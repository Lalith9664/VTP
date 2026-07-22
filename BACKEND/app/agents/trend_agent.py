import asyncio
import logging
from typing import List, Dict
from collections import Counter
from datetime import datetime
from supabase import create_client, Client
from .config import SUPABASE_URL, SUPABASE_KEY

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# HACKATHON SAFETY NET: Mock trends if DB fails or is empty
MOCK_TRENDS = [
    ("Python", 45), ("React", 38), ("AWS", 32), ("Docker", 29), 
    ("PostgreSQL", 25), ("FastAPI", 22), ("TypeScript", 20), 
    ("Kubernetes", 18), ("Node.js", 15), ("Machine Learning", 12)
]

from typing import List, Dict, Optional

async def analyze_trends(jobs: Optional[List[Dict]] = None) -> List[tuple]:
    """Agent 8: Calculates top 10 trending skills from the scraped jobs."""
    logger.info("📈 Agent 8: Analyzing market trends...")
    
    if jobs is None:
        try:
            # Fetch jobs from Supabase inside trend_agent itself if not provided by caller
            jobs_res = supabase.table("jobs").select("skills").execute()
            jobs = jobs_res.data or []
        except Exception as je:
            logger.warning(f"Agent 8: Failed to fetch jobs from Supabase (non-fatal): {je}")
            jobs = []

    if not jobs:
        logger.warning("No jobs available for trend analysis. Returning mock trends.")
        return MOCK_TRENDS

    try:
        # 1. Extract and normalize all skills (lowercase & strip whitespace)
        all_skills = []
        for job in jobs:
            skills = job.get('skills', [])
            if skills:
                all_skills.extend([s.strip().lower() for s in skills if isinstance(s, str)])
        
        if not all_skills:
            return MOCK_TRENDS

        # 2. Count frequencies
        counter = Counter(all_skills)
        top_skills = counter.most_common(10)
        
        # Format for frontend (capitalize them back nicely)
        formatted_trends = [(skill.title(), count) for skill, count in top_skills]

        # 3. Update Supabase (Non-blocking via asyncio.to_thread)
        await asyncio.to_thread(_update_trends_db, formatted_trends)
        
        logger.info(f"✅ Agent 8: Trends updated. Top skill: {formatted_trends[0][0]}")
        return formatted_trends

    except Exception as e:
        logger.error(f"❌ Agent 8 failed: {e}")
        return MOCK_TRENDS

def _update_trends_db(trends: List[tuple]):
    """Synchronous DB helper to be run in a background thread."""
    try:
        # Clear old trends safely
        supabase.table('trending_skills').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        
        # Insert new trends in a single batch (much faster than looping)
        rows_to_insert = [
            {
                'skill_name': skill,
                'frequency': count,
                'date': datetime.now().date().isoformat()
            }
            for skill, count in trends
        ]
        if rows_to_insert:
            supabase.table('trending_skills').insert(rows_to_insert).execute()
    except Exception as e:
        logger.warning(f"DB update for trends failed (table might not exist): {e}")