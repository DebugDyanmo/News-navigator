from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.schemas_video import (
    VideoGenerateRequest,
    VideoGenerateResponse,
    VideoStatus,
    VideoStatusResponse,
)
from app.agents.video.script_agent import run_script_agent
from app.agents.video.scene_planner import run_scene_planner
from app.agents.video.narration_agent import run_narration_agent
from app.agents.video.render_agent import run_render_agent

router = APIRouter(prefix="/video", tags=["video"])

# In-memory job store (replace with Redis/DB in production)
_jobs: dict[str, dict[str, Any]] = {}


def _process_video(job_id: str, req: VideoGenerateRequest) -> None:
    try:
        _jobs[job_id]["status"] = VideoStatus.processing
        article_text = req.article_text or f"Breaking news article about: {req.title}"

        script = run_script_agent(article_text, title=req.title or "")
        script = run_scene_planner(script)
        narration = run_narration_agent(script)
        render_meta = run_render_agent(script, narration)

        _jobs[job_id].update({
            "status": VideoStatus.completed,
            "script": script,
            "narration_text": narration,
            "render_metadata": render_meta,
        })
    except Exception as e:
        _jobs[job_id].update({"status": VideoStatus.failed, "error": str(e)})


@router.post("/generate", response_model=VideoGenerateResponse, status_code=202)
def generate_video(req: VideoGenerateRequest, background_tasks: BackgroundTasks) -> Any:
    if not req.article_url and not req.article_text:
        raise HTTPException(status_code=400, detail="Provide article_url or article_text")

    job_id = str(uuid.uuid4())
    _jobs[job_id] = {"status": VideoStatus.pending}
    background_tasks.add_task(_process_video, job_id, req)

    return VideoGenerateResponse(
        job_id=job_id,
        status=VideoStatus.pending,
        message="Video generation started. Poll /video/status/{job_id} for updates.",
    )


@router.get("/status/{job_id}", response_model=VideoStatusResponse)
def get_video_status(job_id: str) -> Any:
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return VideoStatusResponse(
        job_id=job_id,
        status=job["status"],
        script=job.get("script"),
        narration_text=job.get("narration_text"),
        render_metadata=job.get("render_metadata", {}),
        error=job.get("error"),
    )
