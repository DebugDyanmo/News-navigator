"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "outline";
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const base =
    "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium";

  const variants = {
    default: "bg-zinc-100 text-zinc-800",
    outline: "border border-zinc-300 text-zinc-300 bg-transparent",
  };

  return (
    <div
      className={cn(base, variants[variant], className)}
      {...props}
    />
  );
}
