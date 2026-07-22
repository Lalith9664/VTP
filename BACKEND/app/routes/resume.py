from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from typing import List, Optional
from pydantic import BaseModel
from app.utils.pdf_generator import generate_resume_pdf
from app.utils.storage import upload_pdf_to_supabase
from app.database import supabase
from app.dependencies.auth import get_current_user

router = APIRouter()

class PDFGenerateRequest(BaseModel):
    bullets: List[str]
    user_name: Optional[str] = "Candidate"
    ultimate_goal: Optional[str] = None
    skills: Optional[List[str]] = None

@router.post("/generate-pdf")
async def generate_pdf(
    request: PDFGenerateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate downloadable ATS-friendly resume PDF bytes and upload to Supabase Storage.
    """
    user_id = current_user["id"]
    pdf_bytes = generate_resume_pdf(
        bullets=request.bullets,
        user_name=request.user_name,
        ultimate_goal=request.ultimate_goal,
        skills=request.skills
    )

    pdf_url = await upload_pdf_to_supabase(pdf_bytes, f"tailored_{user_id}.pdf")

    return {
        "status": "success",
        "user_id": user_id,
        "pdf_url": pdf_url,
        "size_bytes": len(pdf_bytes)
    }

@router.get("/download/{resume_id}")
async def download_resume_pdf(
    resume_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Return raw PDF bytes for immediate browser download.
    """
    sample_bullets = [
        "Built modular asynchronous FastAPI microservices with clean code architecture.",
        "Integrated pgvector and HuggingFace embeddings for semantic search."
    ]
    pdf_bytes = generate_resume_pdf(bullets=sample_bullets, user_name=current_user.get("email", "Candidate"))

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=resume_{resume_id}.pdf"}
    )
