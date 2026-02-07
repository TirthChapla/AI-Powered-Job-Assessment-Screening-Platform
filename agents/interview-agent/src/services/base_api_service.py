import os
import ssl
import aiohttp
import logging
from typing import Dict, Any, Optional
from abc import ABC, abstractmethod

logger = logging.getLogger("base-api-service")


class ApiException(Exception):
    """Custom exception for API-related errors."""
    
    def __init__(self, message: str, status_code: Optional[int] = None, response_data: Optional[Dict] = None):
        super().__init__(message)
        self.status_code = status_code
        self.response_data = response_data


class BaseApiService(ABC):
    """Base API service with common configuration and error handling."""
    
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or os.environ.get("VH_API_BASE_URL", "http://localhost:5000")
        self.base_url = self.base_url.rstrip('/')
        
        # Configure SSL context for development
        self.ssl_context = self._create_ssl_context()
        
        # Default headers
        self.default_headers = {
            "Content-Type": "application/json",
            "User-Agent": "VoiceHire-Interview-Agent/1.0"
        }
        
        logger.info(f"{self.__class__.__name__} initialized with base URL: {self.base_url}")
    
    def _create_ssl_context(self) -> ssl.SSLContext:
        """Create SSL context based on environment configuration."""
        ssl_context = ssl.create_default_context()
        
        if os.environ.get("BYPASS_SSL_CERTIFICATE", "false") == "true":
            logger.warning("SSL certificate verification disabled for development")
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
        
        return ssl_context
    
    def _build_headers(self, additional_headers: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        """Build headers with defaults and additional headers."""
        headers = self.default_headers.copy()
        if additional_headers:
            headers.update(additional_headers)
        return headers
    
    async def _make_request(
        self,
        method: str,
        endpoint: str,
        headers: Optional[Dict[str, str]] = None,
        json_data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Make HTTP request with common error handling."""
        url = f"{self.base_url}{endpoint}"
        request_headers = self._build_headers(headers)
        
        logger.debug(f"Making {method} request to: {url}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.request(
                    method=method,
                    url=url,
                    headers=request_headers,
                    json=json_data,
                    params=params,
                    ssl=self.ssl_context
                ) as response:
                    response_data = await response.json()
                    
                    logger.debug(f"API response status: {response.status}")
                    logger.debug(f"API response data: {response_data}")
                    
                    if response.status == 200:
                        return self._extract_response_data(response_data)
                    elif response.status == 401:
                        await self._handle_authentication_error(response_data)
                        raise ApiException(
                            f"Authentication failed: {response_data}",
                            status_code=response.status,
                            response_data=response_data
                        )
                    else:
                        raise ApiException(
                            f"API request failed with status {response.status}: {response_data}",
                            status_code=response.status,
                            response_data=response_data
                        )
                        
        except aiohttp.ClientError as e:
            error_msg = f"Network error during API call: {str(e)}"
            logger.error(error_msg)
            raise ApiException(error_msg)
        except Exception as e:
            if isinstance(e, ApiException):
                raise
            error_msg = f"Unexpected error during API call: {str(e)}"
            logger.error(error_msg)
            raise ApiException(error_msg)
    
    def _extract_response_data(self, response_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract data from response, handling wrapped responses."""
        if "data" in response_data and response_data.get("success", True):
            return response_data["data"]
        return response_data
    
    @abstractmethod
    async def _handle_authentication_error(self, response_data: Dict[str, Any]) -> None:
        """Handle authentication errors (to be implemented by subclasses)."""
        pass 