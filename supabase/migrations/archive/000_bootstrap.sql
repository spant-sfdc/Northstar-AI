-- ═════════════════════════════════════════════════════════════════════════════
-- Northstar AI — Full Database Bootstrap
-- File: 000_bootstrap.sql
-- ═════════════════════════════════════════════════════════════════════════════
--
-- FOR A FRESH SUPABASE PROJECT WITH NO TABLES.
-- Safe to re-run — every statement is idempotent.
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New query → paste entire file → Run All
--
-- TABLE CREATION ORDER (FK dependencies):
--   1. profiles              → references auth.users  (Supabase built-in)
--   2. onboarding_submissions → references profiles
--   3. roadmaps              → references profiles + onboarding_submissions
--   4. milestones            → references profiles + roadmaps
--   5. subscriptions         → references profiles
-- ═════════════════════════════════════════════════════════════════════════════


-- ─── EXTENSIONS ──────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";


-- ─── SHARED UTILITY: updated_at auto-stamp trigger ───────────────────────────
-- One function, reused across every table that has updated_at.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ═════════════════════════════════════════════════════════════════════════════
-- TABLE 1: profiles
-- One row per authenticated user. Auto-created on signup via trigger.
-- ═════════════════════════════════════════════════════════════════════════════

create table if not exists public.profiles (
  id                  uuid        primary key
                        references auth.users(id) on delete cascade,
  email               text        not null,
  full_name           text,
  avatar_url          text,
  onboarding_complete boolean     not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Backfill column if table pre-existed without it
alter table public.profiles
  add column if not exists onboarding_complete boolean not null default false;

-- updated_at trigger
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─── Auto-create profile on new user signup ───────────────────────────────────

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


-- ═════════════════════════════════════════════════════════════════════════════
-- TABLE 2: onboarding_submissions
-- One row per user. All 10 onboarding wizard fields.
-- ═════════════════════════════════════════════════════════════════════════════

create table if not exists public.onboarding_submissions (
  id                       uuid        primary key default uuid_generate_v4(),
  user_id                  uuid        not null
                             references public.profiles(id) on delete cascade,

  -- Step 1: Current role
  current_role             text        not null,

  -- Step 2: Experience
  experience_level         text        not null
                             check (experience_level in
                               ('junior','mid','senior','staff','principal')),
  years_of_experience      integer     not null check (years_of_experience >= 0),

  -- Step 3: Skills
  current_skills           text[]      not null default '{}',

  -- Step 4: Resume (optional — user may skip)
  resume_storage_path      text,
  resume_file_name         text,

  -- Step 5: Target
  target_role              text        not null,
  target_company_size      text        not null
                             check (target_company_size in
                               ('startup','growth','enterprise','any')),

  -- Step 6: Timeline
  target_timeline_months   integer     not null check (target_timeline_months > 0),

  -- Step 7: Hours
  available_hours_per_week integer     not null check (available_hours_per_week > 0),

  -- Step 8: Struggles
  career_struggles         text[]      not null default '{}',

  -- Step 9: Work type
  preferred_work_type      text        not null
                             check (preferred_work_type in
                               ('remote','hybrid','onsite','flexible')),

  -- Step 10: Confidence
  confidence_score         integer     not null
                             check (confidence_score between 1 and 10),

  -- Submission metadata
  status                   text        not null default 'pending'
                             check (status in ('pending','processing','complete')),
  completed_at             timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  -- One submission row per user
  constraint onboarding_submissions_user_id_key unique (user_id)
);

-- updated_at trigger
drop trigger if exists trg_onboarding_updated_at on public.onboarding_submissions;
create trigger trg_onboarding_updated_at
  before update on public.onboarding_submissions
  for each row execute function public.set_updated_at();


-- ═════════════════════════════════════════════════════════════════════════════
-- TABLE 3: roadmaps
-- One row per user. Stores the full AI-generated ReadinessAnalysis JSON.
-- submission_id is nullable (SET NULL on delete) so the roadmap survives
-- if the user re-does onboarding.
-- ═════════════════════════════════════════════════════════════════════════════

create table if not exists public.roadmaps (
  id              uuid        primary key default uuid_generate_v4(),
  user_id         uuid        not null
                    references public.profiles(id) on delete cascade,
  submission_id   uuid
                    references public.onboarding_submissions(id) on delete set null,

  -- Display fields derived from AI output
  title           text        not null,
  readiness_score integer     check (readiness_score between 0 and 100),
  summary         text,

  -- Full AI analysis — ReadinessAnalysis schema stored as JSONB
  gap_analysis    jsonb,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- One roadmap row per user (upsert target for AI analyze route)
  constraint roadmaps_user_id_key unique (user_id)
);

-- updated_at trigger
drop trigger if exists trg_roadmaps_updated_at on public.roadmaps;
create trigger trg_roadmaps_updated_at
  before update on public.roadmaps
  for each row execute function public.set_updated_at();


-- ═════════════════════════════════════════════════════════════════════════════
-- TABLE 4: milestones
-- Child of roadmaps. Weekly deliverables extracted from AI output.
-- Cascade-deletes when the parent roadmap is deleted.
-- ═════════════════════════════════════════════════════════════════════════════

create table if not exists public.milestones (
  id           uuid        primary key default uuid_generate_v4(),
  roadmap_id   uuid        not null
                 references public.roadmaps(id) on delete cascade,
  user_id      uuid        not null
                 references public.profiles(id) on delete cascade,

  title        text        not null,
  description  text,
  week_number  integer     not null check (week_number > 0),
  order_index  integer     not null default 0,

  status       text        not null default 'not_started'
                 check (status in ('not_started','in_progress','complete')),

  completed_at timestamptz,
  created_at   timestamptz not null default now()
  -- no updated_at — we only flip status, not update content
);


-- ═════════════════════════════════════════════════════════════════════════════
-- TABLE 5: subscriptions
-- One row per user. Created as 'free' by default.
-- Writes come from Stripe webhooks using the service role key — NOT the anon key.
-- Therefore: RLS allows reads but NOT writes for authenticated users.
-- ═════════════════════════════════════════════════════════════════════════════

create table if not exists public.subscriptions (
  id                      uuid        primary key default uuid_generate_v4(),
  user_id                 uuid        not null
                            references public.profiles(id) on delete cascade,

  stripe_customer_id      text,
  stripe_subscription_id  text,

  plan                    text        not null default 'free'
                            check (plan in ('free','pro')),
  status                  text        not null default 'active'
                            check (status in ('active','canceled','past_due')),

  current_period_end      timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  -- One subscription row per user
  constraint subscriptions_user_id_key unique (user_id)
);

-- updated_at trigger
drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();


-- ═════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.profiles               enable row level security;
alter table public.onboarding_submissions  enable row level security;
alter table public.roadmaps               enable row level security;
alter table public.milestones             enable row level security;
alter table public.subscriptions          enable row level security;

-- ─── profiles ────────────────────────────────────────────────────────────────
-- Authenticated user can read and update their own row only.
-- INSERT is handled exclusively by the handle_new_user trigger (security definer).

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
    and policyname = 'profiles_select_own'
  ) then
    create policy "profiles_select_own"
      on public.profiles for select
      using (auth.uid() = id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
    and policyname = 'profiles_update_own'
  ) then
    create policy "profiles_update_own"
      on public.profiles for update
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;

