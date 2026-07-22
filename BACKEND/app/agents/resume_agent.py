import logging
from groq import AsyncGroq
from .config import GROQ_API_KEY

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async_groq_client = AsyncGroq(api_key=GROQ_API_KEY)

async def generate_base_resume(
    goal: str,
    education: str,
    location: str,
    skills: list
) -> str:
    """
    Synthesize a foundational, ATS-friendly base resume text matching the user's
    target career goal, education details, location, and key skills.
    Uses Groq LLM to generate high-quality bullet points and summary.
    """
    logger.info(f"📝 Resume Agent: Synthesizing base resume for target: {goal}")

    skills_str = ", ".join(skills) if skills else "General Software Development"

    prompt = f"""
    You are an expert ATS (Applicant Tracking System) Resume Writer and Career Coach.
    Generate a high-quality, clean, professional base resume layout matching the candidate profile below:
    - Career Goal: {goal}
    - Education: {education}
    - Location: {location}
    - Skills: {skills_str}

    Provide the resume in a clean text format with sections for:
    1. Professional Summary (Action-oriented, highlighting the target goal)
    2. Key Skills (Structured bullet list)
    3. Education (Details provided)
    4. Projects & Professional Experience (Generate 2 highly relevant project descriptions matching the skills and target goal. Each project should have 3 bullet points using the Google X-Y-Z formula: "Accomplished [X] as measured by [Y], by doing [Z]")

    Do not include any greeting or conversational filler. Start directly with the resume text.
    """

    try:
        response = await async_groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a professional resume parser and writer."},
                {"role": "user", "content": prompt}
            ],
            model="llama3-8b-8192",
            temperature=0.3,
            max_tokens=1500
        )
        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from Groq API")
        return content

    except Exception as e:
        logger.error(f"Failed to generate base resume using Groq: {e}")
        # Return a robust fallback mock base resume if API fails
        fallback_skills = "\n- ".join(skills) if skills else "- Software Engineering\n- Problem Solving"
        return f"""
PROFESSIONAL SUMMARY
Motivated and detail-oriented technical candidate seeking to excel as a {goal}. Equipped with foundational knowledge in {education} and hands-on skill alignment across core frameworks. Committed to applying clean code practices and agile architectures in a collaborative development team in {location}.

CORE SKILLS
- {fallback_skills}
- Git Version Control & Teamwork
- Software Development Life Cycle (SDLC)

EDUCATION
{education}
Location: {location}

PROJECTS
Project A: Developer Alignment System
- Designed and built a modular application stack incorporating {skills_str} to automate data pipelines.
- Integrated automated fetch routing queries which improved API query responsiveness by 25%.
- Verified structural types and resolved package conflicts, achieving 100% compilation safety.

Project B: Open-Source Automation Pipelines
- Built script tools to automate directory setup, file copying, and relative path configurations.
- Implemented error boundaries and cached network fallbacks, reducing runtime connection timeouts.
- Structured code base models following layered MVC conventions to ensure future scalability.
"""
