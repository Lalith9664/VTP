"""
backend/app/agents/peer_agent.py
Agent 6 – Peer Network Agent.

Finds jobs where friends/seniors got hired so the user can leverage
their network. Falls back to curated mock insights if the DB tables
don't exist yet.
"""

import asyncio
import logging
from typing import List

from app.database import supabase   # ← centralised client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MOCK_PEER_INSIGHTS = [
    {
        "friend_name": "Rahul (Senior)",
        "company": "Zoho Corporation",
        "job_title": "Software Engineer",
        "job_id": "mock-job-zoho-1",
        "message": "🔥 Your senior Rahul got hired at Zoho! They are actively hiring for similar roles.",
    },
    {
        "friend_name": "Priya (Batchmate)",
        "company": "Freshworks",
        "job_title": "Product Engineer",
        "job_id": "mock-job-freshworks-1",
        "message": "💡 Your batchmate Priya cracked Freshworks last month. Leverage her referral!",
    },
]


async def get_peer_recommendations(user_id: str, user_skills: List[str]) -> List[dict]:
    """
    Agent 6: Peer Network Agent.
    Returns a list of peer-insight dicts for the dashboard.
    """
    logger.info(f"🤝 Agent 6: Checking peer network for user {user_id}...")

    try:
        friends_res = await asyncio.to_thread(
            supabase.table("friends").select("friend_id").eq("user_id", user_id).execute
        )
        friend_ids = [f["friend_id"] for f in (friends_res.data or [])]

        if not friend_ids:
            return MOCK_PEER_INSIGHTS

        peer_res = await asyncio.to_thread(
            supabase.table("peer_success").select("*").in_("user_id", friend_ids).execute
        )
        peers = peer_res.data or []

        if not peers:
            return MOCK_PEER_INSIGHTS

        insights: List[dict] = []
        user_lower = {s.lower() for s in user_skills}

        for peer in peers:
            peer_skills = peer.get("skills_used") or []
            overlap = len(user_lower & {s.lower() for s in peer_skills})

            if overlap > 1:
                jobs_res = await asyncio.to_thread(
                    supabase.table("jobs")
                    .select("id, title")
                    .eq("company", peer["company_hired"])
                    .eq("is_scam", False)
                    .limit(2)
                    .execute
                )
                for job in jobs_res.data or []:
                    insights.append(
                        {
                            "friend_name": peer.get("friend_name", "A connection"),
                            "company": peer.get("company_hired", ""),
                            "job_title": job.get("title", "Open Role"),
                            "job_id": str(job.get("id")),
                            "message": (
                                f"🔥 {peer.get('friend_name')} got hired at "
                                f"{peer.get('company_hired')}! They used "
                                f"{', '.join(peer_skills[:2])}."
                            ),
                        }
                    )

        result = insights if insights else MOCK_PEER_INSIGHTS
        logger.info(f"✅ Agent 6: {len(result)} peer insights returned.")
        return result

    except Exception as e:
        logger.error(f"❌ Agent 6 failed: {e}")
        return MOCK_PEER_INSIGHTS