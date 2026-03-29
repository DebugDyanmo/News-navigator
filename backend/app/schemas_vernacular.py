from __future__ import annotations
from enum import Enum
from pydantic import BaseModel, Field


class TargetLanguage(str, Enum):
    hindi = "hindi"
    tamil = "tamil"
    telugu = "telugu"
    bengali = "bengali"

class VernacularRequest(BaseModel):
    text: str
    target_language: TargetLanguage
    preserve_jargon: bool = Field(default=False, description="Keep financial terms in English")
    add_local_context: bool = Field(default=True, description="Add culturally relevant analogies")


class JargonExplanation(BaseModel):
    term: str
    explanation_in_target_language: str
    local_analogy: str | None = None


class VernacularResponse(BaseModel):
    original_text: str
    target_language: TargetLanguage
    translated_text: str
    cultural_adaptations: list[str]
    jargon_explanations: list[JargonExplanation]
    reading_level: str  # simple | intermediate | expert
