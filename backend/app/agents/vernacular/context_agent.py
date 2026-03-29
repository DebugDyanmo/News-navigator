from __future__ import annotations
from app.utils.llm import groq_chat_json
from app.schemas_vernacular import TargetLanguage


SYSTEM_TEMPLATE = """You are a regional business news editor for {language}-speaking audiences.
Given translated business news, add local context: regional economic impact, relevant local companies,
state-level implications, and cultural references that make the story more relatable.
Return JSON:
{{
  "enriched_text": "translated text with local context woven in",
  "local_context_notes": ["note1", "note2"]
}}"""


def run_context_agent(translated_text: str, target_language: TargetLanguage) -> dict:
    system = SYSTEM_TEMPLATE.format(language=target_language.value.capitalize())
    raw = groq_chat_json(system=system, user=translated_text)
    return {
        "enriched_text": raw.get("enriched_text", translated_text),
        "local_context_notes": raw.get("local_context_notes", []),
    }
