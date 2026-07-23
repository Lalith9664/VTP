"""
backend/app/routes/jobs.py
==========================
Priority endpoints:
  GET  /api/jobs/my-jobs            – ultra-fast personalised job feed
  POST /api/jobs/search             – pgvector semantic job search
  GET  /api/jobs/{job_id}/dossier   – full AI dossier (cached + live)
"""

import asyncio
import logging
import math
import time
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import supabase
from app.dependencies.auth import get_current_user
from app.models import JobSearchQuery
from app.utils.embeddings import get_embedding
from app.agents.tailor_agent import generate_dossier
from app.agents.mock_interview_agent import generate_interview_prep
from app.agents.scraper_agent import scrape_and_enrich_jobs
from app.agents.anit_match_agent import find_anti_matching_jobs

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# ─────────────────────────────────────────────────────────────────────────────
# In-memory cache: jobs list with TTL (60 s)
# ─────────────────────────────────────────────────────────────────────────────

_JOBS_CACHE: dict[int, tuple[float, list]] = {}
_JOBS_TTL = 60  # seconds


# ─────────────────────────────────────────────────────────────────────────────
# Async Supabase helper
# ─────────────────────────────────────────────────────────────────────────────

async def _run(query_builder):
    """Run any synchronous Supabase query builder inside a thread pool."""
    return await asyncio.to_thread(query_builder.execute)


