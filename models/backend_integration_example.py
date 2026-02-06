"""
Backend Integration Example for AI Resume Matcher
Shows how to use the module efficiently in a backend service (Spring Boot, Flask, FastAPI, etc.)
"""

from ai_resume_matcher import (
    load_model, 
    evaluate_application,  # PRIMARY: For candidate Apply button
    batch_match_for_recruiter,  # SECONDARY: For recruiter dashboard (optional)
    get_model,
    # Backward compatibility aliases
    check_candidate_application,  # Alias for evaluate_application
    match_resumes  # Alias for batch_match_for_recruiter
)

# ============================================================================
# OPTION 1: Load model once at application startup (RECOMMENDED)
# ============================================================================

# In your backend application startup (e.g., @PostConstruct in Spring Boot)
# or in Flask/FastAPI app initialization:

def initialize_model():
    """Call this once when your backend application starts"""
    print("Loading AI model...")
    model = load_model()
    print("✅ Model loaded successfully!")
    return model

# Store model in application context (example for Flask/FastAPI)
# app.model = load_model()

# ============================================================================
# OPTION 2: Use cached model (automatic caching)
# ============================================================================

def match_resumes_with_cached_model(jd_text: str, resume_texts: list, min_score_threshold: float = 0.50):
    """
    Uses automatically cached model - efficient for backend.
    Model is loaded once on first call, then reused.
    
    IMPORTANT: min_score_threshold ensures only qualified candidates are shortlisted.
    Returns ALL qualified candidates (NO top-K limit).
    """
    # Model is automatically cached, so this is efficient
    result = batch_match_for_recruiter(
        jd_text, 
        resume_texts, 
        min_score_threshold=min_score_threshold
    )
    return result

# ============================================================================
# OPTION 3: Pass pre-loaded model (most efficient for high traffic)
# ============================================================================

def match_resumes_with_preloaded_model(
    jd_text: str, 
    resume_texts: list, 
    model,
    min_score_threshold: float = 0.50
):
    """
    Pass pre-loaded model for maximum efficiency.
    Best for high-traffic backends.
    
    IMPORTANT: min_score_threshold ensures only qualified candidates are shortlisted.
    Returns ALL qualified candidates (NO top-K limit).
    """
    result = batch_match_for_recruiter(
        jd_text, 
        resume_texts, 
        min_score_threshold=min_score_threshold,
        model=model
    )
    return result

# ============================================================================
# EXAMPLE: Flask/FastAPI Endpoint
# ============================================================================

# Flask example:
"""
from flask import Flask, request, jsonify
from ai_resume_matcher import load_model, match_resumes

app = Flask(__name__)

# Load model once at startup
app.model = load_model()

@app.route('/api/match-resumes', methods=['POST'])
def match_resumes_endpoint():
    try:
        data = request.json
        jd_text = data.get('jd_text')
        resume_texts = data.get('resume_texts', [])
        min_score_threshold = data.get('min_score_threshold', 0.50)  # Quality filter
        
        # Use pre-loaded model
        # IMPORTANT: min_score_threshold filters out weak candidates
        # Returns ALL qualified candidates (NO top-K limit)
        result = batch_match_for_recruiter(
            jd_text, 
            resume_texts, 
            min_score_threshold=min_score_threshold,
            model=app.model
        )
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400
"""

# FastAPI example:
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from ai_resume_matcher import load_model, match_resumes

app = FastAPI()

# Load model once at startup
model = load_model()

class MatchRequest(BaseModel):
    jd_text: str
    resume_texts: List[str]
    min_score_threshold: float = 0.50  # Quality filter

