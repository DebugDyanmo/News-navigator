from __future__ import annotations

import sys
import uuid
from pathlib import Path
from typing import Any, Literal

from langgraph.graph import END, StateGraph

# Ensure imports work regardless of where `uvicorn` is launched from.
_HERE = Path(__file__).resolve()
_BACKEND_DIR = _HERE.parents[1]
_REPO_ROOT = _HERE.parents[2]
for p in [str(_REPO_ROOT), str(_BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.schemas import Persona
from agents.state import PipelineState

from agents.ingestion import ingestion_node
from agents.entity_extraction import entity_extraction_node
from agents.sentiment_impact import sentiment_impact_node
from agents.knowledge_structuring import knowledge_structuring_node
from agents.synthesis import synthesis_node
from agents.persona import persona_agent_node
from agents.query import query_agent_node


def _route_after_synthesis(state: PipelineState) -> Literal["persona", "end"]:
    return "persona" if state.get("stop_at") in ("persona", "query") else "end"


def _route_after_persona(state: PipelineState) -> Literal["query", "end"]:
    return "query" if state.get("stop_at") == "query" else "end"


def build_pipeline_graph():
    graph = StateGraph(PipelineState)

    # NOTE: Node IDs must NOT collide with state keys (e.g. "synthesis", "structured", "query").
    graph.add_node("ingestion_agent", ingestion_node)
    graph.add_node("entity_extraction_agent", entity_extraction_node)
    graph.add_node("sentiment_impact_agent", sentiment_impact_node)
    graph.add_node("knowledge_structuring_agent", knowledge_structuring_node)
    graph.add_node("synthesis_agent", synthesis_node)
    graph.add_node("persona_agent", persona_agent_node)
    graph.add_node("query_agent", query_agent_node)

    graph.set_entry_point("ingestion_agent")

    graph.add_edge("ingestion_agent", "entity_extraction_agent")
    graph.add_edge("entity_extraction_agent", "sentiment_impact_agent")
    graph.add_edge("sentiment_impact_agent", "knowledge_structuring_agent")
    graph.add_edge("knowledge_structuring_agent", "synthesis_agent")

    graph.add_conditional_edges("synthesis_agent", _route_after_synthesis, {"persona": "persona_agent", "end": END})
    graph.add_conditional_edges("persona_agent", _route_after_persona, {"query": "query_agent", "end": END})
    graph.add_edge("query_agent", END)

    return graph.compile()


compiled_graph = build_pipeline_graph()


def run_pipeline(*, stop_at: str, persona: Persona, question: str = "") -> dict[str, Any]:
    run_id = str(uuid.uuid4())
    state: PipelineState = {
        "stop_at": stop_at,  # "synthesis" | "persona" | "query"
        "run_id": run_id,
        "persona": persona,
        "question": question,
        "trace": [],
    }
    out = compiled_graph.invoke(state)
    return out

