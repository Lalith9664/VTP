import logging
from typing import List
from groq import AsyncGroq
import instructor
from pydantic import BaseModel, Field
from config import GROQ_API_KEY

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Async Groq with Instructor for strict JSON
async_groq_client = AsyncGroq(api_key=GROQ_API_KEY)
client = instructor.from_groq(async_groq_client)

# ==============================================================================
# 1. STRICT PYDANTIC SCHEMA
# ==============================================================================
class TrajectoryReport(BaseModel):
    score: int = Field(ge=0, le=100, description="Trajectory alignment score from 0 to 100.")
    reasoning: str = Field(description="Concise explanation of how this job builds skills for the user's ultimate goal.")

# ==============================================================================
# 2. AGENT 5: THE GOAL & TRAJECTORY VALIDATOR
# ==============================================================================
async def evaluate_trajectory(user_goal: str, job_skills: List[str], job_title: str) -> dict:
    """
    Agent 5: Evaluates if a job moves the user toward their long-term career goal.
    Uses the fast 8B model for semantic understanding (e.g., knows PyTorch = ML).
    """
    logger.info(f"🎯 Agent 5: Evaluating trajectory for '{job_title}' against goal: '{user_goal}'")
    
    try:
        prompt = f"""
        You are an expert Career Strategist. 
        
        User's Ultimate Long-Term Goal: "{user_goal}"
        Current Job Opportunity: "{job_title}"
        Required Skills for this Job: {', '.join(job_skills) if job_skills else 'None specified'}
        
        TASK:
        Evaluate how well this specific job and its required skills will help the user reach their ultimate goal.
        - Score 80-100: Directly builds critical skills for the goal (e.g., Goal is ML, Job requires PyTorch).
        - Score 50-79: Builds adjacent, foundational, or transferable skills.
        - Score 0-49: Unrelated or a step backward from the goal.
        
        Return STRICT JSON with the integer score and a 1-sentence reasoning.
        """
        
        # CRITICAL OPTIMIZATION: Using 8B model for fast, cheap semantic classification
        response = await client.chat.completions.create(
            model="llama-3.1-8b-instant", 
            messages=[
                {"role": "system", "content": "You are a strict JSON generator. Output ONLY valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_model=TrajectoryReport,
            max_retries=2
        )
        
        logger.info(f"✅ Agent 5: Trajectory Score = {response.score}")
        
        return {
            "score": response.score,
            "reasoning": response.reasoning
        }

    except Exception as e:
        logger.warning(f"❌ Agent 5 LLM failed ({e}). Falling back to rule-based logic.")
        # ==============================================================================
        # HACKATHON SAFETY NET: Robust Rule-Based Fallback
        # ==============================================================================
        return _rule_based_fallback(user_goal, job_skills, job_title)

def _rule_based_fallback(user_goal: str, job_skills: List[str], job_title: str) -> dict:
    """Fallback logic if Groq is rate-limited or offline."""
    score = 50
    reasoning = f"This {job_title} role has some relevant skills."
    
    goal_lower = user_goal.lower()
    skills_lower = [s.lower() for s in job_skills] if job_skills else []
    
    # ML / Data Science
    if any(g in goal_lower for g in ['machine learning', 'data science', 'ai', 'ml']):
        if any(s in skills_lower for s in ['python', 'sql', 'data', 'pandas', 'pytorch', 'tensorflow', 'scikit']):
            score = 85
            reasoning = "This role builds the data/ML skills you need."
            
    # DevOps / Cloud
    elif any(g in goal_lower for g in ['devops', 'cloud', 'infrastructure', 'sre']):
        if any(s in skills_lower for s in ['docker', 'kubernetes', 'aws', 'ci/cd', 'terraform', 'jenkins']):
            score = 88
            reasoning = "This role builds the cloud infrastructure skills you need."
            
    # Frontend / Full Stack
    elif any(g in goal_lower for g in ['frontend', 'full stack', 'react', 'ui/ux']):
        if any(s in skills_lower for s in ['react', 'angular', 'vue', 'javascript', 'typescript', 'css', 'html']):
            score = 82
            reasoning = "This role builds the frontend UI skills you need."
            
    # Backend
    elif any(g in goal_lower for g in ['backend', 'api', 'server']):
        if any(s in skills_lower for s in ['node', 'python', 'java', 'go', 'sql', 'postgres', 'docker']):
            score = 80
            reasoning = "This role builds the backend architecture skills you need."

    return {"score": score, "reasoning": reasoning}


# Ensure models can be imported dynamically
try:
    from models import RequiredSkillItem, LearningRoadmapItem, WeeklyPlanItem, SkillRoadmapOutput
except ImportError:
    from app.agents.models import RequiredSkillItem, LearningRoadmapItem, WeeklyPlanItem, SkillRoadmapOutput

async def generate_skill_roadmap(target_skill: str, user_skills: List[str]) -> dict:
    """
    Agent 5 standalone tool: Generates a complete learning roadmap for a target skill,
    tailored to the user's current skills.
    """
    logger.info(f"🎯 Agent 5: Generating skill mastery roadmap for '{target_skill}'")
    try:
        prompt = f"""
        You are an expert technical Career Strategist.
        
        Target Technology/Skill to Master: "{target_skill}"
        User's Current Core Skills: {', '.join(user_skills) if user_skills else 'None specified'}
        
        TASK:
        Generate a customized, comprehensive study plan to master the target skill.
        Compare the target skill requirements against the user's current core skills.
        
        Return a strict JSON output matching the following structure:
        - estimatedTime: Overall timeframe needed (e.g. '6 Weeks (Approx. 90 Hours)').
        - requiredSkills: List of 4-5 required core skills/concepts to master, with estimated progress (0-100) based on their current skills (if they already know a prerequisite, progress should be higher).
        - learningRoadmap: 3-4 key learning milestones/phases with detailed descriptions and durations.
        - weeklyPlan: A 4-week weekly breakdown showing the week title and exactly 3 concrete tasks/projects to complete.
        """
        
        response = await client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a strict JSON generator. Output ONLY valid JSON matching the requested schema."},
                {"role": "user", "content": prompt}
            ],
            response_model=SkillRoadmapOutput,
            max_retries=2
        )
        
        logger.info(f"✅ Agent 5: Generated skill roadmap for '{target_skill}'")
        return response.dict()
        
    except Exception as e:
        logger.warning(f"❌ Agent 5 LLM roadmap generation failed ({e}). Falling back to baseline frontend-like rules.")
        # Rule-based fallback to guarantee output shape
        return _rule_based_roadmap_fallback(target_skill, user_skills)

