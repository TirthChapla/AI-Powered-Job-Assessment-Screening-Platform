from dataclasses import dataclass
from typing import Optional, List, Dict, Any

@dataclass
class Stage:
    key: str
    name: str
    system_prompt: str
    assistant_prompt: str
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}
    
class StageManager:
    def __init__(self, stages: List[Stage]):
        self.stages = stages
        self.current_stage_index = -1
        self.backup_chat_ctx = None
    
    def start(self):
        """Start the first stage"""
        if len(self.stages) > 0:
            self.current_stage_index = 0
            return True
        return False
    
    def get_current_stage(self) -> Optional[Stage]:
        """Get the current stage or None if no stage is active"""
        if 0 <= self.current_stage_index < len(self.stages):
            return self.stages[self.current_stage_index]
        return None
    
    def advance_to_next_stage(self) -> bool:
        """Advances to the next stage if one exists.
        Returns True if advanced to a new stage, False if there are no more stages."""
        if self.current_stage_index < len(self.stages) - 1:
            self.current_stage_index += 1
            return True
        return False
    
    def has_more_stages(self) -> bool:
        """Check if there are more stages after the current one"""
        return self.current_stage_index < len(self.stages) - 1
    
    def get_current_index(self) -> int:
        """Get the current stage index"""
        return self.current_stage_index
    
    def is_last_stage(self) -> bool:
        """Check if current stage is the last stage"""
        return self.current_stage_index == len(self.stages) - 1