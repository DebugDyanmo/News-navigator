from __future__ import annotations
from typing import Any
from app.utils.llm import groq_chat_json
from app.schemas_video import VideoScript


SYSTEM = """You are a video render pipeline coordinator. Given a script with scenes, produce
render metadata for an animation engine. Return JSON:
{
  "render_plan": [
    {
      "scene_index": 1,
      "background_template": "news_studio|data_viz|street_footage|split_screen",
      "animation_type": "slide_in|fade|zoom|ticker_scroll",
      "color_scheme": "et_brand|dark|light",
      "overlay_elements": ["lower_third", "logo", "data_chart"]
    }
  ],
  "total_frames": 2700,
  "fps": 30,
  "resolution": "1080x1920"
}"""


def run_render_agent(script: VideoScript, narration: str) -> dict[str, Any]:
    payload = {
        "title": script.title,
        "total_duration": script.total_duration,
        "scene_count": len(script.scenes),
        "narration_preview": narration[:300],
    }
    raw = groq_chat_json(system=SYSTEM, user=str(payload))
    return raw if isinstance(raw, dict) else {}
