-- Supabase pgvector setup for MyET Navigator
-- Run this in Supabase SQL editor (or via migrations).

create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists public.briefing_sections (
  id uuid primary key default gen_random_uuid(),
  run_id text not null,
  persona text not null,
  section_key text not null,
  content text not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);

-- Matches the most relevant section embeddings for a given run + persona.
-- Uses cosine distance: lower distance => higher similarity.
create or replace function public.match_briefing_sections(
  run_id_in text,
  persona_in text,
  query_embedding vector(1536),
  k_in int
)
returns table (
  section_key text,
  content text,
  match_score float
)
language sql stable
as $$
  select
    bs.section_key,
    bs.content,
    (1 - (bs.embedding <=> query_embedding)) as match_score
  from public.briefing_sections bs
  where bs.run_id = run_id_in
    and bs.persona = persona_in
  order by bs.embedding <=> query_embedding
  limit k_in;
$$;

