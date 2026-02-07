import logging
from typing import Dict, Any
from livekit.agents import llm

logger = logging.getLogger("context-analyzer")

class ContextAnalyzer:
    @staticmethod
    def analyze_context(chat_ctx: llm.ChatContext) -> Dict[str, Any]:
        """Analyze chat context size and provide metrics"""
        context_content = ""
        for message in chat_ctx.items:
            context_content += f"{message.role}: {message.content}\n"
        
        context_size = len(context_content)
        estimated_tokens = context_size // 4
        
        return {
            'context_size': context_size,
            'context_size_kb': context_size / 1024,
            'estimated_tokens': estimated_tokens,
            'message_count': len(chat_ctx.items)
        }
    
    @staticmethod
    def log_context_metrics(chat_ctx: llm.ChatContext, operation: str = "LLM call"):
        """Log context metrics with appropriate warnings"""
        metrics = ContextAnalyzer.analyze_context(chat_ctx)
        
        logger.info(f"{operation} context: {metrics['context_size']:,} chars ({metrics['context_size_kb']:.1f}KB), ~{metrics['estimated_tokens']:,} tokens")
        
        if metrics['estimated_tokens'] > 12000:
            logger.warning(f"Large context size: ~{metrics['estimated_tokens']:,} tokens - may cause performance issues")
        
        if metrics['estimated_tokens'] > 20000:
            logger.error(f"Very large context size: ~{metrics['estimated_tokens']:,} tokens - likely to cause failures")
        
        return metrics
    
    @staticmethod
    def log_context_failure(chat_ctx: llm.ChatContext, error: Exception, operation_time: float):
        """Log context information when an operation fails"""
        metrics = ContextAnalyzer.analyze_context(chat_ctx)
        
        logger.error(f"Operation failed after {operation_time:.3f}s: {str(error)}")
        logger.error(f"Context size at failure: {metrics['context_size']:,} chars, ~{metrics['estimated_tokens']:,} tokens")
        
        if logger.isEnabledFor(logging.DEBUG):
            logger.debug("Last few context messages:")
            for i, message in enumerate(chat_ctx.items[-3:]):
                logger.debug(f"  {i}: {message.role}: {message.content[:200]}...")
        
        return metrics 