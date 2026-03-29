from __future__ import annotations
from app.utils.llm import groq_chat_json
from app.schemas_video import VideoScript, SceneSegment


SYSTEM = """You are a visual director for broadcast news. Given a video script, enrich each scene
with detailed visual directions and data overlay specifications. Return JSON:
{
  "scenes": [
    {
      "index": 1,
      "narration": "...",
      "visual_description": "detailed camera/animation direction",
      "data_overlay": {"type": "chart|map|ticker|none", "data": {}, "position": "bottom|top|side"},
      "duration_seconds": 10
    }
  ]
}"""


def run_scene_planner(script: VideoScript) -> VideoScript:
    scenes_input = [
        {"index": s.index, "narration": s.narration, "visual_description": s.visual_description}
        for s in script.scenes
    ]
    raw = groq_chat_json(system=SYSTEM, user=str(scenes_input))

    enriched = []
    for s_raw in raw.get("scenes", []):
        enriched.append(SceneSegment(**s_raw))

    return script.model_copy(update={"scenes": enriched if enriched else script.scenes})