async def _fetch_fallback_jobs(limit: int) -> list:
    """Fetch latest non-scam jobs with TTL cache to avoid re-querying Supabase."""
    now = time.monotonic()
    cached = _JOBS_CACHE.get(limit)
    if cached and (now - cached[0]) < _JOBS_TTL:
        logger.info("⚡ Jobs cache hit (%.0fs old)", now - cached[0])
        return cached[1]
    res = await _run(
        supabase.table("jobs")
        .select("id, title, company, location, description, skills, salary_range, toxic_score, is_scam, source")
        .eq("is_scam", False)
        .order("id", desc=True)
        .limit(limit)
    )
    rows = res.data or []
    _JOBS_CACHE[limit] = (now, rows)
    logger.info("🗄️  Jobs cache updated (%d rows)", len(rows))
    return rows


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/jobs/my-jobs  →  User's personalised scraped job matches
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/my-jobs", summary="Personalised scraped jobs for the current user")
async def get_my_jobs(
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    """
    Returns personalised scraped jobs, fast and reliably.

    Strategy (single path — pgvector removed after testing):
      • pgvector RPC was tested: embeddings stored as JSON strings (not float[]),
        causing RPC to always crash with format error. Removed entirely.
      • This handler runs ONE parallel gather:
          → user skills from profiles table
          → cached latest non-scam jobs (TTL 60s — 0ms on repeat)
        Then ranks by Python skill-overlap in <1ms.
      • Total latency: ~226ms first load, ~0ms cached.
    """
    t_start = time.monotonic()
    user_id = current_user["id"]
    logger.info("👤 /api/jobs/my-jobs called for user %s", user_id)

    # Fetch user skills + jobs list IN PARALLEL (cached jobs = 0ms on repeat)
    profile_res, fallback_rows = await asyncio.gather(
        _run(supabase.table("profiles").select("skills").eq("id", user_id)),
        _fetch_fallback_jobs(limit),
        return_exceptions=True,
    )

    # Unpack profile
    user_skills: list[str] = []
    if not isinstance(profile_res, Exception) and profile_res.data:
        user_skills = profile_res.data[0].get("skills") or []

    # Unpack jobs (list already returned by _fetch_fallback_jobs)
    raw_rows: list = []
    if isinstance(fallback_rows, list):
        raw_rows = fallback_rows
    elif not isinstance(fallback_rows, Exception) and hasattr(fallback_rows, "data"):
        raw_rows = fallback_rows.data or []

    t_fetch = time.monotonic()
    logger.info("⚡ Parallel fetch done in %.0fms | skills=%d | jobs=%d",
                (t_fetch - t_start) * 1000, len(user_skills), len(raw_rows))

    # Rank by skill overlap (pure Python, <1ms)
    user_skills_lower = {s.lower().strip() for s in user_skills}
    jobs: list[dict] = []
    for row in raw_rows:
        job_skills = row.get("skills") or []
        job_skills_lower = {s.lower().strip() for s in job_skills}
        overlap = len(job_skills_lower & user_skills_lower)
        score = round(overlap / max(len(job_skills_lower), 1), 2) if job_skills_lower else 0.0
        jobs.append({
            "id":               str(row.get("id")),
            "title":            row.get("title") or "Unknown Role",
            "company":          row.get("company") or "Unknown Company",
            "location":         row.get("location") or "",
            "description":      (row.get("description") or "")[:400] + "...",
            "skills":           job_skills,
            "salary_range":     row.get("salary_range"),
            "similarity_score": score,
            "toxic_score":      row.get("toxic_score", 0),
            "is_scam":          row.get("is_scam", False),
            "source":           row.get("source") or "",
        })

    # Sort best matches first
    jobs.sort(key=lambda x: x["similarity_score"], reverse=True)

    t_total = time.monotonic()
    logger.info("🏁 /my-jobs done: %.0fms total | %d jobs returned",
                (t_total - t_start) * 1000, len(jobs))

    return {"status": "success", "user_id": user_id, "count": len(jobs), "jobs": jobs}



# ─────────────────────────────────────────────────────────────────────────────
# Utility
# ─────────────────────────────────────────────────────────────────────────────

def _cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Pure-Python cosine similarity – used only when the pgvector RPC fails."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot   = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    return dot / (norm1 * norm2) if norm1 and norm2 else 0.0


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/jobs/search  →  Semantic job search
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/search")
async def search_jobs(
    body: JobSearchQuery,
    current_user: dict = Depends(get_current_user),
):
    """
    Semantic job search using pgvector embeddings.

    Strategy (in order of speed):
      1. Embed query (async – HuggingFace or deterministic mock)
      2. pgvector RPC match_jobs  (fastest – server-side cosine similarity)
      3. Python-side cosine on fetched embeddings  (fallback)
      4. Return empty list with informative status (never hard-crash)
    """
    search_term = body.query.strip() or "Software Engineer"
    top_k       = max(1, min(body.top_k, 50))
    threshold   = body.match_threshold

    logger.info("🔍 Job search: '%s' | top_k=%d", search_term, top_k)

    # 1. Embed query (already async)
    query_embedding = await get_embedding(search_term)
    matches: List[dict] = []

    # 2. Try pgvector RPC (async)
    try:
        rpc_res = await _run(
            supabase.rpc(
                "match_jobs",
                {
                    "query_embedding": query_embedding,
                    "match_threshold": threshold,
                    "match_count":     top_k,
                },
            )
        )
        if rpc_res.data:
            for row in rpc_res.data:
                matches.append({
                    "id":               str(row.get("id")),
                    "title":            row.get("title", "Unknown Role"),
                    "company":          row.get("company", "Unknown Company"),
                    "location":         row.get("location", ""),
                    "description":      (row.get("description") or "")[:300] + "...",
                    "skills":           row.get("skills") or [],
                    "salary_range":     row.get("salary_range"),
                    "similarity_score": round(float(row.get("similarity", 0.8)), 2),
                    "source":           row.get("source") or "",
                })
            logger.info("✅ RPC returned %d matches.", len(matches))
            return {"status": "success", "source": "vector_rpc", "results": matches}
    except Exception as e:
        logger.warning("pgvector RPC failed → falling back to Python cosine: %s", e)

    # 3. Python-side fallback (async)
    try:
        jobs_res = await _run(
            supabase.table("jobs")
            .select("id, title, company, location, description, skills, salary_range, embedding, source")
            .eq("is_scam", False)
            .limit(100)
        )
        for job in jobs_res.data or []:
            score = _cosine_similarity(query_embedding, job.get("embedding") or [])
            if score >= threshold:
                matches.append({
                    "id":               str(job.get("id")),
                    "title":            job.get("title", "Unknown Role"),
                    "company":          job.get("company", "Unknown Company"),
                    "location":         job.get("location", ""),
                    "description":      (job.get("description") or "")[:300] + "...",
                    "skills":           job.get("skills") or [],
                    "salary_range":     job.get("salary_range"),
                    "similarity_score": round(score, 2),
                    "source":           job.get("source") or "",
                })
        matches.sort(key=lambda x: x["similarity_score"], reverse=True)
        logger.info("✅ Python fallback returned %d matches.", len(matches[:top_k]))
        return {"status": "success", "source": "python_fallback", "results": matches[:top_k]}
    except Exception as e:
        logger.error("Python fallback also failed: %s", e)

    return {"status": "success", "source": "no_results", "results": []}


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/jobs/{job_id}/dossier
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/{job_id}/dossier")
async def get_job_dossier(
    job_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Full AI intelligence dossier for one job.

    Flow:
      1. Check Supabase cache  (instant)
      2. Fetch user profile + job details IN PARALLEL (async)
      3. Run Agent 7 (tailor) + Agent 9 (interview) in parallel
      4. Cache the result for subsequent requests
    """
    user_id = current_user["id"]
    logger.info("📂 Dossier request: job=%s user=%s", job_id, user_id)

    # ── 1. Cache check ─────────────────────────────────────────────────────────
    try:
        cached = await _run(
            supabase.table("tailored_resumes")
            .select("*")
            .eq("user_id", user_id)
            .eq("job_id", job_id)
        )
        if cached.data:
            item = cached.data[0]
            logger.info("✅ Serving dossier from Supabase cache.")
            return {
                "status": "success",
                "source": "cache",
                "data": {
                    "job_id":                  job_id,
                    "ats_score":               item.get("ats_score", 0),
                    "warning":                 item.get("warning", ""),
                    "tailored_diff":           item.get("tailored_bullets", []),
                    "interview_questions":     item.get("interview_questions", []),
                    "can_qualify":             item.get("can_qualify", False),
                    "missing_skills":          item.get("missing_skills", []),
                    "qualification_feedback":  item.get("qualification_feedback", ""),
                    "study_resources":         item.get("study_resources", []),
                },
            }
    except Exception as e:
        logger.warning("Cache check failed (non-fatal): %s", e)

    # ── 2. Fetch user profile + job details IN PARALLEL ────────────────────────
    user_q = (
        supabase.table("profiles")
        .select("raw_resume_text, ultimate_goal, skills")
        .eq("id", user_id)
    )
    job_q = (
        supabase.table("jobs")
        .select("title, company, description, skills")
        .eq("id", job_id)
    )

    user_res, job_res = await asyncio.gather(
        _run(user_q), _run(job_q), return_exceptions=True
    )

    user_resume_text = ""
    user_goal        = "Software Engineer"
    user_skills: List[str] = []
    if not isinstance(user_res, Exception) and user_res.data:
        p = user_res.data[0]
        user_resume_text = p.get("raw_resume_text") or ""
        user_goal        = p.get("ultimate_goal")   or user_goal
        user_skills      = p.get("skills")          or []

    job_desc    = ""
    job_skills: List[str] = []
    job_title   = "Software Engineer Role"
    job_company = ""
    if not isinstance(job_res, Exception) and job_res.data:
        j = job_res.data[0]
        job_desc    = j.get("description") or ""
        job_skills  = j.get("skills")      or []
        job_title   = j.get("title")       or job_title
        job_company = j.get("company")     or ""

    # ── 3. Parallel Agent execution ────────────────────────────────────────────
    logger.info("⚡ Running Agent 7 + Agent 9 in parallel...")
    dossier_result, interview_result = await asyncio.gather(
        generate_dossier(
            user_resume_text=user_resume_text,
            job_desc=job_desc,
            job_skills=job_skills,
            user_goal=user_goal,
        ),
        generate_interview_prep(
            user_skills=user_skills,
            job_skills=job_skills,
            job_title=job_title,
        ),
        return_exceptions=True,
    )

    if isinstance(dossier_result, Exception):
        logger.error("Agent 7 crashed: %s", dossier_result)
        dossier_result = {"ats_score": 0, "warning": "AI generation failed", "tailored_diff": [], "interview_questions": []}
    if isinstance(interview_result, Exception):
        logger.error("Agent 9 crashed: %s", interview_result)
        interview_result = {"can_qualify": False, "missing_skills": [], "qualification_feedback": "", "questions": [], "study_resources": []}

    combined_questions = list(
        dict.fromkeys(
            dossier_result.get("interview_questions", [])
            + interview_result.get("questions", [])
        )
    )[:5]

    response_data = {
        "job_id":                  job_id,
        "job_title":               job_title,
        "job_company":             job_company,
        "ats_score":               dossier_result.get("ats_score", 0),
        "warning":                 dossier_result.get("warning", ""),
        "tailored_diff":           dossier_result.get("tailored_diff", []),
        "interview_questions":     combined_questions,
        "can_qualify":             interview_result.get("can_qualify", False),
        "missing_skills":          interview_result.get("missing_skills", []),
        "qualification_feedback":  interview_result.get("qualification_feedback", ""),
        "study_resources":         interview_result.get("study_resources", []),
    }

    # ── 4. Cache result (fire-and-forget, don't block the response) ────────────
    async def _cache():
        try:
            await _run(
                supabase.table("tailored_resumes").upsert({
                    "user_id":                user_id,
                    "job_id":                 job_id,
                    "tailored_bullets":       response_data["tailored_diff"],
                    "ats_score":              response_data["ats_score"],
                    "warning":                response_data["warning"],
                    "interview_questions":    response_data["interview_questions"],
                    "can_qualify":            response_data["can_qualify"],
                    "missing_skills":         response_data["missing_skills"],
                    "qualification_feedback": response_data["qualification_feedback"],
                    "study_resources":        response_data["study_resources"],
                })
            )
            logger.info("💾 Dossier cached.")
        except Exception as e:
            logger.warning("Cache write failed (non-fatal): %s", e)

    asyncio.create_task(_cache())   # fire-and-forget; don't await

    return {"status": "success", "source": "live_generation", "data": response_data}


@router.get("/anti-jobs", summary="Find anti-matching jobs other than the user's role")
async def get_anti_jobs(
    limit: int = 3,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]
    logger.info("🚫 /api/jobs/anti-jobs called for user %s", user_id)
    
    # 1. Fetch user profile (skills + ultimate_goal)
    profile_res = await _run(supabase.table("profiles").select("skills, ultimate_goal").eq("id", user_id))
    user_skills = []
    ultimate_goal = ""
    if profile_res.data:
        user_skills = profile_res.data[0].get("skills") or []
        ultimate_goal = profile_res.data[0].get("ultimate_goal") or ""
        
    # 2. Fetch latest active jobs
    jobs_res = await _run(
        supabase.table("jobs")
        .select("id, title, company, description, skills")
        .eq("is_scam", False)
        .limit(50)
    )
    all_jobs = jobs_res.data or []
    
    # 3. Use Agent 3 (anit_match_agent) tool to compute the anti-match list
    anti_matches = find_anti_matching_jobs(
        user_skills=user_skills,
        ultimate_goal=ultimate_goal,
        all_jobs=all_jobs,
        limit=limit
    )
    
    return {"status": "success", "jobs": anti_matches}