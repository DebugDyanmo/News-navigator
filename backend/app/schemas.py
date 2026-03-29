from __future__ import annotations

from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


class Persona(str, Enum):
    cfo = "cfo"
    investor = "investor"


class TraceStep(BaseModel):
    node: str
    model: str | None = None
    notes: str | None = None


class Article(BaseModel):
    id: str
    title: str
    source: str
    published_date: str
    text: str


class StructuredKnowledge(BaseModel):
    sectors: list[str] = Field(default_factory=list)
    companies: list[str] = Field(default_factory=list)
    topics: list[str] = Field(default_factory=list)
    # Additional structured artifacts that judges can inspect.
    extracted_by_article: dict[str, Any] = Field(default_factory=dict)


class Synthesis(BaseModel):
    sector_impact: str
    market_reaction: str
    expert_opinion: str


class PersonalizedBriefing(Synthesis):
    persona: Persona


class BriefingResponse(BaseModel):
    synthesis: Synthesis
    structured: StructuredKnowledge
    trace: list[TraceStep]


class PersonalizedResponse(BaseModel):
    persona_briefing: PersonalizedBriefing
    trace: list[TraceStep]


class QueryRequest(BaseModel):
    persona: Persona
    question: str


class QueryAnswer(BaseModel):
    section_key: Literal["sector_impact", "market_reaction", "expert_opinion"]
    answer: str


class QueryResponse(BaseModel):
    persona: Persona
    relevant_section_keys: list[Literal["sector_impact", "market_reaction", "expert_opinion"]]
    answers: list[QueryAnswer]
    trace: list[TraceStep]
    debug: dict[str, Any] = Field(default_factory=dict)

