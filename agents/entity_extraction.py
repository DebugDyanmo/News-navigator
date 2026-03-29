from __future__ import annotations

import re
from typing import Any

from app.config import settings
from app.utils.llm import groq_chat_json


SECTOR_KEYWORDS: dict[str, list[str]] = {
    "Infrastructure & Engineering": ["capex", "infrastructure", "roads", "ports", "transit", "logistics", "construction"],
    "Renewable Energy & Storage": ["renewables", "solar", "wind", "battery", "grid", "carbon credit"],
    "Manufacturing & Industrial": ["manufacturing", "production-linked", "electronics", "semiconductor", "chemicals", "capital goods"],
    "Banking & Financial Services": ["bank", "deposit", "credit", "risk weights", "SME", "guarantee"],
    "Healthcare": ["healthcare", "diagnostics", "rural", "primary care"],
    "Defense & Aerospace": ["defense", "surveillance", "naval", "unmanned"],
    "Telecom": ["telecom", "spectrum", "4g", "5g", "operators"],
    "Real Estate": ["real estate", "stamp duty", "affordable housing", "developers"],
    "Agriculture & Food Processing": ["agriculture", "MSP", "pulses", "oilseeds", "storage", "cold-chain"],
    "Consumer & Retail": ["consumer", "subsidies", "retail", "packaged foods", "essentials"],
    "IT & Tech Services": ["IT services", "export", "analytics", "ai talent", "global clients"],
}


def _unique_clean(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for x in items:
        s = x.strip()
        if s and s.lower() not in seen:
            seen.add(s.lower())
            out.append(s)
    return out


def _heuristic_extract(articles: list[dict[str, Any]]) -> dict[str, Any]:
    sectors: list[str] = []
    companies: list[str] = []
    topics: list[str] = []

    by_article: dict[str, Any] = {}
    for a in articles:
        txt = f"{a.get('title','')} {a.get('text','')}".lower()
        found_sectors: list[str] = []
        for sector, kws in SECTOR_KEYWORDS.items():
            if any(kw in txt for kw in kws):
                found_sectors.append(sector)
        # Companies aren’t explicitly listed in the mock text; we provide lightweight sector proxies.
        found_companies: list[str] = []
        if any(s == "Infrastructure & Engineering" for s in found_sectors):
            found_companies += ["Larsen & Toubro", "Techno-build contractors"]
        if any(s == "Banking & Financial Services" for s in found_sectors):
            found_companies += ["HDFC Bank", "SME-focused lenders"]
        if any(s == "Renewable Energy & Storage" for s in found_sectors):
            found_companies += ["NTPC-backed renewable developers", "Grid storage integrators"]
        if any(s == "IT & Tech Services" for s in found_sectors):
            found_companies += ["Infosys-like exporters", "HCLTech-like services firms"]
        if any(s == "Telecom" for s in found_sectors):
            found_companies += ["Bharti Airtel-like operators"]
        if any(s == "Real Estate" for s in found_sectors):
            found_companies += ["Affordable housing developers"]

        found_topics: list[str] = []
        if "capex" in txt:
            found_topics.append("capex cycle")
        if "tax" in txt or "customs duty" in txt or "stamp duty" in txt:
            found_topics.append("tax & duties")
        if "renew" in txt or "carbon credit" in txt:
            found_topics.append("energy transition finance")
        if "deposit" in txt or "credit" in txt or "sme" in txt:
            found_topics.append("credit availability")
        if "primary healthcare" in txt or "healthcare" in txt:
            found_topics.append("health spending")

        by_article[a["id"]] = {
            "sectors": _unique_clean(found_sectors),
            "companies": _unique_clean(found_companies),
            "topics": _unique_clean(found_topics),
        }

        sectors += found_sectors
        companies += found_companies
        topics += found_topics

    return {
        "sectors": _unique_clean(sectors),
        "companies": _unique_clean(companies),
        "topics": _unique_clean(topics),
        "by_article": by_article,
    }


def entity_extraction_node(state: dict[str, Any]) -> dict[str, Any]:
    articles = state.get("articles", [])
    trace = state.setdefault("trace", [])
    if not articles:
        raise ValueError("No articles in state for Entity Extraction Agent")

    # If no key is configured, use deterministic heuristics.
    use_llm = bool(settings.GROQ_API_KEY)
    if not use_llm:
        extracted = _heuristic_extract(articles)
        trace.append({"node": "Entity Extraction Agent", "model": "mock(heuristics)", "notes": "No Groq key configured"})
        return {"extracted": extracted, "trace": trace}

    system = (
        "You are an investment research extraction engine. "
        "Extract sectors, companies, and topics implied by the articles. "
        "Return valid JSON only."
    )

    # Keep prompt compact to control cost.
    sample_articles = articles[:18]
    user = (
        "Extract from these business news articles. "
        "Output schema:\n"
        "{\n"
        '  "sectors": string[],\n'
        '  "companies": string[],\n'
        '  "topics": string[],\n'
        '  "by_article": { "<article_id>": {"sectors": string[], "companies": string[], "topics": string[]} }\n'
        "}\n\n"
        "Articles:\n"
        + "\n\n".join(
            f'[{a["id"]}] {a["title"]}\n{a["text"][:1200]}'
            for a in sample_articles
        )
    )

    extracted = groq_chat_json(system=system, user=user, model=settings.GROQ_CHAT_MODEL)
    # Basic sanitization.
    extracted = extracted if isinstance(extracted, dict) else {}
    extracted.setdefault("sectors", [])
    extracted.setdefault("companies", [])
    extracted.setdefault("topics", [])
    extracted.setdefault("by_article", {})

    trace.append({"node": "Entity Extraction Agent", "model": settings.GROQ_CHAT_MODEL, "notes": "Sectors/companies/topics JSON"})
    return {"extracted": extracted, "trace": trace}

