from __future__ import annotations
from app.utils.llm import groq_chat_json
from app.schemas_vernacular import TargetLanguage


SYSTEM_TEMPLATE = """You are an expert financial news translator specialising in {language}.
Translate the English business news into {language} with cultural adaptation — NOT literal translation.
Use natural, conversational {language} that a middle-class Indian reader would understand.
Return JSON:
{{
  "translated_text": "...",
  "cultural_adaptations": ["list of adaptations made, e.g. replaced 'hedge fund' with local equivalent"],
  "reading_level": "simple|intermediate|expert"
}}"""


def run_translation_agent(text: str, target_language: TargetLanguage) -> dict:
    system = SYSTEM_TEMPLATE.format(language=target_language.value.capitalize())
    raw = groq_chat_json(system=system, user=text)
    return {
        "translated_text": raw.get("translated_text", ""),
        "cultural_adaptations": raw.get("cultural_adaptations", []),
        "reading_level": raw.get("reading_level", "intermediate"),
    }
