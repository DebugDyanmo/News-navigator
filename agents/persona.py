from __future__ import annotations

from typing import Any

from app.config import settings
from app.utils.llm import groq_chat_json
from app.schemas import Persona
from agents.pipeline_logger import log_stage_start, log_stage_done

# ---------------------------------------------------------------------------
# CFO persona  → analytical, strategic, decision-oriented bullets
#               focus: macro trends, execution risks, financial signals
#
# Young Investor persona → simple, conversational, jargon-free
#               must include: "What this means for you" + "What should you do"
#               with examples and actionable steps
# ---------------------------------------------------------------------------

_CFO_STYLE = (
    "Persona: CFO\n"
    "Tone: analytical, strategic — write for someone who reads P&L statements, not headlines.\n"
    "Format: concise decision-oriented bullets only (no paragraphs).\n"
    "Each bullet must contain: a financial mechanism OR a risk signal OR an execution watchpoint.\n"
    "Focus areas: macro trends, balance-sheet implications, execution risks, leading indicators.\n"
    "Do NOT use conversational language, analogies, or 'what this means for you' framing."
)

_YOUNG_INVESTOR_STYLE = (
    "Persona: Young Investor\n"
    "Tone: simple, friendly, conversational — write for a 24-year-old investing for the first time.\n"
    "No jargon. If a financial term is unavoidable, explain it in plain English immediately after.\n"
    "Structure MUST include these two labelled sections:\n"
    "  'What this means for you:' — 2–3 sentences explaining the real-world impact with a relatable example.\n"
    "  'What should you do:' — 3 numbered actionable steps, each one sentence, no jargon.\n"
    "Do NOT use bullet-heavy analytical framing or CFO-style watchpoints."
)


def _mock_cfo(synthesis: dict[str, Any]) -> dict[str, Any]:
    return {
        "persona": Persona.cfo,
        "sector_impact": (
            "- IT: AI-talent programs reduce delivery-cost pressure over 12–18 months; "
            "track utilisation rates and large-deal TCV before upgrading margin assumptions.\n"
            "- Infra/Capital Goods: ₹11.1L cr capex allocation creates a visible order pipeline; "
            "monitor MoRTH tender awards monthly to validate revenue recognition timing.\n"
            "- Exporters: GST simplification shortens cash conversion cycles by ~8–12 days; "
            "model working-capital improvement before assuming top-line benefit.\n"
            "- Risk: PLI disbursement lags mean electronics OEM capex benefits accrue in FY27, not FY26 — "
            "adjust DCF terminal-year assumptions accordingly."
        ),
        "market_reaction": (
            "- G-sec 10Y likely range-bound 6.65–6.80%; fiscal deficit at 4.4% GDP removes crowding-out risk "
            "for corporate bond issuance in H1 FY26.\n"
            "- Rate-sensitive sector re-rating (banks, NBFCs) is contingent on RBI cutting 25 bps in April; "
            "hedge duration exposure until MPC decision.\n"
            "- PSU AAA spreads expected to compress; overweight infra-bond allocation ahead of project award data.\n"
            "- FII equity re-entry signal: watch net flows in first 30 post-Budget trading sessions."
        ),
        "expert_opinion": (
            "- Consensus: 'back-loaded catalyst' — FY27 captures more benefit than FY26 due to execution lags.\n"
            "- Risk #1: State capex underspend of 15–20% in election years dilutes central multiplier; "
            "stress-test infra revenue models at 80% execution.\n"
            "- Risk #2: MSME credit transmission is stalled; PSU bank SME lending growth has not accelerated "
            "despite policy intent — consumption recovery thesis is fragile without this channel.\n"
            "- Risk #3: Revenue assumptions embed 11% nominal GDP growth; a 1% miss = ₹25,000 cr shortfall "
            "triggering mid-year expenditure compression.\n"
            "- Upside scenario: 50 bps RBI cuts by Q3 FY26 adds 15–20 bps to GDP above consensus — "
            "currently priced by <20% of sell-side models."
        ),
    }


