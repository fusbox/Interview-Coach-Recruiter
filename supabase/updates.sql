-- MODIFICATIONS FOR INVITE FLOW (First Name / Last Name & Permissions)

-- 1. Ensure RLS policies allow Recruiters to create the necessary child records.
--    The existing policies for 'questions' are permissive (public can insert), 
--    but 'candidate_tokens' has NO insert policy, which would block Invite creation.

-- Policy: Allow Recruiter to insert a token IF they own the session.
drop policy if exists "recruiter_insert_tokens" on candidate_tokens;
create policy "recruiter_insert_tokens" on candidate_tokens
for insert to authenticated
with check (
  exists (
    select 1 from sessions s 
    where s.session_id = candidate_tokens.session_id 
    and s.recruiter_id = auth.uid()
  )
);

-- Policy: Allow Recruiter to insert questions explicitly (hardening beyond 'public')
drop policy if exists "recruiter_insert_questions" on questions;
create policy "recruiter_insert_questions" on questions
for insert to authenticated
with check (
  exists (
    select 1 from sessions s 
    where s.session_id = questions.session_id 
    and s.recruiter_id = auth.uid()
  )
);

-- 2. Note on Schema Changes
--    No table schema changes are required for 'firstName'/'lastName'.
--    These fields are stored within the 'sessions.intake_json' JSONB column.
--    The application logic (SupabaseInviteRepository) maps { firstName, lastName } correctly.

-- 3. (Optional) Cleanup of any orphaned sessions (Development Utility)
-- delete from sessions where created_at < output(now() - interval '1 week');
