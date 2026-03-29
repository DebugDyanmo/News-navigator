import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type * as React from "react";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "MyET Navigator",
  description: "AI-native newsroom briefing with persona personalization",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

