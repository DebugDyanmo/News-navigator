"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ─── Types ────────────────────────────────────────────────────────────────────

type VideoJob = {
  id: string;
  status: "queued" | "scripting" | "rendering" | "done" | "error";
  title: string;
  duration_sec?: number;
  script?: string;
  scenes?: Scene[];
  narration_url?: string;
  video_url?: string;
  error?: string;
};

type Scene = {
  index: number;
  headline: string;
  visual_type: "chart" | "text_overlay" | "data_card" | "transition";
  data_label?: string;
  duration_sec: number;
};

// ─── Mock pipeline (replace with real API calls) ──────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function submitVideoJob(articleUrl: string, style: string): Promise<VideoJob> {
  const res = await fetch(`${API_BASE}/video/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ article_url: articleUrl, style }),
  });
  if (!res.ok) throw new Error(`Video API error: ${res.status}`);
  return res.json();
}

async function pollVideoJob(jobId: string): Promise<VideoJob> {
  const res = await fetch(`${API_BASE}/video/status/${jobId}`);
  if (!res.ok) throw new Error(`Poll error: ${res.status}`);
  return res.json();
}

// ─── Demo mock (used when backend is offline) ─────────────────────────────────

function mockJob(): VideoJob {
  return {
    id: "demo-001",
    status: "done",
    title: "Union Budget 2025: What It Means for Markets",
    duration_sec: 90,
    script:
      "India's Union Budget 2025 has set the stage for a significant fiscal shift. Capital expenditure rises 11% to ₹11.1 lakh crore, signalling a strong infrastructure push. Markets reacted swiftly — Nifty gained 1.2% on budget day as defence and railways stocks surged. Experts warn fiscal deficit at 4.9% of GDP leaves limited room for rate cuts. Watch: FII flows, 10-year yield, and Q1 capex disbursements.",
    scenes: [
      { index: 0, headline: "Budget 2025 Overview", visual_type: "text_overlay", duration_sec: 8 },
      { index: 1, headline: "Capex +11% to ₹11.1L Cr", visual_type: "data_card", data_label: "₹11.1L Cr", duration_sec: 12 },
      { index: 2, headline: "Nifty +1.2% on Budget Day", visual_type: "chart", data_label: "Nifty 50", duration_sec: 15 },
      { index: 3, headline: "Fiscal Deficit: 4.9% of GDP", visual_type: "data_card", data_label: "4.9%", duration_sec: 12 },
      { index: 4, headline: "What to Watch Next", visual_type: "text_overlay", duration_sec: 10 },
      { index: 5, headline: "End Card", visual_type: "transition", duration_sec: 5 },
    ],
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const VISUAL_ICONS: Record<Scene["visual_type"], string> = {
  chart: "📈",
  text_overlay: "📝",
  data_card: "🃏",
  transition: "🎬",
};

const STATUS_STEPS = ["queued", "scripting", "rendering", "done"] as const;

function PipelineProgress({ status }: { status: VideoJob["status"] }) {
  const idx = STATUS_STEPS.indexOf(status as any);
  return (
    <div className="flex items-center gap-2 mt-3">
      {STATUS_STEPS.map((step, i) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={[
                "h-2.5 w-2.5 rounded-full transition-colors",
                i < idx ? "bg-emerald-500" : i === idx ? "bg-indigo-500 animate-pulse" : "bg-zinc-200",
              ].join(" ")}
            />
            <span className="text-[10px] text-zinc-500 capitalize">{step}</span>
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <div className={`h-0.5 flex-1 mb-3 transition-colors ${i < idx ? "bg-emerald-400" : "bg-zinc-200"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function SceneTimeline({ scenes }: { scenes: Scene[] }) {
  const total = scenes.reduce((s, sc) => s + sc.duration_sec, 0);
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Scene Timeline ({total}s)</div>
      <div className="flex rounded-lg overflow-hidden h-8">
        {scenes.map((sc) => (
          <div
            key={sc.index}
            title={sc.headline}
            style={{ flex: sc.duration_sec }}
            className={[
              "flex items-center justify-center text-[10px] font-medium border-r border-white/30 last:border-0 transition-all hover:brightness-110 cursor-default",
              sc.visual_type === "chart" ? "bg-indigo-500 text-white" :
              sc.visual_type === "data_card" ? "bg-violet-500 text-white" :
              sc.visual_type === "text_overlay" ? "bg-zinc-700 text-white" :
              "bg-zinc-300 text-zinc-700",
            ].join(" ")}
          >
            {VISUAL_ICONS[sc.visual_type]}
          </div>
        ))}
      </div>
      <div className="grid gap-1.5">
        {scenes.map((sc) => (
          <div key={sc.index} className="flex items-center gap-2 text-xs text-zinc-700">
            <span className="w-5 text-center">{VISUAL_ICONS[sc.visual_type]}</span>
            <span className="flex-1">{sc.headline}</span>
            {sc.data_label && (
              <Badge variant="outline" className="text-[10px]">{sc.data_label}</Badge>
            )}
            <span className="text-zinc-400">{sc.duration_sec}s</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const STYLE_OPTIONS = [
  { id: "broadcast", label: "📺 Broadcast", desc: "News anchor style, formal tone" },
  { id: "explainer", label: "🎓 Explainer", desc: "Simple, educational, step-by-step" },
  { id: "data_story", label: "📊 Data Story", desc: "Chart-heavy, numbers-first" },
];

export default function VideoStudioPage() {
  const [articleUrl, setArticleUrl] = React.useState("");
  const [style, setStyle] = React.useState("broadcast");
  const [job, setJob] = React.useState<VideoJob | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [useMock, setUseMock] = React.useState(false);

  async function handleGenerate() {
    if (!articleUrl.trim() && !useMock) return;
    setLoading(true);
    setError(null);
    setJob(null);
    try {
      if (useMock) {
        await new Promise((r) => setTimeout(r, 1200));
        setJob(mockJob());
        return;
      }
      const submitted = await submitVideoJob(articleUrl.trim(), style);
      setJob(submitted);
      // Poll until done
      let attempts = 0;
      while (submitted.status !== "done" && submitted.status !== "error" && attempts < 30) {
        await new Promise((r) => setTimeout(r, 3000));
        const updated = await pollVideoJob(submitted.id);
        setJob({ ...updated });
        if (updated.status === "done" || updated.status === "error") break;
        attempts++;
      }
    } catch (e: any) {
      setError(e.message || "Failed to generate video.");
      setUseMock(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-zinc-700 bg-zinc-950/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <div>
            <div className="text-xs font-medium tracking-wide text-zinc-500">AI NEWS VIDEO STUDIO</div>
            <div className="text-lg font-semibold text-zinc-100">Broadcast-Quality Video from Any Article</div>
          </div>
          <Badge className="ml-auto border-amber-700 bg-amber-950 text-amber-300">Roadmap</Badge>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Intro */}
        <p className="text-zinc-400 max-w-2xl">
          Paste any ET article URL. The AI pipeline writes a broadcast script, plans scenes with animated data visuals,
          generates narration, and assembles a 60–120 second video — fully automated.
        </p>

        {/* Input card */}
        <Card className="border-zinc-700 bg-zinc-900">
          <CardHeader>
            <div className="font-medium text-zinc-100">Generate Video</div>
            <div className="text-sm text-zinc-400">Paste an article URL or use the demo mode.</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={articleUrl}
              onChange={(e) => setArticleUrl(e.target.value)}
              placeholder="https://economictimes.indiatimes.com/..."
              className="bg-zinc-800 border-zinc-600 text-zinc-100 placeholder:text-zinc-500"
            />

            {/* Style selector */}
            <div className="grid grid-cols-3 gap-2">
              {STYLE_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={[
                    "rounded-lg border p-3 text-left transition-colors",
                    style === s.id
                      ? "border-indigo-500 bg-indigo-950 text-indigo-100"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700",
                  ].join(" ")}
                >
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="text-xs mt-0.5 opacity-70">{s.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                {loading ? "Generating…" : "🎬 Generate Video"}
              </Button>
              <button
                type="button"
                onClick={() => { setUseMock(true); handleGenerate(); }}
                className="text-xs text-zinc-500 hover:text-zinc-300 underline"
              >
                Try demo (no backend)
              </button>
            </div>

            {error && (
              <div className="text-sm text-amber-400 bg-amber-950/50 border border-amber-800 rounded-lg p-3">
                {error} — switched to demo mode.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job output */}
        {(loading || job) && (
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <Card className="border-zinc-700 bg-zinc-900">
              <CardHeader>
                <div className="font-medium text-zinc-100">{job?.title || "Processing…"}</div>
                {job && <PipelineProgress status={job.status} />}
              </CardHeader>
              <CardContent className="space-y-5">
                {loading && !job && (
                  <div className="space-y-2 animate-pulse">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-3 rounded bg-zinc-700" style={{ width: `${80 - i * 10}%` }} />
                    ))}
                  </div>
                )}

                {job?.script && (
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-2">AI Script</div>
                    <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                      {job.script}
                    </p>
                  </div>
                )}

                {job?.scenes && (
                  <>
                    <Separator className="bg-zinc-700" />
                    <SceneTimeline scenes={job.scenes} />
                  </>
                )}

                {job?.status === "done" && (
                  <>
                    <Separator className="bg-zinc-700" />
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                        onClick={() => job.video_url && window.open(job.video_url)}
                        disabled={!job.video_url}
                      >
                        ▶ Play Video
                      </Button>
                      <Button
                        variant="outline"
                        className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                        onClick={() => job.narration_url && window.open(job.narration_url)}
                        disabled={!job.narration_url}
                      >
                        🔊 Play Narration
                      </Button>
                    </div>
                    {!job.video_url && (
                      <div className="text-xs text-zinc-500">
                        Video rendering requires the backend video pipeline (ElevenLabs + FFmpeg). Scene plan and script are ready above.
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Pipeline info */}
            <Card className="border-zinc-700 bg-zinc-900 h-fit">
              <CardHeader>
                <div className="font-medium text-zinc-100">Pipeline Agents</div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {[
                  { agent: "Ingestion Agent", role: "Fetches & cleans article text", model: "scraper" },
                  { agent: "Script Agent", role: "Writes broadcast script", model: "GPT-4o" },
                  { agent: "Scene Planner", role: "Plans visual scenes & overlays", model: "GPT-4o" },
                  { agent: "Narration Agent", role: "Generates voice narration", model: "ElevenLabs" },
                  { agent: "Render Agent", role: "Assembles video with FFmpeg", model: "FFmpeg" },
                ].map((a) => (
                  <div key={a.agent} className="flex items-start gap-2 p-2 rounded-lg bg-zinc-800 border border-zinc-700">
                    <div className="flex-1">
                      <div className="font-medium text-zinc-200">{a.agent}</div>
                      <div className="text-zinc-500">{a.role}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-zinc-600 text-zinc-400 shrink-0">{a.model}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
