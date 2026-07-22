from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
import asyncio
import math
from app.database import supabase
from app.utils.embeddings import get_embedding
from app.models import JobMatch, DossierResponse, JobSearchQuery
from app.dependencies.auth import get_current_user
from agents.tailor_agent import generate_dossier
from agents.mock_interview_agent import generate_interview_prep

router = APIRouter()

def _cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    return dot / (norm1 * norm2) if norm1 and norm2 else 0.0

@router.get("/search", response_model=List[JobMatch])
@router.post("/search", response_model=List[JobMatch])
async def search_jobs(
    query: Optional[str] = Query(None, description="Search query string"),
    body_query: Optional[JobSearchQuery] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    PRIORITY ENDPOINT: Vector search jobs using 384-dimension pgvector embeddings with RPC & fallback logic.
    """
    search_term = query or (body_query.query if body_query else "Software Engineer")
    top_k = body_query.top_k if body_query else 10

    # Generate vector embedding for search term
    query_embedding = await get_embedding(search_term)

    matches = []

    if supabase:
        try:
            # 1. Attempt pgvector RPC search in Supabase
            rpc_res = supabase.rpc(
                'match_jobs',
                {
                    'query_embedding': query_embedding,
                    'match_threshold': 0.1,
                    'match_count': top_k
                }
            ).execute()

            if rpc_res.data:
                for row in rpc_res.data:
                    matches.append(JobMatch(
                        id=str(row.get("id")),
                        title=row.get("title", "Software Engineer"),
                        company=row.get("company", "Tech Corp"),
                        location=row.get("location", "Remote"),
                        description=row.get("description", ""),
                        skills=row.get("skills", []),
                        similarity_score=float(row.get("similarity", row.get("similarity_score", 0.85))),
                        salary_range=row.get("salary_range")
                    ))
                return matches
        except Exception:
            pass  # Fall through to standard select query if RPC is missing

        # 2. Query fallback: fetch jobs table
        try:
            jobs_res = supabase.table('jobs').select('*').limit(50).execute()
            if jobs_res.data:
                for job in jobs_res.data:
                    job_emb = job.get("embedding") or job.get("job_embedding")
                    score = _cosine_similarity(query_embedding, job_emb) if job_emb else 0.75
                    matches.append(JobMatch(
                        id=str(job.get("id")),
                        title=job.get("title", "Software Engineer"),
                        company=job.get("company", "Tech Corp"),
                        location=job.get("location", "Remote"),
                        description=job.get("description", ""),
                        skills=job.get("skills", []),
                        similarity_score=round(score, 4),
                        salary_range=job.get("salary_range")
                    ))

                # Sort by similarity score descending
                matches.sort(key=lambda x: x.similarity_score, reverse=True)
                return matches[:top_k]
        except Exception:
            pass

    # 3. Fallback mock job response for local development
    return [
        JobMatch(
            id="job-101",
            title="Senior FastAPI Backend Developer",
            company="Supabase AI Labs",
            location="Remote",
            description="Build async Python backend services, pgvector search pipelines, and multi-agent systems.",
            skills=["Python", "FastAPI", "Supabase", "pgvector", "AsyncIO"],
            similarity_score=0.92,
            salary_range="$140,000 - $170,000 USD"
        ),
        JobMatch(
            id="job-102",
            title="AI Solutions Architect",
            company="Groq Innovations",
            location="San Francisco, CA",
            description="Architect low-latency LLM applications utilizing Groq acceleration and vector databases.",
            skills=["Python", "Groq", "PostgreSQL", "Docker", "REST APIs"],
            similarity_score=0.87,
            salary_range="$160,000 - $190,000 USD"
        )
    ]

@router.get("/{job_id}/dossier", response_model=DossierResponse)
async def get_job_dossier(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    PRIORITY ENDPOINT: Return comprehensive dossier for job application.
    Checks Supabase cache first; on cache miss, executes tailor_agent and mock_interview_agent in parallel via asyncio.gather.
    """
    user_id = current_user["id"]

    # 1. Check Supabase Cache
    if supabase:
        try:
            cached = supabase.table('tailored_resumes')\
                .select('*')\
                .eq('user_id', user_id)\
                .eq('job_id', job_id)\
                .execute()

            if cached.data:
                item = cached.data[0]
                return DossierResponse(
                    job_id=job_id,
                    user_id=user_id,
                    tailored_bullets=item.get("tailored_bullets", []),
                    ats_score=float(item.get("ats_score", 85.0)),
                    interview_questions=item.get("interview_questions", []),
                    skill_gaps=item.get("skill_gaps", []),
                    match_explanation=item.get("match_explanation", "Cached tailor dossier result.")
                )
        except Exception:
            pass

    # 2. Fetch User & Job Details
    user_resume_text = "Experienced Backend Engineer skilled in Python, FastAPI, SQL, and API integration."
    user_skills = ["Python", "FastAPI", "PostgreSQL"]
    job_desc = "Seeking experienced Python engineer with expertise in FastAPI, Supabase, and pgvector."
    job_skills = ["FastAPI", "Supabase", "pgvector", "Docker"]
    job_title = "Backend Engineer"

    if supabase:
        try:
            u_res = supabase.table('profiles').select('raw_resume_text, skills').eq('id', user_id).execute()
            if u_res.data:
                user_resume_text = u_res.data[0].get("raw_resume_text") or user_resume_text
                user_skills = u_res.data[0].get("skills") or user_skills

            j_res = supabase.table('jobs').select('*').eq('id', job_id).execute()
            if j_res.data:
                job_desc = j_res.data[0].get("description") or job_desc
                job_skills = j_res.data[0].get("skills") or job_skills
                job_title = j_res.data[0].get("title") or job_title
        except Exception:
            pass

    # 3. Parallel Agent Execution via asyncio.gather
    dossier_task = generate_dossier(resume_text=user_resume_text, job_desc=job_desc, job_skills=job_skills)
    interview_task = generate_interview_prep(user_skills=user_skills, job_skills=job_skills, job_title=job_title)

    dossier_result, interview_result = await asyncio.gather(dossier_task, interview_task)

    combined_questions = dossier_result.get("interview_questions", []) + interview_result.get("questions", [])

    dossier_response = DossierResponse(
        job_id=job_id,
        user_id=user_id,
        tailored_bullets=dossier_result.get("tailored_bullets", []),
        ats_score=float(dossier_result.get("ats_score", 88.0)),
        interview_questions=combined_questions[:5],
        skill_gaps=dossier_result.get("skill_gaps", []),
        match_explanation=dossier_result.get("match_explanation", "High match based on skill alignment.")
    )

    # 4. Cache in Supabase
    if supabase:
        try:
            supabase.table('tailored_resumes').insert({
                'user_id': user_id,
                'job_id': job_id,
                'tailored_bullets': dossier_response.tailored_bullets,
                'ats_score': dossier_response.ats_score,
                'interview_questions': dossier_response.interview_questions,
                'skill_gaps': dossier_response.skill_gaps,
                'match_explanation': dossier_response.match_explanation
            }).execute()
        except Exception:
            pass

    return dossier_response
