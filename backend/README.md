# MyET Navigator Backend

FastAPI + LangGraph multi-agent pipeline (Ingestion → Extraction → Sentiment/Impact → Structuring → Synthesis → Persona → Query).

## Endpoints
- `GET /briefing` → Union Budget intelligence (three sections, non-personalized)
- `GET /personalized?persona=cfo|investor` → persona-transformed three sections
- `POST /query` with `{ "persona": "...", "question": "..." }` → vector-selected section(s) + focused answers

## Model routing (cost-efficient)
- Extraction / Impact / Persona / Query rewrite: Groq (chat + embeddings)
- Synthesis: OpenAI GPT-4o (reasoning-heavy)

## Supabase pgvector (optional)
If `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set, the query agent will store embeddings for the current run and use `pgvector` via `match_briefing_sections`.

See `supabase.sql`.

