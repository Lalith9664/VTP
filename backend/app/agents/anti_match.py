from groq import Groq
from config import GROQ_API_KEY

groq_client = Groq(api_key=GROQ_API_KEY)

async def scan_job_for_toxicity(job_description: str) -> dict:
    """Use Llama-3 to detect scams or toxic culture"""
    prompt = f"""Analyze this job description. Return JSON with:
    - is_scam (boolean): True if asking for money, unrealistic salary, or vague.
    - toxic_score (int): 0-100. 100 = extremely toxic culture keywords.
    - reason: Short explanation.
    
    Job: {job_description[:3000]}
    """
    completion = groq_client.chat.completions.create(
        model="llama-3.1-70b-versatile",  # Heavy reasoning for safety
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )
    return eval(completion.choices[0].message.content)