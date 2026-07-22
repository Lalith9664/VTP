"""
backend/app/routes/jobs.py
==========================
Priority endpoints:
  POST /api/jobs/search         – pgvector semantic job search
  GET  /api/jobs/{job_id}/dossier – full AI dossier (cached + live)
"""

import asyncio
import logging
import math
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import supabase
from app.dependencies.auth import get_current_user
from app.models import JobSearchQuery
from app.utils.embeddings import get_embedding
from app.agents.tailor_agent import generate_dossier
from app.agents.mock_interview_agent import generate_interview_prep

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


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
# POST /api/jobs/search
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/search")
async def search_jobs(
    body: JobSearchQuery,
    current_user: dict = Depends(get_current_user),
):
    """
    Semantic job search using pgvector embeddings.

    Strategy (in order of speed):
      1. pgvector RPC match_jobs  (fastest – server-side cosine similarity)
      2. Python-side cosine on fetched embeddings  (fallback)
      3. Return empty list with informative status (never hard-crash)
    """
    search_term = body.query.strip() or "Software Engineer"
    top_k       = max(1, min(body.top_k, 50))          # clamp 1-50
    threshold   = body.match_threshold

    logger.info(f"🔍 Job search: '{search_term}' | top_k={top_k}")

    # 1. Embed the query
    query_embedding = await get_embedding(search_term)
    matches: List[dict] = []

    # 2. Try pgvector RPC
    try:
        rpc_res = await asyncio.to_thread(
            supabase.rpc(
                "match_jobs",
                {
                    "query_embedding": query_embedding,
                    "match_threshold": threshold,
                    "match_count": top_k,
                },
            ).execute
        )
        if rpc_res.data:
            for row in rpc_res.data:
                matches.append(
                    {
                        "id": str(row.get("id")),
                        "title": row.get("title", "Unknown Role"),
                        "company": row.get("company", "Unknown Company"),
                        "location": row.get("location", ""),
                        "description": (row.get("description") or "")[:300] + "...",
                        "skills": row.get("skills") or [],
                        "salary_range": row.get("salary_range"),
                        "similarity_score": round(float(row.get("similarity", 0.8)), 2),
                    }
                )
            logger.info(f"✅ RPC returned {len(matches)} matches.")
            return {"status": "success", "source": "vector_rpc", "results": matches}
    except Exception as e:
        logger.warning(f"pgvector RPC failed → falling back to Python cosine: {e}")

    # 3. Python-side fallback
    try:
        jobs_res = await asyncio.to_thread(
            supabase.table("jobs")
            .select("id, title, company, location, description, skills, salary_range, embedding")
            .eq("is_scam", False)
            .limit(100)
            .execute
        )
        for job in jobs_res.data or []:
            score = _cosine_similarity(query_embedding, job.get("embedding") or [])
            if score >= threshold:
                matches.append(
                    {
                        "id": str(job.get("id")),
                        "title": job.get("title", "Unknown Role"),
                        "company": job.get("company", "Unknown Company"),
                        "location": job.get("location", ""),
                        "description": (job.get("description") or "")[:300] + "...",
                        "skills": job.get("skills") or [],
                        "salary_range": job.get("salary_range"),
                        "similarity_score": round(score, 2),
                    }
                )
        matches.sort(key=lambda x: x["similarity_score"], reverse=True)
        logger.info(f"✅ Python fallback returned {len(matches[:top_k])} matches.")
        return {"status": "success", "source": "python_fallback", "results": matches[:top_k]}
    except Exception as e:
        logger.error(f"Python fallback also failed: {e}")

    # 4. Graceful empty response – never 500
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
      2. Fetch user profile + job details from DB
      3. Run Agent 7 (tailor) + Agent 9 (interview) in parallel
      4. Cache the result for subsequent requests
    """
    user_id = current_user["id"]
    logger.info(f"📂 Dossier request: job={job_id} user={user_id}")

    # ── 1. Cache check ─────────────────────────────────────────────────────────
    try:
        cached = await asyncio.to_thread(
            supabase.table("tailored_resumes")
            .select("*")
            .eq("user_id", user_id)
            .eq("job_id", job_id)
            .execute
        )
        if cached.data:
            item = cached.data[0]
            logger.info("✅ Serving dossier from Supabase cache.")
            return {
                "status": "success",
                "source": "cache",
                "data": {
                    "job_id": job_id,
                    "ats_score": item.get("ats_score", 0),
                    "warning": item.get("warning", ""),
                    "tailored_diff": item.get("tailored_bullets", []),
                    "interview_questions": item.get("interview_questions", []),
                    "can_qualify": item.get("can_qualify", False),
                    "missing_skills": item.get("missing_skills", []),
                    "qualification_feedback": item.get("qualification_feedback", ""),
                    "study_resources": item.get("study_resources", []),
                },
            }
    except Exception as e:
        logger.warning(f"Cache check failed (non-fatal): {e}")

    # ── 2. Fetch user profile ──────────────────────────────────────────────────
    user_resume_text = ""
    user_goal        = "Software Engineer"
    user_skills: List[str] = []

    try:
        u_res = await asyncio.to_thread(
            supabase.table("profiles")
            .select("raw_resume_text, ultimate_goal, skills")
            .eq("id", user_id)
            .execute
        )
        if u_res.data:
            profile = u_res.data[0]
            user_resume_text = profile.get("raw_resume_text") or user_resume_text
            user_goal        = profile.get("ultimate_goal")  or user_goal
            user_skills      = profile.get("skills")         or user_skills
    except Exception as e:
        logger.warning(f"User profile fetch failed: {e}")

    # ── 3. Fetch job details ───────────────────────────────────────────────────
    job_desc   = ""
    job_skills: List[str] = []
    job_title  = "Software Engineer Role"
    job_company = ""

    try:
        j_res = await asyncio.to_thread(
            supabase.table("jobs")
            .select("title, company, description, skills")
            .eq("id", job_id)
            .execute
        )
        if j_res.data:
            job         = j_res.data[0]
            job_desc    = job.get("description") or job_desc
            job_skills  = job.get("skills")      or job_skills
            job_title   = job.get("title")       or job_title
            job_company = job.get("company")     or job_company
    except Exception as e:
        logger.warning(f"Job fetch failed: {e}")

    # ── 4. Parallel Agent execution ────────────────────────────────────────────
    logger.info("⚡ Running Agent 7 + Agent 9 in parallel...")

    dossier_task  = generate_dossier(
        user_resume_text=user_resume_text,
        job_desc=job_desc,
        job_skills=job_skills,
        user_goal=user_goal,
    )
    interview_task = generate_interview_prep(
        user_skills=user_skills,
        job_skills=job_skills,
        job_title=job_title,
    )

    dossier_result, interview_result = await asyncio.gather(
        dossier_task, interview_task, return_exceptions=True
    )

    if isinstance(dossier_result, Exception):
        logger.error(f"Agent 7 crashed: {dossier_result}")
        dossier_result = {
            "ats_score": 0, "warning": "AI generation failed",
            "tailored_diff": [], "interview_questions": [],
        }
    if isinstance(interview_result, Exception):
        logger.error(f"Agent 9 crashed: {interview_result}")
        interview_result = {
            "can_qualify": False, "missing_skills": [],
            "qualification_feedback": "", "questions": [], "study_resources": [],
        }

    # Merge interview questions, deduplicate, cap at 5
    combined_questions = list(
        dict.fromkeys(
            dossier_result.get("interview_questions", [])
            + interview_result.get("questions", [])
        )
    )[:5]

    response_data = {
        "job_id":                job_id,
        "job_title":             job_title,
        "job_company":           job_company,
        "ats_score":             dossier_result.get("ats_score", 0),
        "warning":               dossier_result.get("warning", ""),
        "tailored_diff":         dossier_result.get("tailored_diff", []),
        "interview_questions":   combined_questions,
        "can_qualify":           interview_result.get("can_qualify", False),
        "missing_skills":        interview_result.get("missing_skills", []),
        "qualification_feedback": interview_result.get("qualification_feedback", ""),
        "study_resources":       interview_result.get("study_resources", []),
    }

    # ── 5. Cache result ────────────────────────────────────────────────────────
    try:
        await asyncio.to_thread(
            supabase.table("tailored_resumes").upsert(
                {
                    "user_id": user_id,
                    "job_id": job_id,
                    "tailored_bullets": response_data["tailored_diff"],
                    "ats_score": response_data["ats_score"],
                    "warning": response_data["warning"],
                    "interview_questions": response_data["interview_questions"],
                    "can_qualify": response_data["can_qualify"],
                    "missing_skills": response_data["missing_skills"],
                    "qualification_feedback": response_data["qualification_feedback"],
                    "study_resources": response_data["study_resources"],
                }
            ).execute
        )
        logger.info("💾 Dossier cached.")
    except Exception as e:
        logger.warning(f"Cache write failed (non-fatal): {e}")

    return {"status": "success", "source": "live_generation", "data": response_data}