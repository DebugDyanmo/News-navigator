"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { PersonaToggle } from "@/components/PersonaToggle";
import type { Persona } from "@/components/PersonaToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { postQuery, fetchPersonalized } from "@/lib/api";

/* ===================== ORIGINAL CODE MOVED HERE ===================== */

function BriefingContent() {
  const sp = useSearchParams();
  const initialPersona = ((sp.get("persona") as Persona) || "cfo") as Persona;

  // ⬇️ KEEP EVERYTHING EXACTLY SAME BELOW (no logic change)

  const [persona, setPersona] = React.useState<Persona>(initialPersona);
  const [briefing, setBriefing] = React.useState<any>(null);
  const [trace, setTrace] = React.useState<any>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [queryLoading, setQueryLoading] = React.useState(false);
  const [queryError, setQueryError] = React.useState<string | null>(null);
  const [question, setQuestion] = React.useState("");
  const [selectedKey, setSelectedKey] = React.useState<any>("sector_impact");
  const [queryResp, setQueryResp] = React.useState<any>(null);
  const [queryHistory, setQueryHistory] = React.useState<string[]>([]);
  const [startedAt] = React.useState(() => Date.now());
  const [secondsOnPage, setSecondsOnPage] = React.useState(0);

  const itRef = React.useRef<HTMLDivElement | null>(null);
  const marketRef = React.useRef<HTMLDivElement | null>(null);
  const expertsRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const id = window.setInterval(
      () => setSecondsOnPage(Math.floor((Date.now() - startedAt) / 1000)),
      1000
    );
    return () => window.clearInterval(id);
  }, [startedAt]);

  React.useEffect(() => {
    loadPersonalized(initialPersona);
  }, [initialPersona]);

  async function loadPersonalized(p: Persona) {
    setLoading(true);
    try {
      const data = await fetchPersonalized(p);
      setBriefing(data);
      setTrace(data.trace || []);
    } catch {
      setLoadError("Backend not reachable");
    } finally {
      setLoading(false);
    }
  }

  async function runQuery() {
    if (!question) return;
    setQueryLoading(true);
    try {
      const resp = await postQuery(persona, question);
      setQueryResp(resp);
      setTrace(resp.trace || []);
    } catch {
      setQueryError("Query failed");
    } finally {
      setQueryLoading(false);
    }
  }

  const sc = briefing?.persona_briefing;

  return (
    <main className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">AI Intelligence Briefing</h1>
        <PersonaToggle persona={persona} onChange={setPersona} />
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <Card>
            <CardHeader>Sector Impact</CardHeader>
            <CardContent>{sc?.sector_impact}</CardContent>
          </Card>

          <Card>
            <CardHeader>Market Reaction</CardHeader>
            <CardContent>{sc?.market_reaction}</CardContent>
          </Card>

          <Card>
            <CardHeader>Expert Opinion</CardHeader>
            <CardContent>{sc?.expert_opinion}</CardContent>
          </Card>
        </>
      )}

      <div className="mt-4">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask something..."
        />
        <Button onClick={runQuery} className="mt-2">
          Ask
        </Button>

        {queryResp && (
          <Card className="mt-3">
            <CardHeader>Answer</CardHeader>
            <CardContent>{JSON.stringify(queryResp)}</CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

/* ===================== FINAL EXPORT FIX ===================== */

export default function BriefingPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading briefing...</div>}>
      <BriefingContent />
    </Suspense>
  );
}
