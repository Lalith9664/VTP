from groq import Groq
from config import GROQ_API_KEY

groq_client = Groq(api_key=GROQ_API_KEY)

async def evaluate_trajectory(user_goal: str, job_skills: list, job_title: str) -> dict:
    prompt = f"""
    User's Ultimate Career Goal: {user_goal}
    Job Title: {job_title}
    Job Skills: {', '.join(job_skills)}
    
    Rate the trajectory alignment (0-100). If the job skills help the user reach the goal, give 80-100. If unrelated, give 0-30.
    Return JSON: {{"score": int, "reasoning": "why"}}
    """
    completion = groq_client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )
    return eval(completion.choices[0].message.content)