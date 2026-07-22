"""
backend/app/agents/trend_agent.py
Agent 8 – Market Trend Analyser.

Calculates the top-10 trending skills from live job data in Supabase
and writes results back to the trending_skills table.
"""

import asyncio
import logging
from collections import Counter
from datetime import date
from typing import List, Tuple

from app.database import supabase   # ← centralised client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Fallback when DB is empty or unavailable
MOCK_TRENDS: List[Tuple[str, int]] = [
    ("Python", 45), ("React", 38), ("AWS", 32), ("Docker", 29),
    ("PostgreSQL", 25), ("FastAPI", 22), ("TypeScript", 20),
    ("Kubernetes", 18), ("Node.js", 15), ("Machine Learning", 12),
]


async def analyze_trends() -> dict:
    """
    Agent 8: Pull all job skills from Supabase, tally frequencies,
    persist back, and return a dashboard-ready dict.

    Returns:
        {
            "trending_skills": [{"skill_name": str, "frequency": int}, ...],
            "peer_insights":   []   # populated by peer_agent separately
        }
    """
    logger.info("📈 Agent 8: Analysing market trends...")

    try:
        res = await asyncio.to_thread(
            supabase.table("jobs").select("skills").eq("is_scam", False).execute
        )
        jobs = res.data or []
    except Exception as e:
        logger.error(f"❌ Agent 8 DB read failed: {e}")
        jobs = []

    if not jobs:
        logger.warning("No jobs found – returning mock trends.")
        return _format_response(MOCK_TRENDS)

    # Tally skill frequencies
    all_skills: List[str] = []
    for job in jobs:
        skills = job.get("skills") or []
        all_skills.extend(
            s.strip().lower() for s in skills if isinstance(s, str)
        )

    if not all_skills:
        return _format_response(MOCK_TRENDS)

    counter = Counter(all_skills)
    top_skills: List[Tuple[str, int]] = [
        (skill.title(), count) for skill, count in counter.most_common(10)
    ]

    # Persist asynchronously (fire-and-forget style)
    asyncio.create_task(_persist_trends(top_skills))

    logger.info(f"✅ Agent 8: Top skill → {top_skills[0][0]}")
    return _format_response(top_skills)


def _format_response(trends: List[Tuple[str, int]]) -> dict:
    return {
        "trending_skills": [
            {"skill_name": skill, "frequency": count}
            for skill, count in trends
        ],
        "peer_insights": [],
    }


async def _persist_trends(trends: List[Tuple[str, int]]) -> None:
    """Write the new trend snapshot to Supabase (non-blocking)."""
    today = date.today().isoformat()
    rows = [
        {"skill_name": skill, "frequency": count, "date": today}
        for skill, count in trends
    ]
    try:
        await asyncio.to_thread(
            supabase.table("trending_skills")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000")
            .execute
        )
        await asyncio.to_thread(
            supabase.table("trending_skills").insert(rows).execute
        )
        logger.info("💾 Agent 8: Trends persisted to Supabase.")
    except Exception as e:
        logger.warning(f"Agent 8 DB write failed (non-fatal): {e}")