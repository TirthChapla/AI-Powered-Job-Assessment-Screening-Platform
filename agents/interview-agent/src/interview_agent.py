import time
import asyncio
import logging
from dataclasses import dataclass
from typing import AsyncIterable, Optional

from livekit.agents import Agent, ModelSettings, RunContext
from livekit.agents import llm
from livekit.agents.llm import function_tool
from livekit.agents.job import get_job_context
from livekit import api
from livekit.rtc.audio_frame import AudioFrame
from livekit.agents.voice.transcription.filters import filter_markdown

from stage_manager import StageManager, Stage
from metrics.metrics_collector import send_interview_end, send_stage_transition
from transcript_manager import InterviewTranscriptManager
from services.interview_api_service import InterviewApiService

logger = logging.getLogger("interview-agent")


@dataclass
class InterviewSessionInfo:
    full_name: str
    interview_id: int
    

class InterviewAgent(Agent):
    """Main interview agent that manages conversation stages."""
    
    def __init__(self, stage_manager: StageManager, transcript_manager: Optional[InterviewTranscriptManager] = None, 
                 interview_api_service: Optional[InterviewApiService] = None) -> None:
        self.stage_manager = stage_manager
        self.current_stage_start_time = time.time()
        self.interview_start_time = time.time()
        self.transcript_manager = transcript_manager
        self.interview_api_service = interview_api_service or InterviewApiService()
        self._interview_ended = False  # Flag to prevent duplicate cleanup
        
        current_stage = self.stage_manager.get_current_stage()
        chat_ctx = self._create_initial_chat_context(current_stage)
        
        super().__init__(
            instructions=current_stage.system_prompt, 
            chat_ctx=chat_ctx
        )
    
    def _create_initial_chat_context(self, stage: Stage) -> llm.ChatContext:
        """Create initial chat context with assistant prompt."""
        chat_ctx = llm.ChatContext()
        # chat_ctx.add_message(role='assistant', content=stage.assistant_prompt)
        return chat_ctx
    
    async def on_enter(self) -> None:
        """Handle agent entry into the session."""
        self.session.generate_reply()

    async def llm_node(
        self,
        chat_ctx: llm.ChatContext,
        tools: list[llm.FunctionTool],
        model_settings: ModelSettings,
    ) -> AsyncIterable[llm.ChatChunk]:
        """Process LLM node with stage context information."""
        self.stage_manager.backup_chat_ctx = chat_ctx.copy()
        self._check_stage_time_limit_and_handle_transition(chat_ctx)
        return Agent.default.llm_node(self, chat_ctx, tools, model_settings)

    async def tts_node(
        self, text: AsyncIterable[str], model_settings: ModelSettings
    ) -> AsyncIterable[AudioFrame]:
        filtered_text = filter_markdown(text)
        return super().tts_node(filtered_text, model_settings)

    def _check_stage_time_limit_and_handle_transition(self, chat_ctx: llm.ChatContext) -> None:
        """Check stage time limit and handle transitions with stage-specific messages."""
        current_stage = self.stage_manager.get_current_stage()
        current_index = self.stage_manager.get_current_index()
        elapsed_time = round(time.time() - self.current_stage_start_time)
        time_limit = int(current_stage.metadata.get("time_limit", 300))
        
        stage_info = (
            f"Stage: {current_stage.key} ({current_index + 1}/"
            f"{len(self.stage_manager.stages)}), "
            f"Elapsed time: {elapsed_time}/{time_limit} seconds"
        )
        logger.debug(f"Stage Information: {stage_info}")
        
        if elapsed_time >= time_limit:
            logger.warning(f"Time limit exceeded for stage {current_stage.key}. Ending session.")
            # Generate stage-specific transition message
            transition_message = self._get_stage_transition_message(current_stage.name.lower())

            logger.debug(f"Transition message: {transition_message}")
            chat_ctx.add_message(
                role='user',
                content=f"Silently call session_end function with reason 'force_time_limit_exceeded' and transition_message='{transition_message}'."
            )
            return
        
        chat_ctx.add_message(role='assistant', content="Reflect on the prompt and system instructions to stay aligned and avoid asking questions or sharing information not specified.")
    
    def _get_stage_transition_message(self, stage_name: str) -> str:
        """Get appropriate transition message based on stage name."""
        if stage_name == "introduction":
            return "Let's move to the questions."
        elif stage_name == "question":
            # Check if this is the second last stage
            current_index = self.stage_manager.get_current_index()
            total_stages = len(self.stage_manager.stages)
            
            if current_index == total_stages - 2:  # Second last stage
                return "Let's conclude the interview."
            else:
                return "Let's move to the next question."
        elif stage_name == "conclusion":
            return "Thank you for your time and goodbye."
        else:
            # Default fallback
            return "Let's move on to the next part."
    
    @function_tool
    async def session_end(
        self,
        context: RunContext,
        reason: Optional[str] = None,
        transition_message: Optional[str] = None,
    ) -> Optional['InterviewAgent']:
        """
        End current stage and either advance to next stage or end interview.
        
        Args:
            reason: Optional reason for ending the session
            transition_message: Optional message to display during transition

        Returns:
            New InterviewAgent instance if advancing to next stage, None if ending
        """
        if reason == "force_time_limit_exceeded" and transition_message:
            polite_message = f"In order to finish the interview in a timely manner, {transition_message}"
            self.session.say(polite_message, allow_interruptions=False)

        current_stage = self.stage_manager.get_current_stage()
        logger.debug(f"Stage completed: {current_stage.key}, Reason: {reason}")
        self._print_conversation()
        
        # Store stage transcript before transitioning (non-blocking)
        if self.transcript_manager:
            stage_end_time = time.time()
            self.transcript_manager.store_stage_transcript_async(
                current_stage,
                self.chat_ctx,
                self.current_stage_start_time,
                stage_end_time,
                reason
            )
        
        if self.stage_manager.is_last_stage():
            await self._end_interview(context, reason)
            self.stage_manager.advance_to_next_stage()
            return None
        
        return await self._advance_to_next_stage(context)
    
    def _print_conversation(self) -> None:
        """Print conversation for debugging purposes."""
        for message in self.chat_ctx.items:
            logger.debug(f"{message.role}: {message.content}")
    
    async def _end_interview(self, context: RunContext, reason: Optional[str]) -> None:
        """End the interview session."""
        if self._interview_ended:
            logger.debug("Interview already ended, skipping duplicate cleanup")
            return
            
        self._interview_ended = True
        logger.debug("Final stage completed, ending interview")
        
        total_duration = time.time() - self.interview_start_time
        completed_stages = len(self.stage_manager.stages)

        # Store full interview transcript with retry (blocking - we must ensure this completes)
        if self.transcript_manager:
            await self.transcript_manager.store_full_interview_transcript_with_retry(
                reason,
                max_retries=3,
                retry_delay=2.0
            )

        await send_interview_end(
            context.userdata.full_name or "unknown", 
            total_duration, 
            completed_stages,
            reason
        )
        
        self.session.interrupt()
        
        await self.session.generate_reply(
            instructions=f"say goodbye to {context.userdata.full_name}", 
            allow_interruptions=False
        )
        
        job_ctx = get_job_context()
        await job_ctx.api.room.delete_room(
            api.DeleteRoomRequest(room=job_ctx.room.name)
        )
    
    async def _advance_to_next_stage(self, context: RunContext) -> 'InterviewAgent':
        """Advance to the next interview stage."""
        previous_stage = self.stage_manager.get_current_stage().key
        self.stage_manager.advance_to_next_stage()
        next_stage = self.stage_manager.get_current_stage().key
        stage_duration = time.time() - self.current_stage_start_time
        
        await send_stage_transition(previous_stage, next_stage, stage_duration)
        
        return InterviewAgent(self.stage_manager, self.transcript_manager, self.interview_api_service)
    
    async def safe_end_interview_external(self, reason: Optional[str] = None) -> None:
        """
        Safely end the interview from external handlers (like session close).
        This method can be called from session cleanup handlers without a RunContext.
        """
        if self._interview_ended:
            logger.debug("Interview already ended, skipping external cleanup")
            return
            
        self._interview_ended = True
        logger.info(f"External interview cleanup triggered: {reason}")
        
        # Store full interview transcript with retry (blocking - we must ensure this completes)
        if self.transcript_manager:
            try:
                stage_end_time = time.time()
                self.transcript_manager.store_stage_transcript_async(
                    self.stage_manager.get_current_stage(),
                    self.stage_manager.backup_chat_ctx or llm.ChatContext(),
                    self.current_stage_start_time,
                    stage_end_time,
                    reason
                )
                await asyncio.sleep(5) # wait for the stage transcript to be stored
                await self.transcript_manager.store_full_interview_transcript_with_retry(
                    reason,
                    max_retries=3,
                    retry_delay=2.0
                )
                logger.info(f"Successfully saved transcript during external cleanup: {reason}")
            except Exception as e:
                logger.error(f"Failed to save transcript during external cleanup: {str(e)}")
        else:
            logger.warning("No transcript manager available for external cleanup")

        # Mark interview as completed via API during external cleanup
        if self.transcript_manager:
            interview_id = self.transcript_manager.interview_id
            try:
                success = await self.interview_api_service.complete_interview(
                    interview_id=interview_id,
                    end_reason=reason
                )
                if success:
                    logger.info(f"Successfully marked interview {interview_id} as completed during external cleanup")
                else:
                    logger.error(f"Failed to mark interview {interview_id} as completed during external cleanup")
            except Exception as e:
                logger.error(f"Error completing interview {interview_id} via API during external cleanup: {str(e)}") 