import asyncio
import logging
from typing import Optional, Callable
from livekit.agents import AgentSession, UserStateChangedEvent

logger = logging.getLogger("candidate-presence-manager")


class CandidatePresenceManager:
    """
    Manages candidate presence detection and handles away states during interviews.
    
    This class monitors user state changes and implements a retry mechanism when
    candidates become inactive or away during the interview process.
    
    It uses direct TTS speech (session.say()) to avoid triggering agent function tools
    like session_end, ensuring it only handles presence detection and not stage transitions.
    """
    
    def __init__(self, 
                 session: AgentSession, 
                 max_ping_attempts: int = 3,
                 ping_interval: float = 20.0,
                 on_candidate_lost: Optional[Callable] = None):
        """
        Initialize the candidate presence manager.
        
        Args:
            session: The AgentSession to monitor and control
            max_ping_attempts: Maximum number of attempts to re-engage candidate
            ping_interval: Time in seconds between ping attempts
            on_candidate_lost: Optional callback when candidate is permanently lost
        """
        self.session = session
        self.max_ping_attempts = max_ping_attempts
        self.ping_interval = ping_interval
        self.on_candidate_lost = on_candidate_lost
        
        self.inactivity_task: Optional[asyncio.Task] = None
        self.is_monitoring = False
        
        # Register event handler for user state changes
        self.session.on("user_state_changed", self._on_user_state_changed)
        
    def start_monitoring(self) -> None:
        """Start monitoring candidate presence."""
        self.is_monitoring = True
        logger.info("Started monitoring candidate presence")
        
    def stop_monitoring(self) -> None:
        """Stop monitoring candidate presence and cancel any active tasks."""
        self.is_monitoring = False
        if self.inactivity_task and not self.inactivity_task.done():
            self.inactivity_task.cancel()
            logger.info("Stopped monitoring candidate presence")
    
    def _on_user_state_changed(self, event: UserStateChangedEvent) -> None:
        """
        Handle user state change events.
        
        Args:
            event: UserStateChangedEvent containing old and new states
        """
        if not self.is_monitoring:
            return
            
        logger.debug(f"User state changed: {event.old_state} -> {event.new_state}")
        
        if event.new_state == "away":
            logger.warning("Candidate has become inactive/away - starting re-engagement protocol")
            self.inactivity_task = asyncio.create_task(self._handle_candidate_away())
        else:
            # Candidate is back (listening, speaking, etc.)
            if self.inactivity_task and not self.inactivity_task.done():
                logger.info(f"Candidate is back ({event.new_state}) - cancelling re-engagement protocol")
                self.inactivity_task.cancel()
    
    async def _handle_candidate_away(self) -> None:
        """
        Handle candidate away state with progressive re-engagement attempts.
        
        Implements a 3-tier approach:
        1. Gentle check-in
        2. More direct engagement 
        3. Final attempt before ending interview
        """
        try:
            for attempt in range(1, self.max_ping_attempts + 1):
                logger.info(f"Attempting to re-engage candidate (attempt {attempt}/{self.max_ping_attempts})")
                
                # Progressive messaging based on attempt number
                if attempt == 1:
                    message = (
                        "Hello, are you still there? I want to make sure you can hear me clearly. "
                        "Please say something if you can hear me."
                    )
                elif attempt == 2:
                    message = (
                        "This is my second attempt to reach you. Can you please respond if you can hear me? "
                        "I want to make sure we can continue the interview properly."
                    )
                else:  # Final attempt
                    message = (
                        "This is my final attempt to reach you. If you don't respond soon, "
                        "I'll need to end the interview session. Please let me know if you can hear me, "
                        "or you can reconnect if you're having technical issues."
                    )
                
                # Use session.say() to avoid triggering agent function tools like session_end
                await self.session.say(
                    text=message,
                    allow_interruptions=True,
                    add_to_chat_ctx=False
                )
                
                # Wait for response before next attempt
                await asyncio.sleep(self.ping_interval)
                
                # Check if task was cancelled (candidate returned)
                if asyncio.current_task().cancelled():
                    return
            
            # All attempts exhausted - candidate is considered lost
            logger.error(f"Candidate failed to respond after {self.max_ping_attempts} attempts - ending interview")
            await self._handle_candidate_lost()
            
        except asyncio.CancelledError:
            logger.info("Candidate re-engagement cancelled - candidate returned")
        except Exception as e:
            logger.error(f"Error during candidate re-engagement: {str(e)}")
    
    async def _handle_candidate_lost(self) -> None:
        """
        Handle the case where candidate is permanently lost.
        
        Provides final message and triggers cleanup callback.
        """
        try:
            # Final message to the session using session.say() to avoid triggering function tools
            await self.session.say(
                text=(
                    "I'm sorry, but you appear to have disconnected or are unable to continue the interview. "
                    "The interview session will now end due to inactivity. "
                    "If you need to reschedule, please contact the company directly. Thank you."
                ),
                allow_interruptions=False,
                add_to_chat_ctx=False
            )
            
            # Trigger callback if provided
            if self.on_candidate_lost:
                await self.on_candidate_lost()
                
        except Exception as e:
            logger.error(f"Error handling candidate lost scenario: {str(e)}")
    
    async def cleanup(self) -> None:
        """Clean up resources and stop monitoring."""
        self.stop_monitoring()
        logger.debug("Candidate presence manager cleaned up") 