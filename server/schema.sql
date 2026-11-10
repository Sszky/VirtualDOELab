-- Virtual DOE Lab: experiment history
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to run again (it only creates what is missing).

create table if not exists experiment_sessions (
  id          uuid primary key default gen_random_uuid(),
  owner       text not null,                 -- 'user:<Clerk user id>'
  sim         text not null check (sim in ('parachute', 'paperHelicopter', 'waterBottleRocket', 'catapult')),
  name        text not null default '' check (char_length(name) <= 80),
  run_count   integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists experiment_sessions_owner_idx
  on experiment_sessions (owner, sim, updated_at desc);

create table if not exists experiment_runs (
  id          bigint generated always as identity primary key,
  session_id  uuid not null references experiment_sessions (id) on delete cascade,
  run_no      integer not null,
  mode        text not null check (mode in ('deterministic', 'stochastic')),
  params      jsonb not null,                -- factor values used (after range checks)
  summary     jsonb not null,                -- results computed by the server
  created_at  timestamptz not null default now(),
  unique (session_id, run_no)
);

-- Only our server (which connects as the database owner) may read or write these tables.
-- Row Level Security with no policies blocks Supabase's public REST API (anon / authenticated keys).
alter table experiment_sessions enable row level security;
alter table experiment_runs enable row level security;
