from fastapi import APIRouter, Depends
from app.models import DashboardResponse
from app.dependencies.auth import get_current_user
from agents.trend_agent import analyze_trends

router = APIRouter()

@router.get("/insights", response_model=DashboardResponse)
async def get_dashboard_insights(current_user: dict = Depends(get_current_user)):
    """
    Fetch market trends, in-demand skills, and peer insights for candidate dashboard.
    """
    trends = await analyze_trends()
    return DashboardResponse(
        trending_skills=trends.get("trending_skills", []),
        peer_insights=trends.get("peer_insights", [])
    )
