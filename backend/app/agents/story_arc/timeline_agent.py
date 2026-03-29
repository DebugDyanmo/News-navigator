from __future__ import annotations
from app.utils.llm import groq_chat_json
from app.schemas_story_arc import TimelineEvent


SYSTEM = """You are a financial news analyst. Extract a chronological timeline of key events
from the provided articles about a business story. Return JSON:
{
  "events": [
    {"date": "YYYY-MM-DD", "headline": "...", "significance": "...", "sentiment": "positive|negative|neutral"}
  ]
}
Order events chronologically. Focus on market-moving moments."""


def run_timeline_agent(story_topic: str, articles: list[str]) -> list[TimelineEvent]:
    user = f"Story: {story_topic}\n\nArticles:\n" + "\n---\n".join(articles)
    raw = groq_chat_json(system=SYSTEM, user=user)
    return [TimelineEvent(**e) for e in raw.get("events", [])]
