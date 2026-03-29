from __future__ import annotations
from app.utils.llm import groq_chat_json
from app.schemas_story_arc import WatchNext


SYSTEM = """You are a forward-looking financial strategist. Based on the story so far, generate
"what to watch next" predictions. Return JSON:
{
  "predictions": [
    {
      "prediction": "...",
      "probability": "high|medium|low",
      "timeframe": "1 week|1 month|1 quarter|1 year"
    }
  ],
  "narrative_summary": "2-3 sentence arc summary of the entire story"
}
Be specific and actionable. Avoid vague statements."""


def run_prediction_agent(
    story_topic: str, articles: list[str]
) -> tuple[list[WatchNext], str]:
    user = f"Story: {story_topic}\n\nArticles:\n" + "\n---\n".join(articles)
    raw = groq_chat_json(system=SYSTEM, user=user)

    predictions = [WatchNext(**p) for p in raw.get("predictions", [])]
    summary = raw.get("narrative_summary", "")
    return predictions, summary
