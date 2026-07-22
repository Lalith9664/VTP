"""
backend/app/agents/orchestrator.py
===================================
LangGraph multi-agent orchestrator for the AI Career Co-Pilot.

Architecture:
  load_context → fetch_jobs → analyze_peers
                                   │
                    ┌──────────────┴──────────────┐
              (target_job_id?)             (no job_id)
                    │                             │
           generate_dossier            prepare_response
                    │                             │
           prepare_response ──────────────────────┘
                    │
                  [END]

All Supabase calls are wrapped in asyncio.to_thread() to avoid blocking
the FastAPI event loop.
"""

import asyncio
import logging
from typing import TypedDict, List, Dict, Any, Literal, Optional

from langgraph.graph import StateGraph, END

# ── centralised imports (no more local config / supabase clients) ──────────────
from app.database import supabase
from app.agents.context_agent import build_user_context
from app.agents.trajectory_agent import evaluate_trajectory
from app.agents.peer_agent import get_peer_recommendations
from app.agents.tailor_agent import generate_dossier
from app.agents.mock_interview_agent import generate_interview_prep
from app.agents.embeddings import get_embedding

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# 1. Shared State definition
# ─────────────────────────────────────────────────────────────────────────────
class AgentState(TypedDict):
    user_id: str
    search_query: Optional[str]
    target_job_id: Optional[str]

    # Filled progressively by each node
    user_context: Dict[str, Any]
    matched_jobs: List[Dict[str, Any]]
    peer_insights: List[Dict[str, Any]]
    trajectory_scores: Dict[str, Any]
    dossier: Optional[Dict[str, Any]]
    final_response: Dict[str, Any]
    error: Optional[str]


# ─────────────────────────────────────────────────────────────────────────────
# 2. Node functions (async, non-blocking)
# ─────────────────────────────────────────────────────────────────────────────

async def load_user_context(state: AgentState) -> dict:
    """Agent 4 – fetch user profile from Supabase."""
    logger.info("🧠 Orchestrator: Loading user context...")
    try:
        context = await build_user_context(state["user_id"])
        return {"user_context": context}
    except Exception as e:
        logger.error(f"Context load failed: {e}")
        return {
            "user_context": {
                "skills": [],
                "ultimate_goal": "Software Engineer",
                "raw_resume_text": "",
            },
            "error": str(e),
        }


async def fetch_and_filter_jobs(state: AgentState) -> dict:
    """Vector-search jobs from pgvector or fall back to a table scan."""
    logger.info("🔍 Orchestrator: Fetching and filtering jobs...")
    matched_jobs: List[Dict] = []

    try:
        if state.get("search_query"):
            query_vec = await get_embedding(state["search_query"])
            result = await asyncio.to_thread(
                supabase.rpc(
                    "match_jobs",
                    {
                        "query_embedding": query_vec,
                        "match_threshold": 0.3,
                        "match_count": 15,
                    },
                ).execute
            )
            matched_jobs = result.data or []
        else:
            result = await asyncio.to_thread(
                supabase.table("jobs")
                .select("*")
                .eq("is_scam", False)
                .limit(10)
                .execute
            )
            matched_jobs = result.data or []
    except Exception as e:
        logger.error(f"Job fetch failed: {e}")
        matched_jobs = [
            {
                "id": "mock-1",
                "title": "Python Developer",
                "company": "Mock Corp",
                "skills": ["Python", "FastAPI"],
                "description": "Mock job for offline mode",
            }
        ]

    return {"matched_jobs": matched_jobs}


async def analyze_peers_and_trajectory(state: AgentState) -> dict:
    """Run Agent 5 (trajectory) and Agent 6 (peers) in parallel."""
    logger.info("🎯 Orchestrator: Analyzing peers and trajectory in parallel...")

    user_context = state.get("user_context", {})
    matched_jobs = state.get("matched_jobs", [])

    peers_task = get_peer_recommendations(
        state["user_id"], user_context.get("skills", [])
    )

    trajectory_tasks = [
        evaluate_trajectory(
            user_context.get("ultimate_goal", ""),
            job.get("skills", []),
            job.get("title", ""),
        )
        for job in matched_jobs[:5]
    ]

    results = await asyncio.gather(peers_task, *trajectory_tasks, return_exceptions=True)

    peer_insights: List[Dict] = results[0] if not isinstance(results[0], Exception) else []

    trajectory_scores: Dict[str, Any] = {}
    for i, res in enumerate(results[1:]):
        if i < len(matched_jobs[:5]) and not isinstance(res, Exception):
            job_id = matched_jobs[i].get("id", f"job-{i}")
            trajectory_scores[job_id] = res.get("score", 50)

    return {"peer_insights": peer_insights, "trajectory_scores": trajectory_scores}


