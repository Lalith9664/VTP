from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import user, jobs, dashboard, resume, admin, auth

app = FastAPI(
    title="AI Job Automation System & Co-Pilot",
    description="Production-ready FastAPI backend with Supabase, pgvector search, and LLM Multi-Agent system.",
    version="1.0.0"
)

# Configure CORS Middleware
# Note for Production: Restrict allow_origins to specified domain origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs & Dossiers"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(resume.router, prefix="/api/resume", tags=["Resume & PDF"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin Maintenance"])

@app.get("/", tags=["Health Check"])
def health_check():
    return {
        "status": "healthy",
        "service": "AI Job Automation Backend",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
