"""
backend/app/routes/dashboard.py
================================
GET /api/dashboard/insights – trending skills + peer insights for the dashboard.
"""

import asyncio
import logging
from fastapi import APIRouter, Depends
from app.database import supabase
from app.dependencies.auth import get_current_user
from app.agents.trend_agent import analyze_trends
from app.agents.peer_agent import get_peer_recommendations

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/insights")
async def get_dashboard_insights(current_user: dict = Depends(get_current_user)):
    """
    Aggregate endpoint consumed by the dashboard page.

    Returns:
        trending_skills  – [{ skill_name, frequency }, ...]
        peer_insights    – [{ friend_name, company, job_title, job_id, message }, ...]
        user_stats       – quick profile summary for the stat cards
    """
    user_id     = current_user["id"]
    user_skills: list = []

    # Fetch user skills for peer-matching
    try:
        profile_res = await asyncio.to_thread(
            supabase.table("profiles")
            .select("skills, ultimate_goal, location")
            .eq("id", user_id)
            .execute
        )
        if profile_res.data:
            user_skills = profile_res.data[0].get("skills") or []
    except Exception as e:
        logger.warning(f"Profile fetch failed (non-fatal): {e}")

    # Run trend analysis + peer network concurrently
    trends_task = analyze_trends()
    peers_task  = get_peer_recommendations(user_id, user_skills)

    trends_result, peer_result = await asyncio.gather(
        trends_task, peers_task, return_exceptions=True
    )

    trending_skills = []
    peer_insights = []

    if not isinstance(trends_result, Exception):
        # analyze_trends() returns List[tuple[str, int]] — convert to dicts
        for item in trends_result:
            if isinstance(item, (list, tuple)) and len(item) >= 2:
                trending_skills.append({"skill_name": item[0], "frequency": item[1]})
            elif isinstance(item, dict):
                trending_skills.append(item)

    if not isinstance(peer_result, Exception):
        peer_insights = peer_result or []

    return {
        "status": "success",
        "trending_skills": trending_skills,   # [{skill_name, frequency}]
        "peer_insights": peer_insights,        # [{friend_name, company, ...}]
    }
