from __future__ import annotations

from typing import Any, Literal, TypedDict

from app.schemas import Persona


class PipelineState(TypedDict, total=False):
    # Controls how far the pipeline runs (used by endpoints).
    stop_at: Literal["synthesis", "persona", "query"]

    # Request-specific.
    run_id: str
    persona: Persona
    question: str

    # Ingestion.
    articles: list[dict[str, Any]]

    # Extraction/Impact/Structuring.
    extracted: dict[str, Any]
    impact: dict[str, Any]
    structured: dict[str, Any]

    # Synthesis and persona transformation.
    synthesis: dict[str, Any]
    persona_briefing: dict[str, Any]

    # Query output.
    query: dict[str, Any]

    # For transparency (judges can inspect).
    trace: list[dict[str, Any]]

