"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { PersonaToggle } from "@/components/PersonaToggle";
import type { Persona } from "@/components/PersonaToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { postQuery, fetchPersonalized } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type BriefingResponse = {
  persona_briefing: {
    persona: Persona | string;
    sector_impact: string;
    market_reaction: string;
    expert_opinion: string;
  };
  trace?: { node: string; model?: string; notes?: string }[];
};

type QueryResponse = {
  relevant_section_keys: string[];
  answers: { section_key: string; answer: string }[];
  trace?: { node: string; model?: string; notes?: string }[];
};

// ─── Section metadata ─────────────────────────────────────────────────────────

const SECTION_META = {
  sector_impact: {
    label: "IT Sector",
    tagline: "Explainer-first IT angle — not a generic summary.",
    watchNext: "Watch capex cycles, PLI disbursements, and hiring signals.",
    whyItMatters: "IT spending is a leading indicator of corporate confidence.",
  },
  market_reaction: {
    label: "Market Reaction",
    tagline: "Rates → equities → rotation (what moves first).",
    watchNext: "Track 10-yr yield, Nifty Bank, and FII flow data.",
    whyItMatters: "Bond market moves telegraph equity rotation before it happens.",
  },
  expert_opinion: {
    label: "Expert Opinion",
    tagline: "Risks, contrarian angles, and what to watch next.",
    watchNext: "Monitor fiscal slippage risk and monsoon-linked rural demand.",
    whyItMatters: "Contrarian views surface risks that consensus misses.",
  },
} as const;

type SectionKey = keyof typeof SECTION_META;

// ─── Suggested queries ────────────────────────────────────────────────────────

