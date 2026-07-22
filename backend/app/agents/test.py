import asyncio
from tailor_agent import generate_dossier

async def test():
    print("🚀 Testing Agent 7 (Resume Tailor)...")
    
    result = await generate_dossier(
        user_resume_text="Built a college library system using Python and SQLite. Created a basic frontend with HTML.",
        job_desc="Looking for a backend engineer with FastAPI, PostgreSQL, and Docker experience to build scalable microservices.",
        job_skills=["FastAPI", "PostgreSQL", "Docker", "Microservices"],
        user_goal="Senior Backend Engineer at a FAANG company"
    )
    
    print(f"\n📊 ATS Score: {result['ats_score']}%")
    print(f"⚠️ Warning: {result['warning']}")
    print("\n📝 Tailored Bullets:")
    for diff in result['tailored_diff']:
        print(f"  - Original: {diff['original']}")
        print(f"  - Tailored: {diff['tailored']}")
        print(f"  - Reason: {diff['reason']}\n")
        
    print("🎤 Interview Questions:")
    for q in result['interview_questions']:
        print(f"  - {q}")

if __name__ == "__main__":
    asyncio.run(test())