"""
Test: Candidate Application - Binary Shortlist Decision
Tests the evaluate_application() function for candidate apply flow
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from ai_resume_matcher import evaluate_application, load_model
import json

# Test Job Description
jd = """
Java Full Stack Developer with 3+ years experience in Spring Boot, 
React.js, MySQL, Docker, and AWS. Must have REST APIs and microservices.
"""

test_candidates = [
    {
        "id": 1,
        "name": "Qualified Candidate",
        "resume": "Java Full Stack Developer with 5 years experience in Spring Boot, React.js, MySQL, Docker, AWS"
    },
    {
        "id": 2,
        "name": "Moderate Candidate",
        "resume": "Software developer with 2 years experience in Java and Spring Boot."
    },
    {
        "id": 3,
        "name": "Weak Candidate",
        "resume": "Student learning HTML, CSS, JavaScript"
    }
]

if __name__ == "__main__":
    print("=" * 80)
    print("CANDIDATE APPLICATION TEST")
    print("=" * 80)
    
    model = load_model()
    print("✅ Model loaded\n")
    
    for candidate in test_candidates:
        print(f"Candidate: {candidate['name']}")
        print(f"Resume: {candidate['resume']}\n")
        
        result = evaluate_application(jd, candidate['resume'], min_score_threshold=0.60, model=model)
        
        print(json.dumps(result, indent=2))
        print("-" * 80)
