-- Create recruiter_profiles table
create table if not exists recruiter_profiles (
  recruiter_id uuid primary key references auth.users(id) on delete cascade,
  first_name text null,
  last_name text null,
  phone text null,
  timezone text null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table recruiter_profiles enable row level security;

drop policy if exists "Users can view own profile" on recruiter_profiles;
create policy "Users can view own profile" on recruiter_profiles for select to authenticated using (auth.uid() = recruiter_id);

drop policy if exists "Users can update own profile" on recruiter_profiles;
create policy "Users can update own profile" on recruiter_profiles for update to authenticated using (auth.uid() = recruiter_id);

drop policy if exists "Users can insert own profile" on recruiter_profiles;
create policy "Users can insert own profile" on recruiter_profiles for insert to authenticated with check (auth.uid() = recruiter_id);

-- Trigger for updated_at
drop trigger if exists trg_recruiter_profiles_updated_at on recruiter_profiles;
create trigger trg_recruiter_profiles_updated_at
before update on recruiter_profiles
for each row execute function set_updated_at();

-- Note: You should run this SQL in your Supabase SQL Editor.
