from __future__ import annotations

from typing import Any

from groq import Groq
from openai import OpenAI

from ..config import settings
from .json_parse import extract_json_object


def _get_groq_client() -> Groq:
    if not settings.GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not set")
    return Groq(api_key=settings.GROQ_API_KEY)


def _get_openai_client() -> OpenAI:
    if not settings.OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not set")
    return OpenAI(api_key=settings.OPENAI_API_KEY)


def groq_embed(texts: list[str], model: str | None = None) -> list[list[float]]:
    """
    Generate embeddings with Groq.
    """
    client = _get_groq_client()
    model = model or settings.GROQ_EMBEDDING_MODEL

    resp = client.embeddings.create(
        input=texts,
        model=model,
    )
    # Groq returns embeddings in the same order as input.
    return [d.embedding for d in resp.data]


def groq_chat_json(
    *,
    system: str,
    user: str,
    model: str | None = None,
) -> Any:
    """
    Ask Groq for JSON output. Returns parsed JSON (best-effort).
    """
    client = _get_groq_client()
    model = model or settings.GROQ_CHAT_MODEL

    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.2,
    )
    content = resp.choices[0].message.content or ""
    return extract_json_object(content)


def openai_chat_json(
    *,
    system: str,
    user: str,
    model: str | None = None,
) -> Any:
    """
    Ask OpenAI for JSON output.
    """
    client = _get_openai_client()
    model = model or settings.OPENAI_CHAT_MODEL

    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.2,
    )
    content = resp.choices[0].message.content or ""
    return extract_json_object(content)