@app.post("/api/match-resumes")
async def match_resumes_endpoint(request: MatchRequest):
    try:
        # IMPORTANT: min_score_threshold ensures only qualified candidates
        # Returns ALL qualified candidates (NO top-K limit)
        result = batch_match_for_recruiter(
            request.jd_text, 
            request.resume_texts, 
            min_score_threshold=request.min_score_threshold,
            model=model
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
"""

# ============================================================================
# EXAMPLE: Spring Boot Service (Python service called from Java)
# ============================================================================

"""
# Python service (can be called via REST API from Spring Boot)

from flask import Flask, request, jsonify
from ai_resume_matcher import load_model, match_resumes

app = Flask(__name__)
model = load_model()  # Load once

@app.route('/match', methods=['POST'])
def match():
    data = request.json
    result = batch_match_for_recruiter(
        data['jd_text'],
        data['resume_texts'],
        min_score_threshold=data.get('min_score_threshold', 0.50),
        model=model
    )
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
"""

# ============================================================================
# ERROR HANDLING EXAMPLE
# ============================================================================

def safe_match_resumes(jd_text: str, resume_texts: list, min_score_threshold: float = 0.50):
    """
    Example with proper error handling for backend.
    
    IMPORTANT: min_score_threshold ensures only qualified candidates are shortlisted.
    If recruiter needs 100 but only 10 qualified, only 10 are returned.
    """
    try:
        # Check if model is loaded
        model = get_model()
        if model is None:
            model = load_model()
        
        result = batch_match_for_recruiter(
            jd_text, 
            resume_texts, 
            min_score_threshold=min_score_threshold,
            model=model
        )
        return {"success": True, "data": result}
        
    except ValueError as e:
        return {"success": False, "error": f"Invalid input: {str(e)}"}
    except RuntimeError as e:
        return {"success": False, "error": f"Model error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Unexpected error: {str(e)}"}

# ============================================================================
# CANDIDATE APPLICATION CHECK (When Candidate Clicks Apply)
# ============================================================================

def check_application_endpoint(jd_text: str, resume_text: str, min_score_threshold: float, model):
    """
    PRIMARY FUNCTION: Use this when a candidate clicks "Apply" button.
    
    Returns binary result: shortlisted (true/false) based on recruiter's threshold.
    No ranking, no top-K - just simple pass/fail check.
    
    This is the MAIN AI MODEL for candidate application flow.
    """
    result = evaluate_application(  # PRIMARY function
        jd_text,
        resume_text,
        min_score_threshold,
        model=model
    )
    return result

# Flask example for candidate application:
"""
from flask import Flask, request, jsonify
from ai_resume_matcher import load_model, check_candidate_application

app = Flask(__name__)
app.model = load_model()

@app.route('/api/candidate/apply', methods=['POST'])
def candidate_apply():
    try:
        data = request.json
        jd_text = data.get('jd_text')
        resume_text = data.get('resume_text')
        min_score_threshold = data.get('min_score_threshold', 0.50)  # From recruiter settings
        
        # PRIMARY: Check if candidate meets threshold (for Apply button)
        result = evaluate_application(
            jd_text,
            resume_text,
            min_score_threshold,
            model=app.model
        )
        
        # Return binary result
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400
"""

# FastAPI example for candidate application:
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ai_resume_matcher import load_model, check_candidate_application

app = FastAPI()
model = load_model()

class ApplicationRequest(BaseModel):
    jd_text: str
    resume_text: str
    min_score_threshold: float = 0.50  # From recruiter settings

@app.post("/api/candidate/apply")
async def candidate_apply(request: ApplicationRequest):
    try:
        # PRIMARY: Evaluate application (for Apply button)
        result = evaluate_application(
            request.jd_text,
            request.resume_text,
            request.min_score_threshold,
            model=model
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
"""

# ============================================================================
# PERFORMANCE TIPS FOR BACKEND
# ============================================================================

"""
1. Load model ONCE at application startup, not per request
2. Use model caching (automatic) or pass model explicitly
3. Batch process multiple resumes together (already implemented)
4. Handle errors gracefully with try-catch
5. Validate inputs before calling match_resumes()
6. Consider async processing for large batches
7. Monitor memory usage (model is ~420MB in memory)
"""

if __name__ == "__main__":
    # Test initialization
    print("Testing backend integration patterns...")
    
    # Initialize model
    model = initialize_model()
    
    # Test with sample data
    jd = "Java Full Stack Developer with Spring Boot and React.js experience"
    resumes = [
        "Java developer with Spring Boot and React.js experience",
        "Python developer with Django experience"
    ]
    
    # Test Option 2 (cached)
    result1 = match_resumes_with_cached_model(jd, resumes, min_score_threshold=0.50)
    print(f"\n✅ Cached model test: {len(result1['results'])} qualified matches")
    
    # Test Option 3 (pre-loaded)
    result2 = match_resumes_with_preloaded_model(jd, resumes, model, min_score_threshold=0.50)
    print(f"✅ Pre-loaded model test: {len(result2['results'])} qualified matches")
    
    # Test error handling
    result3 = safe_match_resumes(jd, resumes, min_score_threshold=0.50)
    print(f"✅ Error handling test: {result3['success']}")
    
    # Test candidate application check
    print("\n" + "="*80)
    print("Testing Candidate Application Check (for Apply button)")
    print("="*80)
    
    single_resume = "Java developer with Spring Boot and React.js experience"
    result4 = evaluate_application(jd, single_resume, min_score_threshold=0.50, model=model)
    print(f"✅ Candidate application check: Shortlisted={result4['shortlisted']}, Score={result4['score']}")
    
    print("\n💡 IMPORTANT - SEPARATION OF RESPONSIBILITIES:")
    print("   PRIMARY: evaluate_application() - For candidate Apply button")
    print("            - Threshold-based binary decision")
    print("            - NO ranking, NO top-K")
    print("   SECONDARY: batch_match_for_recruiter() - For recruiter dashboard (optional)")
    print("            - Batch ranking for analytics")
    print("            - NOT used during candidate apply flow")
    
    print("\n✅ All backend integration tests passed!")

