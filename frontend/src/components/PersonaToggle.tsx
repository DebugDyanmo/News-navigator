"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type Persona = "cfo" | "investor";

export function PersonaToggle({
  persona,
  onChange,
}: {
  persona: Persona;
  onChange: (p: Persona) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Badge className="shrink-0">Persona</Badge>
      <div className="flex rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => onChange("cfo")}
          className={[
            "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            persona === "cfo" ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-50",
          ].join(" ")}
        >
          CFO
        </button>
        <button
          type="button"
          onClick={() => onChange("investor")}
          className={[
            "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            persona === "investor" ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-50",
          ].join(" ")}
        >
          Young investor
        </button>
      </div>
    </div>
  );
}

