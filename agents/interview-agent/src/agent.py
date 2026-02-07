import logging
from typing import Optional

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import JobProcess, JobRequest
from livekit.plugins import silero

from helpers.env_validator import EnvironmentValidator
from request_handler import InterviewRequestHandler
from session_manager import SessionManager

load_dotenv()
logger = logging.getLogger("voice-interview-agent")

# Validate required environment variables before proceeding
EnvironmentValidator.validate_required_env_vars()


# Application entry points and handlers
def prewarm(proc: JobProcess) -> None:
    """Preload the VAD model for faster startup."""
    proc.userdata["vad"] = silero.VAD.load()


async def request_fnc(req: JobRequest) -> None:
    """Handle incoming job requests."""
    handler = InterviewRequestHandler()
    await handler.handle_request(req)


async def entrypoint(ctx: agents.JobContext) -> None:
    """Main entrypoint for the interview agent."""
    session_manager = SessionManager(ctx)
    await session_manager.start_interview_session()


if __name__ == "__main__":
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
            request_fnc=request_fnc,
            prewarm_fnc=prewarm
        )
    )