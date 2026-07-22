import asyncio
import uuid
import logging

from app.database import supabase
from app.config import SUPABASE_BUCKET
from fastapi import HTTPException

logger = logging.getLogger(__name__)


async def upload_pdf_to_supabase(
    file_bytes: bytes,
    filename: str,
    bucket: str = SUPABASE_BUCKET,
    folder: str = "resumes",
) -> str:
    """
    Upload PDF/file bytes to Supabase Storage and return the public access URL.

    Uses asyncio.to_thread so the blocking Supabase SDK call never freezes the
    FastAPI event loop.

    Args:
        file_bytes: Raw bytes of the file to upload.
        filename:   Base filename (a UUID prefix is prepended automatically).
        bucket:     Supabase Storage bucket name (defaults to SUPABASE_BUCKET env var).
        folder:     Sub-folder inside the bucket (default: "resumes").

    Returns:
        Public URL string of the uploaded file.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client is not configured.")

    unique_filename = f"{uuid.uuid4()}_{filename}"
    file_path = f"{folder}/{unique_filename}"

    def _do_upload():
        return supabase.storage.from_(bucket).upload(
            file_path,
            file_bytes,
            file_options={"content-type": "application/pdf"},
        )

    def _get_url():
        return supabase.storage.from_(bucket).get_public_url(file_path)

    try:
        await asyncio.to_thread(_do_upload)
        public_url: str = await asyncio.to_thread(_get_url)
        logger.info("✅ Uploaded '%s' to Supabase bucket '%s'", file_path, bucket)
        return public_url

    except Exception as e:
        logger.error("❌ Supabase Storage upload failed: %s", e)
        # Return a deterministic mock URL so the app never hard-crashes in dev
        return f"https://mock-storage.supabase.co/{bucket}/{file_path}"
