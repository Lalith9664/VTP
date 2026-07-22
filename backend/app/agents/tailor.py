
import instructor
from groq import Groq
from pydantic import BaseModel
from typing import List
from config import GROQ_API_KEY
from models import BulletDiff

# Enable Instructor for strict JSON validation
client = instructor.from_groq(Groq(api_key=GROQ_API_KEY))

class TailorResult(BaseModel):
    diff: List[BulletDiff]
    interview_questions: List[str]

async def generate_dossier(user_resume_text: str, job_desc: str, job_skills: list) -> dict:
    """Generate ATS Score + Tailored Bullets + Interview Questions"""
    
    # 1. Calculate ATS Score (Simple Logic, no API call)
    user_skills = extract_skills_manually(user_resume_text)  # Use a simple regex or set
    missing_skills = [s for s in job_skills if s.lower() not in str(user_skills).lower()]
    ats_score = max(0, 100 - int(len(missing_skills) / len(job_skills) * 100) if job_skills else 50)
    
    # 2. LLM Tailoring & Interview Generation (One single API call)
    prompt = f"""
    User Resume Projects: {user_resume_text[:2000]}
    Target Job Description: {job_desc[:3000]}
    
    Task:
    1. Rewrite exactly 2 project bullet points from the user resume to match the JDs keywords. Do not invent fake jobs.
    2. Generate 3 interview questions specific to the technical stack in the JD.
    
    Return EXACT JSON with this schema:
    {{
        "diff": [{{"original": "old text", "tailored": "new text", "reason": "why changed"}}],
        "interview_questions": ["Q1", "Q2", "Q3"]
    }}
    """
    
    # Use Instructor to force the LLM to output the exact Pydantic model
    response = client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        response_model=TailorResult  # This enforces the schema!
    )
    
    return {
        "ats_score": ats_score,
        "warning": f"Missing: {', '.join(missing_skills[:3])}" if missing_skills else "Great match!",
        "tailored_diff": [d.dict() for d in response.diff],
        "interview_questions": response.interview_questions
    }
