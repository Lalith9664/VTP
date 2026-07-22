"""
backend/app/agents/trajectory_agent.py
Agent 5 – Career Trajectory Evaluator.

Scores how well a job aligns with the user's ultimate career goal
using Groq (Llama 3.3 70B) via Instructor.
"""

import logging
from typing import List

from groq import AsyncGroq
import instructor

from app.agents.config import GROQ_API_KEY
from app.agents.models import TrajectoryReport

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_groq   = AsyncGroq(api_key=GROQ_API_KEY)
_client = instructor.from_groq(_groq)


async def evaluate_trajectory(
    user_goal: str,
    job_skills: List[str],
    job_title: str,
) -> dict:
    """
    Agent 5: Trajectory alignment scoring.
    Returns {"score": int, "reasoning": str}.
    """
    logger.info(f"🎯 Agent 5: Evaluating trajectory for '{job_title}'...")

    prompt = f"""You are a career advisor specialising in long-term trajectory planning.

User's Ultimate Career Goal: {user_goal}
Job Title: {job_title}
Job Required Skills: {', '.join(job_skills)}

Score (0-100) how well THIS job helps the user move toward their ultimate goal.
- 80-100: Direct stepping stone
- 50-79:  Tangentially useful
- 0-49:   Misaligned / detour

Return STRICT JSON matching the schema. Be concise but insightful.
"""

    try:
        response = await _client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a strict JSON generator."},
                {"role": "user", "content": prompt},
            ],
            response_model=TrajectoryReport,
            max_retries=2,
        )
        logger.info(f"✅ Agent 5: Trajectory score = {response.score}")
        return {"score": response.score, "reasoning": response.reasoning}

    except Exception as e:
        logger.warning(f"⚠️  Agent 5 fallback: {e}")
        return {
            "score": 65,
            "reasoning": (
                "Unable to evaluate trajectory via LLM. "
                "Default score applied. Check Groq API key."
            ),
        }