import os
import sys
import logging
from typing import List

logger = logging.getLogger(__name__)


class EnvironmentValidator:
    """Helper class to validate required environment variables are set."""
    
    REQUIRED_ENV_VARS = [
        "LIVEKIT_API_KEY",
        "LIVEKIT_API_SECRET", 
        "LIVEKIT_URL",
        "NEW_RELIC_LICENSE_KEY",
        "VH_API_BASE_URL",
        "VH_M2M_CLIENT_ID",
        "VH_M2M_CLIENT_SECRET",
        "DEEPGRAM_API_KEY",
        "OPENAI_API_KEY",
        "ENVIRONMENT",
        "TRANSCRIPT_BUCKET",
        "AWS_REGION",
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
    ]
    
    @classmethod
    def validate_required_env_vars(cls, required_vars: List[str] = None) -> None:
        """
        Validate that all required environment variables are set.
        
        Args:
            required_vars: List of required environment variable names.
                          If None, uses the default REQUIRED_ENV_VARS.
        
        Raises:
            SystemExit: If any required environment variables are missing.
        """
        if required_vars is None:
            required_vars = cls.REQUIRED_ENV_VARS
            
        missing_vars = []
        
        for var_name in required_vars:
            value = os.getenv(var_name)
            if not value:
                missing_vars.append(var_name)
                logger.error(f"Missing required environment variable: {var_name}")
            else:
                logger.debug(f"Environment variable {var_name} is set")
        
        if missing_vars:
            error_msg = f"Missing required environment variables: {', '.join(missing_vars)}"
            logger.critical(error_msg)
            print(f"ERROR: {error_msg}", file=sys.stderr)
            print("Please set the following environment variables:", file=sys.stderr)
            for var in missing_vars:
                print(f"  - {var}", file=sys.stderr)
            sys.exit(1)
        else:
            logger.info("All required environment variables are set")
    