const SUGGESTED_QUESTIONS: { label: string; q: string; sectionHint: SectionKey }[] = [
  { label: "Biggest risks?", q: "What are the key risks and what should I watch next quarter?", sectionHint: "expert_opinion" },
  { label: "Who benefits most?", q: "Which sectors benefit most, and what is the mechanism?", sectionHint: "sector_impact" },
  { label: "Market playbook", q: "What happens to yields and equity rotation after this budget?", sectionHint: "market_reaction" },
  { label: "What should I do?", q: "What sectors benefit most and what should I do next?", sectionHint: "expert_opinion" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTakeaways(text: string, max = 3): string[] {
  const cleaned = (text || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const parts = cleaned.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const scored = parts
    .map((s) => ({ s, score: Math.min(1, s.length / 90) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.s);
  const uniq: string[] = [];
  for (const s of scored) {
    if (!uniq.some((u) => u.toLowerCase() === s.toLowerCase())) uniq.push(s);
    if (uniq.length >= max) break;
  }
  return uniq;
}

function getActionSteps(text: string): string[] {
  const takeaways = getTakeaways(text, 3);
  return takeaways.map((t) => {
    if (t.toLowerCase().includes("sector")) return `Review exposure to mentioned sectors`;
    if (t.toLowerCase().includes("yield") || t.toLowerCase().includes("bond")) return `Monitor 10-yr yield for entry signals`;
    if (t.toLowerCase().includes("risk")) return `Hedge tail risk with defensive allocation`;
    return `Track: ${t.slice(0, 60)}${t.length > 60 ? "…" : ""}`;
  });
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-4 w-32 rounded bg-zinc-200" />
        <div className="h-3 w-48 rounded bg-zinc-100 mt-1" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-3 w-full rounded bg-zinc-100" />
        <div className="h-3 w-5/6 rounded bg-zinc-100" />
        <div className="h-3 w-4/6 rounded bg-zinc-100" />
        <Separator />
        <div className="h-3 w-full rounded bg-zinc-100" />
        <div className="h-3 w-3/4 rounded bg-zinc-100" />
      </CardContent>
    </Card>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  sectionKey,
  text,
  answerText,
  hasQuery,
  persona,
  loading,
}: {
  sectionKey: SectionKey;
  text: string;
  answerText?: string;
  hasQuery: boolean;
  persona: Persona;
  loading: boolean;
}) {
  const meta = SECTION_META[sectionKey];
  const isCfo = persona === "cfo";
  const takeaways = getTakeaways(text);
  const actionSteps = getActionSteps(text);

  const cardClass = [
    "transition-all duration-200 hover:shadow-md",
    answerText ? "ring-2 ring-indigo-300" : "",
    isCfo
      ? "border-zinc-700 bg-zinc-950 text-zinc-100"
      : "border-violet-100 bg-white text-zinc-900",
  ].join(" ");

  const taglineClass = isCfo ? "text-zinc-400" : "text-zinc-500";
  const labelClass = isCfo ? "text-zinc-100 font-semibold" : "text-zinc-800 font-semibold";
  const bulletClass = isCfo ? "bg-indigo-400" : "bg-violet-400";
  const bodyClass = isCfo ? "text-zinc-300 leading-relaxed" : "text-zinc-700 leading-relaxed";
  const subHeadClass = isCfo ? "text-zinc-400 text-xs font-medium uppercase tracking-wide" : "text-zinc-500 text-xs font-medium uppercase tracking-wide";
  const watchClass = isCfo ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-violet-50 border-violet-100 text-violet-800";
  const actionClass = isCfo ? "bg-zinc-800 border-zinc-700" : "bg-emerald-50 border-emerald-100";
  const actionTextClass = isCfo ? "text-emerald-400" : "text-emerald-700";
  const ctaBtnClass = isCfo
    ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800"
    : "border-violet-200 text-violet-700 hover:bg-violet-50";

  if (loading) return <SkeletonCard />;

  return (
    <Card className={cardClass}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className={labelClass}>{meta.label}</div>
            <div className={`text-xs mt-0.5 ${taglineClass}`}>{meta.tagline}</div>
          </div>
          <Button size="sm" variant="outline" className={`shrink-0 text-xs ${ctaBtnClass}`}>
            View Insights
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Insights */}
        {takeaways.length > 0 && (
          <div>
            <div className={subHeadClass}>Key Insights</div>
            <ul className="mt-2 space-y-1.5">
              {takeaways.map((t, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${bulletClass}`} />
                  <span className={bodyClass}>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator className={isCfo ? "bg-zinc-700" : ""} />

        {/* Why It Matters */}
        <div>
          <div className={subHeadClass}>Why It Matters</div>
          <p className={`mt-1 text-sm ${bodyClass}`}>{meta.whyItMatters}</p>
        </div>

        {/* What to Watch Next */}
        <div className={`rounded-lg border p-3 text-sm ${watchClass}`}>
          <span className="font-medium">What to Watch Next: </span>
          {meta.watchNext}
        </div>

        {/* Investor-only: Action Box */}
        {!isCfo && (
          <div className={`rounded-lg border p-3 ${actionClass}`}>
            <div className="flex items-center gap-1.5 mb-2">
              <span>📊</span>
              <span className={`text-xs font-semibold uppercase tracking-wide ${actionTextClass}`}>What should you do</span>
            </div>
            <ul className="space-y-1">
              {actionSteps.map((step, i) => (
                <li key={i} className={`text-xs flex gap-1.5 ${actionTextClass}`}>
                  <span className="font-bold">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Full body text */}
        {text && (
          <p className={`text-sm ${bodyClass}`}>{text}</p>
        )}

        {/* Query answer */}
        {answerText && (
          <div className={`rounded-lg border p-3 ${isCfo ? "border-indigo-700 bg-indigo-950" : "border-indigo-100 bg-indigo-50"}`}>
            <div className={`text-xs font-medium uppercase tracking-wide mb-1 ${isCfo ? "text-indigo-300" : "text-indigo-600"}`}>
              Query Answer
            </div>
            <p className={`text-sm ${isCfo ? "text-indigo-100" : "text-indigo-900"}`}>{answerText}</p>
          </div>
        )}

        {!answerText && !hasQuery && (
          <div className={`text-xs ${taglineClass}`}>
            Ask a question in the Navigator to get a focused answer here.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BriefingPage() {
  const sp = useSearchParams();
  const initialPersona = ((sp.get("persona") as Persona) || "cfo") as Persona;

  const [persona, setPersona] = React.useState<Persona>(initialPersona);
  const [briefing, setBriefing] = React.useState<BriefingResponse | null>(null);
  const [trace, setTrace] = React.useState<BriefingResponse["trace"]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [queryLoading, setQueryLoading] = React.useState(false);
  const [queryError, setQueryError] = React.useState<string | null>(null);
  const [question, setQuestion] = React.useState("");
  const [selectedKey, setSelectedKey] = React.useState<SectionKey>("sector_impact");
  const [queryResp, setQueryResp] = React.useState<QueryResponse | null>(null);
  const [queryHistory, setQueryHistory] = React.useState<string[]>([]);
  const [startedAt] = React.useState(() => Date.now());
  const [secondsOnPage, setSecondsOnPage] = React.useState(0);

  const itRef = React.useRef<HTMLDivElement | null>(null);
  const marketRef = React.useRef<HTMLDivElement | null>(null);
  const expertsRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const id = window.setInterval(() => setSecondsOnPage(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem("myet_persona") as Persona | null;
      if (saved === "cfo" || saved === "investor") setPersona(saved);
      const hist = JSON.parse(window.localStorage.getItem("myet_query_history") || "[]");
      if (Array.isArray(hist)) setQueryHistory(hist.slice(0, 10));
    } catch {}
  }, []);

  React.useEffect(() => {
    try { window.localStorage.setItem("myet_persona", persona); } catch {}
  }, [persona]);

  async function loadPersonalized(p: Persona) {
    setLoading(true);
    setLoadError(null);
    try {
      const data = (await fetchPersonalized(p)) as BriefingResponse;
      setBriefing(data);
      setTrace(data.trace || []);
      setQueryResp(null);
      setQueryError(null);
      setSelectedKey(p === "cfo" ? "market_reaction" : "sector_impact");
    } catch {
      setBriefing(null);
      setTrace([]);
      setLoadError("Couldn't reach the backend. Make sure FastAPI is running on http://127.0.0.1:8000 and refresh.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { loadPersonalized(initialPersona); }, [initialPersona]);
  React.useEffect(() => { if (persona !== initialPersona) loadPersonalized(persona); }, [persona]);

  async function runQuery(overrideQ?: string) {
    const q = (overrideQ ?? question).trim();
    if (!q) return;
    setQuestion(q);
    setQueryLoading(true);
    setQueryError(null);
    try {
      const resp = (await postQuery(persona, q)) as QueryResponse;
      setQueryResp(resp);
      setTrace((resp.trace as any) || []);
      setQueryHistory((prev) => {
        const next = [q, ...prev.filter((x) => x !== q)].slice(0, 10);
        try { window.localStorage.setItem("myet_query_history", JSON.stringify(next)); } catch {}
        return next;
      });
      const topKey = (resp.relevant_section_keys[0] || "sector_impact") as SectionKey;
      if (topKey in SECTION_META) setSelectedKey(topKey);
      const target = topKey === "sector_impact" ? itRef.current : topKey === "market_reaction" ? marketRef.current : expertsRef.current;
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setQueryError("Query failed. If the backend just restarted, try again in 2 seconds.");
    } finally {
      setQueryLoading(false);
    }
  }

  const answersByKey = React.useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of queryResp?.answers || []) m[a.section_key] = a.answer;
    return m;
  }, [queryResp]);

  const sc = briefing?.persona_briefing || null;
  const isCfo = persona === "cfo";

  const pageClass = isCfo
    ? "min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900"
    : "min-h-screen bg-gradient-to-b from-violet-50 to-white";

  const headerClass = isCfo
    ? "sticky top-0 z-20 border-b border-zinc-700 bg-zinc-950/90 backdrop-blur"
    : "sticky top-0 z-20 border-b border-zinc-200/70 bg-white/80 backdrop-blur";

  const titleClass = isCfo ? "text-zinc-100" : "text-zinc-900";
  const subtitleClass = isCfo ? "text-zinc-400" : "text-zinc-600";
  const badgeClass = isCfo
    ? "border-indigo-700 bg-indigo-950 text-indigo-300"
    : "border-indigo-200 bg-indigo-50 text-indigo-700";

  return (
    <main className={pageClass}>
      {/* Header */}
      <div className={headerClass}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className={`text-xs font-medium tracking-wide ${subtitleClass}`}>NEWS NAVIGATOR</div>
            <div className="flex items-center gap-3">
              <div className={`text-lg font-semibold ${titleClass}`}>Interactive Intelligence Briefing</div>
              <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${badgeClass}`}>
                FE-v2
              </div>
            </div>
          </div>
          <PersonaToggle persona={persona} onChange={setPersona} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="mb-6">
          <h1 className={`text-3xl font-semibold ${titleClass}`}>News Navigator: one explorable briefing</h1>
          <p className={`mt-2 max-w-3xl ${subtitleClass}`}>
            Instead of reading multiple articles about the Union Budget, interact with a single AI briefing. Ask follow-ups
            and the system routes you to the right section without duplication.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {[
              { label: "Est. time saved", value: "39 min" },
              { label: "Engagement", value: `${secondsOnPage}s` },
              { label: "Queries asked", value: String(queryHistory.length) },
            ].map((stat) => (
              <span
                key={stat.label}
                className={`inline-flex items-center rounded-full border px-3 py-1 ${isCfo ? "border-zinc-700 bg-zinc-800 text-zinc-300" : "border-zinc-200 bg-white text-zinc-700"}`}
              >
                {stat.label}: <span className="ml-1 font-semibold">{stat.value}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Error banner */}
        {loadError && (
          <Card className="mb-6 border-red-300 bg-red-50">
            <CardHeader>
              <div className="font-medium text-red-700">Backend not reachable</div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-red-700">{loadError}</div>
              <div className="mt-3 font-mono text-xs bg-white border border-red-200 rounded-lg p-3 text-zinc-700">
                python -m uvicorn app.main:app --reload --port 8000
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* ── Main briefing ── */}
          <div>
            <Tabs value={selectedKey} onValueChange={(v) => setSelectedKey(v as SectionKey)}>
              <TabsList className={isCfo ? "bg-zinc-800 border border-zinc-700" : ""}>
                {(Object.keys(SECTION_META) as SectionKey[]).map((k) => (
                  <TabsTrigger
                    key={k}
                    value={k}
                    className={isCfo ? "data-[state=active]:bg-zinc-600 data-[state=active]:text-white text-zinc-400" : ""}
                  >
                    {SECTION_META[k].label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="mt-4 space-y-4">
                <TabsContent value="sector_impact">
                  <div ref={itRef} />
                  <SectionCard
                    sectionKey="sector_impact"
                    text={sc?.sector_impact || ""}
                    answerText={answersByKey["sector_impact"]}
                    hasQuery={!!queryResp}
                    persona={persona}
                    loading={loading}
                  />
                </TabsContent>

                <TabsContent value="market_reaction">
                  <div ref={marketRef} />
                  <SectionCard
                    sectionKey="market_reaction"
                    text={sc?.market_reaction || ""}
                    answerText={answersByKey["market_reaction"]}
                    hasQuery={!!queryResp}
                    persona={persona}
                    loading={loading}
                  />
                </TabsContent>

                <TabsContent value="expert_opinion">
                  <div ref={expertsRef} />
                  <SectionCard
                    sectionKey="expert_opinion"
                    text={sc?.expert_opinion || ""}
                    answerText={answersByKey["expert_opinion"]}
                    hasQuery={!!queryResp}
                    persona={persona}
                    loading={loading}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* ── Navigator sidebar ── */}
          <aside className="lg:sticky lg:top-[92px] h-fit">
            <Card className={isCfo ? "border-zinc-700 bg-zinc-900" : ""}>
              <CardHeader>
                <div className={`font-medium ${titleClass}`}>Navigator</div>
                <div className={`text-sm ${subtitleClass}`}>Ask once, jump to the right answer.</div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder='Ask: "what are the risks?"'
                    onKeyDown={(e) => { if (e.key === "Enter") runQuery(); }}
                    className={isCfo ? "bg-zinc-800 border-zinc-600 text-zinc-100 placeholder:text-zinc-500" : ""}
                  />
                  <Button
                    onClick={() => runQuery()}
                    disabled={queryLoading}
                    className={`shrink-0 ${isCfo ? "bg-indigo-600 hover:bg-indigo-500 text-white" : ""}`}
                  >
                    {queryLoading ? "…" : "Ask"}
                  </Button>
                </div>

                {queryError && <div className="text-sm text-red-500">{queryError}</div>}

                {/* Suggested chips */}
                <div>
                  <div className={`text-xs font-medium tracking-wide ${subtitleClass}`}>SUGGESTED</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.map((x) => (
                      <button
                        key={x.label}
                        type="button"
                        className={[
                          "rounded-full border px-3 py-1 text-xs transition-colors",
                          isCfo
                            ? "border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                            : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
                        ].join(" ")}
                        onClick={() => runQuery(x.q)}
                      >
                        {x.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent queries */}
                {queryHistory.length > 0 && (
                  <div>
                    <div className={`text-xs font-medium tracking-wide ${subtitleClass}`}>RECENT QUERIES</div>
                    <div className="mt-2 space-y-1.5">
                      {queryHistory.slice(0, 5).map((q) => (
                        <button
                          key={q}
                          type="button"
                          className={[
                            "w-full text-left rounded-lg border px-3 py-2 text-xs transition-colors",
                            isCfo
                              ? "border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
                          ].join(" ")}
                          onClick={() => runQuery(q)}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Separator className={isCfo ? "bg-zinc-700" : ""} />

                {/* Agent pipeline trace */}
                <details className="text-sm">
                  <summary className={`cursor-pointer font-medium ${titleClass}`}>Agent pipeline (audit trail)</summary>
                  <div className="mt-3 space-y-2">
                    {trace && trace.length ? (
                      trace.map((t, idx) => (
                        <div
                          key={idx}
                          className={[
                            "p-3 rounded-lg border",
                            isCfo ? "bg-zinc-800 border-zinc-700" : "bg-white border-zinc-200",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className={`font-medium text-xs ${titleClass}`}>{t.node}</div>
                              {t.notes && <div className={`text-xs mt-0.5 ${subtitleClass}`}>{t.notes}</div>}
                            </div>
                            <div
                              className={[
                                "text-[11px] px-2 py-1 rounded-full border whitespace-nowrap",
                                (t.model || "").includes("gpt")
                                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700",
                              ].join(" ")}
                            >
                              {t.model || "no-model"}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={`text-xs ${subtitleClass}`}>No trace yet.</div>
                    )}
                  </div>
                </details>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}
