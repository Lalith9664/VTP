from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_PUBLISHABLE_KEY

supabase_key = SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY or SUPABASE_PUBLISHABLE_KEY

if SUPABASE_URL and supabase_key:
    supabase: Client = create_client(SUPABASE_URL, supabase_key)
else:
    # Fallback placeholder for initialization if environment variables are not yet loaded
    supabase: Client = None  # type: ignore

