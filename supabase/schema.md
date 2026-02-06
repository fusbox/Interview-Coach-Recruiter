-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.answers (
  answer_id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  question_id uuid NOT NULL,
  attempt_number integer NOT NULL DEFAULT 1 CHECK (attempt_number >= 1),
  modality USER-DEFINED NOT NULL DEFAULT 'text'::modality_type,
  draft_text text,
  draft_revision integer NOT NULL DEFAULT 0,
  draft_updated_at timestamp with time zone,
  final_text text,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT answers_pkey PRIMARY KEY (answer_id),
  CONSTRAINT answers_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(session_id),
  CONSTRAINT answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(question_id)
);
CREATE TABLE public.candidate_tokens (
  token_id uuid NOT NULL DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  session_id uuid NOT NULL,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT candidate_tokens_pkey PRIMARY KEY (token_id),
  CONSTRAINT candidate_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(session_id)
);
CREATE TABLE public.eval_results (
  eval_id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  question_id uuid NOT NULL,
  attempt_number integer NOT NULL DEFAULT 1 CHECK (attempt_number >= 1),
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::eval_status,
  feedback_json jsonb,
  model_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT eval_results_pkey PRIMARY KEY (eval_id),
  CONSTRAINT eval_results_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(session_id),
  CONSTRAINT eval_results_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(question_id)
);
CREATE TABLE public.events (
  event_id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  event_type text NOT NULL,
  actor USER-DEFINED NOT NULL,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key text NOT NULL,
  correlation_id uuid,
  event_version integer NOT NULL DEFAULT 1,
  schema_hash text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT events_pkey PRIMARY KEY (event_id),
  CONSTRAINT events_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(session_id)
);
CREATE TABLE public.projection_session_now (
  session_id uuid NOT NULL,
  state_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT projection_session_now_pkey PRIMARY KEY (session_id),
  CONSTRAINT projection_session_now_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(session_id)
);
CREATE TABLE public.questions (
  question_id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  question_index integer NOT NULL CHECK (question_index >= 0),
  question_text text NOT NULL,
  competencies jsonb,
  scoring_dimensions jsonb,
  tts_state USER-DEFINED NOT NULL DEFAULT 'NONE'::tts_status,
  tts_audio_ref text,
  tts_generated_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT questions_pkey PRIMARY KEY (question_id),
  CONSTRAINT questions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(session_id)
);
CREATE TABLE public.sessions (
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  recruiter_id uuid,
  status USER-DEFINED NOT NULL DEFAULT 'NOT_STARTED'::session_status,
  current_question_index integer NOT NULL DEFAULT 0,
  target_role text,
  job_description text,
  intake_json jsonb,
  version integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sessions_pkey PRIMARY KEY (session_id)
);