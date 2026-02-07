import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Dict, Any, Optional
import aiohttp
from livekit.agents.metrics import LLMMetrics, STTMetrics, EOUMetrics, TTSMetrics, VADMetrics
from metrics.metrics_formatter import MetricsFormatter

logger = logging.getLogger("new-relic-client")

class NewRelicClient:
    def __init__(self, license_key: Optional[str] = None, region: str = "US", formatter: Optional[MetricsFormatter] = None):
        self.license_key = license_key or os.getenv("NEW_RELIC_LICENSE_KEY")
        if not self.license_key:
            raise ValueError("New Relic license key is required. Set NEW_RELIC_LICENSE_KEY environment variable or pass it directly.")
        
        self.region = region.upper()
        self.base_url = self._get_base_url()
        self.formatter = formatter or MetricsFormatter()
        
    def _get_base_url(self) -> str:
            return "https://log-api.newrelic.com/log/v1"
    
    def _format_for_new_relic(self, metrics_data: Dict[str, Any]) -> list:
        """
        Format metrics data according to New Relic Logs API detailed format.
        Returns an array with a single object containing 'common' and 'logs' structure.
        """
        # Extract timestamp and convert to milliseconds if needed
        timestamp = metrics_data.get("timestamp_unix", datetime.now().timestamp())
        # Ensure timestamp is in milliseconds
        if timestamp < 1e12:  # If timestamp is in seconds, convert to milliseconds
            timestamp = int(timestamp * 1000)
        else:
            timestamp = int(timestamp)
        
        # Extract common attributes
        common_attributes = {
            "service": metrics_data.get("service", "voice-interview-agent"),
            "environment": metrics_data.get("environment", "development"),
            "agent_version": metrics_data.get("agent_version", "1.0.0"),
            "session_id": metrics_data.get("session_id", "unknown"),
            "room_name": metrics_data.get("room_name", "unknown"),
            "hostname": metrics_data.get("hostname", "unknown"),
            "deployment_id": metrics_data.get("deployment_id", "unknown"),
            "logtype": metrics_data.get("logtype", "agent_metrics")
        }
        
        # Create log entry with message and specific attributes
        log_entry = {
            "timestamp": timestamp,
            "message": metrics_data.get("message", "Agent metrics"),
            "attributes": {}
        }
        
        # Add all metrics-specific data as attributes
        for key, value in metrics_data.items():
            if key not in ["timestamp", "timestamp_unix", "service", "environment", 
                          "agent_version", "session_id", "room_name", "hostname", 
                          "deployment_id", "message", "logtype"]:
                log_entry["attributes"][key] = value
        
        # Return New Relic detailed format
        return [{
            "common": {
                "attributes": common_attributes
            },
            "logs": [log_entry]
        }]
    
    async def _send_to_new_relic(self, formatted_payload: list) -> None:
        """Internal method to send data to New Relic without waiting for response"""
        try:
            headers = {
                "Content-Type": "application/json",
                "Api-Key": self.license_key
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.base_url,
                    headers=headers,
                    json=formatted_payload,
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    if response.status != 202:
                        error_text = await response.text()
                        logger.error(f"New Relic API error - Status: {response.status}, Response: {error_text}")
                        
        except asyncio.TimeoutError:
            logger.error("New Relic request timeout")
        except Exception as e:
            logger.error(f"Failed to send to New Relic: {str(e)}")

    async def send_metrics_async(self, metrics_data: Dict[str, Any]) -> None:
        """Send metrics to New Relic asynchronously without waiting for response"""
        try:
            formatted_payload = self._format_for_new_relic(metrics_data)
            # Fire and forget - don't await the result
            asyncio.create_task(self._send_to_new_relic(formatted_payload))
        except Exception as e:
            logger.error(f"Error preparing metrics for New Relic: {str(e)}")

    async def send_metrics(self, metrics_data: Dict[str, Any]) -> bool:
        """Legacy method for backwards compatibility - now calls async version"""
        await self.send_metrics_async(metrics_data)
        return True  # Always return True since we don't wait for response
    
    async def send_llm_metrics(self, metrics: LLMMetrics) -> bool:
        metrics_data = self.formatter.format_llm_metrics(metrics)
        await self.send_metrics_async(metrics_data)
        return True
    
    async def send_stt_metrics(self, metrics: STTMetrics) -> bool:
        metrics_data = self.formatter.format_stt_metrics(metrics)
        await self.send_metrics_async(metrics_data)
        return True
    
    async def send_eou_metrics(self, metrics: EOUMetrics) -> bool:
        metrics_data = self.formatter.format_eou_metrics(metrics)
        await self.send_metrics_async(metrics_data)
        return True
    
    async def send_tts_metrics(self, metrics: TTSMetrics) -> bool:
        metrics_data = self.formatter.format_tts_metrics(metrics)
        await self.send_metrics_async(metrics_data)
        return True
    
    async def send_vad_metrics(self, metrics: VADMetrics) -> bool:
        metrics_data = self.formatter.format_vad_metrics(metrics)
        await self.send_metrics_async(metrics_data)
        return True
    
    async def send_custom_event_async(self, event_type: str, message: str, custom_attributes: Dict[str, Any] = None) -> None:
        """Send custom event to New Relic asynchronously without waiting for response"""
        metrics_data = self.formatter.create_custom_event(event_type, message, custom_attributes)
        await self.send_metrics_async(metrics_data)
    
    async def send_custom_event(self, event_type: str, message: str, custom_attributes: Dict[str, Any] = None) -> bool:
        """Legacy method for backwards compatibility"""
        await self.send_custom_event_async(event_type, message, custom_attributes)
        return True
    
    async def send_stage_transition_async(self, from_stage: str, to_stage: str, stage_duration: float) -> None:
        """Send stage transition event asynchronously"""
        await self.send_custom_event_async(
            "stage_transition",
            f"Interview stage transition from {from_stage} to {to_stage}",
            {
                "stage_transition": {
                    "from_stage": from_stage,
                    "to_stage": to_stage,
                    "stage_duration": stage_duration,
                    "stage_duration_ms": stage_duration * 1000
                }
            }
        )
    
    async def send_stage_transition(self, from_stage: str, to_stage: str, stage_duration: float) -> bool:
        """Legacy method for backwards compatibility"""
        await self.send_stage_transition_async(from_stage, to_stage, stage_duration)
        return True
    
    async def send_interview_start_async(self, participant_id: str, room_name: str) -> None:
        """Send interview start event asynchronously"""
        await self.send_custom_event_async(
            "interview_start",
            f"Interview started for participant {participant_id} in room {room_name}",
            {
                "interview": {
                    "participant_id": participant_id,
                    "room_name": room_name,
                    "start_time": datetime.now().isoformat()
                }
            }
        )
    
    async def send_interview_start(self, participant_id: str, room_name: str) -> bool:
        """Legacy method for backwards compatibility"""
        await self.send_interview_start_async(participant_id, room_name)
        return True
    
    async def send_interview_end_async(self, participant_id: str, total_duration: float, completed_stages: int, reason: Optional[str] = None) -> None:
        """Send interview end event asynchronously"""
        interview_data = {
            "participant_id": participant_id,
            "total_duration": total_duration,
            "total_duration_ms": total_duration * 1000,
            "completed_stages": completed_stages,
            "end_time": datetime.now().isoformat()
        }
        
        # Add reason if provided
        if reason:
            interview_data["reason"] = reason
            
        await self.send_custom_event_async(
            "interview_end",
            f"Interview completed for participant {participant_id}" + (f" (reason: {reason})" if reason else ""),
            {
                "interview": interview_data
            }
        )
    
    async def send_interview_end(self, participant_id: str, total_duration: float, completed_stages: int, reason: Optional[str] = None) -> bool:
        """Legacy method for backwards compatibility"""
        await self.send_interview_end_async(participant_id, total_duration, completed_stages, reason)
        return True 