-- ─── onboarding_submissions ───────────────────────────────────────────────────
-- Authenticated user can insert, select, and update their own row.

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'onboarding_submissions'
    and policyname = 'submissions_select_own'
  ) then
    create policy "submissions_select_own"
      on public.onboarding_submissions for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'onboarding_submissions'
    and policyname = 'submissions_insert_own'
  ) then
    create policy "submissions_insert_own"
      on public.onboarding_submissions for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'onboarding_submissions'
    and policyname = 'submissions_update_own'
  ) then
    create policy "submissions_update_own"
      on public.onboarding_submissions for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- ─── roadmaps ─────────────────────────────────────────────────────────────────
-- Authenticated user can read and write their own roadmap.
-- The AI analyze route writes via the server client (anon key + user session).

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'roadmaps'
    and policyname = 'roadmaps_select_own'
  ) then
    create policy "roadmaps_select_own"
      on public.roadmaps for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'roadmaps'
    and policyname = 'roadmaps_insert_own'
  ) then
    create policy "roadmaps_insert_own"
      on public.roadmaps for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'roadmaps'
    and policyname = 'roadmaps_update_own'
  ) then
    create policy "roadmaps_update_own"
      on public.roadmaps for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- ─── milestones ───────────────────────────────────────────────────────────────
-- Authenticated user can read and update their own milestones.

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'milestones'
    and policyname = 'milestones_select_own'
  ) then
    create policy "milestones_select_own"
      on public.milestones for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'milestones'
    and policyname = 'milestones_insert_own'
  ) then
    create policy "milestones_insert_own"
      on public.milestones for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'milestones'
    and policyname = 'milestones_update_own'
  ) then
    create policy "milestones_update_own"
      on public.milestones for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- ─── subscriptions ────────────────────────────────────────────────────────────
