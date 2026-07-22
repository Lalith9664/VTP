import os
from dotenv import load_dotenv

# Load environment variables from a .env file if it exists
load_dotenv()

# ---------------------------------------------------------------------------
# Core API keys
# ---------------------------------------------------------------------------
HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
# Additional API credentials for Adzuna (India job search)
ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")

# ---------------------------------------------------------------------------
# Supabase configuration – supports multiple possible environment variable names.
# The order of precedence for each setting is documented below.
# ---------------------------------------------------------------------------
# Primary Supabase URL – fall back to the Next.js public variable if the generic
# SUPABASE_URL is not defined.
SUPABASE_URL = (
    os.getenv("SUPABASE_URL")
    or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
)

# Secret service‑role key – prefer the explicit secret key, then the generic
# service‑role key, then a dummy placeholder for local development.
SUPABASE_KEY = (
    os.getenv("SUPABASE_SECRET_KEY")
    or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# Additional Supabase‑related URLs that may be consumed elsewhere in the code.
# They are loaded for convenience but are not required for the mock client.
SUPABASE_JWKS_URL = os.getenv("SUPABASE_JWKS_URL")
SUPABASE_URLDATABASE_URL = os.getenv("SUPABASE_URLDATABASE_URL")
DIRECT_URL = os.getenv("DIRECT_URL")
