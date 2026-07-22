"""
backend/app/agents/tailor_agent.py
Agent 7 – Resume Tailor & Strategy Agent.

Generates ATS score, tailored bullet-point diff, and interview questions
using Groq (Llama 3.3 70B) via the Instructor library for strict JSON output.
"""

import logging
from typing import List

from groq import AsyncGroq
import instructor

from app.agents.config import GROQ_API_KEY
from app.agents.models import DossierOutput

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Async Groq client – never blocks the FastAPI event loop
_groq = AsyncGroq(api_key=GROQ_API_KEY)
_client = instructor.from_groq(_groq)


async def generate_dossier(
    user_resume_text: str,
    job_desc: str,
    job_skills: List[str],
    user_goal: str = "Software Engineer",
) -> dict:
    """
    Agent 7: The Resume Tailor.
    Returns a dict with keys: ats_score, warning, tailored_diff, interview_questions.
    """
    logger.info("📝 Agent 7: Generating Intelligence Dossier...")

    # ── Fast local ATS scoring (no LLM token burn) ────────────────────────────
    resume_lower = user_resume_text.lower()
    missing = [
        s for s in job_skills
        if s.lower() not in resume_lower and f"{s.lower()}s" not in resume_lower
    ]
    ats_score = max(0, 100 - int((len(missing) / max(len(job_skills), 1)) * 100))
    warning = (
        f"Missing critical skills: {', '.join(missing[:3])}"
        if missing
        else "Excellent match! No critical skills missing."
    )

    # ── Advanced prompt ────────────────────────────────────────────────────────
    prompt = f"""You are an Expert Technical Recruiter and ATS Optimization Specialist.

**User's Ultimate Career Goal:** {user_goal}
**User's Current Resume (Projects/Experience):**
{user_resume_text[:2000]}

**Target Job Description:**
{job_desc[:3000]}

**Target Job Required Skills:** {', '.join(job_skills)}

YOUR TASK:
1. Resume Tailoring: Rewrite exactly 2 project bullet points from the user's resume to perfectly align with the Target Job Description.
   - CRITICAL RULE: DO NOT invent fake jobs, companies, or metrics. Only rephrase and enhance existing projects using the JD's terminology.
   - Ensure the rewritten bullets naturally incorporate the missing skills if the user has adjacent experience.

2. Interview Preparation: Generate exactly 3 highly probable technical interview questions a hiring manager would ask for this role.

Return STRICT JSON matching the provided schema. No conversational text outside JSON.
"""

    try:
        response = await _client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a strict JSON generator. Output ONLY valid JSON."},
                {"role": "user", "content": prompt},
            ],
            response_model=DossierOutput,
            max_retries=3,
        )

        logger.info("✅ Agent 7: Dossier generated successfully.")

        try:
            tailored_diff = [d.model_dump() for d in response.diff]
        except AttributeError:
            tailored_diff = [d.dict() for d in response.diff]

        return {
            "ats_score": ats_score,
            "warning": warning,
            "tailored_diff": tailored_diff,
            "interview_questions": response.interview_questions,
        }

    except Exception as e:
        logger.error(f"❌ Agent 7 failed: {e}")
        return {
            "ats_score": ats_score,
            "warning": warning,
            "tailored_diff": [
                {
                    "original": "Original bullet point unavailable.",
                    "tailored": "Please try regenerating.",
                    "reason": "AI generation temporarily failed.",
                }
            ],
            "interview_questions": [
                "Tell me about your experience.",
                "What is your greatest technical strength?",
                "Why do you want this role?",
            ],
        }