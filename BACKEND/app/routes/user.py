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
from app.agents.tailor_agent import generate_dossier
from app.agents.config import GROQ_API_KEY
from groq import AsyncGroq
import asyncio
import json
import logging

router = APIRouter()
logger = logging.getLogger(__name__)
async_groq = AsyncGroq(api_key=GROQ_API_KEY)


# ─── Helper: extract structured resume details via Groq LLM ──────────────────

async def _extract_resume_details(raw_text: str) -> dict:
    """
    Uses Groq LLM to extract structured resume fields from raw text:
    name, email, phone, skills, education, experience, projects, summary.
    Returns a dict. Falls back to minimal defaults on failure.
    """
    prompt = f"""
You are an expert resume parser. Extract the following fields from the resume text below.
Return STRICT JSON ONLY (no markdown, no explanation):
{{
  "name": "Full name of the candidate",
  "email": "Email address",
  "phone": "Phone number",
  "summary": "1-2 sentence professional summary",
  "skills": ["skill1", "skill2", ...],
  "education": [{{"degree": "...", "institution": "...", "year": "...", "gpa": "..."}}],
  "experience": [{{"title": "...", "company": "...", "duration": "...", "bullets": ["..."]}}],
  "projects": [{{"name": "...", "tech": ["..."], "description": "..."}}],
  "certifications": ["cert1", ...],
  "location": "City, Country"
}}

Resume Text:
{raw_text[:4000]}
"""
    try:
        resp = await async_groq.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a strict JSON generator. Output ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.0,
            max_tokens=1500
        )
        content = resp.choices[0].message.content or "{}"
        clean = content.strip().replace("```json", "").replace("```", "").strip()
        return json.loads(clean)
    except Exception as e:
        logger.warning(f"LLM resume parsing failed: {e}. Falling back to minimal defaults.")
        # Minimal fallback from raw text
        lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
        return {
            "name": lines[0] if lines else "Candidate",
            "email": "",
            "phone": "",
            "summary": raw_text[:200],
            "skills": [],
            "education": [],
            "experience": [],
            "projects": [],
            "certifications": [],
            "location": ""
        }


@router.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Parse PDF resume, extract embedding vector, upload PDF to Supabase Storage,
    and save everything to the user profile.
    """
    user_id = current_user["id"]
    content = await file.read()

    # 1. Extract text from PDF
    raw_text = extract_text_from_pdf(content)
    if not raw_text or not raw_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract readable text from PDF.")

    # 2. Generate 384-dimension embedding vector
    embedding = await get_embedding(raw_text)

    # 3. Upload raw PDF to Supabase Storage bucket
    original_filename = file.filename or f"resume_{user_id}.pdf"
    pdf_url = await upload_pdf_to_supabase(content, original_filename)

    # 4. Upsert profile with resume text, embedding, and storage URL
    if supabase:
        supabase.table('profiles').upsert({
            'id': user_id,
            'raw_resume_text': raw_text,
            'resume_embedding': embedding,
            'resume_pdf_url': pdf_url,
        }).execute()

        # 5. Also log to resume_uploads for audit history
        try:
            supabase.table('resume_uploads').insert({
                'user_id': user_id,
                'filename': original_filename,
                'pdf_url': pdf_url,
                'raw_text': raw_text,
            }).execute()
        except Exception:
            pass  # Table may not exist yet — non-fatal

    return {
        "status": "success",
        "user_id": user_id,
        "pdf_url": pdf_url,
        "message": "Resume uploaded to Supabase storage, text extracted, and embedding generated.",
    }


@router.post("/analyze-resume")
async def analyze_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    One-shot resume intelligence pipeline:
      1. Parse PDF → extract raw text
      2. Groq LLM → extract structured details (name, skills, education, projects…)
      3. Generate embedding vector
      4. Upload original PDF to Supabase Storage
      5. Generate ATS-optimized PDF and upload to Storage
      6. Persist everything to Supabase profiles table
      7. Return full structured details + PDF URLs for the resume detail page

    This is the MAIN endpoint called after the upload page scan animation.
    """
    user_id = current_user["id"]
    content = await file.read()

    # ── 1. Parse PDF ──────────────────────────────────────────────────────────
    raw_text = extract_text_from_pdf(content)
    if not raw_text or not raw_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract readable text from PDF.")

    # ── 2. Run LLM extraction + embedding concurrently ────────────────────────
    details_task = _extract_resume_details(raw_text)
    embedding_task = get_embedding(raw_text)
    details, embedding = await asyncio.gather(details_task, embedding_task)

    # ── 3. Upload original PDF to bucket ─────────────────────────────────────
    original_filename = file.filename or f"resume_{user_id}.pdf"
    original_pdf_url = await upload_pdf_to_supabase(content, original_filename, folder="resumes/original")

    # ── 4. Generate ATS-formatted PDF from extracted bullets ──────────────────
    bullet_lines: list[str] = []
    for exp in details.get("experience", []):
        bullet_lines.extend(exp.get("bullets", []))
    for proj in details.get("projects", []):
        desc = proj.get("description", "")
        if desc:
            bullet_lines.append(f"{proj.get('name', 'Project')}: {desc}")
    if not bullet_lines:
        bullet_lines = [raw_text[:1000]]

    ats_pdf_bytes = generate_resume_pdf(
        bullets=bullet_lines,
        user_name=details.get("name") or current_user.get("email", "Candidate").split("@")[0].title(),
        ultimate_goal=None,
        skills=details.get("skills", [])
    )
    ats_pdf_url = await upload_pdf_to_supabase(ats_pdf_bytes, f"ats_resume_{user_id}.pdf", folder="resumes/ats")

    # ── 5. Persist to Supabase ────────────────────────────────────────────────
    if supabase:
        supabase.table('profiles').upsert({
            'id': user_id,
            'raw_resume_text': raw_text,
            'resume_embedding': embedding,
            'resume_pdf_url': original_pdf_url,
            'ats_pdf_url': ats_pdf_url,
            'parsed_resume': details,               # full structured JSON
            'skills': details.get("skills", []),
            'location': details.get("location") or None,
        }).execute()

        # Audit log
        try:
            supabase.table('resume_uploads').insert({
                'user_id': user_id,
                'filename': original_filename,
                'pdf_url': original_pdf_url,
                'ats_pdf_url': ats_pdf_url,
                'raw_text': raw_text,
                'parsed_details': details,
            }).execute()
        except Exception:
            pass

    return {
        "status": "success",
        "user_id": user_id,
        "resume_details": details,
        "original_pdf_url": original_pdf_url,
        "ats_pdf_url": ats_pdf_url,
        "raw_text_preview": raw_text[:500],
        "embedding_dimensions": len(embedding),
        "message": "Resume analyzed, structured details extracted, ATS PDF generated and stored.",
    }