def _rule_based_roadmap_fallback(target_skill: str, user_skills: List[str]) -> dict:
    t_lower = target_skill.lower()
    if any(k in t_lower for k in ["docker", "devops", "kubernetes", "aws", "cloud"]):
        return {
            "estimatedTime": "8 Weeks (Approx. 120 Hours)",
            "requiredSkills": [
                {"name": "Linux Administration & Bash", "progress": 80},
                {"name": "Docker Containerization", "progress": 60},
                {"name": "CI/CD Pipeline Configurations", "progress": 40},
                {"name": "Kubernetes Orchestration", "progress": 30},
                {"name": "AWS Cloud Infrastructure", "progress": 50}
            ],
            "learningRoadmap": [
                {"title": "Master Container Ecosystems", "desc": "Learn Dockerfiles, volume mount points, networks, and compose environments.", "duration": "2 weeks", "completed": False},
                {"title": "Kubernetes Orchestration", "desc": "Understand pods, deployments, services, namespaces, and configMaps.", "duration": "2 weeks", "completed": False},
                {"title": "CI/CD Pipeline Automations", "desc": "Configure GitHub Actions, build runner tasks, and publish container images.", "duration": "2 weeks", "completed": False},
                {"title": "Infrastructure as Code & Cloud", "desc": "Manage AWS services, deploy container tasks, and monitor CPU alarms.", "duration": "2 weeks", "completed": False}
            ],
            "weeklyPlan": [
                {"week": "Week 1: Multi-stage Containers", "tasks": ["Write optimized Dockerfiles with multi-stage builds", "Configure local network bridge mappings", "Compose Redis + Node API stacks with volume persistence"]},
                {"week": "Week 2: Kubernetes Cluster Setup", "tasks": ["Set up local Minikube cluster instance", "Write deployment.yaml and service.yaml configs", "Configure rolling updates and environment secret variables"]},
                {"week": "Week 3: GitHub CI/CD Actions", "tasks": ["Create workflows to build and lint codebase on push", "Configure repository secrets for DockerHub access", "Automate image builds and tags upon pull-request merges"]},
                {"week": "Week 4: Cloud Engine Deployment", "tasks": ["Deploy container tasks using AWS ECS ECS-CLI", "Configure target group health-check routes", "Set up AWS CloudWatch CPU usage threshold alerts"]}
            ]
        }
    elif any(k in t_lower for k in ["machine", "ml", "ai", "python", "data"]):
        return {
            "estimatedTime": "10 Weeks (Approx. 150 Hours)",
            "requiredSkills": [
                {"name": "Python / Numerical Computing", "progress": 90},
                {"name": "Machine Learning Foundations", "progress": 70},
                {"name": "Deep Learning (PyTorch)", "progress": 40},
                {"name": "SQL & Vector Databases", "progress": 50},
                {"name": "MLOps (MLflow, Docker)", "progress": 20}
            ],
            "learningRoadmap": [
                {"title": "Deep Learning Fundamentals", "desc": "Study Neural Networks, backpropagation, SGD, and loss function landscapes.", "duration": "3 weeks", "completed": False},
                {"title": "Master PyTorch & Model Optimization", "desc": "Train models, inspect gradients, save checkpoints, and run quantization.", "duration": "2 weeks", "completed": False},
                {"title": "Vector DBs & Prompt Engineering", "desc": "Integrate FAISS, Pinecone, or pgvector for retrieval augmented generation (RAG).", "duration": "1 week", "completed": False},
                {"title": "Production Model Deployments", "desc": "Serve models using FastAPI, containerize with Docker, and push model registries.", "duration": "2 weeks", "completed": False}
            ],
            "weeklyPlan": [
                {"week": "Week 1: Foundations of NN", "tasks": ["Derive backpropagation equations by hand", "Build a neural network with numpy from scratch", "Train on MNIST dataset and achieve > 95% test accuracy"]},
                {"week": "Week 2: Transitioning to PyTorch", "tasks": ["Build PyTorch Dataset and DataLoader generators", "Train a CNN model on FashionMNIST with validation monitoring", "Implement learning rate schedulers and early stopping callbacks"]},
                {"week": "Week 3: Retrieval Pipelines (RAG)", "tasks": ["Generate embeddings using OpenAI or HuggingFace transformers", "Upsert chunks into ChromaDB/Pinecone local databases", "Build search query reranker nodes and check performance"]},
                {"week": "Week 4: MLOps & API Server", "tasks": ["Write FastAPI routes to load model and run real-time inference", "Measure request latency and optimize payload batching", "Write Docker build pipeline and verify container memory limits"]}
            ]
        }
    else:
        return {
            "estimatedTime": "4 Weeks (Approx. 40 Hours)",
            "requiredSkills": [
                {"name": "HTML5 & CSS Layouts", "progress": 95},
                {"name": "JavaScript / TypeScript ES6", "progress": 90},
                {"name": "React State & Props", "progress": 65},
                {"name": "Next.js Framework Concepts", "progress": 40},
                {"name": "Tailwind UI & Styling", "progress": 50}
            ],
            "learningRoadmap": [
                {"title": "Master Modern React Fundamentals", "desc": "Understand hooks life cycles, custom state management, performance optimization, and context patterns.", "duration": "2 weeks", "completed": False},
                {"title": "Deep Dive into Next.js App Router", "desc": "Learn file-based routing, Server Components, layout nesting, Suspense loading boundaries, and fetching architectures.", "duration": "2 weeks", "completed": False},
                {"title": "State Control & API Integrations", "desc": "Configure Axios hooks, integrate API context management, and build robust error triggers.", "duration": "2 weeks", "completed": False},
                {"title": "Interactive Deployments", "desc": "Compile production bundles, configure Vercel hostings, and complete responsive UI components.", "duration": "2 weeks", "completed": False}
            ],
            "weeklyPlan": [
                {"week": "Week 1: Advanced React Life Cycles", "tasks": ["Build a reusable context state controller", "Create custom state validation hooks", "Refactor standard inputs to use optimized debounce handlers"]},
                {"week": "Week 2: Next.js Architecture", "tasks": ["Set up Next.js app with responsive route patterns", "Configure nested layouts with loading and error boundaries", "Verify Static vs Server-side fetching configurations"]},
                {"week": "Week 3: State & REST Data Pipelines", "tasks": ["Integrate context state with Axios interceptors", "Handle API load spinners and warning toasts", "Design custom layout filters matching query search parameters"]},
                {"week": "Week 4: Styling & Hosting Platforms", "tasks": ["Migrate interface design grids to custom CSS variables", "Run production compilation and clear TypeScript alerts", "Deploy project to Vercel/Netlify with live domain access"]}
            ]
        }