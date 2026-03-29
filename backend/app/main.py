from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.graph import run_pipeline
from app.schemas import BriefingResponse, Persona, PersonalizedResponse, QueryRequest, QueryResponse
from app.routers import video as video_router
from app.routers import story_arc as story_arc_router
from app.routers import vernacular as vernacular_router


app = FastAPI(
    title="AI-Native News Experience - MyET Navigator (Backend)",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(video_router.router)
app.include_router(story_arc_router.router)
app.include_router(vernacular_router.router)


@app.get("/health")
def health() -> dict[str, Any]:
    return {"status": "ok"}

@app.get("/")
def index() -> dict[str, Any]:
    return {
        "name": "MyET Navigator Backend",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "briefing": "/briefing",
            "personalized": "/personalized?persona=cfo|investor",
            "query": {"method": "POST", "path": "/query"},
            "video_generate": {"method": "POST", "path": "/video/generate"},
            "video_status": {"method": "GET", "path": "/video/status/{job_id}"},
            "story_arc": {"method": "POST", "path": "/story-arc"},
            "vernacular_translate": {"method": "POST", "path": "/vernacular/translate"},
        },
    }


@app.get("/briefing", response_model=BriefingResponse)
def briefing() -> Any:
    try:
        # Run pipeline only up to the synthesis node.
        out = run_pipeline(stop_at="synthesis", persona=Persona.cfo)
        synthesis = out.get("synthesis") or {}
        structured = out.get("structured") or {}
        trace = out.get("trace") or []
        return {
            "synthesis": synthesis,
            "structured": structured,
            "trace": trace,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/personalized", response_model=PersonalizedResponse)
def personalized(persona: Persona) -> Any:
    try:
        out = run_pipeline(stop_at="persona", persona=persona)
        persona_briefing = out.get("persona_briefing") or {}
        trace = out.get("trace") or []
        return {
            "persona_briefing": persona_briefing,
            "trace": trace,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/query", response_model=QueryResponse)
def query(req: QueryRequest) -> Any:
    try:
        out = run_pipeline(stop_at="query", persona=req.persona, question=req.question)
        query_obj = out.get("query") or {}
        trace = out.get("trace") or []
        debug = query_obj.get("debug") or {}

        answers = query_obj.get("answers") or []
        relevant_section_keys = [a["section_key"] for a in answers if a.get("section_key")]

        return {
            "persona": req.persona,
            "relevant_section_keys": relevant_section_keys,
            "answers": answers,
            "trace": trace,
            "debug": debug,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

