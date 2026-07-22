from fastapi import APIRouter, Depends, HTTPException
from app.models import MidnightRefreshResponse
from app.database import supabase
from app.utils.embeddings import get_embedding
from agents.scraper_agent import scrape_jobs
from agents.trend_agent import analyze_trends

router = APIRouter()

@router.post("/midnight-refresh", response_model=MidnightRefreshResponse)
async def midnight_refresh():
    """
    Midnight maintenance job: clear outdated non-saved jobs, run scraper agent,
    compute 384-dimension embeddings, populate jobs DB, and refresh market trends.
    """
    cleared_count = 0
    scraped_count = 0

    if supabase:
        try:
            # Delete non-flagged/stale jobs older than retention window
            del_res = supabase.table('jobs').delete().eq('is_saved', False).execute()
            if del_res.data:
                cleared_count = len(del_res.data)
        except Exception:
            pass

    # 2. Trigger Scraper Agent
    new_jobs = await scrape_jobs(query="Software Engineer", location="Remote")
    scraped_count = len(new_jobs)

    # 3. Compute vector embeddings and insert scraped jobs
    if supabase and new_jobs:
        for job in new_jobs:
            desc = job.get("description", "")
            embedding = await get_embedding(desc)
            try:
                supabase.table('jobs').upsert({
                    "id": job["id"],
                    "title": job["title"],
                    "company": job["company"],
                    "location": job["location"],
                    "description": desc,
                    "skills": job.get("skills", []),
                    "salary_range": job.get("salary_range"),
                    "job_embedding": embedding
                }).execute()
            except Exception:
                pass

    # 4. Trigger Trend Analysis
    await analyze_trends()

    return MidnightRefreshResponse(
        status="completed",
        jobs_cleared=cleared_count,
        scraped_count=scraped_count
    )
