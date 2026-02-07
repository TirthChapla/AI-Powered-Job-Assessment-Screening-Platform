import json
import logging
from typing import Optional, Dict, Any
from livekit.agents import JobRequest

from services.interview_api_service import InterviewApiService

logger = logging.getLogger("request-handler")


class InterviewRequestHandler:
    """Handles interview request validation and acceptance/rejection."""
    
    def __init__(self):
        self.api_service = InterviewApiService()
    
    async def handle_request(self, req: JobRequest) -> None:
        """Process an incoming interview request."""
        logger.debug(f"Request received: {req.__dict__}")
        
        try:
            interview_id = self._extract_interview_id(req.room.name)
            validation_data = await self._validate_interview(interview_id)
            
            if not validation_data["can_proceed"]:
                logger.error("Interview cannot proceed")
                await req.reject()
                return
            
            await self._accept_request(req, validation_data)
            
        except Exception as e:
            logger.error(f"Failed to validate interview via API: {str(e)}")
            await req.reject()
    
    def _extract_interview_id(self, room_name: str) -> int:
        """Extract interview ID from room name."""
        return int(room_name.split("-")[1])
    
    async def _validate_interview(self, interview_id: int) -> Dict[str, Any]:
        """Validate interview and get stages from API."""
        validation_data = await self.api_service.validate_and_get_stages(
            interview_id=interview_id
        )
        logger.info(
            f"Interview validated. ID: {validation_data['interview_id']}, "
            f"Stages: {len(validation_data['stages'])}"
        )
        return validation_data
    
    async def _accept_request(self, req: JobRequest, validation_data: Dict[str, Any]) -> None:
        """Accept the request with validation metadata."""
        validation_metadata = json.dumps(validation_data)
        await req.accept(
            name="🤖 Quinn",
            identity="quinn",
            metadata=validation_metadata
        ) 