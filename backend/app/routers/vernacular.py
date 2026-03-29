from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from app.schemas_vernacular import VernacularRequest, VernacularResponse
from app.agents.vernacular.translation_agent import run_translation_agent
from app.agents.vernacular.jargon_agent import run_jargon_agent
from app.agents.vernacular.context_agent import run_context_agent

router = APIRouter(prefix="/vernacular", tags=["vernacular"])


@router.post("/translate", response_model=VernacularResponse)
def translate(req: VernacularRequest) -> Any:
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text cannot be empty")

    try:
        translation_result = run_translation_agent(req.text, req.target_language)
        jargon = run_jargon_agent(req.text, req.target_language)

        translated = translation_result["translated_text"]

        if req.add_local_context:
            context_result = run_context_agent(translated, req.target_language)
            final_text = context_result["enriched_text"]
            adaptations = (
                translation_result["cultural_adaptations"]
                + context_result.get("local_context_notes", [])
            )
        else:
            final_text = translated
            adaptations = translation_result["cultural_adaptations"]

        return VernacularResponse(
            original_text=req.text,
            target_language=req.target_language,
            translated_text=final_text,
            cultural_adaptations=adaptations,
            jargon_explanations=jargon,
            reading_level=translation_result["reading_level"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
