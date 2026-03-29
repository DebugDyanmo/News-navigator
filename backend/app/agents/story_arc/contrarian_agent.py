from __future__ import annotations
from app.utils.llm import groq_chat_json
from app.schemas_story_arc import ContrarianView, SentimentShift


SYSTEM = """You are a contrarian financial analyst. Given a business story, do two things:
1. Track sentiment shifts over time
2. Surface non-consensus, contrarian perspectives that challenge the mainstream narrative

Return JSON:
{
  "sentiment_shifts": [
    {"period": "Q1 2024", "sentiment": "positive|negative|neutral", "driver": "..."}
  ],
  "contrarian_views": [
    {"perspective": "...", "rationale": "...", "source_hint": "bears|shorts|critics|regulators"}
  ]
}"""


def run_contrarian_agent(
    story_topic: str, articles: list[str]
) -> tuple[list[SentimentShift], list[ContrarianView]]:
    user = f"Story: {story_topic}\n\nArticles:\n" + "\n---\n".join(articles)
    raw = groq_chat_json(system=SYSTEM, user=user)

    shifts = [SentimentShift(**s) for s in raw.get("sentiment_shifts", [])]
    views = [ContrarianView(**v) for v in raw.get("contrarian_views", [])]
    return shifts, views
