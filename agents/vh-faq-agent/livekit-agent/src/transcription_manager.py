import logging
import time
from typing import Dict, Any, Optional
from livekit.agents import llm
from api_service import api_service

logger = logging.getLogger("transcription-manager")

class TranscriptionManager:
    def __init__(self):
        self.session_metadata = {
            'user_identifier': None,
            'token_identifier': None,
            'room_name': None,
            'participant_name': None
        }
        
    def set_session_metadata(self, user_identifier: str, token_identifier: str, room_name: str, participant_name: str):
        """Set session metadata for transcription storage"""
        self.session_metadata.update({
            'user_identifier': user_identifier,
            'token_identifier': token_identifier,
            'room_name': room_name,
            'participant_name': participant_name
        })
        logger.info(f"Session metadata set: user={user_identifier}, token={token_identifier}, room={room_name}")
        
    def generate_transcription(self, chat_ctx: llm.ChatContext, conversation_start_time: float) -> Dict[str, Any]:
        """Generate a structured JSON transcription from the conversation context"""
        messages = []
        
        # Skip the first message (knowledge base) and start from the second message (initial prompt)
        chat_items = chat_ctx.items[2:] if len(chat_ctx.items) > 1 else chat_ctx.items
        
        for i, message in enumerate(chat_items):
            role = message.role
            content = message.content
            
            if role == 'assistant':
                speaker = 'agent'
                speaker_name = 'Veeaa'
            elif role == 'user':
                speaker = 'user'
                speaker_name = 'User'
            else:
                speaker = role.lower()
                speaker_name = role.capitalize()
            
            messages.append({
                "messageId": i + 1,
                "speaker": speaker,
                "speakerName": speaker_name,
                "content": content
            })
        
        return {
            "sessionInfo": {
                "sessionStartTime": int(conversation_start_time),
                "sessionEndTime": int(time.time()),
                "durationSeconds": int(time.time() - conversation_start_time),
                "totalMessages": len(messages),
                "agentName": "Veeaa",
                "agentType": "vh-faq-agent"
            },
            "messages": messages,
            "metadata": {
                "userIdentifier": self.session_metadata.get('user_identifier'),
                "tokenIdentifier": self.session_metadata.get('token_identifier'),
                "roomName": self.session_metadata.get('room_name'),
                "participantName": self.session_metadata.get('participant_name')
            }
        }
    
    async def store_transcription(self, chat_ctx: llm.ChatContext, conversation_start_time: float, session_end_reason: str = "user_request"):
        """Store the session transcription and update usage"""
        if not all(self.session_metadata.values()):
            logger.warning("Cannot store transcription: missing session metadata")
            return
        
        try:
            conversation_duration = int(time.time() - conversation_start_time)
            transcription_data = self.generate_transcription(chat_ctx, conversation_start_time)
            
            transcription_data["sessionInfo"]["endReason"] = session_end_reason
            
            logger.info(f"Storing transcription for session ending due to: {session_end_reason}")
            logger.info(f"Session duration: {conversation_duration}s, messages: {transcription_data['sessionInfo']['totalMessages']}")
            
            result = await api_service.store_transcription(
                transcription=transcription_data,
                room_name=self.session_metadata['room_name'],
                participant_name=self.session_metadata['participant_name'],
                user_identifier=self.session_metadata['user_identifier'],
                token_identifier=self.session_metadata['token_identifier'],
                duration=conversation_duration
            )
            
            if result.get('success'):
                logger.info(f"Transcription stored successfully: {result.get('data', {}).get('transcriptionKey', 'unknown')}")
            else:
                logger.error(f"Failed to store transcription: {result.get('error', 'unknown error')}")
                
        except Exception as e:
            logger.error(f"Error storing session transcription: {str(e)}")
            
    def has_metadata(self) -> bool:
        """Check if all required metadata is available"""
        return all(self.session_metadata.values()) 