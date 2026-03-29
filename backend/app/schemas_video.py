from __future__ import annotations
from enum import Enum
from typing import Any
from pydantic import BaseModel, Field


class VideoStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class VideoGenerateRequest(BaseModel):
    article_url: str | None = None
    article_text: str | None = None
    title: str | None = None
    duration_seconds: int = Field(default=90, ge=60, le=120)


class SceneSegment(BaseModel):
    index: int
    narration: str
    visual_description: str
    data_overlay: dict[str, Any] = Field(default_factory=dict)
    duration_seconds: int = 10


class VideoScript(BaseModel):
    title: str
    hook: str
    scenes: list[SceneSegment]
    closing: str
    total_duration: int


class VideoGenerateResponse(BaseModel):
    job_id: str
    status: VideoStatus
    message: str


class VideoStatusResponse(BaseModel):
    job_id: str
    status: VideoStatus
    script: VideoScript | None = None
    narration_text: str | None = None
    render_metadata: dict[str, Any] = Field(default_factory=dict)
    error: str | None = None
