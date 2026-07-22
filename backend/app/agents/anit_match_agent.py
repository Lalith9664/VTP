"""
backend/app/agents/anit_match_agent.py
Agent 3 – Anti-Match & Job Safety Filter.

Classifies job descriptions as scam/toxic using Groq llama-3.1-8b-instant
(cheap, fast classification model). Safe fallback on any LLM failure.
"""

import logging
from pydantic import BaseModel, Field
from groq import AsyncGroq
import instructor

from app.agents.config import GROQ_API_KEY

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_groq   = AsyncGroq(api_key=GROQ_API_KEY)
_client = instructor.from_groq(_groq)


class ToxicityReport(BaseModel):
    """Structured output for Agent 3."""
    is_scam: bool = Field(description="True if job asks for money, SSN, or is clearly fraudulent.")
    toxic_score: int = Field(ge=0, le=100, description="0-100 culture-toxicity score. 100 = extremely toxic.")
    reason: str = Field(description="Brief explanation of detected red flags.")


async def scan_job_for_toxicity(job_description: str) -> dict:
    """
    Agent 3: Safety filter.
    Returns {"is_scam": bool, "toxic_score": int, "reason": str}.
    """
    logger.info("🛡️  Agent 3: Scanning job for toxicity/scam indicators...")

    prompt = f"""You are an expert Job Market Safety Analyst.

SCAM INDICATORS: Money requests, SSN/bank details, unrealistic salary, vague responsibilities, 
data-collection disguised as employment.

TOXIC CULTURE INDICATORS: "work hard play hard", "we're a family", "extreme pressure", 
"unpaid trial", "no work-life balance", "always on" expectations.

Job Description:
{job_description[:2000]}

Return STRICT JSON matching the schema.
"""

    try:
        response = await _client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a strict JSON generator."},
                {"role": "user", "content": prompt},
            ],
            response_model=ToxicityReport,
            max_retries=2,
        )
        logger.info(f"✅ Agent 3: scam={response.is_scam}, toxic={response.toxic_score}")
        return {
            "is_scam": response.is_scam,
            "toxic_score": response.toxic_score,
            "reason": response.reason,
        }

    except Exception as e:
        logger.error(f"❌ Agent 3 failed: {e}")
        # Fail-safe: assume the job is safe so the UI never shows empty results
        return {
            "is_scam": False,
            "toxic_score": 0,
            "reason": "Safety scan temporarily unavailable – job assumed safe.",
        }