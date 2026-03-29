from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from app.schemas_story_arc import StoryArcRequest, StoryArcResponse
from app.agents.story_arc.timeline_agent import run_timeline_agent
from app.agents.story_arc.player_agent import run_player_agent
from app.agents.story_arc.contrarian_agent import run_contrarian_agent
from app.agents.story_arc.prediction_agent import run_prediction_agent

router = APIRouter(prefix="/story-arc", tags=["story-arc"])


@router.post("", response_model=StoryArcResponse)
def build_story_arc(req: StoryArcRequest) -> Any:
    if not req.story_topic:
        raise HTTPException(status_code=400, detail="story_topic is required")

    articles = req.articles or [f"Ongoing story about: {req.story_topic}"]

    try:
        timeline = run_timeline_agent(req.story_topic, articles)
        players = run_player_agent(req.story_topic, articles)
        sentiment_shifts, contrarian_views = run_contrarian_agent(req.story_topic, articles)
        watch_next, narrative_summary = run_prediction_agent(req.story_topic, articles)

        return StoryArcResponse(
            story_topic=req.story_topic,
            timeline=timeline,
            key_players=players,
            sentiment_shifts=sentiment_shifts,
            contrarian_views=contrarian_views,
            watch_next=watch_next,
            narrative_summary=narrative_summary,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
