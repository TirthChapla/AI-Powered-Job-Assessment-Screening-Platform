"""
AI Resume Matcher - Standalone Module
Semantic matching between Job Descriptions and Resumes using Sentence-BERT MPNet
Model: all-mpnet-base-v2 (768-dimensional embeddings)

Backend-Ready: Supports model reuse for efficient backend integration

================================================================================
IMPORTANT: SEPARATION OF RESPONSIBILITIES
================================================================================

PRIMARY FLOW (Candidate Apply) - THRESHOLD-BASED DECISION:
    evaluate_application()
    - Used when candidate clicks "Apply" button
    - Threshold-based binary decision (shortlisted/not shortlisted)
    - NO ranking, NO top-K concept
    - Returns: {shortlisted: true/false, score, reason, threshold}
    - This is the MAIN AI MODEL for candidate application flow

SECONDARY FLOW (Recruiter Analytics) - OPTIONAL BATCH RANKING:
    batch_match_for_recruiter()
    - Used later by recruiter for dashboard/analytics
    - Batch analysis with ranking
    - Returns ALL qualified candidates (NO top-K limit)
    - NOT used during candidate apply flow
    - Keep for future recruiter dashboard features

KEY PRINCIPLE:
    During candidate application, we use threshold-based semantic matching
    to instantly decide shortlist eligibility. Ranking is performed separately
    for recruiter analytics only.
================================================================================
"""

import json
from typing import List, Dict, Tuple, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Global model cache for backend integration (load once, reuse many times)
_model_cache: Optional[SentenceTransformer] = None


def load_model(force_reload: bool = False) -> SentenceTransformer:
    """
    Load all-mpnet-base-v2 model once and keep in memory.
    Uses caching for backend efficiency - model loaded once and reused.
    
    Args:
        force_reload: If True, reload model even if cached (default: False)
        
    Returns:
        SentenceTransformer model instance
    """
    global _model_cache
    
    if _model_cache is None or force_reload:
        try:
            _model_cache = SentenceTransformer('all-mpnet-base-v2')
        except Exception as e:
            raise RuntimeError(f"Failed to load model: {str(e)}")
    
    return _model_cache


def get_model() -> Optional[SentenceTransformer]:
    """
    Get cached model instance if available.
    Useful for backend integration to check if model is already loaded.
    
    Returns:
        Cached model instance or None if not loaded
    """
    return _model_cache


def clean_text(text: str) -> str:
    """Minimal text cleanup - whitespace normalization only."""
    if not text or not isinstance(text, str):
        return ""
    return ' '.join(text.split())


def generate_embeddings(model: SentenceTransformer, texts: List[str]) -> np.ndarray:
    """
    Generate embeddings using batch encoding.
    
    Args:
        model: Loaded SentenceTransformer model
        texts: List of text strings
        
    Returns:
        numpy array of shape (N, 768) for 768-dimensional embeddings
    """
    if not texts:
        return np.array([]).reshape(0, 768)
    
    cleaned_texts = [clean_text(text) for text in texts]
    embeddings = model.encode(
        cleaned_texts,
        batch_size=32,
        show_progress_bar=False,
        normalize_embeddings=True
    )
    return np.array(embeddings)


def compute_similarity(jd_embedding: np.ndarray, resume_embeddings: np.ndarray) -> np.ndarray:
    """
    Compute cosine similarity between JD and resumes.
    
    Args:
        jd_embedding: JD embedding of shape (768,)
        resume_embeddings: Resume embeddings of shape (N, 768)
        
    Returns:
        Array of similarity scores in range [0, 1]
    """
    if resume_embeddings.shape[0] == 0:
        return np.array([])
    
    jd_reshaped = jd_embedding.reshape(1, -1)
    similarities = cosine_similarity(jd_reshaped, resume_embeddings)[0]
    return np.clip(similarities, 0.0, 1.0)


def generate_reason(score: float) -> str:
    """
    Generate rule-based explanation for match score.
    
    Args:
        score: Similarity score in range [0, 1]
        
    Returns:
        Explanation string
    """
    if score >= 0.75:
        return "Strong semantic match with job description"
    elif score >= 0.60:
        return "Moderate match with required skills"
    else:
        return "Weak relevance to job requirements"


def rank_candidates(similarities: np.ndarray) -> List[Tuple[int, float]]:
    """
    Rank candidates by similarity score in descending order.
    
    Args:
        similarities: Array of similarity scores
        
    Returns:
        List of (candidate_id, score) tuples sorted descending
    """
    candidate_scores = [(idx, float(score)) for idx, score in enumerate(similarities)]
    ranked = sorted(candidate_scores, key=lambda x: x[1], reverse=True)
    return ranked


