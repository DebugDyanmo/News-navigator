from __future__ import annotations
from app.utils.llm import groq_chat_json
from app.schemas_vernacular import JargonExplanation, TargetLanguage


SYSTEM_TEMPLATE = """You are a financial literacy expert. Extract English financial/business jargon
from the text and explain each term in {language} with a local Indian analogy where possible.
Return JSON:
{{
  "jargon": [
    {{
      "term": "FII",
      "explanation_in_target_language": "...",
      "local_analogy": "..."
    }}
  ]
}}
Focus on terms that a general reader would not know."""


def run_jargon_agent(text: str, target_language: TargetLanguage) -> list[JargonExplanation]:
    system = SYSTEM_TEMPLATE.format(language=target_language.value.capitalize())
    raw = groq_chat_json(system=system, user=text)
    return [JargonExplanation(**j) for j in raw.get("jargon", [])]
