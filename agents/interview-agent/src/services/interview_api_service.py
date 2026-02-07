import json
import logging
from typing import Dict, List, Any, Optional

from .base_api_service import BaseApiService, ApiException
from .m2m_token_service import M2MTokenService

logger = logging.getLogger("interview-api-service")

class InterviewApiService(BaseApiService):
    """Service for making API calls to VoiceHire API for interview validation and stage retrieval."""
    
    def __init__(self, base_url: Optional[str] = None, 
                 client_id: Optional[str] = None, 
                 client_secret: Optional[str] = None):
        """
        Initialize the interview API service.
        
        Args:
            base_url: Base URL for API requests (defaults to environment variable)
            client_id: Client ID for M2M authentication (defaults to environment variable)
            client_secret: Client secret for M2M authentication (defaults to environment variable)
        """
        super().__init__(base_url)
        
        # Initialize M2M token service
        self.m2m_service = M2MTokenService(
            base_url=self.base_url,
            client_id=client_id,
            client_secret=client_secret
        )

    async def validate_and_get_stages(self, interview_id: int) -> Dict[str, Any]:
        """
        Validate interview request and get interview stages.
        
        Args:
            interview_id: The interview ID
            
        Returns:
            Dictionary containing validation result and stages with normalized field names
            
        Raises:
            ApiException: If API call fails or returns unexpected response
        """
        endpoint = f"/api/platform/validate-interview/{interview_id}"
        
        try:
            # Get valid M2M token and add to headers
            token = await self.m2m_service.get_valid_token()
            headers = {"Authorization": f"Bearer {token}"}
            
            # Make the API request
            data = await self._make_request("GET", endpoint, headers=headers)
            
            # Normalize the response for consistent field names
            normalized_stages = []
            for stage_data in data.get("stages", []):
                normalized_stage = {
                    "key": stage_data["key"],
                    "name": stage_data["name"],
                    "system_prompt": stage_data["systemPrompt"],
                    "assistant_prompt": stage_data["assistantPrompt"],
                    "order": stage_data["order"],
                    "metadata": stage_data["metadata"]
                }
                normalized_stages.append(normalized_stage)
            
            # Return normalized response including companyId
            result = {
                "interview_id": data["interviewId"],
                "company_id": data["companyId"],
                "is_valid": data["isValid"],
                "can_proceed": data["canProceed"],
                "record_session": data["recordSession"],
                "stages": normalized_stages
            }
            
            logger.info(f"Successfully validated interview. Company: {result['company_id']}, Can proceed: {result['can_proceed']}, Stages: {len(result['stages'])}")
            return result
            
        except ApiException:
            raise
        except Exception as e:
            logger.error(f"Failed to get M2M token: {str(e)}")
            raise ApiException(f"Authentication failed: {str(e)}")

    async def complete_interview(self, interview_id: int, end_reason: Optional[str] = None) -> bool:
        """
        Mark interview as completed and queue evaluation.
        
        Args:
            interview_id: The interview ID
            end_reason: Optional reason for interview completion
            
        Returns:
            True if successful, False otherwise
            
        Raises:
            ApiException: If API call fails or returns unexpected response
        """
        endpoint = "/api/platform/complete-interview"
        
        try:
            # Get valid M2M token and add to headers
            token = await self.m2m_service.get_valid_token()
            headers = {"Authorization": f"Bearer {token}"}
            
            # Prepare request data
            request_data = {
                "interviewId": interview_id
            }
            if end_reason:
                request_data["endReason"] = end_reason
            
            # Make the API request
            data = await self._make_request("POST", endpoint, headers=headers, json_data=request_data)
            
            logger.info(f"Successfully completed interview {interview_id}: {data.get('message', 'Unknown response')}")
            return True
            
        except ApiException as e:
            logger.error(f"Failed to complete interview {interview_id}: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error completing interview {interview_id}: {str(e)}")
            return False

    async def _handle_authentication_error(self, response_data: Dict[str, Any]) -> None:
        """Handle authentication errors by invalidating the token."""
        logger.warning("Authentication failed, invalidating token")
        self.m2m_service.invalidate_token()
    
    def invalidate_auth(self):
        """Invalidate the current authentication token, forcing a new one to be generated."""
        logger.info("Invalidating M2M authentication token")
        self.m2m_service.invalidate_token() 