-- Users can only READ their own subscription row.
-- Writes come from Stripe webhooks via the service role key (bypasses RLS).

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'subscriptions'
    and policyname = 'subscriptions_select_own'
  ) then
    create policy "subscriptions_select_own"
      on public.subscriptions for select
      using (auth.uid() = user_id);
  end if;
end $$;


-- ═════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═════════════════════════════════════════════════════════════════════════════

-- onboarding_submissions
create index if not exists idx_onboarding_user_id
  on public.onboarding_submissions(user_id);

create index if not exists idx_onboarding_status
  on public.onboarding_submissions(status)
  where status = 'complete';

-- roadmaps
create index if not exists idx_roadmaps_user_id
  on public.roadmaps(user_id);

-- milestones
create index if not exists idx_milestones_roadmap_id
  on public.milestones(roadmap_id);

create index if not exists idx_milestones_user_id
  on public.milestones(user_id);

create index if not exists idx_milestones_week
  on public.milestones(user_id, week_number);

create index if not exists idx_milestones_status
  on public.milestones(user_id, status)
  where status != 'complete';

-- subscriptions
create index if not exists idx_subscriptions_user_id
  on public.subscriptions(user_id);

create index if not exists idx_subscriptions_stripe_customer
  on public.subscriptions(stripe_customer_id)
  where stripe_customer_id is not null;


-- ═════════════════════════════════════════════════════════════════════════════
-- POSTGREST SCHEMA CACHE RELOAD
-- Must be the last statement. Without this, new tables return PGRST205
-- even though they were just successfully created.
-- ═════════════════════════════════════════════════════════════════════════════

notify pgrst, 'reload schema';


-- ═════════════════════════════════════════════════════════════════════════════
-- VALIDATION QUERIES
-- Run these AFTER the migration completes to confirm the setup is correct.
-- Run each block separately in the SQL Editor.
-- ═════════════════════════════════════════════════════════════════════════════

-- ─── V1. All 5 tables exist ───────────────────────────────────────────────────
/*
select table_name, table_type
from   information_schema.tables
where  table_schema = 'public'
  and  table_name  in (
         'profiles','onboarding_submissions',
         'roadmaps','milestones','subscriptions'
       )
order  by table_name;
-- Expected: 5 rows
*/

-- ─── V2. Unique constraints ───────────────────────────────────────────────────
/*
select table_name, constraint_name, constraint_type
from   information_schema.table_constraints
where  constraint_schema = 'public'
  and  constraint_type   = 'UNIQUE'
order  by table_name;
-- Expected: onboarding_submissions_user_id_key, roadmaps_user_id_key, subscriptions_user_id_key
*/

-- ─── V3. RLS enabled ──────────────────────────────────────────────────────────
/*
select relname as table_name, relrowsecurity as rls_on
from   pg_class
where  relnamespace = 'public'::regnamespace
  and  relname in (
         'profiles','onboarding_submissions',
         'roadmaps','milestones','subscriptions'
       )
order  by relname;
-- Expected: all 5 rows show rls_on = true
*/

-- ─── V4. All RLS policies ──────────────────────────────────────────────────────
/*
select tablename, policyname, cmd as operation
from   pg_policies
where  schemaname = 'public'
order  by tablename, policyname;
-- Expected: 11 policies across 5 tables
*/

-- ─── V5. All indexes ──────────────────────────────────────────────────────────
/*
select tablename, indexname
from   pg_indexes
where  schemaname = 'public'
  and  tablename  in (
         'profiles','onboarding_submissions',
         'roadmaps','milestones','subscriptions'
       )
order  by tablename, indexname;
*/

-- ─── V6. Updated_at triggers ──────────────────────────────────────────────────
/*
select trigger_name, event_object_table, action_timing, event_manipulation
from   information_schema.triggers
where  trigger_schema = 'public'
  and  trigger_name like 'trg_%'
order  by event_object_table;
-- Expected: 4 triggers (profiles, onboarding_submissions, roadmaps, subscriptions)
*/

-- ─── V7. Auth trigger for profile auto-creation ───────────────────────────────
/*
select trigger_name, event_object_schema, event_object_table
from   information_schema.triggers
where  trigger_name = 'on_auth_user_created';
-- Expected: 1 row — trigger on auth.users
*/

-- ─── V8. PostgREST can see the table (run after notify pgrst) ─────────────────
/*
select * from public.onboarding_submissions limit 0;
-- Expected: 0 rows with column headers — no PGRST205
*/
