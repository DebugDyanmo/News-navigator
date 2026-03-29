"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { PersonaToggle } from "@/components/PersonaToggle";
import type { Persona } from "@/components/PersonaToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const TRACKS = [
  {
    id: "navigator",
    title: "News Navigator",
    desc: "One explorable AI briefing synthesized from multiple articles.",
    status: "Live demo",
    href: "/briefing",
    emoji: "🧠",
  },
  {
    id: "video",
    title: "AI News Video Studio",
    desc: "Auto-generate 60–120 sec broadcast-quality videos with narration and data overlays.",
    status: "Demo",
    href: "/video-studio",
    emoji: "🎬",
  },
  {
    id: "arc",
    title: "Story Arc Tracker",
    desc: "Interactive timeline, key players mapped, sentiment shifts, contrarian views, and predictions.",
    status: "Demo",
    href: "/story-arc",
    emoji: "📖",
  },
  {
    id: "vernacular",
    title: "Vernacular Business Engine",
    desc: "Context-aware Hindi, Tamil, Telugu, Bengali — culturally adapted, not literal translation.",
    status: "Demo",
    href: "/vernacular",
    emoji: "🌐",
  },
] as const;

export default function HomePage() {
  const router = useRouter();
  const [persona, setPersona] = React.useState<Persona>("cfo");
  const [selectedTrack, setSelectedTrack] = React.useState<(typeof TRACKS)[number]["id"]>("navigator");

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-3xl">
            <div className="text-xs font-medium tracking-wide text-zinc-500">THE PERSONALIZED NEWSROOM</div>
            <h1 className="text-4xl font-semibold mt-2">My ET</h1>
            <p className="mt-3 text-zinc-700">
              Not just a filtered feed — a fundamentally different news experience for every user. This demo focuses on:
              <span className="font-medium"> News Navigator</span> (interactive intelligence briefings).
            </p>
          </div>
          <PersonaToggle persona={persona} onChange={setPersona} />
        </div>

        <div className="mt-8">
          <div className="text-xs font-medium tracking-wide text-zinc-500">EXPERIENCE TRACKS</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {TRACKS.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => { setSelectedTrack(t.id); router.push(t.href + `?persona=${persona}`); }}
                className={[
                  "text-left rounded-xl border p-4 transition-colors",
                  selectedTrack === t.id
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{t.emoji} {t.title}</div>
                  <div
                    className={[
                      "text-[11px] rounded-full px-2 py-1 border",
                      selectedTrack === t.id ? "border-zinc-600 text-zinc-200" : "border-zinc-200 text-zinc-600",
                    ].join(" ")}
                  >
                    {t.status}
                  </div>
                </div>
                <div className={["text-sm mt-1", selectedTrack === t.id ? "text-zinc-200" : "text-zinc-600"].join(" ")}>
                  {t.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card className="border-zinc-900/10 shadow-sm">
            <CardHeader>
              <div className="font-medium">Persona outcome preview</div>
              <div className="text-sm text-zinc-600">
                {persona === "cfo"
                  ? "CFO: macro-aware, risk-framed, execution watchpoints."
                  : "Young investor: plain-English, actionable next steps."}
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
                {persona === "cfo"
                  ? "You’ll see structured IT/Market/Experts sections with risk watchlists and scenario cues."
                  : "You’ll get the same briefing transformed into simpler language with practical takeaways."}
              </div>
              <Button className="w-full mt-4" size="lg" onClick={() => router.push(`/briefing?persona=${persona}`)}>
                Open Interactive Briefing →
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="font-medium">Judge-facing value</div>
              <div className="text-sm text-zinc-600">
                Designed to maximize autonomy, engagement, and personalization depth.
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg border border-zinc-200 p-3">
                  <div className="text-zinc-500">Autonomy</div>
                  <div className="font-semibold">Ingest → extract → personalize</div>
                </div>
                <div className="rounded-lg border border-zinc-200 p-3">
                  <div className="text-zinc-500">Multi-agent</div>
                  <div className="font-semibold">7-node LangGraph</div>
                </div>
                <div className="rounded-lg border border-zinc-200 p-3">
                  <div className="text-zinc-500">Cost routing</div>
                  <div className="font-semibold">Groq + GPT split</div>
                </div>
                <div className="rounded-lg border border-zinc-200 p-3">
                  <div className="text-zinc-500">Enterprise-ready</div>
                  <div className="font-semibold">Trace + graceful fallback</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

