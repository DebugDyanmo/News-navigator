# MyET — AI-Native News Experience

> Transforming business news from static articles into **personalized, interactive intelligence**

---

## Problem

Business news in 2026 is still consumed like it's 2005 — static text, same homepage for everyone, fragmented across sources. Users spend 10–15 minutes reading multiple articles and still struggle to extract clear insights.

---

## Solution

**MyET** is an AI-native newsroom with four experience tracks:

| Track | Status | Description |
|---|---|---|
| 🧠 News Navigator | Live demo | One explorable AI briefing synthesized from multiple articles |
| 🎬 AI News Video Studio | Demo | Broadcast-quality 60–120s video from any article |
| 📖 Story Arc Tracker | Demo | Visual narrative: timeline, players, sentiment, predictions |
| 🌐 Vernacular Business Engine | Demo | Context-aware Hindi / Tamil / Telugu / Bengali adaptation |

---

## Experience Tracks

### 🧠 News Navigator

Converts 15–20 articles into a structured intelligence briefing with three sections:
- Sector Impact, Market Reaction, Expert Opinion
- Persona-aware: CFO (dark theme, structured, risk-framed) vs Investor (soft theme, actionable steps)
- Interactive querying — ask a question, get routed to the right section
- LangGraph 7-node pipeline with full audit trail

### 🎬 AI News Video Studio

Paste any ET article URL → AI pipeline produces a broadcast-quality short video:
- Script Agent writes a 60–120s broadcast script
- Scene Planner designs animated data visuals and overlays
- Narration Agent generates voice (ElevenLabs)
- Render Agent assembles final video (FFmpeg)
- Three styles: Broadcast, Explainer, Data Story

**Backend agents required:**
```
backend/agents/video/
  ├── ingestion_agent.py     # Fetch & clean article text
  ├── script_agent.py        # GPT-4o: write broadcast script
  ├── scene_planner.py       # GPT-4o: plan scenes + visual types
  ├── narration_agent.py     # ElevenLabs TTS
  └── render_agent.py        # FFmpeg video assembly
backend/routers/video.py     # POST /video/generate, GET /video/status/{id}
```

### 📖 Story Arc Tracker

Pick any ongoing business story → AI builds a complete visual narrative:
- Interactive timeline with sentiment-coded events and impact levels
- Key players mapped with sentiment and quotes
- Contrarian view surfaced automatically
- "What to Watch Next" predictions
- Sentiment shift analysis (from → to → reason)

**Backend agents required:**
```
backend/agents/story_arc/
  ├── search_agent.py        # Fetch articles for the topic
  ├── timeline_agent.py      # Extract and order events
  ├── player_agent.py        # Identify key players + sentiment
  ├── contrarian_agent.py    # Surface contrarian perspectives
  └── prediction_agent.py    # Generate watch-next predictions
backend/routers/story_arc.py # POST /story-arc
```

### 🌐 Vernacular Business Engine

Real-time, context-aware translation into Hindi, Tamil, Telugu, Bengali:
- Not literal translation — culturally adapted explanations
- Finance jargon simplified with local analogies
- Regional context added (e.g. Tamil Nadu ports, West Bengal trade)
- Cultural analogies (Diwali, Pongal, Durga Puja references)

**Backend agents required:**
```
backend/agents/vernacular/
  ├── translation_agent.py   # GPT-4o: translate + adapt
  ├── jargon_agent.py        # Simplify finance terms per language
  ├── context_agent.py       # Add regional/local context
  └── cultural_agent.py      # Add cultural analogies
backend/routers/vernacular.py # POST /vernacular/translate
```

---

## Architecture Overview

```
Raw Articles / Article URL / Topic Query
          ↓
    Ingestion Agent
          ↓
  Entity Extraction Agent (Groq)
          ↓
  Sentiment + Impact Agent (Groq)
          ↓
  Knowledge Structuring Agent
          ↓
    Synthesis Agent (GPT-4o)
          ↓
      Persona Agent
          ↓
      Query Agent
          ↓
    Frontend (Next.js)
```

---

## Full Project Structure

