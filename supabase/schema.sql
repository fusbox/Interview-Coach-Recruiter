-- Minimal Postgres DDL (Supabase-friendly) for the Walking Skeleton
-- Assumes Supabase Postgres. Run in SQL editor with appropriate privileges.

-- 0) Extensions
create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- 1) Enums
do $$ begin
  create type session_status as enum (
    'NOT_STARTED',
    'GENERATING_QUESTIONS',
    'IN_SESSION',
    'AWAITING_EVAL',
    'ERROR',
    'COMPLETED'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type actor_type as enum ('candidate','recruiter','system');
exception when duplicate_object then null; end $$;

do $$ begin
  create type eval_status as enum ('NONE','PENDING','COMPLETE','FAILED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type modality_type as enum ('text','voice');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tts_status as enum ('NONE','GENERATING','READY','FAILED');
exception when duplicate_object then null; end $$;

-- 2) Sessions
create table if not exists sessions (
  session_id uuid primary key default gen_random_uuid(),

  -- recruiter_id is optional for the candidate-only slice, but useful for later.
  recruiter_id uuid null,

  status session_status not null default 'NOT_STARTED',
  current_question_index int not null default 0,

  -- Context fields kept minimal for slice; expand later
  target_role text null,
  job_description text null,
  intake_json jsonb null,

  -- Optional optimistic concurrency / cache-busting
  version int not null default 1,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sessions_recruiter_id on sessions (recruiter_id);
create index if not exists idx_sessions_status on sessions (status);

-- Keep updated_at current
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_sessions_updated_at on sessions;
create trigger trg_sessions_updated_at
before update on sessions
for each row execute function set_updated_at();

-- 3) Candidate tokens (store only hashes)
create table if not exists candidate_tokens (
  token_id uuid primary key default gen_random_uuid(),

  -- store hash of raw token; raw token is only ever shown once in URL
  token_hash text not null unique,

  session_id uuid not null references sessions(session_id) on delete cascade,

  expires_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_candidate_tokens_session_id on candidate_tokens(session_id);

-- 4) Events (append-only)
create table if not exists events (
  event_id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(session_id) on delete cascade,

  event_type text not null,
  actor actor_type not null,
  occurred_at timestamptz not null default now(),

  payload jsonb not null default '{}'::jsonb,

  idempotency_key text not null,
  correlation_id uuid null, -- User requested UUID type

  -- optional safety: event schema versioning / hashing
  event_version int not null default 1,
  schema_hash text null,

  created_at timestamptz not null default now(),

  -- Idempotency: one event per (session, type, key)
  constraint uq_events_idempotency unique (session_id, event_type, idempotency_key)
);

create index if not exists idx_events_session_time on events(session_id, occurred_at desc);
create index if not exists idx_events_correlation_id on events(correlation_id);

-- 5) Questions
create table if not exists questions (
  question_id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(session_id) on delete cascade,

  question_index int not null,
  question_text text not null,

  -- optional: store structured data for later
  competencies jsonb null,
  scoring_dimensions jsonb null,

  tts_state tts_status not null default 'NONE',
  tts_audio_ref text null, -- could be a signed URL pointer, storage key, etc.
  tts_generated_at timestamptz null,

  created_at timestamptz not null default now(),

  constraint uq_questions_session_index unique (session_id, question_index)
);

create index if not exists idx_questions_session_id on questions(session_id);

-- 6) Answers (draft + final in one row per attempt)
create table if not exists answers (
  answer_id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(session_id) on delete cascade,
  question_id uuid not null references questions(question_id) on delete cascade,

  attempt_number int not null default 1,
  modality modality_type not null default 'text',

  draft_text text null,
  draft_revision int not null default 0,
  draft_updated_at timestamptz null,

  final_text text null,
  submitted_at timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint uq_answers_question_attempt unique (question_id, attempt_number)
);

create index if not exists idx_answers_session_id on answers(session_id);
create index if not exists idx_answers_question_id on answers(question_id);

