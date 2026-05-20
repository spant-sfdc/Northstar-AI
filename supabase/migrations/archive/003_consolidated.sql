-- ─────────────────────────────────────────────────────────────────────────────
-- Northstar AI — Consolidated Schema Migration
-- File: 003_consolidated.sql
-- ─────────────────────────────────────────────────────────────────────────────
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New query → paste entire file → Run All
--
-- SAFE TO RE-RUN: yes — every statement is idempotent (IF NOT EXISTS / DO $$)
-- REPLACES:       001_initial_schema.sql + 002_fix_onboarding_constraints.sql
--
-- TABLE CREATION ORDER (respects FK dependencies):
--   1. profiles              (references auth.users)
--   2. onboarding_submissions (references profiles)
--   3. roadmaps              (references profiles, onboarding_submissions)
--   4. milestones            (references profiles, roadmaps)
--   5. subscriptions         (references profiles)
-- ─────────────────────────────────────────────────────────────────────────────


-- ─── 1. EXTENSIONS ───────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";


-- ─── 2. profiles ─────────────────────────────────────────────────────────────
-- One row per auth.users entry. Created automatically by the trigger below.
-- Cascade-deletes all child rows when a user is deleted.

create table if not exists public.profiles (
  id                  uuid        primary key references auth.users(id) on delete cascade,
  email               text        not null,
  full_name           text,
  avatar_url          text,
  onboarding_complete boolean     not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Backfill: add onboarding_complete if the table was created before it existed
alter table public.profiles
  add column if not exists onboarding_complete boolean not null default false;


-- ─── 3. AUTH TRIGGER — auto-create profile on signup ─────────────────────────
-- Runs as security definer so it can write to public.profiles from the
-- auth schema trigger context.

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


-- ─── 4. onboarding_submissions ───────────────────────────────────────────────
-- One row per user. Stores every field collected by the 10-step wizard.
-- The API route does INSERT or UPDATE (no upsert) — unique constraint here
-- is for data integrity only, not relied on by ON CONFLICT logic.

create table if not exists public.onboarding_submissions (
  id                       uuid        primary key default uuid_generate_v4(),
  user_id                  uuid        not null references public.profiles(id) on delete cascade,
  current_role             text        not null,
  experience_level         text        not null
                             check (experience_level in ('junior','mid','senior','staff','principal')),
  years_of_experience      integer     not null,
  current_skills           text[]      not null default '{}',
  resume_storage_path      text,
  resume_file_name         text,
  target_role              text        not null,
  target_company_size      text        not null
                             check (target_company_size in ('startup','growth','enterprise','any')),
  target_timeline_months   integer     not null,
  available_hours_per_week integer     not null,
  career_struggles         text[]      not null default '{}',
  preferred_work_type      text        not null
                             check (preferred_work_type in ('remote','hybrid','onsite','flexible')),
  confidence_score         integer     not null check (confidence_score between 1 and 10),
  status                   text        not null default 'pending'
                             check (status in ('pending','processing','complete')),
  completed_at             timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- Unique constraint: one submission per user (idempotent)
do $$ begin
  if not exists (
    select 1
    from   information_schema.table_constraints
    where  constraint_schema = 'public'
      and  table_name        = 'onboarding_submissions'
      and  constraint_name   = 'onboarding_submissions_user_id_key'
  ) then
    alter table public.onboarding_submissions
      add constraint onboarding_submissions_user_id_key unique (user_id);
    raise notice 'onboarding_submissions: unique(user_id) constraint added';
  else
    raise notice 'onboarding_submissions: unique(user_id) constraint already exists';
  end if;
end $$;


-- ─── 5. roadmaps ─────────────────────────────────────────────────────────────
-- One row per user. Stores the AI-generated gap_analysis JSON and score.
-- submission_id is nullable — set null on submission delete, not cascade,
-- so the roadmap survives a re-onboarding.

create table if not exists public.roadmaps (
  id              uuid        primary key default uuid_generate_v4(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  submission_id   uuid        references public.onboarding_submissions(id) on delete set null,
  title           text        not null,
  readiness_score integer,
  summary         text,
  gap_analysis    jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Unique constraint: one roadmap per user (idempotent)
do $$ begin
  if not exists (
    select 1
    from   information_schema.table_constraints
    where  constraint_schema = 'public'
      and  table_name        = 'roadmaps'
      and  constraint_name   = 'roadmaps_user_id_key'
  ) then
    alter table public.roadmaps
      add constraint roadmaps_user_id_key unique (user_id);
    raise notice 'roadmaps: unique(user_id) constraint added';
  else
    raise notice 'roadmaps: unique(user_id) constraint already exists';
  end if;
end $$;


-- ─── 6. milestones ───────────────────────────────────────────────────────────
-- Child of roadmaps. Individual weekly deliverables derived from AI output.
-- Cascade-deletes when the parent roadmap is deleted.

create table if not exists public.milestones (
  id           uuid        primary key default uuid_generate_v4(),
  roadmap_id   uuid        not null references public.roadmaps(id) on delete cascade,
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  title        text        not null,
  description  text,
  week_number  integer     not null,
  order_index  integer     not null default 0,
  status       text        not null default 'not_started'
                 check (status in ('not_started','in_progress','complete')),
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);


-- ─── 7. subscriptions ────────────────────────────────────────────────────────
-- One row per user. Created with plan='free' on signup (or on first billing
-- event). Stripe webhooks update this row.

create table if not exists public.subscriptions (
  id                      uuid        primary key default uuid_generate_v4(),
  user_id                 uuid        not null references public.profiles(id) on delete cascade,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  plan                    text        not null default 'free'
                            check (plan in ('free','pro')),
  status                  text        not null default 'active'
                            check (status in ('active','canceled','past_due')),
  current_period_end      timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Unique constraint: one subscription row per user (idempotent)
do $$ begin
  if not exists (
    select 1
    from   information_schema.table_constraints
    where  constraint_schema = 'public'
      and  table_name        = 'subscriptions'
      and  constraint_name   = 'subscriptions_user_id_key'
  ) then
    alter table public.subscriptions
      add constraint subscriptions_user_id_key unique (user_id);
    raise notice 'subscriptions: unique(user_id) constraint added';
  else
    raise notice 'subscriptions: unique(user_id) constraint already exists';
  end if;
end $$;


-- ─── 8. ROW LEVEL SECURITY ───────────────────────────────────────────────────
-- Enable RLS on all tables. Safe to run even if already enabled.

alter table public.profiles               enable row level security;
alter table public.onboarding_submissions  enable row level security;
alter table public.roadmaps               enable row level security;
alter table public.milestones             enable row level security;
alter table public.subscriptions          enable row level security;

-- profiles: authenticated user can read/write their own row only
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'profiles'
      and policyname = 'profiles: own row'
  ) then
    create policy "profiles: own row"
      on public.profiles
      for all
      using      (auth.uid() = id)
      with check (auth.uid() = id);
    raise notice 'profiles: RLS policy created';
  else
    raise notice 'profiles: RLS policy already exists';
  end if;
end $$;

-- onboarding_submissions: authenticated user can read/write their own row only
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'onboarding_submissions'
      and policyname = 'submissions: own row'
  ) then
    create policy "submissions: own row"
      on public.onboarding_submissions
      for all
      using      (auth.uid() = user_id)
      with check (auth.uid() = user_id);
    raise notice 'onboarding_submissions: RLS policy created';
  else
    raise notice 'onboarding_submissions: RLS policy already exists';
  end if;
end $$;

-- roadmaps: authenticated user can read/write their own row only
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'roadmaps'
      and policyname = 'roadmaps: own row'
  ) then
    create policy "roadmaps: own row"
      on public.roadmaps
      for all
      using      (auth.uid() = user_id)
      with check (auth.uid() = user_id);
    raise notice 'roadmaps: RLS policy created';
  else
    raise notice 'roadmaps: RLS policy already exists';
  end if;
end $$;

-- milestones: authenticated user can read/write their own rows only
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'milestones'
      and policyname = 'milestones: own row'
  ) then
    create policy "milestones: own row"
      on public.milestones
      for all
      using      (auth.uid() = user_id)
      with check (auth.uid() = user_id);
    raise notice 'milestones: RLS policy created';
  else
    raise notice 'milestones: RLS policy already exists';
  end if;
end $$;

-- subscriptions: authenticated user can only read their own row
-- (writes come from Stripe webhooks using the service role key, not the anon key)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'subscriptions'
      and policyname = 'subscriptions: own read'
  ) then
    create policy "subscriptions: own read"
      on public.subscriptions
      for select
      using (auth.uid() = user_id);
    raise notice 'subscriptions: RLS policy created';
  else
    raise notice 'subscriptions: RLS policy already exists';
  end if;
end $$;


-- ─── 9. INDEXES ──────────────────────────────────────────────────────────────
-- All FK columns that are queried with .eq("user_id", ...) get an index.
-- UNIQUE constraints already create an implicit index on user_id for
-- onboarding_submissions, roadmaps, and subscriptions — these explicit
-- indexes cover milestones and the roadmap_id FK on milestones.

create index if not exists idx_onboarding_user     on public.onboarding_submissions(user_id);
create index if not exists idx_roadmaps_user        on public.roadmaps(user_id);
create index if not exists idx_milestones_roadmap   on public.milestones(roadmap_id);
create index if not exists idx_milestones_user      on public.milestones(user_id);
create index if not exists idx_subscriptions_user   on public.subscriptions(user_id);


-- ─── 10. POSTGREST SCHEMA CACHE RELOAD ───────────────────────────────────────
-- Forces PostgREST to reload its schema cache immediately.
-- Without this, PGRST205 ("table not found in schema cache") appears even
-- when the table was just successfully created.

notify pgrst, 'reload schema';