def _mock_young_investor(synthesis: dict[str, Any]) -> dict[str, Any]:
    return {
        "persona": Persona.young_investor,
        "sector_impact": (
            "The government is putting a lot of money into building roads, railways, and factories. "
            "Companies that build these things — think of them like contractors — are likely to get more work.\n\n"
            "What this means for you: If you own index funds or mid-cap funds, you probably already have some "
            "exposure to these companies. For example, a fund tracking the Nifty Infra index would benefit "
            "directly as order books fill up over the next 6–12 months.\n\n"
            "What should you do:\n"
            "1. Check if your existing mutual fund holds infra or capital goods stocks — most mid-cap funds do.\n"
            "2. Don't buy individual stocks yet; wait one quarter to see if companies actually win new orders.\n"
            "3. Set a Google alert for 'infrastructure order wins India' to track real progress before adding more."
        ),
        "market_reaction": (
            "After a Budget, stock markets often go up quickly on excitement — but that initial jump doesn't always last.\n\n"
            "What this means for you: Think of it like a sale announcement at a store. Prices jump the moment "
            "the sale is announced, but the real deals show up a few weeks later once the crowd thins. "
            "The same happens here — the best entry point is usually after the initial hype settles.\n\n"
            "What should you do:\n"
            "1. Don't rush to invest in the week after the Budget — prices are often inflated by excitement.\n"
            "2. Wait for the next company earnings season (April–June) to see if profits actually improved.\n"
            "3. If you invest via SIPs (monthly auto-investments), just keep them running — timing the market rarely works."
        ),
        "expert_opinion": (
            "Financial experts are saying this Budget is good in theory, but the real test is whether the "
            "government actually spends the money it promised — that's called 'execution', and it's often the hard part.\n\n"
            "What this means for you: Imagine your friend promises to pay you back next month. The promise is nice, "
            "but you only really benefit when the money arrives. Same idea here — the Budget is the promise, "
            "and the next 6 months will show if it's kept.\n\n"
            "What should you do:\n"
            "1. Don't make big investment decisions based on Budget headlines alone — wait for Q1 FY26 results.\n"
            "2. Keep 3–6 months of expenses in a liquid fund or savings account before putting more into stocks.\n"
            "3. Follow one reliable source (like RBI's monthly bulletin) to track whether credit and spending are actually growing."
        ),
    }


def persona_agent_node(state: dict[str, Any]) -> dict[str, Any]:
    synthesis = state.get("synthesis") or {}
    persona: Persona = state.get("persona")
    trace = state.setdefault("trace", [])

    if persona is None:
        raise ValueError("Missing persona for Persona Agent")
    if not synthesis:
        raise ValueError("Missing synthesis for Persona Agent")

    if not settings.GROQ_API_KEY:
        t = log_stage_start("Persona Agent")
        notes = f"mock — persona={persona}"
        trace.append({"node": "Persona Agent", "model": "mock", "notes": notes})
        mock_fn = _mock_cfo if persona == Persona.cfo else _mock_young_investor
        log_stage_done("Persona Agent", t, notes)
        return {"persona_briefing": mock_fn(synthesis), "trace": trace}

    t = log_stage_start("Persona Agent")

    style = _CFO_STYLE if persona == Persona.cfo else _YOUNG_INVESTOR_STYLE

    system = (
        "You are transforming a Union Budget intelligence brief for a specific user persona.\n"
        "The three output sections (sector_impact, market_reaction, expert_opinion) must be "
        "completely different in tone, structure, and purpose from each other — and must match "
        "the persona style exactly.\n"
        "Return valid JSON only."
    )

    user = (
        f"{style}\n\n"
        "Original synthesis (use this as your source material):\n"
        f"{synthesis}\n\n"
        "Rewrite all three sections for this persona. "
        "Do not copy sentences verbatim. Do not repeat the same idea across sections.\n\n"
        "Output schema:\n"
        "{\n"
        '  "persona": string,\n'
        '  "sector_impact": string,\n'
        '  "market_reaction": string,\n'
        '  "expert_opinion": string\n'
        "}"
    )

    briefing = groq_chat_json(system=system, user=user, model=settings.GROQ_CHAT_MODEL)
    if not isinstance(briefing, dict):
        mock_fn = _mock_cfo if persona == Persona.cfo else _mock_young_investor
        briefing = mock_fn(synthesis)

    briefing["persona"] = str(persona)
    for k in ["sector_impact", "market_reaction", "expert_opinion"]:
        briefing.setdefault(k, "")

    notes = f"persona={persona}"
    trace.append({"node": "Persona Agent", "model": settings.GROQ_CHAT_MODEL, "notes": notes})
    log_stage_done("Persona Agent", t, notes)
    return {"persona_briefing": briefing, "trace": trace}
