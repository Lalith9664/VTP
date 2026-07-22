from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class UserProfileUpdate(BaseModel):
    ultimate_goal: Optional[str] = None
    education: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[List[str]] = Field(default_factory=list)
    permission_to_generate_resume: bool = False

class BaseResumeGenerationRequest(BaseModel):
    permission_to_generate_resume: bool = True
    ultimate_goal: Optional[str] = None
    education: Optional[str] = None
    location: Optional[str] = None
    skills: List[str] = Field(default_factory=list)

class UserProfileResponse(BaseModel):
    id: str
    email: Optional[str] = None
    raw_resume_text: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    ultimate_goal: Optional[str] = None
    education: Optional[str] = None
    location: Optional[str] = None
    permission_to_generate_resume: bool = False
    has_resume: bool = False

class JobSearchQuery(BaseModel):
    query: str
    top_k: int = 10
    match_threshold: float = 0.5

class JobMatch(BaseModel):
    id: str
    title: str
    company: str
    location: str
    description: str
    skills: List[str] = Field(default_factory=list)
    similarity_score: float = 0.0
    salary_range: Optional[str] = None

class DossierResponse(BaseModel):
    job_id: str
    user_id: str
    tailored_bullets: List[str] = Field(default_factory=list)
    ats_score: float = 0.0
    interview_questions: List[str] = Field(default_factory=list)
    skill_gaps: List[str] = Field(default_factory=list)
    match_explanation: str = ""

class InterviewPrepResponse(BaseModel):
    job_title: str
    questions: List[str] = Field(default_factory=list)
    star_tips: List[str] = Field(default_factory=list)

class DashboardResponse(BaseModel):
    trending_skills: List[str] = Field(default_factory=list)
    peer_insights: List[Dict[str, Any]] = Field(default_factory=list)

class MidnightRefreshResponse(BaseModel):
    status: str
    jobs_cleared: int
    scraped_count: int