async def generate_full_dossier(state: AgentState) -> dict:
    """Agent 7 + Agent 9 in parallel for one target job."""
    target_job_id = state.get("target_job_id")
    if not target_job_id:
        return {"dossier": None}

    logger.info(f"📝 Orchestrator: Generating dossier for job {target_job_id}...")

    try:
        job_res = await asyncio.to_thread(
            supabase.table("jobs").select("*").eq("id", target_job_id).execute
        )
        if not job_res.data:
            return {"dossier": {"error": "Job not found in database"}}

        job = job_res.data[0]
        user_context = state.get("user_context", {})

        dossier_task = generate_dossier(
            user_resume_text=user_context.get("raw_resume_text", ""),
            job_desc=job.get("description", ""),
            job_skills=job.get("skills", []),
            user_goal=user_context.get("ultimate_goal", ""),
        )
        prep_task = generate_interview_prep(
            user_skills=user_context.get("skills", []),
            job_skills=job.get("skills", []),
            job_title=job.get("title", ""),
        )

        dossier_result, prep_result = await asyncio.gather(
            dossier_task, prep_task, return_exceptions=True
        )

        if isinstance(dossier_result, Exception):
            logger.error(f"Dossier agent failed: {dossier_result}")
            dossier_result = {
                "ats_score": 0,
                "tailored_diff": [],
                "interview_questions": [],
                "warning": "AI generation failed",
            }
        if isinstance(prep_result, Exception):
            logger.error(f"Prep agent failed: {prep_result}")
            prep_result = {
                "qualification_feedback": "",
                "can_qualify": False,
                "missing_skills": [],
                "study_resources": [],
            }

        return {
            "dossier": {
                "job_id": target_job_id,
                "job_title": job.get("title", ""),
                "job_company": job.get("company", ""),
                "ats_score": dossier_result.get("ats_score", 0),
                "warning": dossier_result.get("warning", ""),
                "tailored_diff": dossier_result.get("tailored_diff", []),
                "interview_questions": dossier_result.get("interview_questions", []),
                "qualification_feedback": prep_result.get("qualification_feedback", ""),
                "can_qualify": prep_result.get("can_qualify", False),
                "missing_skills": prep_result.get("missing_skills", []),
                "study_resources": prep_result.get("study_resources", []),
            }
        }

    except Exception as e:
        logger.error(f"Dossier generation failed: {e}")
        return {"dossier": {"error": str(e)}}


async def prepare_final_response(state: AgentState) -> dict:
    """Aggregate all node outputs into one final_response dict."""
    logger.info("📦 Orchestrator: Preparing final response...")
    return {
        "final_response": {
            "user_context": state.get("user_context"),
            "matched_jobs": state.get("matched_jobs", []),
            "peer_insights": state.get("peer_insights", []),
            "trajectory_scores": state.get("trajectory_scores", {}),
            "dossier": state.get("dossier"),
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
# 3. Build and compile the LangGraph
# ─────────────────────────────────────────────────────────────────────────────

builder = StateGraph(AgentState)

builder.add_node("load_context", load_user_context)
builder.add_node("fetch_jobs", fetch_and_filter_jobs)
builder.add_node("analyze_peers", analyze_peers_and_trajectory)
builder.add_node("generate_dossier", generate_full_dossier)
builder.add_node("prepare_response", prepare_final_response)

builder.set_entry_point("load_context")
builder.add_edge("load_context", "fetch_jobs")
builder.add_edge("fetch_jobs", "analyze_peers")


def should_run_dossier(
    state: AgentState,
) -> Literal["generate_dossier", "prepare_response"]:
    return "generate_dossier" if state.get("target_job_id") else "prepare_response"


builder.add_conditional_edges(
    "analyze_peers",
    should_run_dossier,
    {
        "generate_dossier": "generate_dossier",
        "prepare_response": "prepare_response",
    },
)

builder.add_edge("generate_dossier", "prepare_response")
builder.add_edge("prepare_response", END)

orchestrator = builder.compile()


# ─────────────────────────────────────────────────────────────────────────────
# 4. Public entry-point called by FastAPI routes
# ─────────────────────────────────────────────────────────────────────────────

async def run_pipeline(
    user_id: str,
    search_query: Optional[str] = None,
    job_id: Optional[str] = None,
) -> dict:
    """Single async function that FastAPI routes call to execute the whole pipeline."""
    initial_state: AgentState = {
        "user_id": user_id,
        "search_query": search_query,
        "target_job_id": job_id,
        "user_context": {},
        "matched_jobs": [],
        "peer_insights": [],
        "trajectory_scores": {},
        "dossier": None,
        "final_response": {},
        "error": None,
    }

    try:
        final_state = await orchestrator.ainvoke(initial_state)
        return final_state.get("final_response", {})
    except Exception as e:
        logger.critical(f"Orchestrator pipeline crashed: {e}")
        return {"error": "Pipeline execution failed", "details": str(e)}