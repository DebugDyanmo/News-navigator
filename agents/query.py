from __future__ import annotations

import math
from typing import Any, Literal

from app.config import settings
from app.utils.llm import groq_chat_json, groq_embed
from app.schemas import Persona
from app.supabase_store import get_supabase_client, match_sections_by_embedding, upsert_section_embeddings
from agents.pipeline_logger import log_stage_start, log_stage_done
from agents.session_tracker import track_query

# ---------------------------------------------------------------------------
# Section routing map — intent keywords → single canonical section
# Rule: one query → one section. No overlap, no extra content.
# ---------------------------------------------------------------------------

SECTION_KEYS = ["sector_impact", "market_reaction", "expert_opinion"]

SectionKey = Literal["sector_impact", "market_reaction", "expert_opinion"]

# Each entry: (keywords, target_section)
# Evaluated in order; first match wins.
_INTENT_MAP: list[tuple[list[str], SectionKey]] = [
    # Sector / policy impact
    (
        [
            "sector", "it stock", "tech stock", "infra", "infrastructure", "capex",
            "manufactur", "healthcare", "bank", "agriculture", "housing", "telecom",
            "renewable", "energy", "fmcg", "consumer", "pli", "export", "gst",
            "impact", "winner", "benefit", "tailwind", "who wins", "which sector",
        ],
        "sector_impact",
    ),
    # Market / price signals
    (
        [
            "market", "stock market", "equity", "nifty", "sensex", "rate", "yield",
            "bond", "g-sec", "gsec", "rally", "reprice", "fii", "foreign investor",
            "rupee", "currency", "credit spread", "nbfc", "rbi", "interest rate",
            "invest now", "buy now", "sell",
        ],
        "market_reaction",
    ),
    # Expert / analyst / risk
    (
        [
            "expert", "analyst", "economist", "risk", "outlook", "scenario",
            "forecast", "consensus", "research", "watch", "what to watch",
            "downside", "upside", "slippage", "execution risk", "msme",
        ],
        "expert_opinion",
    ),
]

# Follow-up suggestions keyed by section
_FOLLOW_UPS: dict[SectionKey, list[str]] = {
    "sector_impact": [
        "Which specific companies are best positioned to benefit?",
        "What execution risks could delay these sector gains?",
        "How does this compare to last year's Budget impact on the same sectors?",
    ],
    "market_reaction": [
        "What should I watch to know if this rally will last?",
        "How are foreign investors (FIIs) likely to respond?",
        "What does the RBI's next move mean for these market signals?",
    ],
    "expert_opinion": [
        "What are the biggest risks analysts are flagging?",
        "Which sectors do analysts think are overpriced post-Budget?",
        "What's the bullish scenario if everything goes right?",
    ],
}


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = na = nb = 0.0
    for x, y in zip(a, b):
        dot += x * y
        na += x * x
        nb += y * y
    if na == 0.0 or nb == 0.0:
        return 0.0
    return dot / math.sqrt(na * nb)


def _keyword_route(question: str) -> SectionKey:
    """Map a question to exactly one section via keyword matching."""
    q = question.lower()
    for keywords, section in _INTENT_MAP:
        if any(kw in q for kw in keywords):
            return section
    # Default: market_reaction (most general financial question)
    return "market_reaction"


def _trim(text: str, max_chars: int = 300) -> str:
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rsplit(" ", 1)[0] + "..."


def query_agent_node(state: dict[str, Any]) -> dict[str, Any]:
    persona_briefing = state.get("persona_briefing") or {}
    persona: Persona = state.get("persona")
    question: str = (state.get("question") or "").strip()
    run_id: str = state.get("run_id") or ""
    trace = state.setdefault("trace", [])

    if not persona_briefing or not question:
        raise ValueError("Missing persona_briefing or question for Query Agent")

    sections: dict[str, str] = {
        k: persona_briefing.get(k, "") for k in SECTION_KEYS
    }

    # ------------------------------------------------------------------
    # 1. Route to exactly ONE section
    # ------------------------------------------------------------------
    selected: SectionKey
    method: str

    if not settings.GROQ_API_KEY:
        selected = _keyword_route(question)
        method = "keyword"
    else:
        # Embed question + sections, pick highest cosine match
        supabase = get_supabase_client()
        section_embeddings: dict[str, list[float]] = {}
        for key in SECTION_KEYS:
            content = sections.get(key, "")
            section_embeddings[key] = groq_embed([content])[0] if content else []

        question_embedding = groq_embed([question])[0]
        scores: dict[str, float] = {}

        if supabase and run_id:
            method = "pgvector"
            try:
                for key in SECTION_KEYS:
                    content = sections.get(key, "")
                    if content:
                        upsert_section_embeddings(
                            supabase=supabase,
                            run_id=run_id,
                            persona=str(persona),
                            section_key=key,
                            content=content,
                            embedding=section_embeddings[key],
                        )
                matches = match_sections_by_embedding(
                    supabase=supabase,
                    run_id=run_id,
                    persona=str(persona),
                    query_embedding=question_embedding,
                    k=1,
                )
                for m in matches:
                    k = m.get("section_key")
                    if k in SECTION_KEYS:
                        scores[str(k)] = float(m.get("match_score", 0.0))
            except Exception as e:
                trace.append({"node": "Query Agent", "warning": f"pgvector error: {e}"})

        if not scores:
            method = "cosine"
            for key in SECTION_KEYS:
                emb = section_embeddings.get(key) or []
                if emb:
                    scores[key] = _cosine_similarity(question_embedding, emb)

        best = max(scores, key=lambda k: scores[k]) if scores else _keyword_route(question)
        selected = best  # type: ignore[assignment]

    section_text = sections.get(selected, "")
    follow_ups = _FOLLOW_UPS.get(selected, [])

    # ------------------------------------------------------------------
    # 2. Generate a focused answer from the single selected section
    # ------------------------------------------------------------------
    answer: str

    if not settings.GROQ_API_KEY or not section_text:
        answer = (
            f'For "{question}":\n\n{_trim(section_text)}'
            if section_text
            else "No relevant content found for your question."
        )
    else:
        system = (
            "You are a newsroom assistant answering a user's question about the Union Budget. "
            "Answer using ONLY the provided section text. "
            "Be concise and direct. Do not reference other sections or add information not in the text."
        )
        user = (
            f"Persona: {persona}\n"
            f"Question: {question}\n\n"
            f"Section ({selected}):\n{section_text}\n\n"
            'Return JSON: { "answer": string }'
        )
        resp = groq_chat_json(system=system, user=user, model=settings.GROQ_CHAT_MODEL)
        answer = (resp.get("answer") or "") if isinstance(resp, dict) else ""
        if not answer:
            answer = f'For "{question}":\n\n{_trim(section_text)}'

    trace.append({
        "node": "Query Agent",
        "model": settings.GROQ_CHAT_MODEL if settings.GROQ_API_KEY else "mock",
        "notes": f"routed={selected} method={method if settings.GROQ_API_KEY else 'keyword'}",
    })

    return {
        "query": {
            "question": question,
            "persona": str(persona),
            "selected_section": selected,
            "answer": answer,
            "follow_up_suggestions": follow_ups,
        },
        "trace": trace,
    }
