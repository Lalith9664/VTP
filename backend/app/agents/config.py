# backend/app/agents/config.py
# Thin re-export shim — agents import from here but the real
# values live in the centralised app.config module.
from app.config import (
    GROQ_API_KEY,
    HF_API_KEY,
    SUPABASE_URL,
    SUPABASE_SECRET_KEY as SUPABASE_KEY,
    SUPABASE_SERVICE_ROLE_KEY,
)

# Adzuna keys (only needed by scraper_agent)
import os
ADZUNA_APP_ID  = os.getenv("ADZUNA_APP_ID", "")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY", "")
RAPIDAPI_KEY   = os.getenv("RAPIDAPI_KEY", "")
