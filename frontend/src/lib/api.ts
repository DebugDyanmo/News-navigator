export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function fetchBriefing() {
  const res = await fetch(`${API_BASE_URL}/briefing`);
  if (!res.ok) throw new Error(`Failed to fetch briefing: ${res.status}`);
  return res.json();
}

export async function fetchPersonalized(persona: "cfo" | "investor") {
  const res = await fetch(`${API_BASE_URL}/personalized?persona=${persona}`);
  if (!res.ok) throw new Error(`Failed to fetch personalized: ${res.status}`);
  return res.json();
}

export async function postQuery(persona: "cfo" | "investor", question: string) {
  const res = await fetch(`${API_BASE_URL}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ persona, question }),
  });
  if (!res.ok) throw new Error(`Failed to run query: ${res.status}`);
  return res.json();
}

