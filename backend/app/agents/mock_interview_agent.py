"""
backend/app/agents/mock_interview_agent.py
Agent 9 – Mock Interview & Qualification Agent.

Analyses skill gaps and generates targeted interview questions using
Groq (Llama 3.3 70B) via Instructor for strict JSON output.
"""

import logging
from typing import List

from groq import AsyncGroq
import instructor
from pydantic import BaseModel, Field

from app.agents.config import GROQ_API_KEY

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_groq = AsyncGroq(api_key=GROQ_API_KEY)
_client = instructor.from_groq(_groq)


class PrepOutput(BaseModel):
    """Structured output for Agent 9."""
    qualification_feedback: str = Field(description="Honest, encouraging feedback on readiness.")
    can_qualify: bool = Field(description="True if user has ≥ 60% of required skills.")
    missing_skills: List[str] = Field(description="Skills the user lacks for this role.")
    questions: List[str] = Field(description="5 challenging technical interview questions.")
    study_resources: List[str] = Field(description="Actionable study topics to bridge the skill gap.")


async def generate_interview_prep(
    user_skills: List[str],
    job_skills: List[str],
    job_title: str,
) -> dict:
    """
    Agent 9: Skill-gap analysis + targeted interview questions.
    Returns a dict with: qualification_feedback, can_qualify, missing_skills,
                         questions, study_resources.
    """
    logger.info(f"🎤 Agent 9: Generating interview prep for '{job_title}'...")

    # ── Fast logic-based gap analysis (no LLM needed) ─────────────────────────
    user_set = {s.lower().strip() for s in user_skills}
    job_set  = {s.lower().strip() for s in job_skills}
    missing  = list(job_set - user_set)
    can_qualify = len(missing) < (len(job_set) * 0.4) if job_set else True

    if missing:
        feedback = (
            f"You are missing key skills: {', '.join(missing)}. "
            "Focus on these to significantly improve your chances."
        )
        study_resources = [
            f"Build a mini-project using {skill}" for skill in missing[:3]
        ]
    else:
        feedback = (
            "Excellent! You possess all required skills. "
            "Focus on demonstrating depth and system-design thinking."
        )
        study_resources = [
            "Review system design principles (scalability, CAP theorem)",
            "Practice behavioural questions using the STAR method",
        ]

    prompt = f"""You are a strict, expert Technical Hiring Manager.

Target Role: {job_title}
Required Skills: {', '.join(job_skills)}
Candidate's Missing Skills: {', '.join(missing) if missing else 'None'}

TASK: Generate exactly 5 challenging, realistic technical interview questions.
- At least 2 questions MUST target the missing skills.
- Remaining questions should test deep understanding of the required stack.
- Return STRICT JSON matching the provided schema. No extra text.
"""

    try:
        response = await _client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a strict JSON generator. Output ONLY valid JSON."},
                {"role": "user", "content": prompt},
            ],
            response_model=PrepOutput,
            max_retries=3,
        )

        logger.info("✅ Agent 9: Interview prep generated successfully.")
        return {
            "qualification_feedback": response.qualification_feedback or feedback,
            "can_qualify": response.can_qualify,
            "missing_skills": response.missing_skills or missing,
            "questions": response.questions[:5],
            "study_resources": response.study_resources or study_resources,
        }

    except Exception as e:
        logger.error(f"❌ Agent 9 failed: {e}")
        return {
            "qualification_feedback": feedback,
            "can_qualify": can_qualify,
            "missing_skills": missing,
            "questions": [
                f"Walk me through a project where you used {job_skills[0] if job_skills else 'Python'}.",
                "How do you handle production bugs or system failures under pressure?",
                "Describe a time you had to learn a new technology quickly.",
                "What are the trade-offs of the tech stack in this job description?",
                "How do you ensure code quality and test your backend services?",
            ],
            "study_resources": [f"Review {s} fundamentals" for s in missing[:3]],
        }