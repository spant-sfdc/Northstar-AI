-- ─────────────────────────────────────────────────────────────────────────────
-- Northstar AI — Minimal Database Bootstrap
-- Safe to re-run: DROP POLICY IF EXISTS before each CREATE POLICY
-- No DO $$ blocks. No conditionals. No extensions required.
-- ─────────────────────────────────────────────────────────────────────────────
-- Run in: Supabase Dashboard → SQL Editor → New query → Run All
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 1: profiles
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id                  uuid        primary key references auth.users(id) on delete cascade,
  email               text        not null,
  full_name           text,
  avatar_url          text,
  onboarding_complete boolean     not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER: auto-create profile row on new user signup
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 2: onboarding_submissions
--
-- IMPORTANT: "current_role" is double-quoted because it is a reserved keyword
-- in PostgreSQL. Unquoted → syntax error 42601. The column is stored and
-- queried as current_role — PostgREST and the app are unaffected.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.onboarding_submissions (
  id                       uuid        primary key default gen_random_uuid(),
  user_id                  uuid        not null references public.profiles(id) on delete cascade,
  "current_role"           text        not null,
  experience_level         text        not null,
  years_of_experience      integer     not null,
  current_skills           text[]      not null default '{}',
  resume_storage_path      text,
  resume_file_name         text,
  target_role              text        not null,
  target_company_size      text        not null,
  target_timeline_months   integer     not null,
  available_hours_per_week integer     not null,
  career_struggles         text[]      not null default '{}',
  preferred_work_type      text        not null,
  confidence_score         integer     not null,
  status                   text        not null default 'pending',
  completed_at             timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (user_id)
);


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 3: roadmaps
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.roadmaps (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  title           text        not null,
  readiness_score integer,
  gap_analysis    jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id)
);


-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- DROP POLICY IF EXISTS first so this block is safe to re-run on an existing DB.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles               enable row level security;
alter table public.onboarding_submissions  enable row level security;
alter table public.roadmaps               enable row level security;

-- profiles
drop policy if exists "profiles_own" on public.profiles;
create policy "profiles_own"
  on public.profiles
  for all
  using      (auth.uid() = id)
  with check (auth.uid() = id);

-- onboarding_submissions
drop policy if exists "submissions_own" on public.onboarding_submissions;
create policy "submissions_own"
  on public.onboarding_submissions
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- roadmaps
drop policy if exists "roadmaps_own" on public.roadmaps;
create policy "roadmaps_own"
  on public.roadmaps
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

create index if not exists idx_submissions_user_id on public.onboarding_submissions (user_id);
create index if not exists idx_roadmaps_user_id    on public.roadmaps (user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- RELOAD POSTGREST SCHEMA CACHE
-- Tells PostgREST to pick up the new tables immediately.
-- Without this, the app returns PGRST205 even though the tables now exist.
-- ─────────────────────────────────────────────────────────────────────────────

notify pgrst, 'reload schema';
