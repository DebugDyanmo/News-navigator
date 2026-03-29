from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from agents.pipeline_logger import log_stage_start, log_stage_done


def ingestion_node(state: dict[str, Any]) -> dict[str, Any]:
    """Load mock dataset (JSON) from data/."""
    t = log_stage_start("Ingestion Agent")

    repo_root = Path(__file__).resolve().parents[1]
    data_path = repo_root / "data" / "articles_union_budget.json"
    articles = json.loads(data_path.read_text(encoding="utf-8"))

    notes = f"Loaded {len(articles)} articles"
    trace = state.setdefault("trace", [])
    trace.append({"node": "Ingestion Agent", "model": None, "notes": notes})

    log_stage_done("Ingestion Agent", t, notes)
    return {"articles": articles, "trace": trace}

