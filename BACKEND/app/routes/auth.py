from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.database import supabase

router = APIRouter()

# --- Pydantic Models for Request/Response ---
class AuthRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    status: str
    user_id: str
    access_token: str
    message: str

# --- 1. REGISTER ENDPOINT ---
@router.post("/register", response_model=AuthResponse)
async def register_user(request: AuthRequest):
    """
    Registers a new user using Supabase Auth (Email/Password).
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not initialized")

    try:
        # Call Supabase Auth to create the user
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password
        })
        
        if not response.user:
            raise HTTPException(status_code=400, detail="User already exists or invalid credentials")

        # If "Confirm Email" is OFF in Supabase, the session is created immediately.
        # If it's ON, you would need to return a message saying "Check your email".
        access_token = response.session.access_token if response.session else ""

        # Create a default profile record for the new user ID
        try:
            supabase.table("profiles").upsert({
                "id": response.user.id,
                "email": request.email,
                "ultimate_goal": "Software Engineer",
                "skills": [],
                "raw_resume_text": "",
                "location": "Remote",
                "education": "B.Tech in Computer Science"
            }).execute()
        except Exception as pe:
            # Log warning but do not crash registration
            print(f"Profile creation warning: {pe}")

        return AuthResponse(
            status="success",
            user_id=response.user.id,
            access_token=access_token,
            message="User registered successfully."
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

# --- 2. LOGIN ENDPOINT ---
@router.post("/login", response_model=AuthResponse)
async def login_user(request: AuthRequest):
    """
    Logs in an existing user and returns a JWT access token.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not initialized")

    try:
        # Call Supabase Auth to verify credentials
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })

        if not response.user or not response.session:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        return AuthResponse(
            status="success",
            user_id=response.user.id,
            access_token=response.session.access_token,
            message="Login successful."
        )

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Login failed: {str(e)}")
