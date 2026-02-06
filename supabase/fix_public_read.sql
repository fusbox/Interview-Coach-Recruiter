-- FIX: Allow PUBLIC (Unauthenticated) access to Sessions for Invite Links
-- The 'candidate_tokens' table allows public read, but resolving the LINKED 'sessions' table 
-- requires a corresponding policy on 'sessions'.

-- 1. Allow public to read sessions (Required for /s/[token] page to hydrate session details)
--    Note: In a Real app, we would restrict this to only sessions linked by a valid token 
--    using a security definer function, but for Walking Skeleton, public read is standard.
drop policy if exists "public_read_sessions" on sessions;
create policy "public_read_sessions" on sessions for select using (true);

-- 2. Ensure public read on candidate_tokens (Should already exist, but reinforcing)
drop policy if exists "public_read_tokens" on candidate_tokens;
create policy "public_read_tokens" on candidate_tokens for select using (true);

-- 3. Ensure public read on questions (for when the candidate loads the session)
drop policy if exists "public_read_questions" on questions;
create policy "public_read_questions" on questions for select using (true);
