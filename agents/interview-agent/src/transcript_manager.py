import json
import logging
import os
import time
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from pathlib import Path

from livekit.agents import llm
from stage_manager import Stage
from s3_transcript_storage import S3TranscriptStorage

logger = logging.getLogger("transcript-manager")


class InterviewTranscriptManager:
    """
    Manages transcript storage for interview stages and full interviews.
    
    Simplified design that builds the full transcript incrementally:
    1. When each stage completes, store stage file and add to full transcript
    2. Use dictionary with stage keys to prevent duplicates
    3. Full transcript is always ready - no need for complex rebuilding
    """
    
    def __init__(self, interview_id: int, company_id: int, participant_name: str, room_name: str):
        """
        Initialize the transcript manager for a specific interview session.
        
        Args:
            interview_id: Unique identifier for this interview
            company_id: Unique identifier for the company conducting the interview
            participant_name: Name/identity of the interviewee
            room_name: LiveKit room name for this session
        """
        # Core session identifiers
        self.interview_id = interview_id
        self.company_id = company_id
        self.participant_name = participant_name
        self.room_name = room_name
        
        # Timing tracking for duration calculations
        self.interview_start_time = time.time()
        
        # Storage collections for transcript data
        self.stage_transcripts: Dict[str, Dict[str, Any]] = {}  # Stage key -> transcript data (prevents duplicates)
        self.stored_stage_keys: set = set()  # Track which stages have been stored to avoid duplicate file operations
        
        # Create local storage directory if it doesn't exist
        self.transcripts_dir = Path("transcripts")
        self.transcripts_dir.mkdir(exist_ok=True)
        
        # Initialize S3 storage adapter with company and interview IDs
        self.s3_storage = S3TranscriptStorage(company_id, interview_id)
        
    def store_stage_transcript_async(self, 
                             stage: Stage, 
                             chat_ctx: llm.ChatContext, 
                             stage_start_time: float,
                             stage_end_time: float,
                             stage_reason: Optional[str] = None) -> None:
        """
        Store transcript for a completed stage and add to full transcript.
        
        This method:
        1. Generates structured transcript data for the stage
        2. Adds/overwrites in stage_transcripts dict (prevents duplicates)
        3. Queues stage file storage as background task
        
        Args:
            stage: The completed stage object with metadata
            chat_ctx: Current chat context containing all messages
            stage_start_time: Unix timestamp when stage started
            stage_end_time: Unix timestamp when stage ended  
            stage_reason: Optional reason why stage ended (e.g., "completed", "timeout")
        """
        try:
            # Generate structured transcript data
            stage_transcript = self._generate_stage_transcript(
                stage, chat_ctx, stage_start_time, stage_end_time, stage_reason
            )
            
            # Add to stage transcripts dict - this automatically handles duplicates
            # If same stage key is added again, it overwrites the previous data
            self.stage_transcripts[stage.key] = stage_transcript
            
            # Fire-and-forget stage file storage (background, non-blocking)
            asyncio.create_task(self._store_stage_file_async(stage_transcript, stage.key))
            
            logger.info(f"Stage transcript added for '{stage.key}' - Messages: {stage_transcript['stageInfo']['messageCount']}")
            
        except Exception as e:
            # Log error but don't raise - stage storage failures shouldn't crash the interview
            logger.error(f"Error preparing stage transcript for '{stage.key}': {str(e)}")
    
    async def _store_stage_file_async(self, stage_transcript: Dict[str, Any], stage_key: str) -> None:
        """
        Asynchronously store stage transcript to local file and upload to S3 (non-blocking background task).
        
        Args:
            stage_transcript: The structured transcript data to store
            stage_key: Key of the stage (for logging purposes)
        """
        try:
            # Check if this stage file has already been stored to avoid duplicate file operations
            if stage_key in self.stored_stage_keys:
                logger.debug(f"Stage transcript file for '{stage_key}' already stored, skipping background write")
                return
                
            # Write the JSON file to local storage
            filename = f"stage_{stage_key}.json"
            local_filepath = self._write_file(filename, stage_transcript)
            self.stored_stage_keys.add(stage_key)
            logger.debug(f"Stage transcript file written for '{stage_key}': {local_filepath}")
            
            # Immediately upload to S3 if enabled
            if self.s3_storage.enabled:
                s3_key = self.s3_storage.generate_s3_key(filename)
                
                s3_result = await self.s3_storage.upload_file(local_filepath, s3_key)
                if s3_result:
                    logger.debug(f"Stage transcript uploaded to S3: {s3_result}")
                else:
                    logger.warning(f"Failed to upload stage transcript to S3 for '{stage_key}'")
            
        except Exception as e:
            # Log warning but don't raise - this is best-effort background storage
            logger.warning(f"Failed to write stage transcript file for '{stage_key}': {str(e)}")
    
    async def store_full_interview_transcript_with_retry(self, 
                                      end_reason: Optional[str] = None,
                                      max_retries: int = 3,
                                      retry_delay: float = 2.0) -> str:
        """
        Store complete interview transcript with retry logic.
        
        Builds the full transcript from the accumulated stage transcripts and session metadata.
        No need for chat_ctx or total_stages since we build incrementally.
        
        Args:
            end_reason: Reason why interview ended (e.g., "completed", "timeout", "error")
            max_retries: Maximum number of retry attempts for failed operations
            retry_delay: Delay in seconds between retry attempts
            
        Returns:
            File path of the stored full interview transcript
        """
        logger.info("Starting final transcript storage with retry logic...")
        
        # Ensure all pending stage file operations complete with retry
        await self._ensure_stage_files_stored_with_retry(max_retries, retry_delay)
        
        # Generate comprehensive full interview transcript from accumulated data
        full_transcript = self._generate_full_interview_transcript(end_reason)
        
        # Store full transcript to local file with retry logic and upload to S3
        filepath = await self._store_full_interview_file_with_retry(full_transcript, max_retries, retry_delay)
        
        # Log completion summary with key metrics
        logger.info(f"Full interview transcript storage completed: {filepath}")
        logger.info(f"Interview summary - Duration: {full_transcript['sessionInfo']['durationSeconds']}s, "
                   f"Stages: {len(self.stage_transcripts)}, Total Messages: {full_transcript['sessionInfo']['totalMessages']}")
        
        return filepath
    
    async def _ensure_stage_files_stored_with_retry(self, max_retries: int, retry_delay: float) -> None:
        """Ensure all stage transcript files are stored with retry logic."""
        if not self.stage_transcripts:
            logger.debug("No stage transcripts to store files for")
            return
            
        logger.info(f"Ensuring {len(self.stage_transcripts)} stage transcript files are stored...")
        
        for stage_key, stage_transcript in self.stage_transcripts.items():
            # Store local file with retry if not already stored
            if stage_key not in self.stored_stage_keys:
                for attempt in range(max_retries):
                    try:
                        filename = f"stage_{stage_key}.json"
                        local_filepath = self._write_file(filename, stage_transcript)
                        self.stored_stage_keys.add(stage_key)
                        logger.debug(f"Stage transcript file stored for '{stage_key}' (attempt {attempt + 1}): {local_filepath}")
                        
                        # Upload to S3 immediately after successful local storage
                        if self.s3_storage.enabled:
                            s3_key = self.s3_storage.generate_s3_key(filename)
                            
                            s3_result = await self.s3_storage.upload_file(local_filepath, s3_key)
                            if s3_result:
                                logger.debug(f"Stage transcript uploaded to S3: {s3_result}")
                            else:
                                logger.warning(f"Failed to upload stage transcript to S3 for '{stage_key}'")
                        break
                    except Exception as e:
                        if attempt < max_retries - 1:
                            logger.warning(f"Failed to store stage transcript for '{stage_key}' (attempt {attempt + 1}): {str(e)} - Retrying in {retry_delay}s")
                            await asyncio.sleep(retry_delay)
                        else:
                            logger.error(f"Failed to store stage transcript for '{stage_key}' after {max_retries} attempts: {str(e)}")
            else:
                logger.debug(f"Stage transcript file for '{stage_key}' already stored, skipping")
    
    async def _store_full_interview_file_with_retry(self, full_transcript: Dict[str, Any], max_retries: int, retry_delay: float) -> str:
        """Store full interview transcript file with retry logic and upload to S3."""
        for attempt in range(max_retries):
            try:
                filename = f"full_transcript.json"
                local_filepath = self._write_file(filename, full_transcript)
                logger.info(f"Full interview transcript file stored: {local_filepath} (attempt {attempt + 1})")
                
                # Upload to S3 immediately after successful local storage
                if self.s3_storage.enabled:
                    s3_key = self.s3_storage.generate_s3_key(filename)
                    
                    s3_result = await self.s3_storage.upload_file(local_filepath, s3_key)
                    if s3_result:
                        logger.info(f"Full interview transcript uploaded to S3: {s3_result}")
                    else:
                        logger.warning("Failed to upload full interview transcript to S3")
                
                return local_filepath
            except Exception as e:
                if attempt < max_retries - 1:
                    logger.warning(f"Failed to store full interview transcript file (attempt {attempt + 1}): {str(e)} - Retrying in {retry_delay}s")
                    await asyncio.sleep(retry_delay)
                else:
                    logger.error(f"Failed to store full interview transcript file after {max_retries} attempts: {str(e)}")
                    return ""
    

    
    def _generate_stage_transcript(self, 
                                 stage: Stage, 
                                 chat_ctx: llm.ChatContext, 
                                 stage_start_time: float,
                                 stage_end_time: float,
                                 stage_reason: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate structured transcript for a single stage.
        
        Creates a standardized JSON structure containing stage metadata, filtered
        conversation messages, and timing information.
        
        Args:
            stage: The stage object containing metadata and configuration
            chat_ctx: Complete chat context (messages from entire interview so far)
            stage_start_time: Unix timestamp when this stage started
            stage_end_time: Unix timestamp when this stage ended
            stage_reason: Optional reason why stage ended
            
        Returns:
            Structured dictionary ready for JSON serialization
        """
        # Extract and filter messages relevant to this stage
        messages = self._extract_stage_messages(chat_ctx)
        
        # Build standardized transcript structure
        return {
            "stageInfo": {
                "stageKey": stage.key,                                    # Unique identifier for stage type
                "stageName": stage.name,                                  # Human-readable stage name
                "stageStartTime": int(stage_start_time),                 # Unix timestamp (stage start)
                "stageEndTime": int(stage_end_time),                     # Unix timestamp (stage end)
                "durationSeconds": int(stage_end_time - stage_start_time), # Calculated duration
                "endReason": stage_reason or "completed",               # Why stage ended
                "messageCount": len(messages),                          # Number of conversation messages
                "metadata": stage.metadata or {}                       # Stage-specific configuration
            },
            "messages": messages,                                       # Filtered conversation for this stage
            "interviewInfo": {
                "interviewId": self.interview_id,                      # Interview session identifier
                "participantName": self.participant_name,              # Interviewee name/identity
                "roomName": self.room_name                             # LiveKit room name
            },
            "timestamp": int(time.time())                              # When transcript was generated
        }
    
    def _generate_full_interview_transcript(self, end_reason: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate structured transcript for the complete interview from accumulated stage data.
        
        Args:
            end_reason: Optional reason why interview ended
            
        Returns:
            Structured dictionary ready for JSON serialization
        """
        interview_end_time = time.time()
        
        # Calculate total messages from all stages
        total_messages = sum(
            stage_transcript['stageInfo']['messageCount'] 
            for stage_transcript in self.stage_transcripts.values()
        )
        
        return {
            "sessionInfo": {
                "interviewId": self.interview_id,
                "sessionStartTime": int(self.interview_start_time),
                "sessionEndTime": int(interview_end_time),
                "durationSeconds": int(interview_end_time - self.interview_start_time),
                "totalMessages": total_messages,
                "totalStages": len(self.stage_transcripts),
                "completedStages": len(self.stage_transcripts),
                "endReason": end_reason or "completed",
                "participantName": self.participant_name,
                "roomName": self.room_name,
                "agentName": "Quinn",
                "agentType": "interview-agent"
            },
            "stages": list(self.stage_transcripts.values()),  # Convert dict values to list
            "metadata": {
                "storedAt": int(time.time()),
                "version": "1.0"
            }
        }
    
    def _extract_stage_messages(self, chat_ctx: llm.ChatContext) -> List[Dict[str, Any]]:
        """
        Extract messages from chat context, filtering out system/stage info messages.
        
        Processes the complete chat context and filters out internal system messages,
        stage transition notifications, and other non-conversation content. Normalizes
        message content and speaker information for consistent transcript format.
        
        Args:
            chat_ctx: LiveKit chat context containing all messages from interview
            
        Returns:
            List of structured message dictionaries ready for transcript inclusion
        """
        messages = []
        
        logger.debug(f"Processing {len(chat_ctx.items)} chat messages")
        
        for i, message in enumerate(chat_ctx.items):
            try:
                if message.type != 'message':
                    logger.debug(f"Skipping message type {message.type}")
                    continue
                
                role = message.role
                
                # Normalize message content to string format
                # LiveKit messages can have various content types (string, list, etc.)
                if isinstance(message.content, list):
                    # Join list items into single string (empty string if list is empty)
                    content = " ".join(str(item) for item in message.content) if message.content else ""
                elif isinstance(message.content, str):
                    content = message.content
                else:
                    # Convert any other type to string
                    content = str(message.content)
                
                # Map LiveKit roles to transcript speaker information
                if role == 'assistant':
                    speaker = 'agent'
                    speaker_name = 'Quinn'           # AI agent name
                elif role == 'user':
                    speaker = 'candidate'
                    speaker_name = self.participant_name  # Interviewee name
                else:
                    # Handle any unexpected roles gracefully
                    speaker = role.lower()
                    speaker_name = role.capitalize()
                
                # Build structured message for transcript
                messages.append({
                    "messageId": len(messages) + 1,    # Sequential ID within this transcript
                    "speaker": speaker,                # Normalized speaker type (agent/user)
                    "speakerName": speaker_name,      # Display name for speaker
                    "content": content,               # Normalized message content
                    "timestamp": int(time.time())     # When message was processed
                })
                
            except Exception as e:
                # Log warning but continue processing - don't let single message errors break transcripts
                logger.warning(f"Error processing message at index {i}: {str(e)} - Skipping message")
                continue
        
        return messages
    
    def _write_file(self, filename: str, transcript_data: Dict[str, Any]) -> str:
        """
        Write transcript to a JSON file in the local transcripts directory.
        
        Creates a JSON file containing the structured transcript data.
        Files are stored with a standardized naming convention for easy identification.
        
        Args:
            filename: Full filename including extension
            transcript_data: Structured transcript data
            
        Returns:
            Full file path of the created transcript file
            
        Raises:
            IOError: If file cannot be written (disk space, permissions, etc.)
        """
        filepath = self.transcripts_dir / filename
        
        # Write JSON file with proper formatting and UTF-8 encoding
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(transcript_data, f, indent=2, ensure_ascii=False)
        
        return str(filepath)