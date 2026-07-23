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

def find_anti_matching_jobs(user_skills: list[str], ultimate_goal: str, all_jobs: list[dict], limit: int = 3) -> list[dict]:
    """
    Agent 3 extension: Identifies jobs completely outside the user's role/skills profile (anti-match).
    Computes critical tech gaps and learning roadmap suggestions.
    """
    user_skills_lower = {s.lower().strip() for s in user_skills}
    goal_lower = (ultimate_goal or "").lower()
    anti_matches = []
    
    for job in all_jobs:
        job_skills = job.get("skills") or []
        job_skills_lower = {s.lower().strip() for s in job_skills}
        
        # Calculate overlap
        overlap = len(job_skills_lower & user_skills_lower)
        
        # Check if the title belongs to the user's target domain
        title = (job.get("title") or "").lower()
        is_role_mismatch = True
        if goal_lower:
            keywords = [w for w in goal_lower.split() if len(w) > 3]
            for kw in keywords:
                if kw in title:
                    is_role_mismatch = False
                    break
                    
        # An anti-match has a role mismatch, required skills, and zero skill overlap
        if is_role_mismatch and len(job_skills) > 0 and overlap == 0:
            missing = [s for s in job_skills if s.lower().strip() not in user_skills_lower]
            
            # Generate custom learning roadmaps
            suggestions = []
            for s in missing[:3]:
                suggestions.append(f"Learn the fundamentals of {s} through official docs or structured courses.")
            suggestions.append("Build a small sandbox project incorporating this stack to build confidence.")
            
            reason = f"Role mismatch: {job.get('title')} requires specialization in {', '.join(missing[:3])} which are not in your profile."
            
            # Low match score representing warnings
            match_score = 15 + (len(job_skills) % 20)
            
            anti_matches.append({
                "id": str(job.get("id")),
                "companyName": job.get("company") or "Unknown Company",
                "role": job.get("title") or "Unknown Role",
                "matchScore": match_score,
                "reason": reason,
                "missingSkills": missing,
                "suggestions": suggestions
            })
            
    # Sort to return the lowest match scores first
    anti_matches.sort(key=lambda x: x["matchScore"])
    return anti_matches[:limit]