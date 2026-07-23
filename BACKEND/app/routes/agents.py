"""
backend/app/routes/agents.py
==============================
Dedicated endpoints exposing every AI agent directly:

  POST /api/agents/scan-job       – Agent 3:  Toxicity / scam filter
  GET  /api/agents/context        – Agent 4:  User context builder
  POST /api/agents/trajectory     – Agent 5:  Career trajectory scorer
  POST /api/agents/scrape         – Agent 1+2: Job scraping (admin-level)
  POST /api/agents/pipeline       – Full LangGraph orchestrator run
  POST /api/agents/interview-prep – Agent 9:  Interview preparation (standalone)
  GET  /api/agents/trends         – Agent 8:  Market trend analysis (standalone)
"""

import asyncio
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, Field

from app.database import supabase
from app.dependencies.auth import get_current_user
from app.agents.anit_match_agent import scan_job_for_toxicity
from app.agents.context_agent import build_user_context
from app.agents.trajectory_agent import evaluate_trajectory, generate_skill_roadmap
from app.agents.scraper_agent import scrape_and_enrich_jobs
from app.agents.trend_agent import analyze_trends
from app.agents.mock_interview_agent import generate_interview_prep
from app.agents.orchestrator import run_pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# Request / Response schemas
# ─────────────────────────────────────────────────────────────────────────────

class ScanJobRequest(BaseModel):
    job_description: str = Field(..., min_length=10, description="The full job description text to scan.")


class TrajectoryRequest(BaseModel):
    user_goal: str = Field(..., description="User's long-term career goal.")
    job_skills: List[str] = Field(default_factory=list, description="Skills required by the job.")
    job_title: str = Field(..., description="Title of the job being evaluated.")


class RoadmapRequest(BaseModel):
    target_skill: str = Field(..., description="Target technology or skill to build a roadmap for.")
    user_skills: List[str] = Field(default_factory=list, description="User's current skills.")



class InterviewPrepRequest(BaseModel):
    user_skills: List[str] = Field(default_factory=list, description="Skills the user currently has.")
    job_skills: List[str] = Field(default_factory=list, description="Skills required by the target job.")
    job_title: str = Field(..., description="Title of the target job.")


