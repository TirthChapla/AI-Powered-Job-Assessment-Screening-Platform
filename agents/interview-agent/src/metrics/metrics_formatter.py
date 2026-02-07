import os
import uuid
import socket
from datetime import datetime
from typing import Dict, Any, Optional
from livekit.agents.metrics import LLMMetrics, STTMetrics, EOUMetrics, TTSMetrics, VADMetrics

class MetricsFormatter:
    def __init__(self):
        self.session_id = str(uuid.uuid4())
        self.room_name = "unknown-room"
        self.participant_id = "unknown-participant"
        self.environment = os.getenv("ENVIRONMENT", "development")
        
        # Try to get actual hostname
        try:
            self.hostname = socket.gethostname()
        except:
            self.hostname = os.getenv("HOSTNAME", "unknown-host")
            
    def update_room_context(self, room_name: str = None, participant_id: str = None):
        """Update room context when available from LiveKit"""
        if room_name:
            self.room_name = room_name
        if participant_id:
            self.participant_id = participant_id
        
    def _get_common_attributes(self) -> Dict[str, Any]:
        return {
            "service": "voice-interview-agent",
            "environment": self.environment,
            "session_id": self.session_id,
            "room_name": self.room_name,
            "hostname": self.hostname,
            "participant_id": self.participant_id
        }
    
    def _convert_timestamp_to_ms(self, timestamp: float) -> int:
        """Convert timestamp to milliseconds if it's in seconds"""
        if timestamp < 1e12:  # If timestamp is in seconds
            return int(timestamp * 1000)
        return int(timestamp)
    
    def format_llm_metrics(self, metrics: LLMMetrics) -> Dict[str, Any]:
        timestamp_ms = self._convert_timestamp_to_ms(metrics.timestamp)
        
        formatted_data = {
            "timestamp": datetime.fromtimestamp(metrics.timestamp).isoformat(),
            "timestamp_unix": timestamp_ms,
            "logtype": "llm_metrics",
            "message": f"LLM request completed - Duration: {metrics.duration:.4f}s, Tokens: {metrics.total_tokens}",
            **self._get_common_attributes(),
            "metrics_type": "llm",
            "llm": {
                "type": str(metrics.type),
                "label": str(metrics.label),
                "request_id": str(metrics.request_id),
                "duration": metrics.duration,
                "ttft": metrics.ttft,
                "cancelled": metrics.cancelled,
                "completion_tokens": metrics.completion_tokens,
                "prompt_tokens": metrics.prompt_tokens,
                "total_tokens": metrics.total_tokens,
                "tokens_per_second": metrics.tokens_per_second
            },
            "performance": {
                "duration_ms": metrics.duration * 1000,
                "ttft_ms": metrics.ttft * 1000,
                "efficiency_score": metrics.tokens_per_second / 100 if metrics.tokens_per_second > 0 else 0
            }
        }
        
        if hasattr(metrics, 'error') and metrics.error:
            formatted_data["error"] = str(metrics.error)
            formatted_data["logtype"] = "llm_error"
            formatted_data["message"] = f"LLM request failed: {metrics.error}"
        
        return formatted_data
    
    def format_stt_metrics(self, metrics: STTMetrics) -> Dict[str, Any]:
        timestamp_ms = self._convert_timestamp_to_ms(metrics.timestamp)
        
        formatted_data = {
            "timestamp": datetime.fromtimestamp(metrics.timestamp).isoformat(),
            "timestamp_unix": timestamp_ms,
            "logtype": "stt_metrics",
            "message": f"STT request completed - Duration: {metrics.duration:.4f}s, Audio: {metrics.audio_duration:.4f}s",
            **self._get_common_attributes(),
            "metrics_type": "stt",
            "stt": {
                "type": str(metrics.type),
                "label": str(metrics.label),
                "request_id": str(metrics.request_id),
                "duration": metrics.duration,
                "streamed": metrics.streamed,
                "audio_duration": metrics.audio_duration
            },
            "performance": {
                "duration_ms": metrics.duration * 1000,
                "audio_duration_ms": metrics.audio_duration * 1000,
                "processing_ratio": metrics.duration / metrics.audio_duration if metrics.audio_duration > 0 else 0
            }
        }
        
        if hasattr(metrics, 'speech_id'):
            formatted_data["stt"]["speech_id"] = str(metrics.speech_id)
            
        if hasattr(metrics, 'error') and metrics.error:
            formatted_data["error"] = str(metrics.error)
            formatted_data["logtype"] = "stt_error"
            formatted_data["message"] = f"STT request failed: {metrics.error}"
        
        return formatted_data
    
    def format_eou_metrics(self, metrics: EOUMetrics) -> Dict[str, Any]:
        timestamp_ms = self._convert_timestamp_to_ms(metrics.timestamp)
        
        formatted_data = {
            "timestamp": datetime.fromtimestamp(metrics.timestamp).isoformat(),
            "timestamp_unix": timestamp_ms,
            "logtype": "eou_metrics",
            "message": f"End of utterance detected - EOU delay: {metrics.end_of_utterance_delay:.4f}s",
            **self._get_common_attributes(),
            "metrics_type": "eou",
            "eou": {
                "type": str(metrics.type),
                "label": str(metrics.label),
                "end_of_utterance_delay": metrics.end_of_utterance_delay,
                "transcription_delay": metrics.transcription_delay,
                "speech_id": str(metrics.speech_id)
            },
            "performance": {
                "eou_delay_ms": metrics.end_of_utterance_delay * 1000,
                "transcription_delay_ms": metrics.transcription_delay * 1000,
                "total_delay_ms": (metrics.end_of_utterance_delay + metrics.transcription_delay) * 1000
            }
        }
        
        if hasattr(metrics, 'error') and metrics.error:
            formatted_data["error"] = str(metrics.error)
            formatted_data["logtype"] = "eou_error"
            formatted_data["message"] = f"EOU processing failed: {metrics.error}"
        
        return formatted_data
    
    def format_tts_metrics(self, metrics: TTSMetrics) -> Dict[str, Any]:
        timestamp_ms = self._convert_timestamp_to_ms(metrics.timestamp)
        
        formatted_data = {
            "timestamp": datetime.fromtimestamp(metrics.timestamp).isoformat(),
            "timestamp_unix": timestamp_ms,
            "logtype": "tts_metrics",
            "message": f"TTS request completed - Duration: {metrics.duration:.4f}s, Characters: {metrics.characters_count}",
            **self._get_common_attributes(),
            "metrics_type": "tts",
            "tts": {
                "type": str(metrics.type),
                "label": str(metrics.label),
                "request_id": str(metrics.request_id),
                "ttfb": metrics.ttfb,
                "duration": metrics.duration,
                "audio_duration": metrics.audio_duration,
                "cancelled": metrics.cancelled,
                "characters_count": metrics.characters_count,
                "streamed": metrics.streamed,
                "speech_id": str(metrics.speech_id)
            },
            "performance": {
                "ttfb_ms": metrics.ttfb * 1000,
                "duration_ms": metrics.duration * 1000,
                "audio_duration_ms": metrics.audio_duration * 1000,
                "characters_per_second": metrics.characters_count / metrics.duration if metrics.duration > 0 else 0,
                "audio_speed_ratio": metrics.audio_duration / metrics.duration if metrics.duration > 0 else 0
            }
        }
        
        if hasattr(metrics, 'error') and metrics.error:
            formatted_data["error"] = str(metrics.error)
            formatted_data["logtype"] = "tts_error"
            formatted_data["message"] = f"TTS request failed: {metrics.error}"
        
        return formatted_data
    
    def format_vad_metrics(self, metrics: VADMetrics) -> Dict[str, Any]:
        timestamp_ms = self._convert_timestamp_to_ms(metrics.timestamp)
        
        formatted_data = {
            "timestamp": datetime.fromtimestamp(metrics.timestamp).isoformat(),
            "timestamp_unix": timestamp_ms,
            "logtype": "vad_metrics",
            "message": f"VAD processing completed - Inferences: {getattr(metrics, 'inference_count', 'unknown')}",
            **self._get_common_attributes(),
            "metrics_type": "vad",
            "vad": {
                "type": str(metrics.type)
            }
        }
        
        if hasattr(metrics, 'label'):
            formatted_data["vad"]["label"] = str(metrics.label)
        if hasattr(metrics, 'idle_time'):
            formatted_data["vad"]["idle_time"] = metrics.idle_time
            formatted_data["performance"] = formatted_data.get("performance", {})
            formatted_data["performance"]["idle_time_ms"] = metrics.idle_time * 1000
        if hasattr(metrics, 'inference_duration_total'):
            formatted_data["vad"]["inference_duration_total"] = metrics.inference_duration_total
            formatted_data["performance"] = formatted_data.get("performance", {})
            formatted_data["performance"]["inference_duration_total_ms"] = metrics.inference_duration_total * 1000
        if hasattr(metrics, 'inference_count'):
            formatted_data["vad"]["inference_count"] = metrics.inference_count
            if hasattr(metrics, 'inference_duration_total') and metrics.inference_count > 0:
                formatted_data["performance"] = formatted_data.get("performance", {})
                formatted_data["performance"]["avg_inference_duration_ms"] = (metrics.inference_duration_total / metrics.inference_count) * 1000
        if hasattr(metrics, 'speech_id'):
            formatted_data["vad"]["speech_id"] = str(metrics.speech_id)
        
        if hasattr(metrics, 'error') and metrics.error:
            formatted_data["error"] = str(metrics.error)
            formatted_data["logtype"] = "vad_error"
            formatted_data["message"] = f"VAD processing failed: {metrics.error}"
        
        return formatted_data
    
    def create_custom_event(self, event_type: str, message: str, custom_attributes: Dict[str, Any] = None) -> Dict[str, Any]:
        now = datetime.now()
        timestamp_ms = self._convert_timestamp_to_ms(now.timestamp())
        
        formatted_data = {
            "timestamp": now.isoformat(),
            "timestamp_unix": timestamp_ms,
            "logtype": f"custom_{event_type}",
            "message": message,
            **self._get_common_attributes(),
            "metrics_type": "custom",
            "event_type": event_type
        }
        
        if custom_attributes:
            formatted_data.update(custom_attributes)
        
        return formatted_data 