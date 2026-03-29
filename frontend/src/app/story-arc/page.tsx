"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ─── Types ────────────────────────────────────────────────────────────────────

type Player = {
  name: string;
  role: string;
  sentiment: "bullish" | "bearish" | "neutral";
  quote?: string;
};

type TimelineEvent = {
  date: string;
  headline: string;
  sentiment: "positive" | "negative" | "neutral";
  impact: "high" | "medium" | "low";
};

type StoryArc = {
  story_title: string;
  summary: string;
  players: Player[];
  timeline: TimelineEvent[];
  contrarian_view: string;
  watch_next: string[];
  sentiment_shift: { from: string; to: string; reason: string };
};

// ─── Mock data ────────────────────────────────────────────────────────────────

function mockStoryArc(topic: string): StoryArc {
  return {
    story_title: `${topic || "Adani Group"}: Full Story Arc`,
    summary:
      "From infrastructure darling to short-seller target and back — this story tracks one of India's most volatile corporate narratives across 18 months of market-moving events.",
    players: [
      { name: "Gautam Adani", role: "Chairman, Adani Group", sentiment: "bullish", quote: "We will emerge stronger." },
      { name: "Hindenburg Research", role: "Short Seller", sentiment: "bearish", quote: "Largest corporate fraud in history." },
      { name: "SEBI", role: "Regulator", sentiment: "neutral" },
      { name: "LIC / SBI", role: "Institutional Investors", sentiment: "neutral", quote: "Exposure within limits." },
      { name: "GQG Partners", role: "Foreign Investor", sentiment: "bullish", quote: "Bought the dip aggressively." },
    ],
    timeline: [
      { date: "Jan 2023", headline: "Hindenburg report drops — stocks crash 50%+", sentiment: "negative", impact: "high" },
      { date: "Feb 2023", headline: "FPO pulled; Adani repays $1.1B debt early", sentiment: "negative", impact: "high" },
      { date: "Mar 2023", headline: "GQG Partners invests $1.87B — confidence signal", sentiment: "positive", impact: "high" },
      { date: "Jun 2023", headline: "SEBI investigation ongoing; stocks stabilise", sentiment: "neutral", impact: "medium" },
      { date: "Dec 2023", headline: "Supreme Court gives clean chit on SEBI probe", sentiment: "positive", impact: "high" },
      { date: "Mar 2024", headline: "Adani stocks recover 70% from lows", sentiment: "positive", impact: "medium" },
      { date: "Nov 2024", headline: "US DOJ indictment on bribery allegations", sentiment: "negative", impact: "high" },
      { date: "Jan 2025", headline: "Adani denies charges; legal battle begins", sentiment: "neutral", impact: "medium" },
    ],
    contrarian_view:
      "While consensus fears regulatory risk, contrarians note Adani's infrastructure assets are irreplaceable — airports, ports, and power grids can't be short-sold into irrelevance. The real risk is refinancing, not fundamentals.",
    watch_next: [
      "US DOJ case timeline and any plea deals",
      "Adani Green's debt refinancing schedule (Q2 2025)",
      "SEBI's final order on related-party transactions",
      "FII re-entry into Adani stocks as a sentiment signal",
    ],
    sentiment_shift: {
      from: "Euphoric (pre-Jan 2023)",
      to: "Cautiously recovering (2025)",
      reason: "Regulatory clarity + institutional re-entry offset ongoing legal overhang",
    },
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function fetchStoryArc(topic: string): Promise<StoryArc> {
  const res = await fetch(`${API_BASE}/story-arc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
  });
  if (!res.ok) throw new Error(`Story Arc API error: ${res.status}`);
  return res.json();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SENTIMENT_COLORS = {
  positive: "bg-emerald-500",
  negative: "bg-red-500",
  neutral: "bg-zinc-400",
  bullish: "text-emerald-400",
  bearish: "text-red-400",
};

const IMPACT_WIDTH = { high: "w-3", medium: "w-2", low: "w-1.5" };

function SentimentDot({ s }: { s: "positive" | "negative" | "neutral" }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${SENTIMENT_COLORS[s]}`} />;
}

function TimelineView({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative pl-6 space-y-4">
      <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-zinc-700" />
      {events.map((ev, i) => (
        <div key={i} className="relative">
          <div className={`absolute -left-4 top-1.5 h-3 ${IMPACT_WIDTH[ev.impact]} rounded-full ${SENTIMENT_COLORS[ev.sentiment]}`} />
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 hover:border-zinc-500 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-zinc-500 font-mono">{ev.date}</span>
              <Badge
                variant="outline"
                className={`text-[10px] border-zinc-600 ${ev.impact === "high" ? "text-amber-400 border-amber-800" : "text-zinc-400"}`}
              >
                {ev.impact}
              </Badge>
            </div>
            <div className="text-sm text-zinc-200">{ev.headline}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PlayerCard({ player }: { player: Player }) {
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-3 hover:border-zinc-500 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-zinc-100">{player.name}</div>
          <div className="text-xs text-zinc-500">{player.role}</div>
        </div>
        <span className={`text-xs font-medium capitalize ${SENTIMENT_COLORS[player.sentiment]}`}>
          {player.sentiment}
        </span>
      </div>
      {player.quote && (
        <div className="mt-2 text-xs text-zinc-400 italic border-l-2 border-zinc-600 pl-2">
          "{player.quote}"
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const EXAMPLE_TOPICS = ["Adani Group", "Zomato IPO journey", "RBI rate cycle", "Jio vs Airtel"];

export default function StoryArcPage() {
  const [topic, setTopic] = React.useState("");
  const [arc, setArc] = React.useState<StoryArc | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleFetch(overrideTopic?: string) {
    const t = (overrideTopic ?? topic).trim();
    if (!t) return;
    setTopic(t);
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStoryArc(t);
      setArc(data);
    } catch {
      setError("Backend offline — showing demo data.");
      setArc(mockStoryArc(t));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-slate-700 bg-slate-950/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <div>
            <div className="text-xs font-medium tracking-wide text-slate-500">STORY ARC TRACKER</div>
            <div className="text-lg font-semibold text-slate-100">Visual Narrative Intelligence</div>
          </div>
          <Badge className="ml-auto border-amber-700 bg-amber-950 text-amber-300">Roadmap</Badge>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <p className="text-slate-400 max-w-2xl">
          Pick any ongoing business story. AI builds a complete visual narrative — interactive timeline, key players mapped,
          sentiment shifts tracked, contrarian perspectives surfaced, and "what to watch next" predictions.
        </p>

        {/* Search */}
        <Card className="border-slate-700 bg-slate-900">
          <CardContent className="pt-5 space-y-3">
            <div className="flex gap-2">
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder='e.g. "Adani Group", "Zomato IPO", "RBI rate cycle"'
                className="bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500"
                onKeyDown={(e) => { if (e.key === "Enter") handleFetch(); }}
              />
              <Button
                onClick={() => handleFetch()}
                disabled={loading}
                className="bg-violet-600 hover:bg-violet-500 text-white shrink-0"
              >
                {loading ? "Building…" : "🔍 Track Story"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleFetch(t)}
                  className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
            {error && <div className="text-xs text-amber-400">{error}</div>}
          </CardContent>
        </Card>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid gap-4 lg:grid-cols-[1fr_300px] animate-pulse">
            <Card className="border-slate-700 bg-slate-900">
              <CardContent className="pt-5 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-slate-800" />
                ))}
              </CardContent>
            </Card>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 rounded-lg bg-slate-800" />
              ))}
            </div>
          </div>
        )}

        {/* Arc output */}
        {arc && !loading && (
          <div className="space-y-4">
            {/* Summary */}
            <Card className="border-slate-700 bg-slate-900">
              <CardHeader>
                <div className="font-semibold text-slate-100 text-lg">{arc.story_title}</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 text-sm leading-relaxed">{arc.summary}</p>

                {/* Sentiment shift */}
                <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-3 text-sm">
                  <div className="text-center">
                    <div className="text-xs text-slate-500">From</div>
                    <div className="text-red-400 font-medium">{arc.sentiment_shift.from}</div>
                  </div>
                  <div className="flex-1 text-center text-slate-500">→</div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500">To</div>
                    <div className="text-emerald-400 font-medium">{arc.sentiment_shift.to}</div>
                  </div>
                  <Separator orientation="vertical" className="bg-slate-700 h-8" />
                  <div className="flex-1 text-xs text-slate-400">{arc.sentiment_shift.reason}</div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
              {/* Timeline */}
              <Card className="border-slate-700 bg-slate-900">
                <CardHeader>
                  <div className="font-medium text-slate-100">Interactive Timeline</div>
                  <div className="text-xs text-slate-500">Bar width = impact level. Color = sentiment.</div>
                </CardHeader>
                <CardContent>
                  <TimelineView events={arc.timeline} />
                </CardContent>
              </Card>

              {/* Right column */}
              <div className="space-y-4">
                {/* Players */}
                <Card className="border-slate-700 bg-slate-900">
                  <CardHeader>
                    <div className="font-medium text-slate-100">Key Players</div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {arc.players.map((p) => <PlayerCard key={p.name} player={p} />)}
                  </CardContent>
                </Card>

                {/* Contrarian */}
                <Card className="border-violet-900 bg-violet-950/40">
                  <CardHeader>
                    <div className="font-medium text-violet-300">🔄 Contrarian View</div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-violet-200 leading-relaxed">{arc.contrarian_view}</p>
                  </CardContent>
                </Card>

                {/* Watch next */}
                <Card className="border-slate-700 bg-slate-900">
                  <CardHeader>
                    <div className="font-medium text-slate-100">👁 What to Watch Next</div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {arc.watch_next.map((w, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-300">
                          <span className="text-violet-400 font-bold shrink-0">{i + 1}.</span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
