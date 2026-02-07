import os
import asyncio
import logging
import jwt
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from dataclasses import dataclass

from .base_api_service import BaseApiService, ApiException

logger = logging.getLogger("m2m-token-service")

@dataclass
class TokenInfo:
    token: str
    expires_at: datetime
    
    def is_expired(self, buffer_minutes: int = 5) -> bool:
        """Check if token is expired or will expire within buffer_minutes"""
        buffer_time = datetime.now(timezone.utc) + timedelta(minutes=buffer_minutes)
        return self.expires_at <= buffer_time

class M2MTokenService(BaseApiService):
    """Service for managing Machine-to-Machine authentication tokens with automatic renewal."""
    
    def __init__(self, 
                 base_url: Optional[str] = None, 
                 client_id: Optional[str] = None, 
                 client_secret: Optional[str] = None):
        """
        Initialize the M2M token service.
        
        Args:
            base_url: Base URL for API requests (defaults to environment variable)
            client_id: Client ID for M2M authentication (defaults to environment variable)
            client_secret: Client secret for M2M authentication (defaults to environment variable)
        """
        super().__init__(base_url)
        
        self.client_id = client_id or os.environ.get("VH_M2M_CLIENT_ID", "lambda-client")
        self.client_secret = client_secret or os.environ.get("VH_M2M_CLIENT_SECRET", "your-secure-client-secret-for-lambda-function")
        
        # Current token info
        self._current_token: Optional[TokenInfo] = None
        self._token_lock = asyncio.Lock()
        
        logger.info(f"M2MTokenService initialized with client ID: {self.client_id}")

    async def get_valid_token(self) -> str:
        """
        Get a valid M2M token, automatically generating or renewing if necessary.
        
        Returns:
            Valid JWT token string
            
        Raises:
            Exception: If token generation fails
        """
        async with self._token_lock:
            # Check if we have a valid token
            if self._current_token and not self._current_token.is_expired():
                logger.debug("Using existing valid token")
                return self._current_token.token
            
            # Generate new token
            logger.info("Generating new M2M token")
            new_token = await self._generate_token()
            
            # Parse expiry from JWT
            expires_at = self._parse_token_expiry(new_token)
            
            # Store token info
            self._current_token = TokenInfo(token=new_token, expires_at=expires_at)
            
            logger.info(f"New M2M token generated, expires at: {expires_at}")
            return new_token

    async def _generate_token(self) -> str:
        """
        Generate a new M2M token from the API.
        
        Returns:
            JWT token string
            
        Raises:
            ApiException: If token generation fails
        """
        endpoint = "/api/auth/m2m"
        
        json_data = {
            "clientId": self.client_id,
            "clientSecret": self.client_secret
        }
        
        logger.debug(f"Client ID: {self.client_id}")
        
        try:
            data = await self._make_request("POST", endpoint, json_data=json_data)
            
            # Handle both wrapped and unwrapped responses
            if "accessToken" in data:
                access_token = data["accessToken"]
            else:
                raise ApiException(f"Unexpected response format: {data}")
            
            logger.info("Successfully generated M2M token")
            return access_token
            
        except ApiException:
            raise
        except Exception as e:
            error_msg = f"Unexpected error during M2M token request: {str(e)}"
            logger.error(error_msg)
            raise ApiException(error_msg)

    def _parse_token_expiry(self, token: str) -> datetime:
        """
        Parse the expiry time from a JWT token.
        
        Args:
            token: JWT token string
            
        Returns:
            Expiry datetime in UTC
        """
        try:
            # Decode JWT without verification (we just need the expiry)
            decoded = jwt.decode(token, options={"verify_signature": False})
            exp_timestamp = decoded.get('exp')
            
            if exp_timestamp:
                return datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
            else:
                # Fallback: assume 1 hour expiry from now
                logger.warning("No expiry found in JWT, assuming 1 hour from now")
                return datetime.now(timezone.utc) + timedelta(hours=1)
                
        except Exception as e:
            logger.warning(f"Failed to parse JWT expiry: {e}, assuming 1 hour from now")
            return datetime.now(timezone.utc) + timedelta(hours=1)

    async def _handle_authentication_error(self, response_data: Dict[str, Any]) -> None:
        """Handle authentication errors (no specific action needed for M2M service)."""
        logger.warning("Authentication failed for M2M token service")
        # M2M service doesn't need specific auth error handling
    
    def invalidate_token(self):
        """Invalidate the current token, forcing a new one to be generated on next request."""
        logger.info("Invalidating current M2M token")
        self._current_token = None 