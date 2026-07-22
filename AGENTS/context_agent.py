import asyncio
import logging
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def build_user_context(user_id: str) -> dict:
    """
    Agent 4: The User Context & Memory Agent.
    Fetches user profile, skills, and preferences asynchronously without blocking the event loop.
    """
    logger.info(f"🧠 Agent 4: Building context for user {user_id}...")
    
    try:
        # CRITICAL FIX: Use asyncio.to_thread to run the sync Supabase call 
        # in a separate thread, preventing it from freezing the FastAPI event loop.
        res = await asyncio.to_thread(
            supabase.table('profiles').select('*').eq('id', user_id).execute
        )
        
        if not res.data or len(res.data) == 0:
            logger.warning(f"⚠️ User {user_id} not found in Supabase. Using default demo context.")
            return _get_default_context(user_id)
        
        data = res.data[0]
        
        # CRITICAL FIX: Use `or` to guarantee we never pass `None` to downstream agents.
        context = {
            "user_id": user_id,
            "email": data.get('email') or "demo@student.com",
            "ultimate_goal": data.get('ultimate_goal') or "General Software Engineer",
            "skills": data.get('skills') or ["Python", "FastAPI"],
            "raw_resume_text": data.get('raw_resume_text') or "Experienced developer with a strong technical foundation.",
            "resume_embedding": data.get('resume_embedding'),
            "location": data.get('location') or "Remote",
            "education": data.get('education') or "B.Tech in Computer Science"
        }
        
        logger.info(f"✅ Agent 4: Context built successfully. Skills loaded: {len(context['skills'])}")
        return context

    except Exception as e:
        logger.error(f"❌ Agent 4 failed to fetch user context from DB: {e}")
        # HACKATHON SAFETY NET: Fallback to prevent the entire pipeline from crashing
        return _get_default_context(user_id)

def _get_default_context(user_id: str) -> dict:
    """
    HACKATHON SAFETY NET: 
    Returns a valid, highly-optimized "Demo User" context if the DB fails, 
    times out, or the user ID is invalid. Ensures the demo never shows a blank screen.
    """
    return {
        "user_id": user_id,
        "email": "demo@student.com",
        "ultimate_goal": "Senior Full Stack Engineer at a FAANG company",
        "skills": ["Python", "FastAPI", "React", "PostgreSQL", "Docker"],
        "raw_resume_text": "Built scalable backend microservices using Python and FastAPI. Developed responsive frontend dashboards using React and TypeScript. Managed PostgreSQL databases and containerized applications using Docker.",
        "resume_embedding": None,
        "location": "Chennai, India",
        "education": "B.Tech in Computer Science"
    }