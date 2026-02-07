import os
import logging
import sys
from typing import Dict, List

logger = logging.getLogger("knowledge-loader")

class KnowledgeLoader:
    def __init__(self, knowledge_base_path: str = "../knowledge-base"):
        # Get the absolute path relative to this file's directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.knowledge_base_path = os.path.join(current_dir, knowledge_base_path)
        self.knowledge_base: Dict[str, str] = {}
        self.load_knowledge_base()
    
    def load_knowledge_base(self):
        """Load all markdown files from the knowledge base directory."""
        try:
            if not os.path.exists(self.knowledge_base_path):
                logger.warning(f"Knowledge base path does not exist: {self.knowledge_base_path}")
                return
            
            total_size = 0
            file_count = 0
            
            for filename in os.listdir(self.knowledge_base_path):
                if filename.endswith('.md'):
                    file_path = os.path.join(self.knowledge_base_path, filename)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as file:
                            content = file.read()
                            # Use filename without extension as key
                            key = filename[:-3]  # Remove .md extension
                            self.knowledge_base[key] = content
                            
                            # Log file details
                            file_size = len(content)
                            total_size += file_size
                            file_count += 1
                            
                            logger.info(f"Loaded knowledge file: {filename} ({file_size:,} chars, {file_size/1024:.1f}KB)")
                            
                    except Exception as e:
                        logger.error(f"Error loading file {filename}: {e}")
            
            logger.info(f"Knowledge base loaded: {file_count} files, {total_size:,} total chars ({total_size/1024:.1f}KB)")
            
            # Log individual file sizes for debugging
            if logger.isEnabledFor(logging.DEBUG):
                logger.debug("Knowledge base file breakdown:")
                for key, content in self.knowledge_base.items():
                    size = len(content)
                    logger.debug(f"  {key}: {size:,} chars ({size/1024:.1f}KB)")
            
        except Exception as e:
            logger.error(f"Error loading knowledge base: {e}")
    
    def get_all_knowledge(self) -> str:
        """Get all knowledge base content as a single string."""
        if not self.knowledge_base:
            logger.warning("No knowledge base content available")
            return "No knowledge base content available."
        
        combined_content = []
        total_chars = 0
        
        for key, content in self.knowledge_base.items():
            section_header = f"=== {key.upper().replace('-', ' ')} ==="
            combined_content.append(f"{section_header}\n")
            combined_content.append(content)
            combined_content.append("\n\n")
            
            total_chars += len(section_header) + len(content) + 3  # +3 for newlines
        
        result = "\n".join(combined_content)
        final_size = len(result)
        
        logger.info(f"Generated combined knowledge: {final_size:,} chars ({final_size/1024:.1f}KB)")
        
        # Warning for very large content
        if final_size > 50000:  # 50KB threshold
            logger.warning(f"Large knowledge base content: {final_size:,} chars - this may cause LLM token limit issues")
        
        if final_size > 100000:  # 100KB threshold
            logger.error(f"Very large knowledge base content: {final_size:,} chars - likely to cause LLM failures")
        
        return result
    
    def get_knowledge_by_topic(self, topic: str) -> str:
        """Get knowledge base content for a specific topic."""
        topic_key = topic.lower().replace(' ', '-')
        
        logger.debug(f"Searching for topic: '{topic}' (key: '{topic_key}')")
        
        # Try exact match first
        if topic_key in self.knowledge_base:
            content = self.knowledge_base[topic_key]
            logger.info(f"Found exact match for topic '{topic}': {len(content):,} chars")
            return content
        
        # Try partial matches
        matches = []
        for key, content in self.knowledge_base.items():
            if topic_key in key or any(word in key for word in topic_key.split('-')):
                matches.append((key, content))
        
        if matches:
            # Return the first match
            key, content = matches[0]
            logger.info(f"Found partial match for topic '{topic}': '{key}' ({len(content):,} chars)")
            if len(matches) > 1:
                logger.debug(f"Multiple matches found for '{topic}': {[m[0] for m in matches]}")
            return content
        
        logger.warning(f"No knowledge found for topic: '{topic}'")
        return f"No specific knowledge found for topic: {topic}"
    
    def search_knowledge(self, query: str) -> List[str]:
        """Search for content containing the query terms."""
        query_lower = query.lower()
        results = []
        total_matches = 0
        
        logger.debug(f"Searching knowledge base for query: '{query}'")
        
        for key, content in self.knowledge_base.items():
            if query_lower in content.lower():
                # Extract relevant section around the match
                lines = content.split('\n')
                relevant_lines = []
                matches_in_file = 0
                
                for i, line in enumerate(lines):
                    if query_lower in line.lower():
                        matches_in_file += 1
                        # Include context around the match
                        start = max(0, i - 2)
                        end = min(len(lines), i + 3)
                        context = '\n'.join(lines[start:end])
                        relevant_lines.append(f"From {key}:\n{context}")
                
                results.extend(relevant_lines)
                total_matches += matches_in_file
                logger.debug(f"Found {matches_in_file} matches in '{key}'")
        
        # Limit results to top 5
        limited_results = results[:5]
        
        logger.info(f"Search for '{query}' found {total_matches} total matches across {len([r for r in results])} sections, returning top {len(limited_results)}")
        
        return limited_results
    
    def get_available_topics(self) -> List[str]:
        """Get list of available knowledge base topics."""
        topics = list(self.knowledge_base.keys())
        logger.debug(f"Available topics: {topics}")
        return topics
    
    def get_knowledge_stats(self) -> Dict[str, any]:
        """Get statistics about the knowledge base for debugging."""
        if not self.knowledge_base:
            return {"error": "No knowledge base loaded"}
        
        stats = {
            "total_files": len(self.knowledge_base),
            "total_chars": sum(len(content) for content in self.knowledge_base.values()),
            "files": {}
        }
        
        for key, content in self.knowledge_base.items():
            stats["files"][key] = {
                "chars": len(content),
                "lines": len(content.split('\n')),
                "size_kb": len(content) / 1024
            }
        
        stats["total_size_kb"] = stats["total_chars"] / 1024
        stats["average_file_size"] = stats["total_chars"] / stats["total_files"]
        
        return stats

# Global instance
knowledge_loader = KnowledgeLoader() 