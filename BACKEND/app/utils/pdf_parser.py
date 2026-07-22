import io
import PyPDF2
from fastapi import HTTPException

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Robustly extract plain text from uploaded PDF bytes using PyPDF2.
    """
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Empty PDF file provided.")

    try:
        pdf_file = io.BytesIO(pdf_bytes)
        reader = PyPDF2.PdfReader(pdf_file)
        
        extracted_text = []
        for page_num, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                extracted_text.append(text)

        full_text = "\n".join(extracted_text).strip()
        if not full_text:
            raise HTTPException(
                status_code=400, 
                detail="Could not extract readable text from PDF. The PDF may be scanned or image-based."
            )
        
        return full_text

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Failed to parse PDF document: {str(e)}"
        )
