import json
import logging
from typing import Dict, Optional, Tuple
from api_service import api_service

logger = logging.getLogger("participant-handler")

class ParticipantHandler:
    @staticmethod
    def extract_metadata(participant) -> Tuple[Optional[str], Optional[str]]:
        """Extract user and token identifiers from participant metadata"""
        user_identifier = None
        token_identifier = None
        
        if participant.metadata:
            try:
                metadata = json.loads(participant.metadata)
                user_identifier = metadata.get('userIdentifier')
                token_identifier = metadata.get('tokenIdentifier')
                logger.info(f"Extracted session metadata from participant: user={user_identifier}, token={token_identifier}")
            except Exception as e:
                logger.error(f"Error parsing participant metadata: {str(e)}")
        
        return user_identifier, token_identifier
    
    @staticmethod
    async def validate_usage(user_identifier: str, min_required_minutes: int = 1) -> bool:
        """Validate user usage and check if session is allowed"""
        if not user_identifier:
            logger.warning("No user identifier found in participant metadata, starting session without usage check")
            return True
        
        logger.info(f"Checking usage for user identifier: {user_identifier}")
        
        try:
            usage_allowed = await api_service.is_usage_allowed(user_identifier, min_required_minutes)
            
            if not usage_allowed:
                logger.warning(f"Connection rejected for user {user_identifier}: insufficient remaining minutes")
                return False
            
            logger.info(f"Usage check passed for user {user_identifier}, starting session")
            return True
            
        except Exception as e:
            logger.error(f"Error checking usage for user {user_identifier}: {str(e)}")
            logger.warning("Allowing connection due to usage check error")
            return True
    
    @staticmethod
    async def handle_participant_connection(participant) -> Tuple[bool, Optional[str], Optional[str]]:
        """Handle participant connection, extract metadata and validate usage"""
        user_identifier, token_identifier = ParticipantHandler.extract_metadata(participant)
        
        if user_identifier:
            usage_allowed = await ParticipantHandler.validate_usage(user_identifier)
            return usage_allowed, user_identifier, token_identifier
        
        return True, user_identifier, token_identifier 