def _filter_qualified_candidates(
    ranked_candidates: List[Tuple[int, float]], 
    min_score_threshold: float = 0.50
) -> List[Tuple[int, float]]:
    """
    INTERNAL HELPER: Filter candidates by minimum quality threshold.
    
    Only candidates with score >= min_score_threshold are returned.
    NO top-K limit - all qualified candidates are returned.
    
    Args:
        ranked_candidates: List of (candidate_id, score) tuples (already sorted)
        min_score_threshold: Minimum score required (default: 0.50)
        
    Returns:
        List of qualified candidates (all meeting threshold, no limit)
    """
    # Filter candidates by minimum score threshold
    # IMPORTANT: Only candidates with score >= min_score_threshold pass
    # Candidates with score < min_score_threshold are EXCLUDED
    qualified_candidates = [
        (candidate_id, score) 
        for candidate_id, score in ranked_candidates 
        if score >= min_score_threshold  # Strict >= check - below threshold = NOT qualified
    ]
    
    return qualified_candidates


def evaluate_application(
    jd_text: str,
    resume_text: str,
    min_score_threshold: float,
    model: Optional[SentenceTransformer] = None
) -> Dict:
    """
    PRIMARY FUNCTION: Evaluate single candidate application (threshold-based decision).
    
    This is the MAIN AI MODEL used when a candidate clicks "Apply" button.
    Returns binary result: shortlisted (true/false) based on recruiter's threshold.
    
    KEY CHARACTERISTICS:
    - Threshold-based decision (NO ranking, NO top-K)
    - Binary result: shortlisted/not shortlisted
    - Instant decision for candidate application flow
    - Used in production for real-time application evaluation
    
    Args:
        jd_text: Job description text
        resume_text: Single candidate resume text
        min_score_threshold: Minimum score required by recruiter (0.0 to 1.0)
        model: Optional pre-loaded model instance (for backend efficiency)
        
    Returns:
        Dictionary with application result:
        {
            "shortlisted": bool,      # true if score >= threshold, false otherwise
            "score": float,            # Similarity score [0, 1]
            "reason": str,            # Explanation of decision
            "threshold": float        # Recruiter's minimum score threshold
        }
        
    Raises:
        ValueError: If inputs are invalid
        RuntimeError: If model loading fails
        
    Example:
        result = evaluate_application(
            jd_text="Java Developer with Spring Boot",
            resume_text="Java developer with Spring Boot experience",
            min_score_threshold=0.60
        )
        # Returns: {"shortlisted": true, "score": 0.8234, ...}
    """
    # Input validation
    if not jd_text or not isinstance(jd_text, str):
        raise ValueError("jd_text must be a non-empty string")
    
    if not resume_text or not isinstance(resume_text, str):
        raise ValueError("resume_text must be a non-empty string")
    
    if not isinstance(min_score_threshold, (int, float)) or min_score_threshold < 0.0 or min_score_threshold > 1.0:
        raise ValueError("min_score_threshold must be a float between 0.0 and 1.0")
    
    # Use provided model or load/cache model
    if model is None:
        model = load_model()
    elif not isinstance(model, SentenceTransformer):
        raise ValueError("model must be a SentenceTransformer instance")
    
    try:
        # Generate embeddings
        jd_embedding = generate_embeddings(model, [jd_text])[0]
        resume_embedding = generate_embeddings(model, [resume_text])[0]
        
        # Validate embedding shapes
        if jd_embedding.shape[0] != 768:
            raise RuntimeError(f"JD embedding shape mismatch: expected 768, got {jd_embedding.shape[0]}")
        
        if resume_embedding.shape[0] != 768:
            raise RuntimeError(f"Resume embedding shape mismatch: expected 768, got {resume_embedding.shape[0]}")
        
        # Compute similarity
        jd_reshaped = jd_embedding.reshape(1, -1)
        resume_reshaped = resume_embedding.reshape(1, -1)
        similarity_score = float(cosine_similarity(jd_reshaped, resume_reshaped)[0][0])
        similarity_score = max(0.0, min(1.0, similarity_score))  # Clip to [0, 1]
        
        # Check if candidate meets threshold
        is_shortlisted = similarity_score >= min_score_threshold
        
        # Generate reason
        if is_shortlisted:
            reason = generate_reason(similarity_score)
        else:
            reason = f"Score {similarity_score:.4f} below required threshold {min_score_threshold:.4f}"
        
        return {
            "shortlisted": is_shortlisted,
            "score": round(similarity_score, 4),
            "reason": reason,
            "threshold": round(min_score_threshold, 4)
        }
        
    except Exception as e:
        raise RuntimeError(f"Error during candidate application evaluation: {str(e)}")


