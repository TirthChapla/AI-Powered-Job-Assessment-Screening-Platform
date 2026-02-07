import asyncio
import logging
import json
import time
import sys
from dotenv import load_dotenv
from typing import AsyncIterable, Optional, List, Dict, Any
from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions, JobProcess, JobRequest, ModelSettings, AutoSubscribe, RunContext, CloseEvent
from livekit.agents import llm
from livekit.plugins import (
    openai,
    deepgram,
    silero,
    noise_cancellation
)
from livekit.agents.llm import function_tool
from livekit.agents.job import get_job_context
from livekit import api
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from prompts import PRODUCT_ASSISTANT_SYSTEM_PROMPT, PRODUCT_ASSISTANT_INITIAL_PROMPT
from knowledge_loader import knowledge_loader
from api_service import api_service
from session_manager import SessionManager
from transcription_manager import TranscriptionManager
from context_analyzer import ContextAnalyzer
from participant_handler import ParticipantHandler

load_dotenv()
logger = logging.getLogger("voice-product-assistant")

# Session timeout configuration
SESSION_TIMEOUT_SECONDS = 600

def prewarm(proc: JobProcess) -> None:
    """Preload the VAD model."""
    proc.userdata["vad"] = silero.VAD.load()

async def request_fnc(req: JobRequest):
    # accept the job request
    await req.accept(
        # the agent's name (Participant.name), defaults to ""
        name="🤖 Veeaa",
        # the agent's identity (Participant.identity), defaults to "agent-<jobid>"
        identity="veeaa",
    )
    
def print_conversation(chat_ctx: llm.ChatContext):
    for message in chat_ctx.items:
        print(f"{message.role}: {message.content}")

class ProductAssistantAgent(Agent):
    def __init__(self) -> None:
        # Use clean system prompt without knowledge base
        clean_system_prompt = PRODUCT_ASSISTANT_SYSTEM_PROMPT
        
        # Get knowledge base content separately
        knowledge_content = knowledge_loader.get_all_knowledge()
        
        logger.info(f"Knowledge base content: {len(knowledge_content):,} chars ({len(knowledge_content)/1024:.1f}KB)")
        
        # Create chat context with knowledge base as assistant message
        chat_ctx = llm.ChatContext()
        
        # Add knowledge base as assistant message
        knowledge_message = f"""I have access to comprehensive knowledge about VoiceHire:

{knowledge_content}

I will use this knowledge to provide accurate, detailed answers to user questions, always basing my responses on this information and providing specific details, metrics, and examples when relevant."""
        
        chat_ctx.add_message(role='assistant', content=knowledge_message)
        
        # Add initial assistant prompt
        chat_ctx.add_message(role='assistant', content=PRODUCT_ASSISTANT_INITIAL_PROMPT)
        
        super().__init__(instructions=clean_system_prompt, chat_ctx=chat_ctx)
        
        self.session_manager = SessionManager(SESSION_TIMEOUT_SECONDS)
        self.transcription_manager = TranscriptionManager()
        self._closing_task: asyncio.Task[None] | None = None
        
    def set_session_metadata(self, user_identifier: str, token_identifier: str, room_name: str, participant_name: str):
        """Set session metadata for transcription storage"""
        self.transcription_manager.set_session_metadata(user_identifier, token_identifier, room_name, participant_name)
        
    async def store_session_transcription(self, session_end_reason: str = "user_request"):
        """Store the session transcription and update usage"""
        await self.transcription_manager.store_transcription(
            self.chat_ctx, 
            self.session_manager.conversation_start_time, 
            session_end_reason
        )
        
    async def on_enter(self):
        logger.debug("Product assistant entering session")
        self.session_manager.start_timeout(self._terminate_session_due_to_timeout)
        self.session.generate_reply()

    async def _terminate_session_due_to_timeout(self):
        """Terminate the session due to timeout"""
        await self.session_manager.terminate_session(
            self.session, 
            self.store_session_transcription, 
            "timeout"
        )

    async def llm_node(
        self,
        chat_ctx: llm.ChatContext,
        tools: list[llm.FunctionTool],
        model_settings: ModelSettings,
    ) -> AsyncIterable[llm.ChatChunk]:
        
        start_time = time.time()
        elapsed_time_seconds = self.session_manager.get_elapsed_time()
        
        logger.debug(f"Product assistant conversation, Elapsed time: {elapsed_time_seconds} seconds")
        
        if self.session_manager.session_terminated:
            logger.warning("LLM call attempted on terminated session")
            return
        
        ContextAnalyzer.log_context_metrics(chat_ctx)
        logger.debug(f"Model settings: {model_settings}")
        
        asyncio.create_task(self.store_session_transcription("llm_node"))
        logger.info("Transcription stored in llm_node")

        try:
            llm_start_time = time.time()
            result = Agent.default.llm_node(self, chat_ctx, tools, model_settings)
            llm_call_time = time.time() - llm_start_time
            
            logger.info(f"LLM call completed in {llm_call_time:.3f}s")
            return result
            
        except Exception as e:
            operation_time = time.time() - start_time
            ContextAnalyzer.log_context_failure(chat_ctx, e, operation_time)
            raise
    
    @function_tool
    async def session_end(
        self,
        context: RunContext,
    ):
        """
        Call this function only when the user explicitly indicates they want to end the conversation 
        or don't want to talk to the agent anymore. This maintains the full conversation context 
        until the user decides to leave.
        """
        if self.session_manager.session_terminated:
            return
            
        # self.session_manager.session_terminated = True
        conversation_duration = self.session_manager.get_duration()
        
        logger.info(f"Product assistant conversation ended by user request (duration: {conversation_duration:.1f}s)")
        
        self.session_manager.cancel_timeout()
        await self.store_session_transcription("user_request")
        
        self.session.interrupt()

        await self.session.say("Thank you for your time, have a wonderful day.")

        # job_ctx = get_job_context()
        # await job_ctx.api.room.delete_room(api.DeleteRoomRequest(room=job_ctx.room.name))
        self._closing_task = asyncio.create_task(self.session.aclose())

