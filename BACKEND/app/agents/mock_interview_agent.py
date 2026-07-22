import logging
from typing import List
from groq import AsyncGroq
import instructor
from pydantic import BaseModel, Field
from .config import GROQ_API_KEY

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==============================================================================
# 1. ASYNC INITIALIZATION (Matches tailor_agent.py for consistency)
# ==============================================================================
async_groq_client = AsyncGroq(api_key=GROQ_API_KEY)
client = instructor.from_groq(async_groq_client)

# ==============================================================================
# 2. STRICT PYDANTIC SCHEMA
# ==============================================================================
class PrepOutput(BaseModel):
    """Structured output for the Mock Interview Agent."""
    qualification_feedback: str = Field(description="Encouraging but honest feedback on the user's current readiness.")
    can_qualify: bool = Field(description="True if the user has >= 60% of the required skills, False otherwise.")
    missing_skills: List[str] = Field(description="List of specific skills the user lacks for this role.")
    questions: List[str] = Field(description="Exactly 5 challenging technical interview questions targeting the required/missing skills.")
    study_resources: List[str] = Field(description="Actionable, specific topics or project ideas to study to bridge the skill gap.")

# ==============================================================================
# 3. AGENT 9: MOCK INTERVIEW & QUALIFICATION
# ==============================================================================
async def generate_interview_prep(user_skills: List[str], job_skills: List[str], job_title: str) -> dict:
    """
    Agent 9: Analyzes skill gaps and generates targeted interview questions.
    """
    logger.info(f"🎤 Agent 9: Generating interview prep for {job_title}...")

    try:
        # A. Fast, Logic-Based Gap Analysis (No LLM needed, saves tokens/time)
        user_set = set([s.lower().strip() for s in user_skills])
        job_set = set([s.lower().strip() for s in job_skills])
        missing = list(job_set - user_set)
        
        # Qualify if missing less than 40% of required skills
        can_qualify = len(missing) < (len(job_set) * 0.4) if job_set else True
        
        if missing:
            feedback = f"You are missing key skills: {', '.join(missing)}. Focus on these to significantly improve your chances."
            study_resources = [f"Build a mini-project using {skill}", f"Review {skill} documentation and common interview patterns"]
        else:
            feedback = "Excellent! You possess all the required skills for this role. Focus on demonstrating depth of knowledge."
            study_resources = ["Review system design principles", "Practice behavioral questions using the STAR method"]

        # B. LLM Generation for High-Quality Questions
        prompt = f"""
        You are a strict, expert Technical Hiring Manager.
        
        Target Role: {job_title}
        Required Skills: {', '.join(job_skills)}
        Candidate's Missing Skills: {', '.join(missing) if missing else 'None'}

        TASK:
        Generate exactly 5 challenging, realistic technical interview questions. 
        - At least 2 questions MUST test the candidate's knowledge of the "Missing Skills" (e.g., "How would you approach learning X...").
        - The remaining questions should test deep understanding of the "Required Skills".
        - Do NOT include answers, only the questions.
        
        Return STRICT JSON matching the provided schema.
        """

        # C. Async LLM Call with Instructor (Guarantees valid JSON)
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile", # UPDATED to the active, supported model
            messages=[
                {"role": "system", "content": "You are a strict JSON generator. Output ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_model=PrepOutput,
            max_retries=3
        )

        logger.info("✅ Agent 9: Interview prep generated successfully.")

        # D. Combine Logic + LLM results
        return {
            "qualification_feedback": response.qualification_feedback or feedback,
            "can_qualify": response.can_qualify or can_qualify,
            "missing_skills": response.missing_skills or missing,
            "questions": response.questions[:5], # Ensure max 5
            "study_resources": response.study_resources or study_resources
        }

    except Exception as e:
        logger.error(f"❌ Agent 9 failed to generate interview prep: {e}")
        
        # ==============================================================================
        # HACKATHON SAFETY NET: Fallback response to prevent 500 Server Errors
        # ==============================================================================
        user_set = set([s.lower().strip() for s in user_skills])
        job_set = set([s.lower().strip() for s in job_skills])
        missing = list(job_set - user_set)
        
        return {
            "qualification_feedback": f"AI generation temporarily failed, but you are missing: {', '.join(missing) if missing else 'nothing'}",
            "can_qualify": len(missing) < (len(job_set) * 0.4) if job_set else True,
            "missing_skills": missing,
            "questions": [
                f"Can you walk me through a project where you used {job_skills[0] if job_skills else 'Python'}?",
                "How do you handle production bugs or system failures?",
                "Describe a time you had to learn a new technology quickly to meet a deadline.",
                "What are the trade-offs of the tech stack mentioned in this job description?",
                "How do you ensure code quality and test your backend services?"
            ],
            "study_resources": [f"Review {skill} fundamentals" for skill in missing[:3]]
        }