def batch_match_for_recruiter(
    jd_text: str, 
    resume_texts: List[str], 
    min_score_threshold: float = 0.50,
    model: Optional[SentenceTransformer] = None
) -> Dict:
    """
    SECONDARY FUNCTION: Batch matching for recruiter dashboard/analytics (OPTIONAL).
    
    This function is for recruiter analytics and dashboard features.
    It provides batch ranking of ALL qualified candidates (no top-K limit).
    
    ⚠️ NOT USED DURING CANDIDATE APPLY FLOW ⚠️
    - Candidate application uses evaluate_application() (threshold-based, no ranking)
    - This function is ONLY for recruiter dashboard/analytics
    
    KEY CHARACTERISTICS:
    - Batch processing of multiple resumes
    - Returns ALL qualified candidates (ranked by score)
    - Quality threshold applies (weak candidates filtered out)
    - NO top-K concept - all qualified candidates are returned
    - Optional feature for future recruiter dashboard
    
    Args:
        jd_text: Job description text
        resume_texts: List of resume texts
        min_score_threshold: Minimum similarity score required (default: 0.50)
                            Only candidates with score >= threshold are returned
        model: Optional pre-loaded model instance (for backend efficiency)
        
    Returns:
        Dictionary with ranked results (ALL qualified candidates):
        {
            "total_candidates": int,
            "shortlisted": int,  # All candidates meeting threshold
            "results": [
                {
                    "candidate_id": int,
                    "score": float,
                    "rank": int,
                    "reason": str
                }
            ]
        }
        
    Raises:
        ValueError: If inputs are invalid
        RuntimeError: If model loading fails
        
    Note:
        This is an optional feature for recruiter analytics.
        Primary application flow uses evaluate_application() instead.
        NO top-K parameter - all qualified candidates are returned.
    """
    # Input validation
    if not jd_text or not isinstance(jd_text, str):
        raise ValueError("jd_text must be a non-empty string")
    
    if not resume_texts or not isinstance(resume_texts, list):
        raise ValueError("resume_texts must be a non-empty list")
    
    if not all(isinstance(r, str) and r.strip() for r in resume_texts):
        raise ValueError("All resume_texts must be non-empty strings")
    
    if not isinstance(min_score_threshold, (int, float)) or min_score_threshold < 0.0 or min_score_threshold > 1.0:
        raise ValueError("min_score_threshold must be a float between 0.0 and 1.0")
    
    # Ensure threshold is enforced - candidates below threshold are NOT shortlisted
    # Default is 0.50, meaning candidates with score < 0.50 will be filtered out
    
    # Use provided model or load/cache model
    if model is None:
        model = load_model()
    elif not isinstance(model, SentenceTransformer):
        raise ValueError("model must be a SentenceTransformer instance")
    
    try:
        # Generate embeddings
        jd_embedding = generate_embeddings(model, [jd_text])[0]
        resume_embeddings = generate_embeddings(model, resume_texts)
        
        # Validate embedding shapes
        if jd_embedding.shape[0] != 768:
            raise RuntimeError(f"JD embedding shape mismatch: expected 768, got {jd_embedding.shape[0]}")
        
        if resume_embeddings.shape[1] != 768:
            raise RuntimeError(f"Resume embedding dimension mismatch: expected 768, got {resume_embeddings.shape[1]}")
        
        # Compute similarities
        similarities = compute_similarity(jd_embedding, resume_embeddings)
        
        # Rank candidates
        ranked_candidates = rank_candidates(similarities)
        
        # Filter candidates by quality threshold (NO top-K limit)
        # IMPORTANT: Only candidates with score >= min_score_threshold are returned
        # Candidates with score < min_score_threshold are FILTERED OUT (not shortlisted)
        qualified_candidates = _filter_qualified_candidates(ranked_candidates, min_score_threshold)
        
        # Build results (ONLY qualified candidates meeting threshold, ranked)
        results = []
        for rank, (candidate_id, score) in enumerate(qualified_candidates, start=1):
            results.append({
                "candidate_id": candidate_id,
                "score": round(score, 4),
                "rank": rank,
                "reason": generate_reason(score)
            })
        
        return {
            "total_candidates": len(resume_texts),
            "shortlisted": len(qualified_candidates),  # All qualified candidates
            "results": results
        }
        
    except Exception as e:
        raise RuntimeError(f"Error during resume matching: {str(e)}")


# ============================================================================
# BACKWARD COMPATIBILITY ALIASES (for existing code)
# ============================================================================

# Alias for evaluate_application (old name support)
check_candidate_application = evaluate_application

# Alias for batch_match_for_recruiter (old name support)
match_resumes = batch_match_for_recruiter