async def entrypoint(ctx: agents.JobContext):
    logger.info(f"Connecting to room {ctx.room.name}")
    
    # Log knowledge base stats at startup
    stats = knowledge_loader.get_knowledge_stats()
    logger.info(f"Knowledge base initialized: {stats}")
    
    try:
        await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

        # Wait for the first participant to connect
        participant = await ctx.wait_for_participant()
        logger.info(f"Starting product assistant conversation for participant {participant.identity}")
        
        usage_allowed, user_identifier, token_identifier = await ParticipantHandler.handle_participant_connection(participant)
        
        if not usage_allowed:
            await ctx.room.disconnect_participant(participant.identity)
            return
        
        session = AgentSession(
            vad=ctx.proc.userdata["vad"],
            stt=deepgram.STT(model="nova-3", language="multi"),
            llm=openai.LLM(model="gpt-4o-mini"),
            tts=deepgram.TTS(),
            allow_interruptions=True,
            turn_detection=MultilingualModel(),
        )
        
        logger.info(f"Starting product assistant session with {SESSION_TIMEOUT_SECONDS}s timeout")
        
        agent = ProductAssistantAgent()
        if user_identifier and token_identifier:
            agent.set_session_metadata(
                user_identifier=user_identifier,
                token_identifier=token_identifier,
                room_name=ctx.room.name,
                participant_name=participant.name or participant.identity
            )
        
        await session.start(
            room=ctx.room,
            agent=agent,
            room_input_options=RoomInputOptions(
                noise_cancellation=noise_cancellation.BVC(),
            ),
        )
        
        @session.on("close")
        def on_close(ev: CloseEvent):
            print(f"Agent Session closed. Likely not calling session.end()")
            print("=" * 20)
            ctx.delete_room()
    finally:
        # Cleanup API service session
        try:
            await api_service.close()
        except Exception as e:
            logger.error(f"Error closing API service: {str(e)}")


if __name__ == "__main__":
    # Set up more detailed logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('agent_debug.log')
        ]
    )
    
    # Enable debug logging for our modules
    logging.getLogger("voice-product-assistant").setLevel(logging.DEBUG)
    logging.getLogger("knowledge-loader").setLevel(logging.DEBUG)
    logging.getLogger("api-service").setLevel(logging.DEBUG)
    
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
            request_fnc=request_fnc,
            prewarm_fnc=prewarm
        )
    )