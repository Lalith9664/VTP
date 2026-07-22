import httpx
import json
import logging
import asyncio
from typing import Any
from supabase import create_client
# ---------------------------------------------------------------------------
# Optional LangChain Groq import – fall back to a lightweight mock if missing.
# ---------------------------------------------------------------------------
try:
    from langchain_groq import ChatGroq  # type: ignore
except ImportError:  # pragma: no cover
    class ChatGroq:  # noqa: D401
        """Lightweight mock of the LangChain Groq client.

        Provides an async ``ainvoke`` method that returns a mock JSON response
        compatible with the real ``ChatGroq`` interface.
        """

        def __init__(self, model: str, groq_api_key: str, temperature: float = 0.0, model_kwargs: dict | None = None):
            self.model = model
            self.api_key = groq_api_key
            self.temperature = temperature
            self.model_kwargs = model_kwargs or {}
            logging.getLogger(__name__).info("[LangChain Groq mock] Initialized model %s", model)

        async def ainvoke(self, prompt: str):
            class _Response:
                def __init__(self, content: str):
                    self.content = content
            dummy = {"skills": [], "summary": "Mocked response"}
            return _Response(json.dumps(dummy))

# Ensure the project root is on the Python path when running this file directly
import os, sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from .config import GROQ_API_KEY, ADZUNA_APP_ID, ADZUNA_APP_KEY, SUPABASE_URL, SUPABASE_KEY
from .embeddings import get_embedding

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Initialise external services
# ---------------------------------------------------------------------------
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# LangChain Groq client (or mock if the package is unavailable)
llm = ChatGroq(
    model="llama-3.1-8b-instant",
    groq_api_key=GROQ_API_KEY,
    temperature=0.0,
    model_kwargs={"response_format": {"type": "json_object"}},
)

# ---------------------------------------------------------------------------
# HACKATHON SAFETY NET: Mock Jobs (used when all APIs fail)
# ---------------------------------------------------------------------------
MOCK_JOBS = [
    {"title": "Junior Python Developer", "company": "TechStartup Chennai", "description": "We are looking for a junior python developer with FastAPI and PostgreSQL experience to build backend services in Tamil Nadu."},
    {"title": "Frontend React Intern", "company": "DesignCorp Coimbatore", "description": "Seeking a frontend intern proficient in React, TypeScript, and Tailwind CSS to build user interfaces."},
    {"title": "Data Analyst Fresher", "company": "DataDriven Madurai", "description": "Looking for a data analyst to write SQL queries, build Python pandas pipelines, and create dashboards."},
    {"title": "DevOps Trainee", "company": "CloudNine Chennai", "description": "Trainee needed to manage AWS EC2 instances, write Dockerfiles, and set up CI/CD pipelines using GitHub Actions."},
    {"title": "Machine Learning Intern", "company": "AI Solutions Tamil Nadu", "description": "Internship for ML enthusiasts to work with PyTorch, scikit-learn, and deploy models using FastAPI."},
]

# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def safe_parse_json(llm_response: str) -> dict:
    """Safely parse JSON even if the LLM adds markdown backticks."""
    try:
        clean = (
            llm_response.strip()
            .replace("```json", "")
            .replace("```", "")
        )
        return json.loads(clean)
    except json.JSONDecodeError:
        logger.warning("Failed to parse LLM JSON response. Returning empty payload.")
        return {"skills": [], "summary": "Failed to parse"}

# ---------------------------------------------------------------------------
# DATA SOURCES
# ---------------------------------------------------------------------------
async def fetch_from_adzuna():
    """Primary source – Adzuna India job API.
    Returns a list of dicts with keys: title, company, description.
    """
    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        logger.warning("Adzuna credentials missing – skipping Adzuna.")
        return []
    try:
        url = "https://api.adzuna.com/v1/api/jobs/in/search/1"
        params = {
            "app_id": ADZUNA_APP_ID,
            "app_key": ADZUNA_APP_KEY,
            "results_per_page": 20,
            "what": "aiml engineer",
            "where": "tamil nadu",
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json().get("results", [])
            jobs = []
            for job in data:
                jobs.append({
                    "title": job.get("title", "Unknown Role"),
                    "company": job.get("company", {}).get("display_name", "Unknown Company"),
                    "description": f"{job.get('description', '')} {job.get('contract_time', '')} {job.get('salary_min', '')}",
                })
            return jobs
    except Exception as e:
        logger.warning(f"Adzuna API failed: {e}")
        return []

async def fetch_from_arbeitnow():
    """Backup source – free, no‑key remote job board."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get("https://www.arbeitnow.com/api/job-board-api")
            resp.raise_for_status()
            data = resp.json().get("data", [])
            return [
                {"title": j.get("title"), "company": j.get("company_name"), "description": j.get("description")}
                for j in data[:15]
            ]
    except Exception as e:
        logger.warning(f"Arbeitnow API failed: {e}")
        return []

# ---------------------------------------------------------------------------
# MAIN ORCHESTRATOR
# ---------------------------------------------------------------------------
async def scrape_and_enrich_jobs():
    logger.info("🕵️ Starting job scraping pipeline for Tamil Nadu...")
    # 1️⃣ Fetch jobs – try Adzuna, then Arbeitnow, then mock.
    raw_jobs = await fetch_from_adzuna()
    if not raw_jobs:
        logger.info("Adzuna empty or failed – trying Arbeitnow.")
        raw_jobs = await fetch_from_arbeitnow()
    if not raw_jobs:
        logger.warning("All APIs failed – using mock jobs.")
        raw_jobs = MOCK_JOBS

    logger.info(f"✅ Fetched {len(raw_jobs)} jobs. Beginning LangChain enrichment...")
    saved = 0
    for job in raw_jobs:
        desc = job.get("description", "")
        if not desc or len(desc) < 50:
            continue
        try:
            # 2️⃣ LangChain Groq extraction – strict JSON
            prompt = (
                "Extract a list of technical skills and a one‑sentence summary from the following job description. "
                "Return STRICT JSON only, no markdown: {\"skills\": [\"skill1\", \"skill2\"], \"summary\": \"...\"}.\n"
                f"Job Description: {desc[:3000]}"
            )
            response = await llm.ainvoke(prompt)
            payload = safe_parse_json(response.content)
            skills = payload.get("skills", [])

            # 3️⃣ Embedding
            embedding = await get_embedding(desc[:2000])

            # 4️⃣ Persist to Supabase (mock client works out‑of‑the‑box)
            supabase.table("jobs").insert({
                "title": job.get("title"),
                "company": job.get("company"),
                "description": desc,
                "skills": skills,
                "embedding": embedding,
                "source": "Adzuna_India",
                "is_scam": False,
                "toxic_score": 0,
            }).execute()
            saved += 1
            logger.info(f"✅ Saved: {job.get('title')} at {job.get('company')}")
        except Exception as e:
            logger.error(f"❌ Failed to process {job.get('title')}: {e}")
            continue

    logger.info(f"🎉 Pipeline complete – saved {saved} jobs to Supabase.")
    return {"status": "success", "scraped_count": saved}

async def scrape_jobs(query: str = "Software Engineer", location: str = "India"):
    """
    Backwards compatibility wrapper mapping to the main scrape_and_enrich_jobs pipeline.
    """
    res = await scrape_and_enrich_jobs()
    scraped_count = res.get("scraped_count", 0)
    return [None] * scraped_count

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    asyncio.run(scrape_and_enrich_jobs())