@router.get("/resume-details")
async def get_resume_details(
    current_user: dict = Depends(get_current_user)
):
    """
    Returns the stored structured resume details for the resume detail page.
    Reads from the `profiles` table — `parsed_resume` JSON column.
    """
    user_id = current_user["id"]

    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured.")

    try:
        res = await asyncio.to_thread(
            supabase.table("profiles")
            .select("name, phone_number, raw_resume_text, resume_pdf_url, ats_pdf_url, parsed_resume, skills, ultimate_goal, location, education")
            .eq("id", user_id)
            .execute
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    if not res.data:
        raise HTTPException(status_code=404, detail="No resume found. Please upload and analyze your resume first.")

    profile = res.data[0]
    parsed = profile.get("parsed_resume") or {}

    return {
        "status": "success",
        "user_id": user_id,
        "name": profile.get("name"),
        "phone_number": profile.get("phone_number"),
        "resume_details": parsed,
        "raw_resume_text": profile.get("raw_resume_text", ""),
        "resume_pdf_url": profile.get("resume_pdf_url"),
        "ats_pdf_url": profile.get("ats_pdf_url"),
        "skills": profile.get("skills", []),
        "ultimate_goal": profile.get("ultimate_goal"),
        "location": profile.get("location"),
        "education": profile.get("education"),
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
        "permission_to_generate_resume": profile_data.permission_to_generate_resume,
        "name": profile_data.name,
        "phone_number": profile_data.phone_number
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


@router.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Parse PDF resume, extract embedding vector, upload PDF to Supabase Storage,
    and save everything to the user profile.
    """
    user_id = current_user["id"]
    content = await file.read()

    # 1. Extract text from PDF
    raw_text = extract_text_from_pdf(content)
    if not raw_text or not raw_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract readable text from PDF.")

    # 2. Generate 384-dimension embedding vector
    embedding = await get_embedding(raw_text)

    # 3. Upload raw PDF to Supabase Storage bucket
    original_filename = file.filename or f"resume_{user_id}.pdf"
    pdf_url = await upload_pdf_to_supabase(content, original_filename)

    # 4. Upsert profile with resume text, embedding, and storage URL
    if supabase:
        supabase.table('profiles').upsert({
            'id': user_id,
            'raw_resume_text': raw_text,
            'resume_embedding': embedding,
            'resume_pdf_url': pdf_url,
        }).execute()

        # 5. Also log to resume_uploads for audit history
        try:
            supabase.table('resume_uploads').insert({
                'user_id': user_id,
                'filename': original_filename,
                'pdf_url': pdf_url,
                'raw_text': raw_text,
            }).execute()
        except Exception:
            pass  # Table may not exist yet — non-fatal

    return {
        "status": "success",
        "user_id": user_id,
        "pdf_url": pdf_url,
        "message": "Resume uploaded to Supabase storage, text extracted, and embedding generated.",
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
