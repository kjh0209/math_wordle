-- ============================================================
-- Mathdle — Initial schema migration
-- Run against your Supabase project via:
--   supabase db push
-- or paste into the Supabase SQL editor.
-- ============================================================

-- ─── puzzles ────────────────────────────────────────────────────��─────────────

create table if not exists puzzles (
  id                         text primary key,
  title                      text not null,
  level                      text not null,
  difficulty                 text not null check (difficulty in ('easy','medium','hard')),
  category                   text not null,

  -- Extracted variable fields (null when has_variable = false)
  variable_name              text null,
  variable_value_expression  text null,
  variable_value_display     text null,

  -- Extracted answer fields
  answer_expression          text not null,
  answer_display             text not null,
  answer_length              int  not null,

  -- Rule / token / block metadata
  rules                      jsonb not null default '{}'::jsonb,
  shown_tokens               jsonb not null default '[]'::jsonb,
  shown_blocks               jsonb not null default '[]'::jsonb,

  -- Full original puzzle JSON (source of truth)
  raw_payload                jsonb not null,

  -- Flags
  has_variable               boolean not null default false,
  is_daily                   boolean not null default false,
  daily_date                 date unique null,
  is_public                  boolean not null default true,

  -- Provenance
  source_type                text not null default 'manual'
                               check (source_type in ('manual','imported-json','ai-generated')),
  created_by                 text null,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create index if not exists idx_puzzles_level       on puzzles (level);
create index if not exists idx_puzzles_difficulty  on puzzles (difficulty);
create index if not exists idx_puzzles_category    on puzzles (category);
create index if not exists idx_puzzles_is_daily    on puzzles (is_daily);
create index if not exists idx_puzzles_daily_date  on puzzles (daily_date);
create index if not exists idx_puzzles_has_variable on puzzles (has_variable);
create index if not exists idx_puzzles_is_public   on puzzles (is_public);
create index if not exists idx_puzzles_source_type on puzzles (source_type);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_puzzles_updated_at on puzzles;
create trigger trg_puzzles_updated_at
  before update on puzzles
  for each row execute function update_updated_at();

-- ─── play_sessions ────────────────────────────────────────────────────────────

create table if not exists play_sessions (
  id          uuid primary key default gen_random_uuid(),
  session_key text unique not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_sessions_updated_at on play_sessions;
create trigger trg_sessions_updated_at
  before update on play_sessions
  for each row execute function update_updated_at();

-- ─── play_records ─────────────────────────────────────────────────────────────

create table if not exists play_records (
  id               uuid primary key default gen_random_uuid(),
  puzzle_id        text not null references puzzles(id) on delete cascade,
  play_session_id  uuid not null references play_sessions(id) on delete cascade,
  mode             text not null check (mode in ('daily','practice','shared')),
  attempts_count   int  not null,
  max_attempts     int  not null,
  cleared          boolean not null,
  clear_time_ms    int  null,
  -- Each element is a JSON array of PuzzleCell objects
  guess_history    jsonb not null default '[]'::jsonb,
  feedback_history jsonb not null default '[]'::jsonb,
  share_code       text unique null,
  started_at       timestamptz not null default now(),
  completed_at     timestamptz null,
  created_at       timestamptz not null default now()
);

create index if not exists idx_play_records_puzzle_id       on play_records (puzzle_id);
create index if not exists idx_play_records_play_session_id on play_records (play_session_id);
create index if not exists idx_play_records_mode            on play_records (mode);
create index if not exists idx_play_records_cleared         on play_records (cleared);
create index if not exists idx_play_records_created_at      on play_records (created_at);
create index if not exists idx_play_records_share_code      on play_records (share_code);

-- ─── puzzle_import_jobs ───────────────────────────────────────────────────────

create table if not exists puzzle_import_jobs (
  id              uuid primary key default gen_random_uuid(),
  source_name     text null,
  status          text not null default 'pending'
                    check (status in ('pending','success','failed')),
  imported_count  int  not null default 0,
  failed_count    int  not null default 0,
  raw_payload     jsonb null,   -- The full JSON array that was submitted
  error_log       jsonb null,   -- Array of { id, error } objects
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists trg_import_jobs_updated_at on puzzle_import_jobs;
create trigger trg_import_jobs_updated_at
  before update on puzzle_import_jobs
  for each row execute function update_updated_at();

-- ─── puzzle_generation_jobs ───────────────────────────────────────────────────

create table if not exists puzzle_generation_jobs (
  id                    uuid primary key default gen_random_uuid(),
  requested_level       text null,
  requested_difficulty  text null,
  requested_category    text null,
  requested_constraints jsonb null,
  status                text not null default 'pending'
                          check (status in ('pending','success','failed')),
  model                 text null,
  raw_prompt            text null,
  raw_response          text null,
  parsed_payload        jsonb null,   -- The PuzzleRawPayload if parsing succeeded
  error_message         text null,
  created_puzzle_id     text null references puzzles(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists trg_gen_jobs_updated_at on puzzle_generation_jobs;
create trigger trg_gen_jobs_updated_at
  before update on puzzle_generation_jobs
  for each row execute function update_updated_at();

-- ─── RLS policies (basic: anon can read public/daily puzzles) ─────────────────

alter table puzzles        enable row level security;
alter table play_sessions  enable row level security;
alter table play_records   enable row level security;

-- Public read for public puzzles
create policy "Public puzzles are readable" on puzzles
  for select using (is_public = true);

-- Service role bypasses RLS (used by admin API and import scripts)
-- No additional policy needed — service role ignores RLS.

-- Anon users can insert their own session
create policy "Anyone can upsert their session" on play_sessions
  for all using (true) with check (true);

-- Anon users can insert play records
create policy "Anyone can insert play records" on play_records
  for insert with check (true);

-- Anyone can read play records (for leaderboard)
create policy "Play records are publicly readable" on play_records
  for select using (true);
