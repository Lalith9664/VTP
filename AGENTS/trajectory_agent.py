import logging
from typing import List
from groq import AsyncGroq
import instructor
from pydantic import BaseModel, Field
from config import GROQ_API_KEY

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Async Groq with Instructor for strict JSON
async_groq_client = AsyncGroq(api_key=GROQ_API_KEY)
client = instructor.from_groq(async_groq_client)

# ==============================================================================
# 1. STRICT PYDANTIC SCHEMA
# ==============================================================================
class TrajectoryReport(BaseModel):
    score: int = Field(ge=0, le=100, description="Trajectory alignment score from 0 to 100.")
    reasoning: str = Field(description="Concise explanation of how this job builds skills for the user's ultimate goal.")

# ==============================================================================
# 2. AGENT 5: THE GOAL & TRAJECTORY VALIDATOR
# ==============================================================================
async def evaluate_trajectory(user_goal: str, job_skills: List[str], job_title: str) -> dict:
    """
    Agent 5: Evaluates if a job moves the user toward their long-term career goal.
    Uses the fast 8B model for semantic understanding (e.g., knows PyTorch = ML).
    """
    logger.info(f"🎯 Agent 5: Evaluating trajectory for '{job_title}' against goal: '{user_goal}'")
    
    try:
        prompt = f"""
        You are an expert Career Strategist. 
        
        User's Ultimate Long-Term Goal: "{user_goal}"
        Current Job Opportunity: "{job_title}"
        Required Skills for this Job: {', '.join(job_skills) if job_skills else 'None specified'}
        
        TASK:
        Evaluate how well this specific job and its required skills will help the user reach their ultimate goal.
        - Score 80-100: Directly builds critical skills for the goal (e.g., Goal is ML, Job requires PyTorch).
        - Score 50-79: Builds adjacent, foundational, or transferable skills.
        - Score 0-49: Unrelated or a step backward from the goal.
        
        Return STRICT JSON with the integer score and a 1-sentence reasoning.
        """
        
        # CRITICAL OPTIMIZATION: Using 8B model for fast, cheap semantic classification
        response = await client.chat.completions.create(
            model="llama-3.1-8b-instant", 
            messages=[
                {"role": "system", "content": "You are a strict JSON generator. Output ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_model=TrajectoryReport,
            max_retries=2
        )
        
        logger.info(f"✅ Agent 5: Trajectory Score = {response.score}")
        
        return {
            "score": response.score,
            "reasoning": response.reasoning
        }

    except Exception as e:
        logger.warning(f"❌ Agent 5 LLM failed ({e}). Falling back to rule-based logic.")
        # ==============================================================================
        # HACKATHON SAFETY NET: Robust Rule-Based Fallback
        # ==============================================================================
        return _rule_based_fallback(user_goal, job_skills, job_title)

def _rule_based_fallback(user_goal: str, job_skills: List[str], job_title: str) -> dict:
    """Fallback logic if Groq is rate-limited or offline."""
    score = 50
    reasoning = f"This {job_title} role has some relevant skills."
    
    goal_lower = user_goal.lower()
    skills_lower = [s.lower() for s in job_skills] if job_skills else []
    
    # ML / Data Science
    if any(g in goal_lower for g in ['machine learning', 'data science', 'ai', 'ml']):
        if any(s in skills_lower for s in ['python', 'sql', 'data', 'pandas', 'pytorch', 'tensorflow', 'scikit']):
            score = 85
            reasoning = "This role builds the data/ML skills you need."
            
    # DevOps / Cloud
    elif any(g in goal_lower for g in ['devops', 'cloud', 'infrastructure', 'sre']):
        if any(s in skills_lower for s in ['docker', 'kubernetes', 'aws', 'ci/cd', 'terraform', 'jenkins']):
            score = 88
            reasoning = "This role builds the cloud infrastructure skills you need."
            
    # Frontend / Full Stack
    elif any(g in goal_lower for g in ['frontend', 'full stack', 'react', 'ui/ux']):
        if any(s in skills_lower for s in ['react', 'angular', 'vue', 'javascript', 'typescript', 'css', 'html']):
            score = 82
            reasoning = "This role builds the frontend UI skills you need."
            
    # Backend
    elif any(g in goal_lower for g in ['backend', 'api', 'server']):
        if any(s in skills_lower for s in ['node', 'python', 'java', 'go', 'sql', 'postgres', 'docker']):
            score = 80
            reasoning = "This role builds the backend architecture skills you need."

    return {"score": score, "reasoning": reasoning}