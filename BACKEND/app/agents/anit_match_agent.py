import logging
from groq import AsyncGroq
import instructor
from pydantic import BaseModel, Field
from .config import GROQ_API_KEY

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==============================================================================
# 1. ASYNC INITIALIZATION (Matches other agents for consistency)
# ==============================================================================
async_groq_client = AsyncGroq(api_key=GROQ_API_KEY)
client = instructor.from_groq(async_groq_client)

# ==============================================================================
# 2. STRICT PYDANTIC SCHEMA
# ==============================================================================
class ToxicityReport(BaseModel):
    """Structured output for the Anti-Match & Safety Filter Agent."""
    is_scam: bool = Field(description="True if job asks for money, SSN, or is highly suspicious.")
    toxic_score: int = Field(ge=0, le=100, description="0-100 toxicity/culture score. 100 = extremely toxic culture.")
    reason: str = Field(description="Brief explanation of the red flags detected.")

# ==============================================================================
# 3. AGENT 3: THE ANTI-MATCH & SAFETY FILTER (The Gatekeeper)
# ==============================================================================
async def scan_job_for_toxicity(job_description: str) -> dict:
    """
    Agent 3: Detects scams, fake jobs, and toxic culture indicators.
    Uses the fast 8B model because this is a classification task, not complex reasoning.
    """
    logger.info("🛡️ Agent 3: Scanning job for toxicity and scams...")
    
    try:
        prompt = f"""
        You are an expert Job Market Safety Analyst. Analyze the following job description for red flags.
        
        SCAM INDICATORS: Asking for money, SSN/bank details upfront, unrealistic salary for a fresher, vague responsibilities, "data collection" disguised as a job.
        TOXIC CULTURE INDICATORS: "work hard play hard", "we are a family", "must work under extreme pressure", "unpaid", "no work-life balance".
        
        Job Description:
        {job_description[:2000]}
        """
        
        # CRITICAL OPTIMIZATION: Using 8B model for fast, cheap classification
        response = await client.chat.completions.create(
            model="llama-3.1-8b-instant", 
            messages=[
                {"role": "system", "content": "You are a strict JSON generator. Output ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_model=ToxicityReport,
            max_retries=2
        )
        
        logger.info(f"✅ Agent 3: Scan complete. Scam: {response.is_scam}, Toxic Score: {response.toxic_score}")
        
        return {
            "is_scam": response.is_scam,
            "toxic_score": response.toxic_score,
            "reason": response.reason
        }

    except Exception as e:
        logger.error(f"❌ Agent 3 failed to scan job: {e}")
        
        # ==============================================================================
        # HACKATHON SAFETY NET: 
        # If the LLM fails, we assume the job is SAFE. 
        # This prevents the app from accidentally filtering out ALL jobs and 
        # leaving the user with an empty dashboard during the demo.
        # ==============================================================================
        return {
            "is_scam": False,
            "toxic_score": 0,
            "reason": "Safety scan temporarily unavailable. Assumed safe for demo."
        }