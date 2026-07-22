import asyncio
import logging
from typing import TypedDict, List, Dict, Any, Literal, Optional
from langgraph.graph import StateGraph, END
from supabase import create_client, Client

# Import agents
from .context_agent import build_user_context
from .trajectory_agent import evaluate_trajectory
from .peer_agent import get_peer_recommendations
from .tailor_agent import generate_dossier
from .mock_interview_agent import generate_interview_prep
from .embeddings import get_embedding
from .config import SUPABASE_URL, SUPABASE_KEY

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 1. Define the State (Memory of the workflow)
class AgentState(TypedDict):
    user_id: str
    search_query: Optional[str]
    target_job_id: Optional[str]
    
    # Filled by agents
    user_context: dict
    matched_jobs: List[dict]
    peer_insights: List[dict]
    trajectory_scores: dict
    dossier: dict
    final_response: dict
    error: Optional[str]

# ==============================================================================
# 2. Define Node Functions (Strictly Async & Non-Blocking)
# ==============================================================================

async def load_user_context(state: AgentState) -> dict:
    logger.info("🧠 Orchestrator: Loading user context...")
    try:
        context = await build_user_context(state["user_id"])
        return {"user_context": context}
    except Exception as e:
        logger.error(f"Context load failed: {e}")
        # Fallback context to prevent pipeline crash
        return {"user_context": {"skills": [], "ultimate_goal": "Software Engineer", "raw_resume_text": ""}, "error": str(e)}

async def fetch_and_filter_jobs(state: AgentState) -> dict:
    logger.info("🔍 Orchestrator: Fetching and filtering jobs...")
    matched_jobs = []
    
    try:
        if state.get("search_query"):
            query_vec = await get_embedding(state["search_query"])
            # CRITICAL: Wrap sync Supabase RPC in asyncio.to_thread
            result = await asyncio.to_thread(
                supabase.rpc('match_jobs', {
                    'query_embedding': query_vec,
                    'match_threshold': 0.3, # 70% similarity
                    'match_count': 15
                }).execute
            )
            matched_jobs = result.data or []
        else:
            # Dashboard mode
            result = await asyncio.to_thread(
                supabase.table('jobs').select('*').eq('is_scam', False).limit(10).execute
            )
            matched_jobs = result.data or []
    except Exception as e:
        logger.error(f"Job fetch failed: {e}")
        # Fallback mock jobs if DB fails
        matched_jobs = [
            {"id": "mock-1", "title": "Python Developer", "company": "Mock Corp", "skills": ["Python", "FastAPI"], "description": "Mock job"}
        ]

    return {"matched_jobs": matched_jobs}

async def analyze_peers_and_trajectory(state: AgentState) -> dict:
    logger.info("🎯 Orchestrator: Analyzing peers and trajectory in parallel...")
    
    user_context = state.get("user_context", {})
    matched_jobs = state.get("matched_jobs", [])
    
    # 1. Start Agent 6 (Peers)
    peers_task = get_peer_recommendations(
        state["user_id"], 
        user_context.get('skills', [])
    )
    
    # 2. Start Agent 5 (Trajectory) for top 5 jobs CONCURRENTLY
    trajectory_tasks = []
    for job in matched_jobs[:5]:
        trajectory_tasks.append(
            evaluate_trajectory(
                user_context.get('ultimate_goal', ''),
                job.get('skills', []),
                job.get('title', '')
            )
        )
    
    # CRITICAL: Run all tasks concurrently. return_exceptions=True prevents one failure from crashing the node.
    results = await asyncio.gather(peers_task, *trajectory_tasks, return_exceptions=True)
    
    peer_insights = results[0] if not isinstance(results[0], Exception) else []
    
    trajectory_scores = {}
    for i, res in enumerate(results[1:]):
        if i < len(matched_jobs[:5]) and not isinstance(res, Exception):
            trajectory_scores[matched_jobs[i]['id']] = res.get('score', 50)
            
    return {
        "peer_insights": peer_insights,
        "trajectory_scores": trajectory_scores
    }

