-- FIX: Ensure Recruiters can insert Sessions
-- The error "new row violates row-level security policy for table sessions"
-- implies this policy is missing or incorrect.

-- 1. Enable RLS (Ensure it's on)
alter table sessions enable row level security;

-- 2. Drop existing policy to cleanly replace
drop policy if exists "recruiter_insert_sessions" on sessions;

-- 3. Create the Policy
-- This allows an authenticated user to insert a row IF the 'recruiter_id' 
-- column matches their own User ID.
create policy "recruiter_insert_sessions" 
on sessions 
for insert 
to authenticated 
with check (
  recruiter_id = auth.uid()
);

-- 4. Also ensure Select policy exists (so they can see what they created)
drop policy if exists "recruiter_select_sessions" on sessions;
create policy "recruiter_select_sessions" 
on sessions 
for select 
to authenticated 
using (
  recruiter_id = auth.uid()
);
