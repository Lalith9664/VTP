import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_PUBLISHABLE_KEY: str = os.getenv("SUPABASE_PUBLISHABLE_KEY", os.getenv("SUPABASE_ANON_KEY", ""))
    SUPABASE_SECRET_KEY: str = os.getenv("SUPABASE_SECRET_KEY", os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""))
    SUPABASE_JWKS_URL: str = os.getenv("SUPABASE_JWKS_URL", "")
    
    # Backward compatibility aliases
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", os.getenv("SUPABASE_PUBLISHABLE_KEY", ""))
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_SECRET_KEY", ""))
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    DIRECT_URL: str = os.getenv("DIRECT_URL", "")
    SUPABASE_BUCKET: str = os.getenv("SUPABASE_BUCKET", "resumes")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    HF_API_KEY: str = os.getenv("HF_API_KEY", os.getenv("HUGGINGFACE_API_KEY", ""))

    # Validation to ensure critical vars are present when required
    def validate_supabase(self):
        if not self.SUPABASE_URL or not (self.SUPABASE_SECRET_KEY or self.SUPABASE_SERVICE_ROLE_KEY or self.SUPABASE_PUBLISHABLE_KEY):
            raise ValueError("Missing Supabase environment variables. Check your .env file.")

settings = Settings()

# Convenience exports for direct module imports
SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY = settings.SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY = settings.SUPABASE_SECRET_KEY
SUPABASE_JWKS_URL = settings.SUPABASE_JWKS_URL
SUPABASE_ANON_KEY = settings.SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY = settings.SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL = settings.DATABASE_URL
DIRECT_URL = settings.DIRECT_URL
SUPABASE_BUCKET = settings.SUPABASE_BUCKET
GROQ_API_KEY = settings.GROQ_API_KEY
HF_API_KEY = settings.HF_API_KEY
