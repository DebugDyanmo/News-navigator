from __future__ import annotations
from app.utils.llm import groq_chat_json
from app.schemas_story_arc import KeyPlayer


SYSTEM = """You are a business intelligence analyst. Identify key players in this business story.
Return JSON:
{
  "players": [
    {
      "name": "...",
      "role": "CEO|Regulator|Analyst|Investor|Company|Government",
      "stance": "bullish|bearish|neutral|regulatory|disruptive",
      "influence_score": 0.85
    }
  ]
}
Score influence 0.0-1.0 based on their impact on the story outcome."""


def run_player_agent(story_topic: str, articles: list[str]) -> list[KeyPlayer]:
    user = f"Story: {story_topic}\n\nArticles:\n" + "\n---\n".join(articles)
    raw = groq_chat_json(system=SYSTEM, user=user)
    return [KeyPlayer(**p) for p in raw.get("players", [])]
