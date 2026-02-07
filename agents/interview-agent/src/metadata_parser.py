import json
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger("metadata-parser")


class MetadataParser:
    """Handles parsing of validation metadata from agent metadata."""
    
    @staticmethod
    def parse_validation_data(metadata: Optional[str]) -> Optional[Dict[str, Any]]:
        """Parse validation data from agent metadata."""
        if not metadata:
            return None
        
        try:
            return json.loads(metadata)
            
        except Exception as e:
            logger.error(f"Failed to parse validation metadata: {e}")
            return None 