import aiohttp
import logging
from typing import Dict, Any, Optional
import time

logger = logging.getLogger("api-service")

class ApiService:
    def __init__(self, base_url: str = "https://faq-api.voicehireats.com"):
        self.base_url = base_url.rstrip('/')
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def _get_session(self) -> aiohttp.ClientSession:
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=10),
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "VH-FAQ-Agent/1.0"
                }
            )
        return self.session
    
    async def check_usage(self, user_identifier: str) -> Dict[str, Any]:
        """
        Check user usage from the API
        
        Args:
            user_identifier: The user identifier to check usage for
            
        Returns:
            Dict containing usage information or error details
        """
        try:
            session = await self._get_session()
            
            payload = {
                "userIdentifier": user_identifier
            }
            
            logger.info(f"Checking usage for user: {user_identifier}")
            
            async with session.post(
                f"{self.base_url}/check-usage",
                json=payload
            ) as response:
                
                logger.debug(f"Usage check response status: {response.status}")
                
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"Usage check successful: {data.get('data', {}).get('remainingMinutes', 0)} minutes remaining")
                    return data
                else:
                    error_text = await response.text()
                    logger.error(f"Usage check failed with status {response.status}: {error_text}")
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status}",
                        "code": response.status
                    }
                    
        except aiohttp.ClientTimeout:
            logger.error("Usage check request timed out")
            return {
                "success": False,
                "error": "Request timed out",
                "code": 408
            }
        except aiohttp.ClientError as e:
            logger.error(f"Usage check client error: {str(e)}")
            return {
                "success": False,
                "error": f"Client error: {str(e)}",
                "code": 500
            }
        except Exception as e:
            logger.error(f"Unexpected error during usage check: {str(e)}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}",
                "code": 500
            }
    
    async def is_usage_allowed(self, user_identifier: str, min_required_minutes: int = 1) -> bool:
        """
        Check if user has enough remaining minutes to start a session
        
        Args:
            user_identifier: The user identifier to check
            min_required_minutes: Minimum required minutes (default: 1)
            
        Returns:
            True if user has enough minutes, False otherwise
        """
        try:
            usage_data = await self.check_usage(user_identifier)
            
            if not usage_data.get("success", False):
                logger.warning(f"Usage check failed for user {user_identifier}, allowing connection as fallback")
                return True
            
            data = usage_data.get("data", {})
            remaining_minutes = data.get("remainingMinutes", 0)
            allowed = data.get("allowed", False)
            
            logger.info(f"User {user_identifier} has {remaining_minutes} minutes remaining, allowed: {allowed}")
            
            return allowed and remaining_minutes >= min_required_minutes
            
        except Exception as e:
            logger.error(f"Error checking usage allowance: {str(e)}")
            return True
    
    async def store_transcription(
        self, 
        transcription: Dict[str, Any], 
        room_name: str, 
        participant_name: str, 
        user_identifier: str, 
        token_identifier: str, 
        duration: int, 
        timestamp: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Store transcription data via the API
        
        Args:
            transcription: The conversation transcription data as JSON object
            room_name: The LiveKit room name
            participant_name: The participant's name
            user_identifier: The user identifier
            token_identifier: The token identifier
            duration: Session duration in seconds
            timestamp: Optional timestamp (defaults to current time)
            
        Returns:
            Dict containing response data or error details
        """
        try:
            session = await self._get_session()
            
            payload = {
                "transcription": transcription,
                "roomName": room_name,
                "participantName": participant_name,
                "userIdentifier": user_identifier,
                "tokenIdentifier": token_identifier,
                "duration": duration,
                "timestamp": timestamp or int(time.time() * 1000)
            }
            
            message_count = transcription.get('sessionInfo', {}).get('totalMessages', 0)
            logger.info(f"Storing JSON transcription for user {user_identifier}, duration: {duration}s, messages: {message_count}")
            
            async with session.post(
                f"{self.base_url}/store-transcription",
                json=payload
            ) as response:
                
                logger.debug(f"Transcription storage response status: {response.status}")
                
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"Transcription stored successfully: {data.get('data', {}).get('transcriptionKey', 'unknown')}")
                    return data
                else:
                    error_text = await response.text()
                    logger.error(f"Transcription storage failed with status {response.status}: {error_text}")
                    return {
                        "success": False,
                        "error": f"API request failed with status {response.status}",
                        "code": response.status
                    }
                    
        except aiohttp.ClientTimeout:
            logger.error("Transcription storage request timed out")
            return {
                "success": False,
                "error": "Request timed out",
                "code": 408
            }
        except aiohttp.ClientError as e:
            logger.error(f"Transcription storage client error: {str(e)}")
            return {
                "success": False,
                "error": f"Client error: {str(e)}",
                "code": 500
            }
        except Exception as e:
            logger.error(f"Unexpected error during transcription storage: {str(e)}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}",
                "code": 500
            }
    
    async def close(self):
        """Close the HTTP session"""
        if self.session and not self.session.closed:
            await self.session.close()
            logger.debug("API service session closed")

api_service = ApiService() 