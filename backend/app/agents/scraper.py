import httpx
from groq import Groq
from config import GROQ_API_KEY, RAPIDAPI_KEY
from utils.embeddings import get_embedding
from database import supabase

groq_client = Groq(api_key=GROQ_API_KEY)

async def scrape_and_enrich_jobs():
    """Fetch jobs, parse with Groq-8B, embed, save to Supabase"""
    
    # 1. Fetch raw jobs from JSearch
    async with httpx.AsyncClient() as client:
        jsearch_res = await client.get(
            "https://jsearch.p.rapidapi.com/search",
            headers={"X-RapidAPI-Key": RAPIDAPI_KEY},
            params={"query": "Software Engineer fresher in India", "num_pages": 1}
        )
        raw_jobs = jsearch_res.json().get('data', [])
    
    for job in raw_jobs[:30]:  # Limit to 30 for speed
        raw_desc = job.get('job_description', '')
        if not raw_desc:
            continue
            
        # 2. LLM Extraction: Parse raw HTML into structured JSON
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",  # Fast, free model
            messages=[
                {"role": "system", "content": "Extract skills (list) and a concise summary from this job description. Return JSON: {\"skills\": [...], \"summary\": \"...\"}"},
                {"role": "user", "content": raw_desc[:4000]}  # Limit tokens
            ],
            response_format={"type": "json_object"}
        )
        parsed = eval(completion.choices[0].message.content)  # Convert to dict
        
        # 3. Generate Embedding
        embedding = await get_embedding(raw_desc[:2000])
        
        # 4. Save to Supabase
        supabase.table('jobs').insert({
            'title': job.get('job_title'),
            'company': job.get('employer_name'),
            'description': raw_desc,
            'skills': parsed.get('skills', []),
            'embedding': embedding,
            'source': 'JSearch'
        }).execute()
        
    return {"status": "success", "scraped_count": len(raw_jobs)}

