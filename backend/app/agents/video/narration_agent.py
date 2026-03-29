from __future__ import annotations
from app.utils.llm import groq_chat_json
from app.schemas_video import VideoScript


SYSTEM = """You are a professional news anchor scriptwriter. Given a video script, produce a
single flowing narration text optimised for text-to-speech. Return JSON:
{
  "narration_text": "full narration as one string with natural pauses marked by [PAUSE]",
  "word_count": 200,
  "estimated_duration_seconds": 90
}"""


def run_narration_agent(script: VideoScript) -> str:
    combined = f"Hook: {script.hook}\n"
    for s in script.scenes:
        combined += f"Scene {s.index}: {s.narration}\n"
    combined += f"Closing: {script.closing}"

    raw = groq_chat_json(system=SYSTEM, user=combined)
    return raw.get("narration_text", combined)
