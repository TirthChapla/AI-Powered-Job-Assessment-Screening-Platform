import asyncio
import logging
import time
from typing import Optional
from livekit.agents.job import get_job_context
from livekit import api

logger = logging.getLogger("session-manager")

class SessionManager:
    def __init__(self, timeout_seconds: int = 600):
        self.timeout_seconds = timeout_seconds
        self.conversation_start_time = time.time()
        self.timeout_task: Optional[asyncio.Task] = None
        self.session_terminated = False
        
    def start_timeout(self, timeout_callback=None):
        """Start the session timeout task"""
        if self.timeout_task is None or self.timeout_task.done():
            self.timeout_task = asyncio.create_task(self._timeout_handler(timeout_callback))
            logger.info(f"Session timeout started: {self.timeout_seconds} seconds")

    async def _timeout_handler(self, timeout_callback=None):
        """Handle session timeout after specified duration"""
        try:
            await asyncio.sleep(self.timeout_seconds)
            
            if not self.session_terminated:
                logger.info(f"Session timeout reached ({self.timeout_seconds}s), terminating session")
                if timeout_callback:
                    await timeout_callback()
                
        except asyncio.CancelledError:
            logger.debug("Session timeout task cancelled")
        except Exception as e:
            logger.error(f"Error in session timeout handler: {e}")

    async def terminate_session(self, session, store_transcription_callback=None, reason="timeout"):
        """Terminate the session due to timeout or other reasons"""
        if self.session_terminated:
            return
            
        self.session_terminated = True
        conversation_duration = time.time() - self.conversation_start_time
        
        logger.info(f"Terminating session due to {reason} (duration: {conversation_duration:.1f}s)")
        
        try:
            if store_transcription_callback:
                await store_transcription_callback(reason)
            
            session.interrupt()

            await session.generate_reply(
                instructions="Politely inform the user that the session time limit has been reached and say goodbye",
                allow_interruptions=False
            )

            job_ctx = get_job_context()
            await job_ctx.api.room.delete_room(api.DeleteRoomRequest(room=job_ctx.room.name))
            
        except Exception as e:
            logger.error(f"Error during session termination: {e}")

    def cancel_timeout(self):
        """Cancel the timeout task"""
        if self.timeout_task and not self.timeout_task.done():
            self.timeout_task.cancel()
            logger.debug("Session timeout task cancelled")

    def get_elapsed_time(self) -> int:
        """Get elapsed time since conversation start"""
        return round(time.time() - self.conversation_start_time)

    def get_duration(self) -> int:
        """Get conversation duration in seconds"""
        return int(time.time() - self.conversation_start_time) 