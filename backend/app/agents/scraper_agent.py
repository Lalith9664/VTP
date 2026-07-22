"""
backend/app/agents/scraper_agent.py
Agent 3 – Job Scraper & Enrichment Agent.

Sources: Adzuna India (primary) → Arbeitnow (backup) → mock jobs (ultimate fallback).
Enriches each job with LLM-extracted skills and a pgvector embedding,
then upserts to Supabase.
"""

import httpx
import json
import logging
import asyncio
from typing import List, Dict, Any

# Optional LangChain Groq – graceful fallback to lightweight mock if missing
try:
    from langchain_groq import ChatGroq  # type: ignore
except ImportError:
    class ChatGroq:  # noqa: D401
        def __init__(self, model, groq_api_key, temperature=0.0, model_kwargs=None):
            self.model = model
            self.api_key = groq_api_key
            logging.getLogger(__name__).info("[mock ChatGroq] model=%s", model)

        async def ainvoke(self, prompt: str):
            class _Resp:
                content = json.dumps({"skills": [], "summary": "Mock response"})
            return _Resp()

from app.database import supabase                       # ← centralised
from app.agents.config import GROQ_API_KEY, ADZUNA_APP_ID, ADZUNA_APP_KEY
from app.agents.embeddings import get_embedding

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    groq_api_key=GROQ_API_KEY,
    temperature=0.0,
    model_kwargs={"response_format": {"type": "json_object"}},
)

MOCK_JOBS: List[Dict[str, Any]] = [
    {"title": "Junior Python Developer", "company": "TechStartup Chennai",
     "description": "FastAPI, PostgreSQL, REST APIs – build backend services."},
    {"title": "Frontend React Intern", "company": "DesignCorp Coimbatore",
     "description": "React, TypeScript, Tailwind CSS – build responsive UIs."},
    {"title": "Data Analyst Fresher", "company": "DataDriven Madurai",
     "description": "SQL, Python, pandas, dashboard creation."},
    {"title": "DevOps Trainee", "company": "CloudNine Chennai",
     "description": "AWS EC2, Docker, GitHub Actions CI/CD."},
    {"title": "ML Intern", "company": "AI Solutions Tamil Nadu",
     "description": "PyTorch, scikit-learn, FastAPI model deployment."},
]


def _safe_parse_json(raw: str) -> dict:
    try:
        clean = raw.strip().replace("```json", "").replace("```", "")
        return json.loads(clean)
    except json.JSONDecodeError:
        return {"skills": [], "summary": "parse failed"}


async def _fetch_adzuna() -> List[Dict]:
    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        logger.warning("Adzuna credentials missing – skipping.")
        return []
    try:
        url = "https://api.adzuna.com/v1/api/jobs/in/search/1"
        params = {
            "app_id": ADZUNA_APP_ID,
            "app_key": ADZUNA_APP_KEY,
            "results_per_page": 20,
            "what": "software engineer",
            "where": "india",
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            return [
                {
                    "title": j.get("title", "Unknown Role"),
                    "company": j.get("company", {}).get("display_name", "Unknown Co"),
                    "description": j.get("description", ""),
                }
                for j in resp.json().get("results", [])
            ]
    except Exception as e:
        logger.warning(f"Adzuna failed: {e}")
        return []


async def _fetch_arbeitnow() -> List[Dict]:
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get("https://www.arbeitnow.com/api/job-board-api")
            resp.raise_for_status()
            return [
                {
                    "title": j.get("title"),
                    "company": j.get("company_name"),
                    "description": j.get("description"),
                }
                for j in resp.json().get("data", [])[:15]
            ]
    except Exception as e:
        logger.warning(f"Arbeitnow failed: {e}")
        return []


async def scrape_jobs(query: str = "Software Engineer", location: str = "India") -> List[Dict]:
    """
    Public interface called by admin.py midnight-refresh endpoint.
    Returns the list of enriched job dicts that were saved.
    """
    logger.info("🕵️  Starting job scraping pipeline...")

    raw_jobs = await _fetch_adzuna()
    if not raw_jobs:
        raw_jobs = await _fetch_arbeitnow()
    if not raw_jobs:
        logger.warning("All APIs failed – using mock jobs.")
        raw_jobs = MOCK_JOBS

    logger.info(f"Fetched {len(raw_jobs)} raw jobs. Enriching with LLM...")
    enriched: List[Dict] = []

    for job in raw_jobs:
        desc = job.get("description", "")
        if not desc or len(desc) < 50:
            continue
        try:
            prompt = (
                "Extract a list of technical skills and a one-sentence summary "
                "from the following job description. Return STRICT JSON only: "
                '{"skills": ["skill1", "skill2"], "summary": "..."}.\n'
                f"Job Description: {desc[:3000]}"
            )
            llm_resp = await llm.ainvoke(prompt)
            payload = _safe_parse_json(llm_resp.content)
            skills = payload.get("skills", [])

            embedding = await get_embedding(desc[:2000])

            job_record = {
                "title": job.get("title", ""),
                "company": job.get("company", ""),
                "description": desc,
                "skills": skills,
                "embedding": embedding,
                "source": "scraper_agent",
                "is_scam": False,
                "toxic_score": 0,
            }

            await asyncio.to_thread(
                supabase.table("jobs").insert(job_record).execute
            )
            enriched.append(job_record)
            logger.info(f"✅ Saved: {job.get('title')} @ {job.get('company')}")

        except Exception as e:
            logger.error(f"Failed to process {job.get('title')}: {e}")

    logger.info(f"🎉 Pipeline complete – {len(enriched)} jobs saved.")
    return enriched
