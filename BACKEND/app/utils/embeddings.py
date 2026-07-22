import httpx
import math
from typing import List
from app.config import HF_API_KEY

def _deterministic_mock_embedding(text: str, dim: int = 384) -> List[float]:
    """Generate a normalized mock 384-dimensional vector based on input text hash."""
    seed = sum(ord(c) for c in text)
    vector = [math.sin(seed + i) for i in range(dim)]
    norm = math.sqrt(sum(x * x for x in vector)) or 1.0
    return [round(x / norm, 6) for x in vector]

async def get_embedding(text: str) -> List[float]:
    """
    Generate 384-dimensional vector embedding using HuggingFace Inference API
    (BAAI/bge-small-en-v1.5) with local fallback.
    """
    if not text or not text.strip():
        return [0.0] * 384

    # Truncate text to avoid token limit overflow (~300 words)
    truncated_text = text[:2000]

    if HF_API_KEY:
        API_URL = "https://api-inference.huggingface.co/pipeline/feature-extraction/BAAI/bge-small-en-v1.5"
        headers = {"Authorization": f"Bearer {HF_API_KEY}"}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    API_URL, 
                    headers=headers, 
                    json={"inputs": truncated_text, "options": {"wait_for_model": True}}
                )
                if response.status_code == 200:
                    data = response.json()
                    # Handle pooled vs token-level response
                    if isinstance(data, list):
                        if len(data) > 0 and isinstance(data[0], list):
                            # Average pool token embeddings if returned as 2D array
                            token_embeddings = data
                            dim = len(token_embeddings[0])
                            avg_vector = [
                                sum(token[i] for token in token_embeddings) / len(token_embeddings)
                                for i in range(dim)
                            ]
                            return avg_vector[:384]
                        return data[:384]
        except Exception:
            pass  # Fall through to deterministic fallback if API request fails

    return _deterministic_mock_embedding(truncated_text, dim=384)
