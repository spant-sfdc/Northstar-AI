-- ─── Northstar AI — Initial Schema ──────────────────────────────────────────
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- or via `supabase db push` if using the CLI.

-- ─── Extensions ──────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ─── profiles ────────────────────────────────────────────────────────────────
-- Created automatically on signup via the trigger below.

create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null,
  full_name           text,
  avatar_url          text,
  onboarding_complete boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
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
  for each row execute function public.handle_new_user();

-- ─── onboarding_submissions ───────────────────────────────────────────────────

create table if not exists public.onboarding_submissions (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid not null references public.profiles(id) on delete cascade,
  current_role             text not null,
  experience_level         text not null check (experience_level in ('junior','mid','senior','staff','principal')),
  years_of_experience      integer not null,
  current_skills           text[] not null default '{}',
  resume_storage_path      text,
  resume_file_name         text,
  target_role              text not null,
  target_company_size      text not null check (target_company_size in ('startup','growth','enterprise','any')),
  target_timeline_months   integer not null,
  available_hours_per_week integer not null,
  career_struggles         text[] not null default '{}',
  preferred_work_type      text not null check (preferred_work_type in ('remote','hybrid','onsite','flexible')),
  confidence_score         integer not null check (confidence_score between 1 and 10),
  status                   text not null default 'pending' check (status in ('pending','processing','complete')),
  completed_at             timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  -- One submission per user (upsert target)
  constraint onboarding_submissions_user_id_key unique (user_id)
);

-- ─── roadmaps ────────────────────────────────────────────────────────────────

create table if not exists public.roadmaps (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  submission_id   uuid references public.onboarding_submissions(id) on delete set null,
  title           text not null,
  readiness_score integer,
  summary         text,
  gap_analysis    jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- One roadmap per user — the analyze route upserts on this
  constraint roadmaps_user_id_key unique (user_id)
);

-- ─── milestones ───────────────────────────────────────────────────────────────

create table if not exists public.milestones (
  id           uuid primary key default uuid_generate_v4(),
  roadmap_id   uuid not null references public.roadmaps(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  description  text,
  week_number  integer not null,
  order_index  integer not null default 0,
  status       text not null default 'not_started' check (status in ('not_started','in_progress','complete')),
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);

-- ─── subscriptions ───────────────────────────────────────────────────────────

create table if not exists public.subscriptions (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  plan                    text not null default 'free' check (plan in ('free','pro')),
  status                  text not null default 'active' check (status in ('active','canceled','past_due')),
  current_period_end      timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  constraint subscriptions_user_id_key unique (user_id)
);

-- ─── Storage bucket ───────────────────────────────────────────────────────────
-- Run via Dashboard → Storage → New bucket if not using CLI.
-- Name: resumes, Public: false

-- insert into storage.buckets (id, name, public)
-- values ('resumes', 'resumes', false)
-- on conflict (id) do nothing;

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.profiles              enable row level security;
alter table public.onboarding_submissions enable row level security;
alter table public.roadmaps              enable row level security;
alter table public.milestones            enable row level security;
alter table public.subscriptions         enable row level security;

-- profiles: users read/update their own row
create policy "profiles: own row" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- onboarding_submissions: users manage their own
create policy "submissions: own row" on public.onboarding_submissions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- roadmaps: users manage their own
create policy "roadmaps: own row" on public.roadmaps
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- milestones: users manage their own
create policy "milestones: own row" on public.milestones
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- subscriptions: users read their own
create policy "subscriptions: own read" on public.subscriptions
  for select using (auth.uid() = user_id);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

create index if not exists idx_onboarding_user      on public.onboarding_submissions(user_id);
create index if not exists idx_roadmaps_user        on public.roadmaps(user_id);
create index if not exists idx_milestones_roadmap   on public.milestones(roadmap_id);
create index if not exists idx_milestones_user      on public.milestones(user_id);
create index if not exists idx_subscriptions_user   on public.subscriptions(user_id);
