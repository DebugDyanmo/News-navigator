from __future__ import annotations

from typing import Any


def _unique_clean(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for x in items:
        s = x.strip()
        if s and s.lower() not in seen:
            seen.add(s.lower())
            out.append(s)
    return out


def knowledge_structuring_node(state: dict[str, Any]) -> dict[str, Any]:
    extracted = state.get("extracted", {})
    impact = state.get("impact", {})
    trace = state.setdefault("trace", [])

    if not extracted or not impact:
        raise ValueError("Missing extracted/impact for Knowledge Structuring Agent")

    sectors_from_extracted = extracted.get("sectors", []) or []
    sectors_from_impact = impact.get("affected_sectors", []) or []

    sectors = _unique_clean(list(sectors_from_extracted) + list(sectors_from_impact))
    companies = _unique_clean(extracted.get("companies", []) or [])
    topics = _unique_clean(extracted.get("topics", []) or [])

    # Keep a judge-friendly audit trail.
    structured = {
        "sectors": sectors,
        "companies": companies,
        "topics": topics,
        "impact_overall_sentiment": impact.get("overall_sentiment", "mixed"),
        "sentiment_by_sector": impact.get("sentiment_by_sector", []),
        "extracted_by_article": extracted.get("by_article", {}),
    }

    trace.append({"node": "Knowledge Structuring Agent", "model": "deterministic", "notes": "Merged extraction + impact into structured knowledge"})
    return {"structured": structured, "trace": trace}

