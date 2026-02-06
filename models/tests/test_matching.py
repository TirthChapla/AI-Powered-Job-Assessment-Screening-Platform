"""
Test Resume Matching - Batch matching for recruiter dashboard
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from AI_Powered_Job_Assessment_Screening_Platform.models.ai_resume_matcher import match_resumes, load_model
import json

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

if __name__ == "__main__":
    print("=" * 80)
    print("RESUME MATCHING TEST")
    print("=" * 80)
    
    model = load_model()
    print("✅ Model loaded\n")
    
    result = match_resumes(jd_text, resume_texts, min_score_threshold=0.0, model=model)
    print(json.dumps(result, indent=2))