class PipelineRequest(BaseModel):
    search_query: Optional[str] = Field(None, description="Job search query. If omitted, returns dashboard recommendations.")
    job_id: Optional[str] = Field(None, description="Specific job ID to generate a full dossier for.")


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/agents/scan-job  →  Agent 3: Toxicity / Scam Filter
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/scan-job", summary="Agent 3 – Toxicity & Scam Filter")
async def scan_job(
    body: ScanJobRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Agent 3: Analyzes a job description for red flags — scam signals (requests
    for money / SSN) and toxic culture indicators ("work hard play hard", unpaid
    trials, etc.).

    Returns:
        is_scam    – bool
        toxic_score – 0-100 (100 = extremely toxic)
        reason     – short explanation of detected flags
    """
    logger.info("🛡️ /api/agents/scan-job called by user %s", current_user["id"])
    result = await scan_job_for_toxicity(body.job_description)
    return {"status": "success", "agent": "Agent 3 – Anti-Match & Safety Filter", **result}


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/agents/context  →  Agent 4: User Context Builder
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/context", summary="Agent 4 – User Context Builder")
async def get_user_context(
    current_user: dict = Depends(get_current_user),
):
    """
    Agent 4: Fetches and builds a complete user context object from the
    `profiles` table — skills, ultimate career goal, resume text, education,
    location, and resume embedding.

    Falls back to a sensible demo context if the DB record is missing.
    """
    user_id = current_user["id"]
    logger.info("🧠 /api/agents/context called for user %s", user_id)
    context = await build_user_context(user_id)
    return {"status": "success", "agent": "Agent 4 – User Context & Memory", "context": context}


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/agents/trajectory  →  Agent 5: Career Trajectory Scorer
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/trajectory", summary="Agent 5 – Career Trajectory Scorer")
async def evaluate_career_trajectory(
    body: TrajectoryRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Agent 5: Evaluates how well a specific job opportunity aligns with the
    user's declared long-term career goal.

    Scoring guide:
    - 80-100 → Directly builds critical skills for the goal
    - 50-79  → Builds adjacent / transferable skills
    - 0-49   → Unrelated or a step backward

    Returns:
        score      int (0-100)
        reasoning  one-sentence explanation
    """
    logger.info("🎯 /api/agents/trajectory called by user %s", current_user["id"])
    result = await evaluate_trajectory(
        user_goal=body.user_goal,
        job_skills=body.job_skills,
        job_title=body.job_title,
    )
    return {"status": "success", "agent": "Agent 5 – Goal & Trajectory Validator", **result}


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/agents/trajectory/roadmap  →  Agent 5: Career Roadmap & Mastery Planner
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/trajectory/roadmap", summary="Agent 5 – Career Roadmap & Mastery Planner")
async def get_skill_mastery_roadmap(
    body: RoadmapRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Agent 5: Generates a complete learning roadmap to master a target skill,
    comparing it against the user's current skills.
    """
    logger.info("🎯 /api/agents/trajectory/roadmap called by user %s", current_user["id"])
    result = await generate_skill_roadmap(
        target_skill=body.target_skill,
        user_skills=body.user_skills,
    )
    return {"status": "success", "agent": "Agent 5 – Career Roadmap & Mastery Planner", "data": result}



# ─────────────────────────────────────────────────────────────────────────────
# POST /api/agents/interview-prep  →  Agent 9: Interview Preparation (standalone)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/interview-prep", summary="Agent 9 – Mock Interview & Qualification")
async def standalone_interview_prep(
    body: InterviewPrepRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Agent 9: Performs a skill-gap analysis and generates targeted technical
    interview questions for the given role — independently of the dossier flow.

    Returns:
        qualification_feedback – readiness summary
        can_qualify            – bool (≥60% skill match)
        missing_skills         – list of skill gaps
        questions              – up to 5 interview questions
        study_resources        – actionable study topics
    """
    logger.info("🎤 /api/agents/interview-prep called by user %s", current_user["id"])
    result = await generate_interview_prep(
        user_skills=body.user_skills,
        job_skills=body.job_skills,
        job_title=body.job_title,
    )
    return {"status": "success", "agent": "Agent 9 – Mock Interview & Qualification Prep", **result}


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/agents/trends  →  Agent 8: Market Trend Analysis (standalone)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/trends", summary="Agent 8 – Market Skill Trends")
async def get_market_trends(
    current_user: dict = Depends(get_current_user),
):
    """
    Agent 8: Aggregates all job skills from the `jobs` table and returns the
    top 10 trending technologies sorted by frequency.

    Returns:
        trending_skills – [{ skill_name: str, frequency: int }, ...]
    """
    logger.info("📈 /api/agents/trends called by user %s", current_user["id"])
    raw_trends = await analyze_trends()

    # analyze_trends returns List[tuple[str, int]] — normalise to dicts
    trending_skills = []
    for item in raw_trends:
        if isinstance(item, (list, tuple)) and len(item) >= 2:
            trending_skills.append({"skill_name": item[0], "frequency": item[1]})
        elif isinstance(item, dict):
            trending_skills.append(item)

    return {
        "status": "success",
        "agent": "Agent 8 – Trend Analyser",
        "trending_skills": trending_skills,
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/agents/scrape  →  Agents 1+2: Job Scraping Pipeline
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/scrape", summary="Agents 1+2 – Job Scraping & Enrichment")
async def trigger_scrape(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    """
    Agents 1 & 2: Triggers the full job scraping + LLM skill enrichment
    pipeline in the background.
    """
    logger.info("🕵️ /api/agents/scrape triggered by user %s", current_user["id"])
    background_tasks.add_task(scrape_and_enrich_jobs)
    return {
        "status": "success",
        "agent": "Agents 1+2 – Scraper & Skill Extractor",
        "message": "Job scraping and enrichment triggered in the background.",
    }



# ─────────────────────────────────────────────────────────────────────────────
# POST /api/agents/pipeline  →  Full LangGraph Orchestrator
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/pipeline", summary="Full LangGraph Multi-Agent Pipeline")
async def run_full_pipeline(
    body: PipelineRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Executes the complete LangGraph multi-agent orchestration pipeline:

    1. Agent 4  – Build user context
    2. Agent 1  – Fetch + filter matching jobs (pgvector or dashboard mode)
    3. Agent 6  – Peer network insights   } concurrent
       Agent 5  – Trajectory scoring      }
    4. Agent 7  – Resume tailoring        } concurrent (only if job_id provided)
       Agent 9  – Interview preparation   }
    5. Prepare unified final response

    Params:
        search_query – semantic job search query (optional)
        job_id       – trigger dossier generation for a specific job (optional)
    """
    user_id = current_user["id"]
    logger.info(
        "⚙️  /api/agents/pipeline called | user=%s | query='%s' | job_id=%s",
        user_id, body.search_query, body.job_id,
    )
    result = await run_pipeline(
        user_id=user_id,
        search_query=body.search_query,
        job_id=body.job_id,
    )

    if "error" in result and result.get("error"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("details", result["error"]),
        )

    return {"status": "success", "agent": "LangGraph Orchestrator", "data": result}
