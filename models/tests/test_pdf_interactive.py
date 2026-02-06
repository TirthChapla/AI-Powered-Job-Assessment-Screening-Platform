"""
PDF Integration Test - Interactive Resume Matching
Extract resume text from PDF and match with AI
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import json

# Try to import PDF libraries
try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

try:
    import pymupdf
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

from ai_resume_matcher import evaluate_application, batch_match_for_recruiter, load_model


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF file."""
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF not found: {pdf_path}")
    
    text = ""
    
    if HAS_PDFPLUMBER:
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            return text.strip()
        except Exception as e:
            print(f"⚠️  pdfplumber error: {e}")
    
    if HAS_PYMUPDF:
        try:
            doc = pymupdf.open(pdf_path)
            for page_num in range(len(doc)):
                page = doc[page_num]
                text += page.get_text()
            return text.strip()
        except Exception as e:
            print(f"⚠️  pymupdf error: {e}")
    
    raise RuntimeError("No PDF library available")


def interactive_candidate_apply():
    """Interactive: Candidate applies with resume (PDF or text)."""
    print("\n" + "=" * 80)
    print("CANDIDATE APPLICATION - Interactive Test")
    print("=" * 80)
    
    # Load model
    print("\n🤖 Loading AI model...")
    model = load_model()
    print("✅ Model loaded\n")
    
    # Get job description
    print("Enter Job Description (or press Enter for default):")
    jd_input = input().strip()
    
    if jd_input:
        jd = jd_input
    else:
        jd = """
        Senior Java Full Stack Developer
        Requirements: Spring Boot, React.js, MySQL, Docker, AWS, 5+ years experience
        """
    
    # Get resume
    print("\nEnter Resume (text) or PDF path:")
    resume_input = input().strip()
    
    if resume_input.endswith('.pdf') and os.path.exists(resume_input):
        print(f"\n📄 Extracting from PDF: {resume_input}")
        try:
            resume_text = extract_text_from_pdf(resume_input)
            print(f"✅ Extracted {len(resume_text)} characters\n")
        except Exception as e:
            print(f"❌ Error: {e}")
            return
    else:
        resume_text = resume_input if resume_input else "Java developer with Spring Boot experience"
    
    # Get threshold
    print("Enter score threshold (0.0-1.0, default 0.60):")
    threshold_input = input().strip()
    threshold = float(threshold_input) if threshold_input else 0.60
    
    # Evaluate
    print("\n🔍 Evaluating application...")
    result = evaluate_application(jd, resume_text, min_score_threshold=threshold, model=model)
    
    # Display result
    print("\n" + "=" * 80)
    print("APPLICATION RESULT:")
    print("=" * 80)
    print(f"Shortlisted: {'✅ YES' if result['shortlisted'] else '❌ NO'}")
    print(f"Score: {result['score']:.4f}")
    print(f"Threshold: {result['threshold']:.4f}")
    print(f"Reason: {result['reason']}")


def interactive_batch_matching():
    """Interactive: Recruiter matches multiple resumes."""
    print("\n" + "=" * 80)
    print("BATCH MATCHING - Interactive Test")
    print("=" * 80)
    
    # Load model
    print("\n🤖 Loading AI model...")
    model = load_model()
    print("✅ Model loaded\n")
    
    # Get job description
    print("Enter Job Description:")
    jd = input().strip() or "Java Full Stack Developer with Spring Boot"
    
    # Get resumes
    resumes = []
    print("\nEnter resumes (one per line, empty line to finish):")
    while True:
        resume_input = input().strip()
        if not resume_input:
            break
        
        if resume_input.endswith('.pdf') and os.path.exists(resume_input):
            try:
                text = extract_text_from_pdf(resume_input)
                resumes.append(text)
                print(f"✅ Added resume from {resume_input}")
            except Exception as e:
                print(f"❌ Error: {e}")
        else:
            resumes.append(resume_input)
            print(f"✅ Added resume")
    
    if not resumes:
        print("❌ No resumes provided")
        return
    
    # Get threshold
    print("\nEnter minimum score threshold (0.0-1.0, default 0.50):")
    threshold_input = input().strip()
    threshold = float(threshold_input) if threshold_input else 0.50
    
    # Batch match
    print("\n🔍 Matching resumes...")
    result = batch_match_for_recruiter(jd, resumes, min_score_threshold=threshold, model=model)
    
    # Display results
    print("\n" + "=" * 80)
    print("BATCH MATCHING RESULTS:")
    print("=" * 80)
    print(f"Total Candidates: {result['total_candidates']}")
    print(f"Shortlisted: {result['shortlisted']}")
    
    if result['results']:
        print(f"\nRanked Candidates:")
        for r in result['results']:
            print(f"  #{r['rank']}: Score {r['score']:.4f}")
            print(f"       {r['reason']}")
    else:
        print("\n❌ No candidates met the threshold")


def main():
    print("=" * 80)
    print("PDF INTEGRATION TEST - Interactive Resume Matcher")
    print("=" * 80)
    print("\nAvailable PDF libraries:")
    print(f"  - pdfplumber: {'✅' if HAS_PDFPLUMBER else '❌'}")
    print(f"  - pymupdf: {'✅' if HAS_PYMUPDF else '❌'}")
    
    while True:
        print("\n" + "=" * 80)
        print("MENU:")
        print("=" * 80)
        print("1. Candidate Application (single resume)")
        print("2. Batch Matching (multiple resumes)")
        print("3. Exit")
        
        choice = input("\nSelect option (1-3): ").strip()
        
        if choice == "1":
            interactive_candidate_apply()
        elif choice == "2":
            interactive_batch_matching()
        elif choice == "3":
            print("\n✅ Goodbye!")
            break
        else:
            print("❌ Invalid option")


if __name__ == "__main__":
    main()
