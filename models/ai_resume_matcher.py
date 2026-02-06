"""
AI Resume Matcher - Standalone Module
Semantic matching between Job Descriptions and Resumes using Sentence-BERT MPNet
Model: all-mpnet-base-v2 (768-dimensional embeddings)
"""

import json
from typing import List, Dict, Tuple
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity


def load_model() -> SentenceTransformer:
    """Load all-mpnet-base-v2 model once and keep in memory."""
    return SentenceTransformer('all-mpnet-base-v2')


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


def shortlist_candidates(ranked_candidates: List[Tuple[int, float]], top_k: int = 100) -> List[Tuple[int, float]]:
    """
    Shortlist top-K candidates.
    
    Args:
        ranked_candidates: List of (candidate_id, score) tuples
        top_k: Number of top candidates to shortlist (default: 100)
        
    Returns:
        Shortlisted candidates list
    """
    return ranked_candidates[:top_k]


def match_resumes(jd_text: str, resume_texts: List[str], top_k: int = 100) -> Dict:
    """
    Main function: Match resumes to job description and return ranked results.
    
    Args:
        jd_text: Job description text
        resume_texts: List of resume texts
        top_k: Number of top candidates to shortlist (default: 100)
        
    Returns:
        Dictionary with matching results in specified JSON format:
        {
            "total_candidates": int,
            "shortlisted": int,
            "results": [
                {
                    "candidate_id": int,
                    "score": float,
                    "rank": int,
                    "reason": str
                }
            ]
        }
    """
    if not jd_text or not resume_texts:
        return {
            "total_candidates": len(resume_texts) if resume_texts else 0,
            "shortlisted": 0,
            "results": []
        }
    
    model = load_model()
    
    jd_embedding = generate_embeddings(model, [jd_text])[0]
    resume_embeddings = generate_embeddings(model, resume_texts)
    
    similarities = compute_similarity(jd_embedding, resume_embeddings)
    
    ranked_candidates = rank_candidates(similarities)
    
    shortlisted = shortlist_candidates(ranked_candidates, top_k)
    
    results = []
    for rank, (candidate_id, score) in enumerate(shortlisted, start=1):
        results.append({
            "candidate_id": candidate_id,
            "score": round(score, 4),
            "rank": rank,
            "reason": generate_reason(score)
        })
    
    return {
        "total_candidates": len(resume_texts),
        "shortlisted": len(shortlisted),
        "results": results
    }


if __name__ == "__main__":
    # Test data
    jd_text = """
We are looking for a Backend Developer with experience in
Spring Boot, REST APIs, SQL, and Docker.
2–4 years of experience required.
"""

    resume_texts = [
        "Backend developer with 3 years experience in Spring Boot, REST APIs, and SQL. Worked on microservices.",
        "Frontend engineer skilled in React, JavaScript, and CSS.",
        "Software engineer with experience in Java, SQL, Docker, and RESTful services.",
        "Data analyst with Python, Pandas, and Machine Learning experience."
    ]
    
    # Run matching
    output = match_resumes(jd_text, resume_texts)
    
    # Print JSON output
    print(json.dumps(output, indent=2))

