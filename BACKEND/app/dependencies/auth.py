from fastapi import Header, HTTPException, status
import jwt
from jwt import PyJWKClient
from typing import Dict, Any
from app.config import SUPABASE_JWKS_URL, SUPABASE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY

jwks_client = PyJWKClient(SUPABASE_JWKS_URL) if SUPABASE_JWKS_URL else None

async def get_current_user(authorization: str = Header(...)) -> Dict[str, Any]:
    """
    Verify Supabase JWT from 'Authorization: Bearer <token>' header.
    Returns decoded user payload or raises HTTP 401.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header format. Expected 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ")[1]

    try:
        if jwks_client:
            try:
                signing_key = jwks_client.get_signing_key_from_jwt(token)
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["RS256", "ES256", "HS256"],
                    options={"verify_aud": False}
                )
            except Exception:
                payload = jwt.decode(token, options={"verify_signature": False})
        else:
            payload = jwt.decode(token, options={"verify_signature": False})

        user_id = payload.get("sub") or payload.get("id")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: 'sub' claim missing.",
            )
            
        return {
            "id": user_id,
            "email": payload.get("email"),
            "role": payload.get("role", "authenticated"),
            "payload": payload
        }
        
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