drop trigger if exists trg_answers_updated_at on answers;
create trigger trg_answers_updated_at
before update on answers
for each row execute function set_updated_at();

-- 7) Evaluation results
create table if not exists eval_results (
  eval_id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(session_id) on delete cascade,
  question_id uuid not null references questions(question_id) on delete cascade,

  attempt_number int not null default 1,
  status eval_status not null default 'PENDING',

  feedback_json jsonb null,
  model_metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint uq_eval_question_attempt unique (question_id, attempt_number)
);

create index if not exists idx_eval_session_id on eval_results(session_id);
create index if not exists idx_eval_question_id on eval_results(question_id);
create index if not exists idx_eval_status on eval_results(status);

drop trigger if exists trg_eval_results_updated_at on eval_results;
create trigger trg_eval_results_updated_at
before update on eval_results
for each row execute function set_updated_at();

-- 8) Optional: projection table for /now (materialize later if needed)
create table if not exists projection_session_now (
  session_id uuid primary key references sessions(session_id) on delete cascade,
  state_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_projection_session_now_updated_at on projection_session_now;
create trigger trg_projection_session_now_updated_at
before update on projection_session_now
for each row execute function set_updated_at();

-- 9) RLS Policies

alter table sessions enable row level security;
alter table candidate_tokens enable row level security;
alter table events enable row level security;
alter table questions enable row level security;
alter table answers enable row level security;
alter table eval_results enable row level security;
alter table projection_session_now enable row level security;

-- Recruiter Access
drop policy if exists "recruiter_select_sessions" on sessions;
create policy "recruiter_select_sessions" on sessions for select to authenticated using (recruiter_id = auth.uid());

drop policy if exists "recruiter_insert_sessions" on sessions;
create policy "recruiter_insert_sessions" on sessions for insert to authenticated with check (recruiter_id = auth.uid());

drop policy if exists "recruiter_select_questions" on questions;
create policy "recruiter_select_questions" on questions for select to authenticated using (exists (
  select 1 from sessions s where s.session_id = questions.session_id and s.recruiter_id = auth.uid()
));

drop policy if exists "recruiter_select_answers" on answers;
create policy "recruiter_select_answers" on answers for select to authenticated using (exists (
  select 1 from sessions s where s.session_id = answers.session_id and s.recruiter_id = auth.uid()
));

drop policy if exists "recruiter_select_eval_results" on eval_results;
create policy "recruiter_select_eval_results" on eval_results for select to authenticated using (exists (
  select 1 from sessions s where s.session_id = eval_results.session_id and s.recruiter_id = auth.uid()
));

-- Candidate Access (Public/Token based)
-- For V1, we allow anyone to read 'candidate_tokens' to resolve the session_id
drop policy if exists "public_read_tokens" on candidate_tokens;
create policy "public_read_tokens" on candidate_tokens for select using (true);

-- We allow reading sessions if you have the ID (UUID security)
-- In production, this should be tighter.
drop policy if exists "public_read_sessions" on sessions;
create policy "public_read_sessions" on sessions for select using (true);
drop policy if exists "public_update_sessions" on sessions;
create policy "public_update_sessions" on sessions for update using (true);

drop policy if exists "public_create_questions" on questions;
create policy "public_create_questions" on questions for insert with check (true);
drop policy if exists "public_read_questions" on questions;
create policy "public_read_questions" on questions for select using (true);

drop policy if exists "public_create_answers" on answers;
create policy "public_create_answers" on answers for insert with check (true);
drop policy if exists "public_read_answers" on answers;
create policy "public_read_answers" on answers for select using (true);
drop policy if exists "public_update_answers" on answers;
create policy "public_update_answers" on answers for update using (true);

-- 10) Constraints
alter table questions add constraint chk_question_index_nonneg check (question_index >= 0);
alter table answers add constraint chk_attempt_number_min check (attempt_number >= 1);
alter table eval_results add constraint chk_eval_attempt_number_min check (attempt_number >= 1);
