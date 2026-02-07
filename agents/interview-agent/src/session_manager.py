import logging
from typing import Optional, Dict, Any
import asyncio
import os

from livekit import agents, api
from livekit.agents import AgentSession, AutoSubscribe, RoomInputOptions, RoomOutputOptions, AgentFalseInterruptionEvent, NOT_GIVEN
from livekit.plugins import openai, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from metadata_parser import MetadataParser
from stage_manager_factory import StageManagerFactory
from interview_agent import InterviewAgent, InterviewSessionInfo
from metrics.metrics_collector import setup_metrics_handlers, send_interview_start, formatter
from transcript_manager import InterviewTranscriptManager
from services.interview_api_service import InterviewApiService
from candidate_presence_manager import CandidatePresenceManager
from helpers.participant_logger import ParticipantLogger

logger = logging.getLogger("session-manager")


class SessionManager:
    """Manages the interview session setup and execution."""
    
    def __init__(self, ctx: agents.JobContext):
        self.ctx = ctx
        self.interview_api_service = InterviewApiService()
        
        self.participant_logger = ParticipantLogger()
    
    async def start_interview_session(self) -> None:
        """Start the interview session with proper setup."""
        logger.debug(f"Connecting to room {self.ctx.room.name}")
        await self.ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

        validation_data = self._get_validation_data()
        if not validation_data:
            logger.error("No validation data available, cannot proceed")
            return
        
        # Store room reference
        self.room = self.ctx.room
        
        # Set up participant logging
        if self.participant_logger:
            self.participant_logger.setup_track_publication_monitoring(self.ctx.room)

        participant = await self.ctx.wait_for_participant()
        if validation_data["record_session"]:
            await self._start_egress_recording(participant.identity, validation_data["company_id"], validation_data["interview_id"])
        
        logger.debug(f"Starting voice interview for participant {participant.identity}")
        
        # Log deep participant details with special focus on publications
        if self.participant_logger:
            self.participant_logger.log_deep_participant_details(participant)
        
        self._update_metrics_context(participant)
        
        await send_interview_start(participant.identity, self.ctx.room.name)
        
        session = self._create_agent_session(participant.name, validation_data["interview_id"])
        setup_metrics_handlers(session)
        
        stage_manager = StageManagerFactory.create_from_validation(validation_data)
        
        # Create transcript manager for this interview
        transcript_manager = InterviewTranscriptManager(
            interview_id=validation_data["interview_id"],
            company_id=validation_data["company_id"],
            participant_name=participant.name,
            room_name=self.ctx.room.name,
        )
        
        # Create agent with transcript manager and API service
        interview_agent = InterviewAgent(stage_manager, transcript_manager, self.interview_api_service)
        
        # Create candidate presence manager to handle away states
        async def on_candidate_lost():
            """Callback when candidate is permanently lost."""
            logger.warning("Candidate lost - ending interview due to inactivity")
            await asyncio.shield(session.aclose())
            
            self.ctx.delete_room()
        
        presence_manager = CandidatePresenceManager(
            session=session,
            max_ping_attempts=3,
            ping_interval=20.0,
            on_candidate_lost=on_candidate_lost
        )
        
        async def cleanup_on_shutdown():
            """Cleanup function called when job is shutting down."""
            logger.info("Job context shutdown triggered - ensuring transcript is saved")        
            
            # Stop presence monitoring
            await presence_manager.cleanup()
            
            await interview_agent.safe_end_interview_external("job_shutdown")
        
        self.ctx.add_shutdown_callback(cleanup_on_shutdown)
        
        # Start presence monitoring
        presence_manager.start_monitoring()
        
        @session.on("agent_false_interruption")
        def _agent_false_interruption(ev: AgentFalseInterruptionEvent):
            logger.info(
                "Resuming agent from interruption", extra={"instructions": ev.extra_instructions}
            )
            session.generate_reply(instructions=ev.extra_instructions or NOT_GIVEN)
       
        await session.start(
            room=self.ctx.room,
            agent=interview_agent,
            room_input_options=RoomInputOptions(
                # noise_cancellation=noise_cancellation.BVC(),
            ),
            room_output_options=RoomOutputOptions(transcription_enabled=True),
        )
    
    def _update_metrics_context(self, participant) -> None:
        """Update metrics formatter with room and participant context."""
        if formatter:
            formatter.update_room_context(
                room_name=self.ctx.room.name,
                participant_id=participant.identity
            )
            logger.info(
                f"Updated metrics context: room={self.ctx.room.name}, "
                f"participant={participant.identity}"
            )
    
    def _get_validation_data(self) -> Optional[Dict[str, Any]]:
        """Get validation data from agent metadata."""
        validation_data = MetadataParser.parse_validation_data(
            self.ctx.agent.metadata
        )
        
        if validation_data:
            logger.info(
                f"Retrieved validation data from metadata: "
                f"{len(validation_data['stages'])} stages"
            )
        
        return validation_data
    
    async def _start_egress_recording(self, participant_identity: str, company_id: int, interview_id: int):
        """Start recording the interview."""
        filename_prefix = f"companies/{company_id}/interview/{interview_id}/recording/"
        lkapi = api.LiveKitAPI()
        
        output = api.S3Upload(
                    bucket=os.getenv("TRANSCRIPT_BUCKET"),
                    region=os.getenv("AWS_REGION"),
                    access_key=os.getenv("AWS_ACCESS_KEY_ID"),
                    secret=os.getenv("AWS_SECRET_ACCESS_KEY"),
                    force_path_style=True,
                )
        segment_output = api.SegmentedFileOutput(
                            filename_prefix= filename_prefix,
                            playlist_name= filename_prefix + "playlist.m3u8",
                            live_playlist_name= filename_prefix + "live-playlist.m3u8",
                            segment_duration=5,
                            s3 = output,
                        )
        # image_output = api.ImageOutput(
        #                     capture_interval=10,
        #                     filename_prefix= filename_prefix + "{room_id}/",
        #                     filename_suffix=api.ImageFileSuffix.IMAGE_SUFFIX_INDEX,
        #                     s3 = output,
        #                 )
        # file_output = api.EncodedFileOutput(
        #                     filepath= filename_prefix + "{room_id}/video.mp4",
        #                     s3 = output,
        #                 )
        
        request = api.RoomCompositeEgressRequest(
            room_name=self.ctx.room.name,
            layout="single-speaker",
            advanced=api.EncodingOptions(
                width=1280,
                height=720,
                framerate=30,
                audio_codec=api.AudioCodec.AAC,
                audio_bitrate=128,
                video_codec=api.VideoCodec.H264_HIGH,
                video_bitrate=5000,
            ),
            segment_outputs=[segment_output],
            # image_outputs=[image_output],
            # file_outputs=[file_output],
        )
        try:
            logger.info(f"Starting egress recording for {participant_identity}")
            info = await lkapi.egress.start_room_composite_egress(request)
            await lkapi.aclose()
            logger.info(f"Egress recording started")
        except Exception as e:
            logger.error(f"Error starting egress recording: {e}")
    
    def _create_agent_session(self, full_name: str, interview_id: int) -> AgentSession:
        """Create and configure the agent session."""
        return AgentSession(
            userdata=InterviewSessionInfo(
                full_name=full_name,
                interview_id=interview_id
            ),
            vad=self.ctx.proc.userdata["vad"],
            stt=deepgram.STT(model="nova-3", language="multi"),
            llm=openai.LLM(model="gpt-4o-mini"),
            tts=deepgram.TTS(),
            min_endpointing_delay=0.5,
            allow_interruptions=True,
            user_away_timeout=10,
            turn_detection=MultilingualModel(),
            agent_false_interruption_timeout=3.0,
        ) 
