from __future__ import annotations

import re
from typing import Any

from app.config import settings
from app.utils.llm import groq_chat_json


POSITIVE_HINTS = [
    "boost",
    "incentive",
    "increases",
    "allocation",
    "support",
    "improve",
    "faster",
    "expands",
    "clarifies",
    "accelerates",
    "stable",
    "growth",
]
NEGATIVE_HINTS = [
    "deferred",
    "uncertainty",
    "risk",
    "tighten",
    "compliance",
    "disciplined",
    "caution",
    "headwind",
]


SECTOR_KEYWORDS: dict[str, list[str]] = {
    "Infrastructure & Engineering": ["capex", "infrastructure", "roads", "ports", "transit", "logistics", "construction"],
    "Renewable Energy & Storage": ["renewables", "solar", "wind", "battery", "grid", "carbon credit"],
    "Manufacturing & Industrial": ["manufacturing", "production-linked", "electronics", "semiconductor", "chemicals", "capital goods"],
    "Banking & Financial Services": ["bank", "deposit", "credit", "risk weights", "SME", "guarantee"],
    "Healthcare": ["healthcare", "diagnostics", "primary healthcare", "rural workforce"],
    "Defense & Aerospace": ["defense", "surveillance", "naval", "unmanned"],
    "Telecom": ["telecom", "spectrum", "4g", "5g", "operators"],
    "Real Estate": ["real estate", "stamp duty", "affordable housing"],
    "Agriculture & Food Processing": ["agriculture", "MSP", "pulses", "oilseeds", "cold-chain", "storage subsidies"],
    "Consumer & Retail": ["consumer", "subsidies", "retail", "essentials", "packaged foods"],
    "IT & Tech Services": ["IT services", "export", "ai talent", "analytics", "global clients"],
}


def _heuristic_sentiment_for_article(text: str) -> dict[str, str]:
    tx = text.lower()
    sector_sent: dict[str, str] = {}
    for sector, kws in SECTOR_KEYWORDS.items():
        if not any(kw in tx for kw in kws):
            continue
        pos = sum(1 for h in POSITIVE_HINTS if h in tx)
        neg = sum(1 for h in NEGATIVE_HINTS if h in tx)
        if pos > neg:
            sector_sent[sector] = "positive"
        elif neg > pos:
            sector_sent[sector] = "negative"
        else:
            sector_sent[sector] = "mixed"
    return sector_sent


def sentiment_impact_node(state: dict[str, Any]) -> dict[str, Any]:
    articles = state.get("articles", [])
    trace = state.setdefault("trace", [])

    if not articles:
        raise ValueError("No articles in state for Sentiment + Impact Agent")

    use_llm = bool(settings.GROQ_API_KEY)
    if not use_llm:
        combined: dict[str, list[str]] = {}
        for a in articles:
            sent = _heuristic_sentiment_for_article(f"{a.get('title','')} {a.get('text','')}")
            for sector, s in sent.items():
                combined.setdefault(sector, []).append(s)

        sentiment_by_sector = []
        affected = []
        for sector, arr in combined.items():
            affected.append(sector)
            if "positive" in arr and "negative" in arr:
                label = "mixed"
            elif "positive" in arr:
                label = "positive"
            elif "negative" in arr:
                label = "negative"
            else:
                label = "mixed"
            sentiment_by_sector.append(
                {"sector": sector, "sentiment": label, "rationale": "Keyword-based policy tailwinds/headwinds across articles."}
            )

        trace.append({"node": "Sentiment + Impact Agent", "model": "mock(heuristics)", "notes": "Keyword-driven sentiment by sector"})
        return {
            "impact": {"overall_sentiment": "mixed", "sentiment_by_sector": sentiment_by_sector, "affected_sectors": affected},
            "trace": trace,
        }

    system = (
        "You are an investment analyst. For the provided articles, identify affected sectors and classify sentiment (positive/mixed/negative) "
        "and summarize the likely impact on those sectors. Return valid JSON only."
    )
    user_articles = "\n\n".join(f"[{a['id']}] {a['title']}\n{a['text'][:1400]}" for a in articles[:18])
    user = (
        "Articles:\n"
        f"{user_articles}\n\n"
        "Return JSON schema:\n"
        "{\n"
        '  "overall_sentiment": "positive|mixed|negative",\n'
        '  "sentiment_by_sector": [{"sector": string, "sentiment": "positive|mixed|negative", "rationale": string}],\n'
        '  "affected_sectors": string[]\n'
        "}\n"
    )

    impact = groq_chat_json(system=system, user=user, model=settings.GROQ_CHAT_MODEL)
    if not isinstance(impact, dict):
        impact = {"overall_sentiment": "mixed", "sentiment_by_sector": [], "affected_sectors": []}
    impact.setdefault("sentiment_by_sector", [])
    impact.setdefault("affected_sectors", [])

    trace.append({"node": "Sentiment + Impact Agent", "model": settings.GROQ_CHAT_MODEL, "notes": "Sector sentiment JSON"})
    return {"impact": impact, "trace": trace}

