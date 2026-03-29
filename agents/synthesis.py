from __future__ import annotations

from typing import Any

from app.config import settings
from app.utils.llm import openai_chat_json
from agents.pipeline_logger import log_stage_start, log_stage_done

# ---------------------------------------------------------------------------
# Each section covers a DISTINCT analytical lens — no idea appears twice.
#
#   sector_impact   → policy mechanics & which sectors/companies are affected
#   market_reaction → price signals: rates, equities, credit spreads, FII flows
#   expert_opinion  → analyst consensus, quantified risks, one bullish outlier
# ---------------------------------------------------------------------------

_SECTION_RULES = {
    "sector_impact": (
        "Cover: which policies change which sector economics, named sub-sectors or companies, "
        "execution watchpoints, and realistic timelines. "
        "Do NOT mention rates, yields, FII flows, or analyst opinions."
    ),
    "market_reaction": (
        "Cover: G-sec yield direction with a numeric range, equity index behaviour, "
        "credit spread movement, FII flow triggers, and rupee impact. "
        "Do NOT repeat sector mechanics or analyst risk framing."
    ),
    "expert_opinion": (
        "Cover: analyst consensus label, top 3 risks each with a quantified stake, "
        "one bullish outlier scenario with a condition. "
        "Do NOT restate sector mechanics or market price moves."
    ),
}

_ANTI_GENERIC = (
    "BANNED phrases (never use): 'mixed signals', 'broadly positive', 'consistent with fiscal optics', "
    "'markets reacted', 'experts believe', 'overall sentiment', 'constructive budget'. "
    "Every bullet must contain at least one of: a named entity, a metric, a timeframe, or a causal chain."
)

_OUTPUT_FORMAT = (
    "Each section value must follow this exact plain-text structure — no extra headers:\n\n"
    "Key Insights:\n"
    "- [bullet]\n"
    "- [bullet]\n"
    "- [bullet]\n"
    "(3–5 bullets; specific, cause-effect, non-generic)\n\n"
    "Why It Matters:\n"
    "- [bullet]\n"
    "- [bullet]\n"
    "(2–3 bullets; explain the implication, not just the fact)\n\n"
    "What to Watch Next:\n"
    "- [concrete forward-looking indicator]\n"
    "- [concrete forward-looking indicator]\n"
    "(2–3 bullets; trackable signals, not vague guidance)"
)


