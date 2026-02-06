"""
Test: Threshold Enforcement
Tests that the quality threshold is properly enforced
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from ai_resume_matcher import batch_match_for_recruiter, load_model
import json

jd = "Backend Developer with Spring Boot, REST APIs, SQL, Docker"

resumes = [
    "Backend developer with 3 years Spring Boot REST APIs SQL microservices",
    "Frontend engineer React JavaScript",
    "Data analyst Python Pandas ML",
]

if __name__ == "__main__":
    print("=" * 80)
    print("THRESHOLD ENFORCEMENT TEST")
    print("=" * 80)
    
    model = load_model()
    print("✅ Model loaded\n")
    
    # Test with threshold 0.50
    print("Testing with min_score_threshold=0.50")
    result = batch_match_for_recruiter(jd, resumes, min_score_threshold=0.50, model=model)
    print(json.dumps(result, indent=2))
    print()
    
    # Test with threshold 0.70
    print("Testing with min_score_threshold=0.70")
    result = batch_match_for_recruiter(jd, resumes, min_score_threshold=0.70, model=model)
    print(json.dumps(result, indent=2))
