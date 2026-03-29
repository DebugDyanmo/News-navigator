from __future__ import annotations

"""
session_tracker.py
──────────────────
Tracks user queries and preferred topics per session.

Storage strategy (auto-selected at import time):
  1. Upstash Redis  — if UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
                      are set in the environment.
  2. In-memory dict — fallback; data lives for the process lifetime.

Public API
──────────
  track_query(session_id, question, selected_section)
      Record a query and the section it routed to.

  get_session_summary(session_id) -> SessionSummary
      Return query history + ranked topic preferences.

  top_topics(session_id, n) -> list[str]
      Return the n most-queried section keys for this session.
"""

import json
import os
from collections import Counter
from dataclasses import dataclass, field
from typing import Any

# ── Optional Upstash Redis client ──────────────────────────────────────────────
try:
    from upstash_redis import Redis as UpstashRedis  # type: ignore
    _UPSTASH_AVAILABLE = True
except ImportError:
    _UPSTASH_AVAILABLE = False

# ── In-memory fallback ─────────────────────────────────────────────────────────
_memory_store: dict[str, list[dict[str, Any]]] = {}

# ── Redis TTL (24 h) ───────────────────────────────────────────────────────────
_TTL_SECONDS = 86_400
_KEY_PREFIX = "biq:session:"  # budget-intelligence-query


# ── Data shape ─────────────────────────────────────────────────────────────────

@dataclass
class QueryRecord:
    question: str
    section: str          # sector_impact | market_reaction | expert_opinion
    persona: str = ""


@dataclass
class SessionSummary:
    session_id: str
    total_queries: int
    queries: list[QueryRecord]
    topic_counts: dict[str, int]          # section → count
    preferred_topics: list[str]           # ranked, most-queried first


# ── Backend helpers ────────────────────────────────────────────────────────────

def _get_redis() -> "UpstashRedis | None":
    if not _UPSTASH_AVAILABLE:
        return None
    url = os.getenv("UPSTASH_REDIS_REST_URL", "")
    token = os.getenv("UPSTASH_REDIS_REST_TOKEN", "")
    if not url or not token:
        return None
    return UpstashRedis(url=url, token=token)


def _redis_key(session_id: str) -> str:
    return f"{_KEY_PREFIX}{session_id}"


def _load_records(session_id: str) -> list[dict[str, Any]]:
    redis = _get_redis()
    if redis:
        raw = redis.get(_redis_key(session_id))
        if raw:
            return json.loads(raw)
        return []
    return _memory_store.get(session_id, [])


def _save_records(session_id: str, records: list[dict[str, Any]]) -> None:
    redis = _get_redis()
    if redis:
        redis.set(_redis_key(session_id), json.dumps(records), ex=_TTL_SECONDS)
    else:
        _memory_store[session_id] = records


# ── Public API ─────────────────────────────────────────────────────────────────

def track_query(session_id: str, question: str, selected_section: str, persona: str = "") -> None:
    """Append a query record to the session store."""
    records = _load_records(session_id)
    records.append({
        "question": question,
        "section": selected_section,
        "persona": persona,
    })
    _save_records(session_id, records)

    backend = "redis(upstash)" if _get_redis() else "memory"
    print(
        f"  📝  session={session_id[:8]}…  "
        f"section={selected_section}  "
        f"queries={len(records)}  [{backend}]"
    )


def get_session_summary(session_id: str) -> SessionSummary:
    """Return full query history and ranked topic preferences."""
    records = _load_records(session_id)
    queries = [
        QueryRecord(
            question=r.get("question", ""),
            section=r.get("section", ""),
            persona=r.get("persona", ""),
        )
        for r in records
    ]
    counts: dict[str, int] = dict(Counter(q.section for q in queries))
    preferred = sorted(counts, key=lambda k: counts[k], reverse=True)
    return SessionSummary(
        session_id=session_id,
        total_queries=len(queries),
        queries=queries,
        topic_counts=counts,
        preferred_topics=preferred,
    )


def top_topics(session_id: str, n: int = 3) -> list[str]:
    """Return the n most-queried section keys for this session."""
    summary = get_session_summary(session_id)
    return summary.preferred_topics[:n]


def storage_backend() -> str:
    """Return which backend is active — useful for health checks."""
    return "upstash_redis" if _get_redis() else "in_memory"