```
frontend/                          ← This repo (Next.js)
  src/app/
    page.tsx                       ← Home / track selector
    briefing/page.tsx              ← News Navigator
    video-studio/page.tsx          ← AI Video Studio
    story-arc/page.tsx             ← Story Arc Tracker
    vernacular/page.tsx            ← Vernacular Engine
  src/components/
    PersonaToggle.tsx
    ui/                            ← shadcn components
  src/lib/
    api.ts                         ← API client

backend/                           ← FastAPI (separate repo/folder)
  app/
    main.py                        ← FastAPI app entry
    routers/
      briefing.py                  ← GET /personalized, POST /query
      video.py                     ← POST /video/generate, GET /video/status/{id}
      story_arc.py                 ← POST /story-arc
      vernacular.py                ← POST /vernacular/translate
    agents/
      ingestion.py
      extraction.py
      sentiment.py
      synthesis.py
      persona.py
      query.py
      video/
        script_agent.py
        scene_planner.py
        narration_agent.py
        render_agent.py
      story_arc/
        timeline_agent.py
        player_agent.py
        contrarian_agent.py
        prediction_agent.py
      vernacular/
        translation_agent.py
        jargon_agent.py
        context_agent.py
    graph.py                       ← LangGraph pipeline definition
    state.py                       ← Shared state schema
  requirements.txt
  .env
```

---

## Agent Design

| Agent | Role | Model |
|---|---|---|
| Ingestion Agent | Loads & normalizes articles | scraper |
| Entity Extraction | Extracts sectors, topics | Groq |
| Sentiment Agent | Classifies market impact | Groq |
| Knowledge Agent | Structures raw insights | Groq |
| Synthesis Agent | Generates intelligence briefing | GPT-4o |
| Persona Agent | Personalizes output per persona | GPT-4o |
| Query Agent | Handles user questions | GPT-4o |
| Script Agent | Writes broadcast video script | GPT-4o |
| Scene Planner | Plans visual scenes + overlays | GPT-4o |
| Narration Agent | Generates voice narration | ElevenLabs |
| Render Agent | Assembles video | FFmpeg |
| Timeline Agent | Extracts story events | GPT-4o |
| Player Agent | Maps key players + sentiment | GPT-4o |
| Contrarian Agent | Surfaces contrarian views | GPT-4o |
| Translation Agent | Translates + culturally adapts | GPT-4o |
| Jargon Agent | Simplifies finance terms | GPT-4o |
| Context Agent | Adds regional context | GPT-4o |

---

## Tech Stack

- Frontend: Next.js 14, Tailwind CSS, shadcn/ui
- Backend: FastAPI (Python)
- Agent Framework: LangGraph
- LLMs: GPT-4o (reasoning), Groq/LLaMA (extraction, fast ops)
- TTS: ElevenLabs
- Video: FFmpeg
- Database: Supabase (PostgreSQL + storage)
- Deployment: Vercel (frontend), Railway (backend)

---

## Setup

### Frontend

```bash
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Backend

```bash
cd backend
pip install -r requirements.txt
```

`.env`:
```
OPENAI_API_KEY=your_key
GROQ_API_KEY=your_key
ELEVENLABS_API_KEY=your_key   # for video narration
```

```bash
uvicorn app.main:app --reload --port 8000
```

---

## Backend API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/personalized?persona=cfo` | Fetch persona briefing |
| POST | `/query` | Ask a question against briefing |
| POST | `/video/generate` | Submit video generation job |
| GET | `/video/status/{id}` | Poll video job status |
| POST | `/story-arc` | Build story arc for a topic |
| POST | `/vernacular/translate` | Translate + culturally adapt article |

---

## Impact Model

- Before: 8 articles × 2 min = 16 minutes
- After: AI briefing = 3 minutes
- Time saved: ~13 min/session × 10,000 users = 130,000 min/day ≈ ₹3.2 crore/month in time value

---

## Team

Mannat Thukral — Founder & AI Product Lead

---

> "We didn't build a better news app — we built an AI system that thinks, filters, and explains like an analyst."
