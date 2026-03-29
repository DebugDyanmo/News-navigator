from __future__ import annotations
from typing import Any
from pydantic import BaseModel, Field


class StoryArcRequest(BaseModel):
    story_topic: str
    articles: list[str] = Field(default_factory=list, description="List of article texts or URLs")
    depth: int = Field(default=3, ge=1, le=5, description="Analysis depth 1-5")


class TimelineEvent(BaseModel):
    date: str
    headline: str
    significance: str
    sentiment: str  # positive | negative | neutral


class KeyPlayer(BaseModel):
    name: str
    role: str
    stance: str
    influence_score: float = Field(ge=0.0, le=1.0)


class SentimentShift(BaseModel):
    period: str
    sentiment: str
    driver: str


class ContrarianView(BaseModel):
    perspective: str
    rationale: str
    source_hint: str


class WatchNext(BaseModel):
    prediction: str
    probability: str  # high | medium | low
    timeframe: str


class StoryArcResponse(BaseModel):
    story_topic: str
    timeline: list[TimelineEvent]
    key_players: list[KeyPlayer]
    sentiment_shifts: list[SentimentShift]
    contrarian_views: list[ContrarianView]
    watch_next: list[WatchNext]
    narrative_summary: str
