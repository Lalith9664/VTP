"""
backend/app/agents/context_agent.py
Agent 4 – User Context & Memory Agent.
Fetches user profile from Supabase using the shared DB client.
"""

import asyncio
import logging
from typing import Dict, Any

from app.database import supabase   # ← centralised client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def build_user_context(user_id: str) -> Dict[str, Any]:
    """
    Fetch user profile, skills, and resume text from Supabase.
    Returns a guaranteed non-None context dict even if the DB is unavailable.
    """
    logger.info(f"🧠 Agent 4: Building context for user {user_id}...")

    try:
        res = await asyncio.to_thread(
            supabase.table("profiles").select("*").eq("id", user_id).execute
        )

        if not res.data:
            logger.warning(f"⚠️  User {user_id} not found. Using default context.")
            return _default_context(user_id)

        data = res.data[0]
        context = {
            "user_id": user_id,
            "email": data.get("email") or "user@example.com",
            "ultimate_goal": data.get("ultimate_goal") or "Software Engineer",
            "skills": data.get("skills") or [],
            "raw_resume_text": data.get("raw_resume_text") or "",
            "resume_embedding": data.get("resume_embedding"),
            "location": data.get("location") or "Remote",
            "education": data.get("education") or "B.Tech in Computer Science",
        }
        logger.info(f"✅ Agent 4: Context built. Skills: {len(context['skills'])}")
        return context

    except Exception as e:
        logger.error(f"❌ Agent 4 DB error: {e}")
        return _default_context(user_id)


def _default_context(user_id: str) -> Dict[str, Any]:
    """Safe fallback context used when the DB is unreachable."""
    return {
        "user_id": user_id,
        "email": "demo@student.com",
        "ultimate_goal": "Senior Full Stack Engineer",
        "skills": ["Python", "FastAPI", "React", "PostgreSQL", "Docker"],
        "raw_resume_text": (
            "Built scalable backend microservices using Python and FastAPI. "
            "Developed responsive frontend dashboards using React and TypeScript. "
            "Managed PostgreSQL databases and containerized applications with Docker."
        ),
        "resume_embedding": None,
        "location": "Remote",
        "education": "B.Tech in Computer Science",
    }