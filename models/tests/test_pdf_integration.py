"""
PDF Integration Test - Extract resume text from PDF and match with AI
Tests demonstrate: PDF → Text extraction → AI matching
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
    import pymupdf  # fitz
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

from ai_resume_matcher import evaluate_application, batch_match_for_recruiter, load_model


def test_pdf_resume_matching():
    """
    Test PDF resume extraction and AI matching with sample data.
    """
    print("=" * 80)
    print("PDF INTEGRATION TEST - Resume Matching with Sample Data")
    print("=" * 80)
    print()
    
    # Check available libraries
    print(f"Available PDF libraries:")
    print(f"  - pdfplumber: {'✅ INSTALLED' if HAS_PDFPLUMBER else '❌ NOT INSTALLED'}")
    print(f"  - pymupdf: {'✅ INSTALLED' if HAS_PYMUPDF else '❌ NOT INSTALLED'}")
    print()
    
    # Load model
    print("Loading AI model...")
    model = load_model()
    print("✅ Model loaded\n")
    
    # Test Job Description
    jd = """
    Senior Java Full Stack Developer
    
    Requirements:
    - Spring Boot and Spring Framework
    - React.js or Angular frontend
    - MySQL/PostgreSQL databases
    - REST API design
    - Docker and Kubernetes
    - AWS cloud platform
    - 5+ years experience
    - Microservices architecture
    """
    
    print("Job Description:")
    print("-" * 80)
    print(jd)
    print("-" * 80)
    print()
    
    # Sample resumes (simulating PDF extraction)
    resume_1 = """
    JOHN DEVELOPER - john@email.com
    
    SUMMARY
    Java Full Stack Developer with 6 years experience in Spring Boot, React.js,
    and AWS. Expert in building scalable microservices and REST APIs.
    
    SKILLS
    Backend: Spring Boot, Hibernate, REST APIs
    Frontend: React.js, Redux
    Databases: MySQL, PostgreSQL
    DevOps: Docker, Kubernetes, AWS
    """
    
    resume_2 = """
    JANE CODER - jane@email.com
    
    SUMMARY
    Software Developer with 3 years in Java Spring Framework.
    
    SKILLS
    Backend: Spring, REST APIs
    Databases: MySQL
    """
    
    resume_3 = """
    ALEX DESIGNER - alex@email.com
    
    SUMMARY
    UI/UX Designer with 4 years experience.
    
    SKILLS
    Design: Figma, Adobe XD
    Frontend: HTML, CSS, JavaScript
    """
    
    resumes = [
        ("Candidate 1 - Strong Match", resume_1),
        ("Candidate 2 - Moderate Match", resume_2),
        ("Candidate 3 - Weak Match", resume_3),
    ]
    
    # Test individual applications
    print("1. INDIVIDUAL APPLICATIONS (Threshold-based):")
    print("=" * 80)
    
    for resume_name, resume_text in resumes:
        print(f"\n{resume_name}")
        print("-" * 40)
        
        result = evaluate_application(jd, resume_text, min_score_threshold=0.60, model=model)
        
        print(f"Score: {result['score']:.4f} (Threshold: {result['threshold']:.4f})")
        print(f"Status: {'✅ SHORTLISTED' if result['shortlisted'] else '❌ NOT SHORTLISTED'}")
        print(f"Reason: {result['reason']}")
    
    # Batch matching
    print("\n" + "=" * 80)
    print("2. BATCH MATCHING (Recruiter Dashboard):")
    print("=" * 80)
    
    all_resumes = [resume_text for _, resume_text in resumes]
    batch_result = batch_match_for_recruiter(jd, all_resumes, min_score_threshold=0.50, model=model)
    
    print(f"\nTotal Candidates: {batch_result['total_candidates']}")
    print(f"Shortlisted: {batch_result['shortlisted']}")
    
    if batch_result['results']:
        print(f"\nRanked Results:")
        for r in batch_result['results']:
            print(f"  #{r['rank']}: Candidate {r['candidate_id']} - Score {r['score']:.4f}")
            print(f"       {r['reason']}")
    
    print("\n" + "=" * 80)
    print("✅ PDF Integration Test Complete!")
    print("=" * 80)
    print("\nPDF Libraries ready for production use:")
    print("- extract_text_from_pdf(pdf_path) → extract text from single PDF")
    print("- Process extracted text with evaluate_application() or batch_match_for_recruiter()")


if __name__ == "__main__":
    test_pdf_resume_matching()

    """Test: Candidate applies with PDF resume"""
    print("=" * 80)
    print("TEST 1: Candidate Application with PDF Resume")
    print("=" * 80)
    
    # Job Description
    jd_text = """
    We are looking for a Java Full Stack Developer with strong experience in
    Spring Boot, React.js, MySQL, Docker, and AWS. Must have 3+ years experience
    building full-stack applications with REST APIs and microservices architecture.
    """
    
    # PDF Resume (replace with actual PDF path)
    pdf_path = input("\nEnter PDF resume path (or press Enter to use text): ").strip()
    
    if pdf_path and os.path.exists(pdf_path):
        try:
            # Extract text from PDF
            print(f"\n📄 Extracting text from PDF: {pdf_path}")
            resume_text = extract_resume_text(pdf_path)
            print(f"✅ Extracted {len(resume_text)} characters")
            
            # Load model
            print("\n🤖 Loading AI model...")
            model = load_model()
            
            # Evaluate application
            print("\n🔍 Evaluating application...")
            result = evaluate_application(
                jd_text=jd_text,
                resume_text=resume_text,
                min_score_threshold=0.50,
                model=model
            )
            
            # Display result
            print("\n" + "=" * 80)
            print("RESULT:")
            print("=" * 80)
            print(f"Shortlisted: {'✅ YES' if result['shortlisted'] else '❌ NO'}")
            print(f"Score: {result['score']:.4f}")
            print(f"Threshold: {result['threshold']:.4f}")
            print(f"Reason: {result['reason']}")
            
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
            import traceback
            traceback.print_exc()
    else:
        print("\n⚠️  No PDF file provided")
        print("\nExample usage:")
        print("  python test_pdf_integration.py")
        print("  # Then enter PDF path when prompted")


def test_pdf_batch_matching():
    """Test: Recruiter batch processes multiple PDF resumes"""
    print("\n\n" + "=" * 80)
    print("TEST 2: Recruiter Batch Matching with PDF Resumes")
    print("=" * 80)
    
    jd_text = """
    Java Full Stack Developer with Spring Boot and React.js experience.
    """
    
    # Multiple PDF resumes
    pdf_paths_input = input("\nEnter PDF paths (comma-separated) or press Enter to skip: ").strip()
    
    if pdf_paths_input:
        pdf_paths = [p.strip() for p in pdf_paths_input.split(',')]
        pdf_paths = [p for p in pdf_paths if os.path.exists(p)]
        
        if pdf_paths:
            try:
                # Extract text from all PDFs
                print(f"\n📄 Extracting text from {len(pdf_paths)} PDFs...")
                resume_texts = extract_resume_texts(pdf_paths)
                
                valid_texts = [t for t in resume_texts if t]  # Remove empty
                print(f"✅ Extracted text from {len(valid_texts)} PDFs")
                
                if valid_texts:
                    # Load model
                    print("\n🤖 Loading AI model...")
                    model = load_model()
                    
                    # Batch match
                    print("\n🔍 Matching resumes...")
                    result = batch_match_for_recruiter(
                        jd_text=jd_text,
                        resume_texts=valid_texts,
                        min_score_threshold=0.50,
                        model=model
                    )
                    
                    # Display results
                    print("\n" + "=" * 80)
                    print("RESULTS:")
                    print("=" * 80)
                    print(f"Total Candidates: {result['total_candidates']}")
                    print(f"Shortlisted: {result['shortlisted']}")
                    print(f"\nRanked Candidates:")
                    for candidate in result['results']:
                        print(f"  Rank {candidate['rank']}: Score {candidate['score']:.4f} - {candidate['reason']}")
                else:
                    print("\n⚠️  No valid text extracted from PDFs")
                    
            except Exception as e:
                print(f"\n❌ Error: {str(e)}")
                import traceback
                traceback.print_exc()
        else:
            print("\n⚠️  No valid PDF files found")
    else:
        print("\n⚠️  No PDF files provided")


def main():
    print("=" * 80)
    print("PDF Integration Test - AI Resume Matcher")
    print("=" * 80)
    print("\nThis test demonstrates:")
    print("1. PDF → Text extraction")
    print("2. Text → AI matching")
    print("3. Integration with evaluate_application() and batch_match_for_recruiter()")
    print("\n" + "=" * 80)
    
    # Test single PDF application
    test_pdf_single_application()
    
    # Test batch PDF matching
    test_pdf_batch_matching()
    
    print("\n\n" + "=" * 80)
    print("✅ PDF Integration Test Complete!")
    print("=" * 80)


if __name__ == "__main__":
    main()

