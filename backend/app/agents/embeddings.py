# backend/app/agents/embeddings.py
# Re-uses the production embedding logic already in app/utils/embeddings.py
# so there is a single implementation rather than two copies.
from app.utils.embeddings import get_embedding

__all__ = ["get_embedding"]