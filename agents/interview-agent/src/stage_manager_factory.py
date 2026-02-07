import logging
from typing import Optional, Dict, Any

from stage_manager import StageManager, Stage

logger = logging.getLogger("stage-manager-factory")


class StageManagerFactory:
    """Factory for creating stage managers from validation data."""
    
    @staticmethod
    def create_from_validation(validation_data: Optional[Dict[str, Any]]) -> StageManager:
        """Create a stage manager from validation data."""
        if not validation_data or not validation_data.get("stages"):
            logger.error("No stages found! This should not happen.")
            raise Exception("No stages found")
        
        logger.info(f"Creating stage manager with {len(validation_data['stages'])} stages from API")
        
        stages = [
            Stage(
                key=stage_data["key"],
                name=stage_data["name"],
                system_prompt=stage_data["system_prompt"],
                assistant_prompt=stage_data["assistant_prompt"],
                metadata=stage_data["metadata"]
            )
            for stage_data in validation_data["stages"]
        ]
        
        manager = StageManager(stages)
        manager.start()
        return manager 