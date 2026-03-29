from __future__ import annotations

"""
pipeline_logger.py
──────────────────
Notion/Airtable-style console logger for the multi-agent pipeline.

Prints a structured table row for each agent stage so the terminal output
proves autonomy and multi-agent orchestration at a glance:

  ┌─────────────────────────────────────────────────────────────────────┐
  │  STAGE              │ STATUS  │ MODEL          │ NOTES              │
  ├─────────────────────────────────────────────────────────────────────┤
  │  🔵 Ingestion       │  ✔ done │ —              │ Loaded 12 articles │
  │  🟡 Extraction      │  ✔ done │ llama3-8b      │ 4 sectors tagged   │
  │  🟠 Synthesis       │  ✔ done │ gpt-4o-mini    │ 3-section brief    │
  │  🟣 Personalization │  ✔ done │ llama3-8b      │ persona=cfo        │
  └─────────────────────────────────────────────────────────────────────┘
"""

import time
from typing import Any

# ── Column widths ──────────────────────────────────────────────────────────────
_W_STAGE = 22
_W_STATUS = 9
_W_MODEL = 18
_W_NOTES = 42

_DIVIDER = (
    "├"
    + "─" * (_W_STAGE + 2)
    + "┼"
    + "─" * (_W_STATUS + 2)
    + "┼"
    + "─" * (_W_MODEL + 2)
    + "┼"
    + "─" * (_W_NOTES + 2)
    + "┤"
)
_TOP = (
    "┌"
    + "─" * (_W_STAGE + 2)
    + "┬"
    + "─" * (_W_STATUS + 2)
    + "┬"
    + "─" * (_W_MODEL + 2)
    + "┬"
    + "─" * (_W_NOTES + 2)
    + "┐"
)
_BOTTOM = (
    "└"
    + "─" * (_W_STAGE + 2)
    + "┴"
    + "─" * (_W_STATUS + 2)
    + "┴"
    + "─" * (_W_MODEL + 2)
    + "┴"
    + "─" * (_W_NOTES + 2)
    + "┘"
)

# Node name → display label + emoji
_STAGE_MAP: dict[str, str] = {
    "Ingestion Agent":      "🔵 Ingestion",
    "Entity Extraction":    "🟡 Extraction",
    "Sentiment/Impact":     "🟡 Extraction",   # same visual tier
    "Knowledge Structuring":"🟡 Extraction",
    "Synthesis Agent":      "🟠 Synthesis",
    "Persona Agent":        "🟣 Personalization",
    "Query Agent":          "🔍 Query",
}


def _cell(text: str, width: int) -> str:
    s = str(text or "")
    if len(s) > width:
        s = s[: width - 1] + "…"
    return s.ljust(width)


def _row(stage: str, status: str, model: str, notes: str) -> str:
    return (
        "│ "
        + _cell(stage, _W_STAGE)
        + " │ "
        + _cell(status, _W_STATUS)
        + " │ "
        + _cell(model, _W_MODEL)
        + " │ "
        + _cell(notes, _W_NOTES)
        + " │"
    )


def _header() -> str:
    return _row("STAGE", "STATUS", "MODEL", "NOTES")


def log_pipeline_trace(trace: list[dict[str, Any]], run_id: str = "", elapsed_ms: float = 0.0) -> None:
    """
    Pretty-print the full pipeline trace as a Notion-style table.
    Call this once at the end of a pipeline run.
    """
    print()
    if run_id:
        print(f"  run_id: {run_id}  |  elapsed: {elapsed_ms:.0f} ms")
    print(_TOP)
    print(_header())
    print(_DIVIDER)
    for entry in trace:
        node = entry.get("node", "Unknown")
        stage = _STAGE_MAP.get(node, node)
        model = entry.get("model") or "—"
        notes = entry.get("notes") or ""
        warning = entry.get("warning")
        if warning:
            notes = f"⚠ {warning}"
        print(_row(stage, "✔ done", model, notes))
    print(_BOTTOM)
    print()


def log_stage_start(node_name: str) -> float:
    """
    Print a single 'in-progress' line when a node begins.
    Returns the start timestamp so elapsed time can be computed.
    """
    stage = _STAGE_MAP.get(node_name, node_name)
    print(f"  ⏳  {stage:<{_W_STAGE}}  running…")
    return time.monotonic()


def log_stage_done(node_name: str, t_start: float, notes: str = "") -> None:
    stage = _STAGE_MAP.get(node_name, node_name)
    elapsed = (time.monotonic() - t_start) * 1000
    suffix = f"  ({notes})" if notes else ""
    print(f"  ✔   {stage:<{_W_STAGE}}  {elapsed:>6.0f} ms{suffix}")