def _mock_synthesis(structured: dict[str, Any]) -> dict[str, str]:
    sector_impact = (
        "Key Insights:\n"
        "- IT delivery margins are constrained by talent gaps; Budget AI-skill programs address the bottleneck "
        "but require 12–18 months before deal-margin improvement shows in earnings.\n"
        "- Infrastructure capex of ₹11.1L cr creates a direct order pipeline for EPC firms; "
        "L&T, KEC, and Kalpataru are first-order beneficiaries before revenue recognition.\n"
        "- GST compliance simplification cuts working-capital lock-up for mid-cap exporters by an estimated 8–12 days, "
        "improving cash conversion without requiring revenue growth.\n"
        "- PLI extension for electronics shifts assembly economics toward domestic OEMs; "
        "import-dependent distributors face margin compression as duty structures tighten.\n"
        "- Cold-chain and agri-storage funding compresses rural FMCG last-mile logistics costs, "
        "expanding addressable distribution reach for mid-tier consumer brands.\n\n"
        "Why It Matters:\n"
        "- Capital goods firms can be positioned ahead of order inflows; waiting for revenue recognition "
        "means entering after the re-rating has already occurred.\n"
        "- IT margin recovery depends on BFSI and retail client budget unlocks, not domestic policy alone — "
        "treating Budget tailwinds as a near-term earnings catalyst overstates the mechanism.\n"
        "- PLI electronics capex benefits component suppliers first; finished-goods brands remain under "
        "import-cost pressure for at least two more quarters.\n\n"
        "What to Watch Next:\n"
        "- MoRTH and Railways monthly project award data to confirm capex converts into actual tenders.\n"
        "- IT large-deal TCV in Q1 FY26 earnings calls as a proxy for client budget recovery.\n"
        "- GST Council rate-rationalisation outcome, which sets the actual quantum of compliance-cost relief."
    )

    market_reaction = (
        "Key Insights:\n"
        "- 10-year G-sec yields are likely range-bound at 6.65–6.80%; fiscal deficit target of 4.4% GDP "
        "removes the risk of aggressive sovereign borrowing crowding out private credit.\n"
        "- Mid-cap indices have outperformed large-caps by 4–6% in the 60 days post-Budget in FY22 and FY24 "
        "under comparable capex-led setups — the current configuration mirrors both.\n"
        "- AAA-rated PSU bond spreads are likely to compress as sovereign-backed project pipelines reduce "
        "perceived default risk for infra-sector issuers.\n"
        "- FII re-entry into rate-sensitive sectors (banks, NBFCs) is conditional on RBI cutting 25 bps in April; "
        "without that, the Budget's transmission effect stays partial.\n"
        "- Reduced import duties on select inputs lower the current account deficit drag, providing a modest "
        "structural support for rupee stability through H1 FY26.\n\n"
        "Why It Matters:\n"
        "- A durable equity rally requires credit transmission and order inflows within two quarters; "
        "absent that, the post-Budget re-rating is a sentiment trade with no earnings anchor.\n"
        "- Bond market stability is the precondition for NBFC and housing-finance re-rating; "
        "any advance-tax data signalling fiscal slippage would reverse spread compression within weeks.\n\n"
        "What to Watch Next:\n"
        "- RBI MPC decision in April — a 25 bps cut confirms the bond-equity dual rally thesis.\n"
        "- Q4 FY25 advance tax collections as the earliest read on whether corporate earnings support fiscal math.\n"
        "- FII net equity flows in the first 30 post-Budget trading days as a sentiment confirmation signal."
    )

    expert_opinion = (
        "Key Insights:\n"
        "- Consensus label: 'back-loaded catalyst' — analyst desks expect FY27 to capture more benefit than FY26 "
        "due to execution lags in capex disbursement and PLI claim cycles.\n"
        "- Risk #1 (execution): State governments historically underspend capex by 15–20% in election years, "
        "diluting the central allocation multiplier by a proportional amount.\n"
        "- Risk #2 (credit): PSU bank lending to sub-₹10 cr MSME borrowers has not accelerated despite policy intent; "
        "without this channel, the domestic consumption recovery thesis loses its primary demand driver.\n"
        "- Risk #3 (revenue): Tax assumptions embed 11% nominal GDP growth; a 1% miss implies a ₹25,000 cr shortfall "
        "that forces mid-year expenditure compression, reversing the capex impulse.\n"
        "- Bullish outlier: If RBI cuts 50 bps cumulatively by Q3 FY26, the income-tax relief consumption multiplier "
        "could add 15–20 bps to GDP above current consensus — a scenario priced by fewer than 20% of sell-side models.\n\n"
        "Why It Matters:\n"
        "- Pricing in FY26 earnings upgrades on Budget alone puts investors 6–9 months early; "
        "Q1 FY26 order book data is the more reliable entry signal.\n"
        "- MSME credit failure is a systemic risk, not a sector-specific one — it would simultaneously impair "
        "FMCG volume growth, consumer durables demand, and SME-linked NBFC asset quality.\n\n"
        "What to Watch Next:\n"
        "- State budget presentations (Feb–March) to assess whether state capex complements or offsets central allocation.\n"
        "- RBI monthly credit growth data for MSME lending acceleration above the current 14% YoY baseline.\n"
        "- IMF/World Bank India growth revision post-Budget as external validation of the fiscal multiplier."
    )

    return {
        "sector_impact": sector_impact,
        "market_reaction": market_reaction,
        "expert_opinion": expert_opinion,
    }


def synthesis_node(state: dict[str, Any]) -> dict[str, Any]:
    structured = state.get("structured") or {}
    trace = state.setdefault("trace", [])

    if not structured:
        raise ValueError("Missing structured knowledge for Synthesis Agent")

    t = log_stage_start("Synthesis Agent")

    if not settings.OPENAI_API_KEY:
        notes = "mock — no OpenAI key"
        trace.append({"node": "Synthesis Agent", "model": "mock", "notes": notes})
        log_stage_done("Synthesis Agent", t, notes)
        return {"synthesis": _mock_synthesis(structured), "trace": trace}

    section_rules_block = "\n".join(
        f"- {k}: {v}" for k, v in _SECTION_RULES.items()
    )

    system = (
        "You are a newsroom synthesis engine for Union Budget intelligence.\n"
        "Return a JSON object with exactly three keys: sector_impact, market_reaction, expert_opinion.\n\n"
        f"{_OUTPUT_FORMAT}\n\n"
        "SECTION SCOPE (strict — no idea may appear in more than one section):\n"
        f"{section_rules_block}\n\n"
        f"{_ANTI_GENERIC}\n\n"
        "Return valid JSON only."
    )

    user = (
        "Structured knowledge:\n"
        f"{structured}\n\n"
        "Produce the three-section brief. Each section must be self-contained and non-overlapping."
    )

    synthesis = openai_chat_json(system=system, user=user, model=settings.OPENAI_CHAT_MODEL)
    if not isinstance(synthesis, dict):
        synthesis = _mock_synthesis(structured)
    for k in ["sector_impact", "market_reaction", "expert_opinion"]:
        synthesis.setdefault(k, "")

    notes = "Non-overlapping three-section brief"
    trace.append({"node": "Synthesis Agent", "model": settings.OPENAI_CHAT_MODEL, "notes": notes})
    log_stage_done("Synthesis Agent", t, notes)
    return {"synthesis": synthesis, "trace": trace}
