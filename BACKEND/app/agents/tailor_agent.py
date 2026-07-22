import logging
from typing import List
from groq import AsyncGroq
import instructor
from .config import GROQ_API_KEY
from .models import DossierOutput

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==============================================================================
# 1. ASYNC INITIALIZATION (Crucial for FastAPI)
# ==============================================================================
# We use AsyncGroq so the LLM call doesn't block the main event loop.
async_groq_client = AsyncGroq(api_key=GROQ_API_KEY)
client = instructor.from_groq(async_groq_client)

async def generate_dossier(
    user_resume_text: str, 
    job_desc: str, 
    job_skills: list,
    user_goal: str = "General Software Engineer" # Injecting Agent 5's context!
) -> dict:
    """
    Agent 7: The Resume Tailor & Strategy Agent.
    Generates ATS Score, Tailored Diff, and Interview Questions.
    """
    logger.info("📝 Agent 7: Generating Intelligence Dossier...")

    # 2. Smart ATS Score Calculation
    resume_lower = user_resume_text.lower()
    missing = []
    for skill in job_skills:
        # Smarter check: avoids simple substring mismatches (e.g., "Python" vs "Pythonic")
        if skill.lower() not in resume_lower and f"{skill.lower()}s" not in resume_lower:
            missing.append(skill)
            
    ats_score = max(0, 100 - int((len(missing) / max(len(job_skills), 1)) * 100))
    warning = f"Missing critical skills: {', '.join(missing[:3])}" if missing else "Excellent match! No critical skills missing."

    # 3. Advanced Prompt Engineering
    prompt = f"""
    You are an Expert Technical Recruiter and ATS (Applicant Tracking System) Optimization Specialist.
    
    **User's Ultimate Career Goal:** {user_goal}
    **User's Current Resume (Projects/Experience):**
    {user_resume_text[:2000]}

    **Target Job Description:**
    {job_desc[:3000]}
    
    **Target Job Required Skills:** {', '.join(job_skills)}

    **YOUR TASK:**
    1. **Resume Tailoring:** Rewrite exactly 2 project bullet points from the user's resume to perfectly align with the Target Job Description.
       - CRITICAL RULE: DO NOT invent fake jobs, companies, or metrics. Only rephrase and enhance existing projects using the JD's terminology.
       - Example: Change "built a database" to "designed and implemented a relational database schema using PostgreSQL to optimize query performance".
       - Ensure the rewritten bullets naturally incorporate the missing skills if the user has adjacent experience.
       
    2. **Interview Preparation:** Generate exactly 3 highly probable, challenging technical interview questions that a hiring manager would ask for this specific role, based on the JD's tech stack.

    **OUTPUT FORMAT:**
    Return STRICT JSON matching the provided schema. Do not include any conversational text outside the JSON.
    """

    try:
        # 4. Async LLM Call with Instructor (Strict Schema Validation)
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile", 
            messages=[
                {"role": "system", "content": "You are a strict JSON generator. Output ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_model=DossierOutput,
            max_retries=3 # Instructor will automatically retry if JSON is malformed
        )

        logger.info("✅ Agent 7: Dossier generated successfully.")

        # 5. Return the structured result
        # Note: Use .model_dump() for Pydantic V2, or .dict() for V1
        try:
            tailored_diff = [d.model_dump() for d in response.diff]
        except AttributeError:
            tailored_diff = [d.dict() for d in response.diff]

        return {
            "ats_score": ats_score,
            "warning": warning,
            "tailored_diff": tailored_diff,
            "interview_questions": response.interview_questions
        }

    except Exception as e:
        logger.error(f"❌ Agent 7 failed to generate dossier: {e}")
        # ==============================================================================
        # HACKATHON SAFETY NET: Fallback response to prevent 500 Server Errors
        # ==============================================================================
        return {
            "ats_score": ats_score,
            "warning": warning,
            "tailored_diff": [
                {"original": "Original bullet point unavailable.", "tailored": "Please try generating again.", "reason": "AI generation temporarily failed."}
            ],
            "interview_questions": ["Tell me about your experience.", "What is your greatest strength?", "Why do you want this job?"]
        }