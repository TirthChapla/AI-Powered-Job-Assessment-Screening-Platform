"""
Simple example: Run the AI Resume Matcher
"""

import sys
import os

# Add models directory to path
models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
sys.path.insert(0, models_dir)

from ai_resume_matcher import match_resumes, load_model
import json

def main():
    # Load model once
    print("Loading model...")
    model = load_model()
    print("✅ Model ready\n")
    
    # Example: Job Description
    jd = """Senior Java Developer with Spring Boot, Microservices, AWS, Docker"""
    
    # Example: Candidate Resumes
    resumes = [
        "Java developer 5 years Spring Boot REST APIs Docker AWS",
        "Frontend React JavaScript CSS",
        "Python Data Scientist ML",
    ]
    
    # Match resumes
    print(f"Job: {jd}\n")
    result = match_resumes(jd, resumes, min_score_threshold=0.0, model=model)
    
    print("Results:")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
