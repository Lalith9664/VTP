"""
backend/app/routes/admin.py
============================
POST /api/admin/midnight-refresh – nightly job scrape + trend refresh.
Protected: add admin-role check before deploying to production.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import supabase
from app.models import MidnightRefreshResponse
from app.utils.embeddings import get_embedding
from app.dependencies.auth import get_current_user
from app.agents.scraper_agent import scrape_jobs
from app.agents.trend_agent import analyze_trends

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/midnight-refresh", response_model=MidnightRefreshResponse)
async def midnight_refresh(current_user: dict = Depends(get_current_user)):
    """
    Nightly maintenance job:
      1. Delete stale un-saved jobs
      2. Scrape + enrich new jobs via Agent 3
      3. Refresh market trends via Agent 8

    ⚠️  TODO Production: restrict to users with role='admin'.
    """
    # ── Admin guard (uncomment in production) ──────────────────────────────────
    # if current_user.get("role") != "admin":
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only.")

    cleared_count = 0

    # 1. Delete stale jobs
    try:
        del_res = supabase.table("jobs").delete().eq("is_saved", False).execute()
        cleared_count = len(del_res.data or [])
        logger.info(f"🗑️  Cleared {cleared_count} stale jobs.")
    except Exception as e:
        logger.warning(f"Job deletion failed (non-fatal): {e}")

    # 2. Scrape + persist new jobs
    new_jobs = await scrape_jobs(query="Software Engineer", location="India")
    scraped_count = len(new_jobs)

    # 3. Refresh market trends
    try:
        await analyze_trends()
    except Exception as e:
        logger.warning(f"Trend refresh failed (non-fatal): {e}")

    return MidnightRefreshResponse(
        status="completed",
        jobs_cleared=cleared_count,
        scraped_count=scraped_count,
    )