async def generate_full_dossier(state: AgentState) -> dict:
    target_job_id = state.get("target_job_id")
    if not target_job_id:
        return {"dossier": None}
        
    logger.info(f"📝 Orchestrator: Generating dossier for job {target_job_id}...")
    
    try:
        # Fetch job details (Non-blocking)
        job_res = await asyncio.to_thread(
            supabase.table('jobs').select('*').eq('id', target_job_id).execute
        )
        if not job_res.data:
            return {"dossier": {"error": "Job not found"}}
            
        job = job_res.data[0]
        user_context = state.get("user_context", {})
        
        # Run Agent 7 and Agent 9 in parallel
        dossier_task = generate_dossier(
            user_context.get('raw_resume_text', ''),
            job.get('description', ''),
            job.get('skills', []),
            user_context.get('ultimate_goal', '')
        )
        prep_task = generate_interview_prep(
            user_context.get('skills', []),
            job.get('skills', []),
            job.get('title', '')
        )
        
        dossier_result, prep_result = await asyncio.gather(dossier_task, prep_task, return_exceptions=True)
        
        # Handle potential exceptions from agents gracefully
        if isinstance(dossier_result, Exception):
            dossier_result = {"ats_score": 0, "tailored_diff": [], "interview_questions": [], "warning": "AI generation failed"}
        if isinstance(prep_result, Exception):
            prep_result = {"qualification_feedback": "", "can_qualify": False, "missing_skills": [], "study_resources": []}

        final_dossier = {
            "job_details": job,
            "ats_score": dossier_result.get('ats_score', 0),
            "warning": dossier_result.get('warning', ''),
            "tailored_diff": dossier_result.get('tailored_diff', []),
            "interview_questions": dossier_result.get('interview_questions', []),
            "qualification_feedback": prep_result.get('qualification_feedback', ''),
            "can_qualify": prep_result.get('can_qualify', False),
            "missing_skills": prep_result.get('missing_skills', []),
            "study_resources": prep_result.get('study_resources', [])
        }
        
        return {"dossier": final_dossier}
        
    except Exception as e:
        logger.error(f"Dossier generation failed: {e}")
        return {"dossier": {"error": str(e)}}

async def prepare_final_response(state: AgentState) -> dict:
    logger.info("📦 Orchestrator: Preparing final response...")
    final_response = {
        "user_context": state.get("user_context"),
        "matched_jobs": state.get("matched_jobs", []),
        "peer_insights": state.get("peer_insights", []),
        "trajectory_scores": state.get("trajectory_scores", {}),
        "dossier": state.get("dossier")
    }
    return {"final_response": final_response}

# ==============================================================================
# 3. Build the LangGraph graph definition (no compilation at import time)
# ==============================================================================

_graph_builder = StateGraph(AgentState)

_graph_builder.add_node("load_context", load_user_context)
_graph_builder.add_node("fetch_jobs", fetch_and_filter_jobs)
_graph_builder.add_node("analyze_peers", analyze_peers_and_trajectory)
_graph_builder.add_node("generate_dossier", generate_full_dossier)
_graph_builder.add_node("prepare_response", prepare_final_response)

_graph_builder.set_entry_point("load_context")
_graph_builder.add_edge("load_context", "fetch_jobs")
_graph_builder.add_edge("fetch_jobs", "analyze_peers")

def should_run_dossier(state: AgentState) -> Literal["generate_dossier", "prepare_response"]:
    if state.get("target_job_id"):
        return "generate_dossier"
    return "prepare_response"

_graph_builder.add_conditional_edges(
    "analyze_peers",
    should_run_dossier,
    {
        "generate_dossier": "generate_dossier",
        "prepare_response": "prepare_response"
    }
)

_graph_builder.add_edge("generate_dossier", "prepare_response")
_graph_builder.add_edge("prepare_response", END)

# Lazy-compiled: only built when first endpoint call is made, not at import time
_orchestrator = None

def _get_orchestrator():
    """Compile the LangGraph orchestrator lazily on first use."""
    global _orchestrator
    if _orchestrator is None:
        logger.info("⚙️ Compiling LangGraph orchestrator (first call)...")
        _orchestrator = _graph_builder.compile()
    return _orchestrator


# ==============================================================================
# 4. Main Entry Point for FastAPI Backend
# ==============================================================================

async def run_pipeline(user_id: str, search_query: str = None, job_id: str = None) -> dict:
    """Backend calls this single function to execute the entire multi-agent flow.
    The pipeline graph is compiled lazily on the first call — not at startup.
    """
    initial_state = {
        "user_id": user_id,
        "search_query": search_query,
        "target_job_id": job_id,
        "user_context": {},
        "matched_jobs": [],
        "peer_insights": [],
        "trajectory_scores": {},
        "dossier": None,
        "final_response": {},
        "error": None
    }
    
    try:
        orchestrator = _get_orchestrator()
        final_state = await orchestrator.ainvoke(initial_state)
        return final_state.get("final_response", {})
    except Exception as e:
        logger.critical(f"Orchestrator pipeline crashed: {e}")
        return {"error": "Pipeline execution failed", "details": str(e)}