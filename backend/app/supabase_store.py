from __future__ import annotations

import uuid
from typing import Any

from supabase import Client, create_client

from .config import settings


def get_supabase_client() -> Client | None:
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        return None
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def upsert_section_embeddings(
    *,
    supabase: Client,
    run_id: str,
    persona: str,
    section_key: str,
    content: str,
    embedding: list[float],
) -> None:
    """
    Insert one section embedding record for the current briefing run.
    """
    payload: dict[str, Any] = {
        "id": str(uuid.uuid4()),
        "run_id": run_id,
        "persona": persona,
        "section_key": section_key,
        "content": content,
        "embedding": embedding,
    }
    supabase.table("briefing_sections").insert(payload).execute()


def match_sections_by_embedding(
    *,
    supabase: Client,
    run_id: str,
    persona: str,
    query_embedding: list[float],
    k: int = 2,
) -> list[dict[str, Any]]:
    """
    Use pgvector match function (created via SQL in backend/supabase.sql).
    """
    resp = supabase.rpc(
        "match_briefing_sections",
        {"run_id": run_id, "persona": persona, "query_embedding": query_embedding, "k": k},
    ).execute()
    return resp.data or []

