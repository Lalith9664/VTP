from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Header
from typing import Optional
from app.utils.pdf_parser import extract_text_from_pdf
from app.utils.pdf_generator import generate_resume_pdf
from app.utils.storage import upload_pdf_to_supabase
from app.utils.embeddings import get_embedding
from app.database import supabase
from app.models import UserProfileUpdate, BaseResumeGenerationRequest
from app.dependencies.auth import get_current_user
from app.agents.resume_agent import generate_base_resume

router = APIRouter()

@router.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Parse PDF resume, extract embedding vector, and save to user profile.
    """
    user_id = current_user["id"]
    content = await file.read()
    raw_text = extract_text_from_pdf(content)
    
    if not raw_text or not raw_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract readable text from PDF.")
    
    # Generate 384-dimension embedding
    embedding = await get_embedding(raw_text)
    
    if supabase:
        supabase.table('profiles').upsert({
            'id': user_id,
            'raw_resume_text': raw_text,
            'resume_embedding': embedding
        }).execute()
        
    return {
        "status": "success",
        "user_id": user_id,
        "message": "Resume successfully uploaded and vector embedding generated."
    }

@router.post("/update-goal")
async def update_goal(
    profile_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update profile data including ultimate goal, education, location, skills, and resume generation permission.
    """
    user_id = current_user["id"]
    
    update_payload = {
        "id": user_id,
        "ultimate_goal": profile_data.ultimate_goal,
        "education": profile_data.education,
        "location": profile_data.location,
        "skills": profile_data.skills,
        "permission_to_generate_resume": profile_data.permission_to_generate_resume
    }
    
    # Filter out None values
    update_payload = {k: v for k, v in update_payload.items() if v is not None}
    
    if supabase:
        supabase.table('profiles').upsert(update_payload).execute()
        
    return {
        "status": "success",
        "user_id": user_id,
        "updated_profile": update_payload
    }

@router.post("/generate-base-resume")
async def generate_user_base_resume(
    request: BaseResumeGenerationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    NEW FEATURE: Auto-generate a foundational ATS-friendly base resume for users signing up without a resume.
    Requires user permission flag. Synthesizes base resume, generates vector embedding, saves to database,
    and uploads ATS PDF to Supabase Storage.
    """
    user_id = current_user["id"]

    if not request.permission_to_generate_resume:
        raise HTTPException(
            status_code=400,
            detail="Permission to generate resume was not granted by user (permission_to_generate_resume must be True)."
        )

    # Fetch user profile to check existing resume state
    profile_res = None
    if supabase:
        profile_res = supabase.table('profiles').select('*').eq('id', user_id).execute()

    existing_profile = profile_res.data[0] if (profile_res and profile_res.data) else {}
    existing_raw_text = existing_profile.get("raw_resume_text")

    if existing_raw_text and len(existing_raw_text.strip()) > 50:
        return {
            "status": "already_exists",
            "message": "User already has an existing resume.",
            "raw_resume_text": existing_raw_text
        }

    # Extract goal, education, location, and skills from request or existing profile
    goal = request.ultimate_goal or existing_profile.get("ultimate_goal")
    education = request.education or existing_profile.get("education")
    location = request.location or existing_profile.get("location")
    skills = request.skills if request.skills else existing_profile.get("skills", [])

    # Synthesize foundational base resume via LLM agent
    base_resume_text = await generate_base_resume(
        goal=goal,
        education=education,
        location=location,
        skills=skills
    )

    # Generate 384-dimension vector embedding
    embedding = await get_embedding(base_resume_text)

    # Generate ATS PDF bytes & upload to Supabase Storage
    pdf_bytes = generate_resume_pdf(
        bullets=base_resume_text.split("\n"),
        user_name=current_user.get("email", "Candidate").split("@")[0].title(),
        ultimate_goal=goal,
        skills=skills
    )
    pdf_url = await upload_pdf_to_supabase(pdf_bytes, f"base_resume_{user_id}.pdf")

    # Update database
    if supabase:
        supabase.table('profiles').upsert({
            'id': user_id,
            'raw_resume_text': base_resume_text,
            'resume_embedding': embedding,
            'permission_to_generate_resume': True,
            'ultimate_goal': goal,
            'education': education,
            'location': location,
            'skills': skills
        }).execute()

        try:
            supabase.table('generated_resumes').insert({
                'user_id': user_id,
                'resume_type': 'prebuilt',
                'raw_text': base_resume_text,
                'pdf_url': pdf_url
            }).execute()
        except Exception:
            pass

    return {
        "status": "success",
        "user_id": user_id,
        "resume_type": "prebuilt",
        "raw_resume_text": base_resume_text,
        "pdf_url": pdf_url
    }
