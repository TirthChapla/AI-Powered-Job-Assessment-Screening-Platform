"""
PDF to Text Extractor - Resume PDF Parser
Extracts text from PDF resumes for AI matching

Supports:
- pdfplumber (primary, best for resumes)
- PyMuPDF (fallback, faster)
"""

import os
from typing import Optional


def extract_text_with_pdfplumber(pdf_path: str) -> str:
    """
    Extract text using pdfplumber (primary method).
    Best for resumes with good layout handling.
    
    Args:
        pdf_path: Path to PDF file
        
    Returns:
        Extracted text as string
        
    Raises:
        FileNotFoundError: If PDF file doesn't exist
        Exception: If pdfplumber extraction fails
    """
    try:
        import pdfplumber
    except ImportError:
        raise ImportError("pdfplumber not installed. Run: pip install pdfplumber")
    
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")
    
    text_parts = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text.strip())
    
    return "\n".join(text_parts)


def extract_text_with_pymupdf(pdf_path: str) -> str:
    """
    Fallback extraction using PyMuPDF (fitz).
    Faster alternative when pdfplumber fails.
    
    Args:
        pdf_path: Path to PDF file
        
    Returns:
        Extracted text as string
        
    Raises:
        FileNotFoundError: If PDF file doesn't exist
        Exception: If PyMuPDF extraction fails
    """
    try:
        import fitz  # PyMuPDF
    except ImportError:
        raise ImportError("PyMuPDF not installed. Run: pip install pymupdf")
    
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")
    
    text_parts = []
    doc = fitz.open(pdf_path)
    for page in doc:
        page_text = page.get_text()
        if page_text:
            text_parts.append(page_text.strip())
    doc.close()
    
    return "\n".join(text_parts)


def extract_resume_text(pdf_path: str, prefer_pdfplumber: bool = True) -> str:
    """
    Main PDF → text extraction function.
    
    Tries pdfplumber first (best for resumes), falls back to PyMuPDF if needed.
    Ensures minimum text length for valid resume extraction.
    
    Args:
        pdf_path: Path to PDF resume file
        prefer_pdfplumber: If True, try pdfplumber first (default: True)
        
    Returns:
        Extracted text as string
        
    Raises:
        FileNotFoundError: If PDF file doesn't exist
        ValueError: If extracted text is too short (< 50 chars)
        RuntimeError: If both extraction methods fail
        
    Example:
        text = extract_resume_text("resume.pdf")
        # Returns: "John Doe\nSoftware Engineer\n..."
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")
    
    if not pdf_path.lower().endswith('.pdf'):
        raise ValueError(f"File is not a PDF: {pdf_path}")
    
    text = None
    last_error = None
    
    # Try primary method (pdfplumber)
    if prefer_pdfplumber:
        try:
            text = extract_text_with_pdfplumber(pdf_path)
            if text and len(text.strip()) > 50:  # Minimum valid text length
                return text.strip()
        except Exception as e:
            last_error = e
    
    # Fallback to PyMuPDF
    try:
        text = extract_text_with_pymupdf(pdf_path)
        if text and len(text.strip()) > 50:
            return text.strip()
    except Exception as e:
        last_error = e
    
    # If both methods failed or text too short
    if not text or len(text.strip()) < 50:
        error_msg = f"Failed to extract sufficient text from PDF: {pdf_path}"
        if last_error:
            error_msg += f" (Last error: {str(last_error)})"
        raise RuntimeError(error_msg)
    
    return text.strip()


def extract_resume_texts(pdf_paths: list) -> list:
    """
    Batch extract text from multiple PDF resumes.
    
    Args:
        pdf_paths: List of PDF file paths
        
    Returns:
        List of extracted text strings (same order as input)
        
    Example:
        texts = extract_resume_texts(["resume1.pdf", "resume2.pdf"])
        # Returns: ["text1", "text2"]
    """
    results = []
    for pdf_path in pdf_paths:
        try:
            text = extract_resume_text(pdf_path)
            results.append(text)
        except Exception as e:
            # Log error but continue with other PDFs
            print(f"Warning: Failed to extract {pdf_path}: {str(e)}")
            results.append("")  # Empty string for failed extraction
    
    return results


if __name__ == "__main__":
    # Test PDF extraction
    print("=" * 80)
    print("PDF to Text Extractor - Test")
    print("=" * 80)
    
    test_pdf = input("Enter PDF file path (or press Enter to skip): ").strip()
    
    if test_pdf and os.path.exists(test_pdf):
        try:
            text = extract_resume_text(test_pdf)
            print(f"\n✅ Successfully extracted {len(text)} characters")
            print(f"\nFirst 500 characters:")
            print("-" * 80)
            print(text[:500])
            print("-" * 80)
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
    else:
        print("\n⚠️  No PDF file provided or file not found")
        print("\nUsage:")
        print("  from pdf_to_text import extract_resume_text")
        print("  text = extract_resume_text('resume.pdf')")

