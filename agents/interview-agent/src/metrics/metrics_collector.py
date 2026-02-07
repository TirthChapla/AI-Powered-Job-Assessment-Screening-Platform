import logging
from livekit.agents.metrics import LLMMetrics, STTMetrics, EOUMetrics, TTSMetrics
from metrics.new_relic_client import NewRelicClient
from metrics.metrics_formatter import MetricsFormatter
import os
from typing import Optional

logger = logging.getLogger("metrics-collector")
logger.setLevel(logging.INFO)

# Create shared formatter instance
formatter = MetricsFormatter()

logger.info(f"Initializing New Relic client")
new_relic_client = None
try:
    logger.info(f"NEW_RELIC_LICENSE_KEY: {os.getenv('NEW_RELIC_LICENSE_KEY')}")
    if os.getenv("NEW_RELIC_LICENSE_KEY"):
        new_relic_client = NewRelicClient(formatter=formatter)
        logger.info("New Relic client initialized successfully")
    else:
        logger.info("NEW_RELIC_LICENSE_KEY not found, New Relic integration disabled")
except Exception as e:
    logger.warning(f"Failed to initialize New Relic client: {e}")
    new_relic_client = None

# Export the formatter so other modules can update it
__all__ = ['formatter', 'new_relic_client', 'setup_metrics_handlers', 'send_interview_start', 'send_interview_end', 'send_stage_transition']

async def on_llm_metrics_collected(metrics: LLMMetrics) -> None:
    if new_relic_client:
        formatted_data = formatter.format_llm_metrics(metrics)
        await new_relic_client.send_metrics_async(formatted_data)

async def on_stt_metrics_collected(metrics: STTMetrics) -> None:
    if new_relic_client:
        formatted_data = formatter.format_stt_metrics(metrics)
        await new_relic_client.send_metrics_async(formatted_data)

async def on_stt_eou_metrics_collected(metrics: EOUMetrics) -> None:
    if new_relic_client:
        formatted_data = formatter.format_eou_metrics(metrics)
        await new_relic_client.send_metrics_async(formatted_data)

async def on_tts_metrics_collected(metrics: TTSMetrics) -> None:
    if new_relic_client:
        formatted_data = formatter.format_tts_metrics(metrics)
        await new_relic_client.send_metrics_async(formatted_data)
    
async def on_vad_metrics_collected(metrics):
    if new_relic_client:
        formatted_data = formatter.format_vad_metrics(metrics)
        await new_relic_client.send_metrics_async(formatted_data)

def setup_metrics_handlers(session):
    """Setup all metrics event handlers for the agent session"""
    import asyncio
    
    def llm_metrics_wrapper(metrics: LLMMetrics):
        asyncio.create_task(on_llm_metrics_collected(metrics))   
        
    def stt_metrics_wrapper(metrics: STTMetrics):
        asyncio.create_task(on_stt_metrics_collected(metrics))
        
    def stt_eou_metrics_wrapper(metrics: EOUMetrics):
        asyncio.create_task(on_stt_eou_metrics_collected(metrics))             

    def tts_metrics_wrapper(metrics: TTSMetrics):
        asyncio.create_task(on_tts_metrics_collected(metrics))
        
    def vad_metrics_wrapper(metrics):
        asyncio.create_task(on_vad_metrics_collected(metrics))            
        
    session.llm.on("metrics_collected", llm_metrics_wrapper)
    session.stt.on("metrics_collected", stt_metrics_wrapper)
    session.stt.on("eou_metrics_collected", stt_eou_metrics_wrapper)
    session.tts.on("metrics_collected", tts_metrics_wrapper)
    # session.vad.on("metrics_collected", vad_metrics_wrapper)

async def send_interview_start(participant_id: str, room_name: str):
    """Send interview start event to New Relic"""
    if new_relic_client:
        await new_relic_client.send_interview_start_async(participant_id, room_name)

async def send_interview_end(participant_id: str, total_duration: float, completed_stages: int, reason: Optional[str] = None):
    """Send interview end event to New Relic"""
    if new_relic_client:
        await new_relic_client.send_interview_end_async(participant_id, total_duration, completed_stages, reason)

async def send_stage_transition(from_stage: str, to_stage: str, stage_duration: float):
    """Send stage transition event to New Relic"""
    if new_relic_client:
        await new_relic_client.send_stage_transition_async(from_stage, to_stage, stage_duration)