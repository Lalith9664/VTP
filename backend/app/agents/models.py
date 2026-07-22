from pydantic import BaseModel, Field
from typing import List

# ==============================================================================
# AGENT 7: TAILOR AGENT SCHEMAS (The Crown Jewel)
# ==============================================================================

class BulletDiff(BaseModel):
    """Represents a single resume bullet point before and after AI tailoring."""
    original: str = Field(..., description="The exact original bullet point from the user's resume.")
    tailored: str = Field(..., description="The rewritten bullet point optimized for the target job's keywords.")
    reason: str = Field(..., description="A brief explanation of why this change improves ATS matching (e.g., 'Added keyword: Kubernetes').")

class DossierOutput(BaseModel):
    """The complete intelligence dossier generated for a specific job application."""
    ats_score: int = Field(..., ge=0, le=100, description="Applicant Tracking System match score from 0 to 100.")
    warning: str = Field(..., description="A short warning about missing critical skills, or 'Great match!' if none.")
    diff: List[BulletDiff] = Field(..., description="A list of exactly 2 rewritten resume bullet points.")
    interview_questions: List[str] = Field(..., min_length=3, max_length=5, description="3 to 5 highly probable technical interview questions for this specific role.")

# ==============================================================================
# AGENT 5: TRAJECTORY AGENT SCHEMAS
# ==============================================================================

class TrajectoryReport(BaseModel):
    """Evaluates if a job aligns with the user's long-term career goals."""
    score: int = Field(..., ge=0, le=100, description="Trajectory alignment score from 0 to 100.")
    reasoning: str = Field(..., description="A concise explanation of how this job builds skills for the user's ultimate goal.")

# ==============================================================================
# AGENT 9: MOCK INTERVIEW AGENT SCHEMAS
# ==============================================================================

class PrepOutput(BaseModel):
    """Qualification analysis and interview preparation guide."""
    qualification_feedback: str = Field(..., description="Encouraging but honest feedback on the user's current readiness.")
    can_qualify: bool = Field(..., description="True if the user has >= 60% of the required skills, False otherwise.")
    missing_skills: List[str] = Field(..., description="List of specific skills the user lacks for this role.")
    questions: List[str] = Field(..., min_length=3, max_length=5, description="Technical interview questions targeting the missing or required skills.")
    study_resources: List[str] = Field(..., description="Actionable, specific topics or project ideas to study to bridge the skill gap.")
