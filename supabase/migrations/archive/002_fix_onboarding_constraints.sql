-- ─── Diagnostic + Fix: onboarding_submissions ────────────────────────────────
-- Run these queries in Supabase SQL Editor (Dashboard → SQL Editor).
-- Work through STEP 1 → 4 in order.

-- ─── STEP 1: Check if the table exists and list its columns ──────────────────

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'onboarding_submissions'
order by ordinal_position;

-- Expected columns (if any are missing, proceed to STEP 2):
-- id, user_id, current_role, experience_level, years_of_experience,
-- current_skills, resume_storage_path, resume_file_name, target_role,
-- target_company_size, target_timeline_months, available_hours_per_week,
-- career_struggles, preferred_work_type, confidence_score,
-- status, completed_at, created_at, updated_at

-- ─── STEP 2: Add any missing columns (safe to re-run — uses IF NOT EXISTS) ───

alter table public.onboarding_submissions
  add column if not exists current_role             text,
  add column if not exists experience_level         text check (experience_level in ('junior','mid','senior','staff','principal')),
  add column if not exists years_of_experience      integer,
  add column if not exists current_skills           text[] default '{}',
  add column if not exists resume_storage_path      text,
  add column if not exists resume_file_name         text,
  add column if not exists target_role              text,
  add column if not exists target_company_size      text check (target_company_size in ('startup','growth','enterprise','any')),
  add column if not exists target_timeline_months   integer,
  add column if not exists available_hours_per_week integer,
  add column if not exists career_struggles         text[] default '{}',
  add column if not exists preferred_work_type      text check (preferred_work_type in ('remote','hybrid','onsite','flexible')),
  add column if not exists confidence_score         integer check (confidence_score between 1 and 10),
  add column if not exists status                   text default 'pending' check (status in ('pending','processing','complete')),
  add column if not exists completed_at             timestamptz,
  add column if not exists updated_at               timestamptz default now();

-- Add unique constraint if missing (required by upsert with onConflict)
-- This is the most likely root cause of "Failed to save your profile"
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'onboarding_submissions_user_id_key'
  ) then
    alter table public.onboarding_submissions
      add constraint onboarding_submissions_user_id_key unique (user_id);
    raise notice 'Added unique constraint on user_id';
  else
    raise notice 'Unique constraint already exists';
  end if;
end $$;

-- ─── STEP 3: Check and fix RLS ───────────────────────────────────────────────

-- Check which policies exist
select policyname, cmd, qual
from pg_policies
where schemaname = 'public'
  and tablename  = 'onboarding_submissions';

-- If no policies are listed, add them:
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'onboarding_submissions'
      and policyname = 'submissions: own row'
  ) then
    execute $policy$
      create policy "submissions: own row"
      on public.onboarding_submissions
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)
    $policy$;
    raise notice 'Created RLS policy for onboarding_submissions';
  else
    raise notice 'RLS policy already exists';
  end if;
end $$;

-- Make sure RLS is enabled
alter table public.onboarding_submissions enable row level security;

-- ─── STEP 4: Check profiles table for onboarding_complete column ─────────────

select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'profiles'
  and column_name  = 'onboarding_complete';

-- If the above returns no rows, add the column:
alter table public.profiles
  add column if not exists onboarding_complete boolean not null default false;

-- ─── STEP 5: Verify auth works by checking your own row ──────────────────────
-- (Run while logged in via Supabase Auth — this uses RLS context)

select id, email, onboarding_complete from public.profiles
where id = auth.uid();

-- If this returns your row, RLS + auth is working correctly.
-- If it returns nothing, the profile row is missing — re-run the trigger:

-- insert into public.profiles (id, email)
-- values (auth.uid(), auth.email())
-- on conflict (id) do nothing;
