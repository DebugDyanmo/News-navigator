from __future__ import annotations
from app.utils.llm import groq_chat_json
from app.schemas_video import VideoScript, SceneSegment


SYSTEM = """You are a broadcast news scriptwriter. Given a news article, produce a 60-120 second
video script as JSON with this exact shape:
{
  "title": "...",
  "hook": "...",
  "scenes": [
    {"index": 1, "narration": "...", "visual_description": "...", "data_overlay": {}, "duration_seconds": 10}
  ],
  "closing": "...",
  "total_duration": 90
}
Keep narration punchy. Each scene is 8-15 seconds. Aim for 6-9 scenes."""


def run_script_agent(article_text: str, title: str = "") -> VideoScript:
    user = f"Title: {title}\n\nArticle:\n{article_text}"
    raw = groq_chat_json(system=SYSTEM, user=user)

    scenes = [SceneSegment(**s) for s in raw.get("scenes", [])]
    return VideoScript(
        title=raw.get("title", title),
        hook=raw.get("hook", ""),
        scenes=scenes,
        closing=raw.get("closing", ""),
        total_duration=raw.get("total_duration", 90),
    )
