-- ─────────────────────────────────────────────────────────────────────────────
-- Northstar AI — Retention Engine
-- Run AFTER 006_stabilize_profile_lifecycle.sql
-- Safe to re-run: CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS throughout
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: milestones
-- Seeded from AI weeklyMilestones when roadmap is first generated.
-- is_premium = true for week_number > 4 (free tier only sees weeks 1–4).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.milestones (
  id               uuid          primary key default gen_random_uuid(),
  user_id          uuid          not null references public.profiles(id) on delete cascade,
  roadmap_id       uuid          not null references public.roadmaps(id) on delete cascade,
  week_number      integer       not null,
  order_index      integer       not null default 0,
  title            text          not null,
  description      text,
  category         text          not null default 'technical',
  estimated_hours  numeric(4,1)  not null default 1.0,
  success_criteria text,
  status           text          not null default 'not_started'
                                 check (status in ('not_started', 'in_progress', 'complete')),
  is_premium       boolean       not null default false,
  completed_at     timestamptz,
  created_at       timestamptz   not null default now()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: weekly_check_ins
-- One row per user per week. Captures confidence, completed milestones, context.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.weekly_check_ins (
  id                       uuid         primary key default gen_random_uuid(),
  user_id                  uuid         not null references public.profiles(id) on delete cascade,
  week_number              integer      not null,
  confidence_score         integer      not null check (confidence_score between 1 and 10),
  completed_milestone_ids  uuid[]       not null default '{}',
  wins                     text,
  blockers                 text,
  ai_feedback              jsonb,
  created_at               timestamptz  not null default now(),
  updated_at               timestamptz  not null default now(),
  unique (user_id, week_number)
);


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: readiness_snapshots
-- One snapshot per user per week check-in.
-- readiness_score = base AI score + milestone-completion bonus (max +30).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.readiness_snapshots (
  id                    uuid         primary key default gen_random_uuid(),
  user_id               uuid         not null references public.profiles(id) on delete cascade,
  week_number           integer      not null,
  readiness_score       integer      not null,
  confidence_score      integer      not null,
  milestones_completed  integer      not null default 0,
  milestones_total      integer      not null default 0,
  created_at            timestamptz  not null default now(),
  unique (user_id, week_number)
);


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: subscriptions
-- Stripe-backed plan tracking. Free tier = no row or plan = 'free'.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.subscriptions (
  id                      uuid         primary key default gen_random_uuid(),
  user_id                 uuid         not null references public.profiles(id) on delete cascade,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  plan                    text         not null default 'free'
                                       check (plan in ('free', 'pro')),
  status                  text         not null default 'active'
                                       check (status in ('active', 'canceled', 'past_due')),
  current_period_end      timestamptz,
  created_at              timestamptz  not null default now(),
  updated_at              timestamptz  not null default now(),
  unique (user_id)
);


-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.milestones           enable row level security;
alter table public.weekly_check_ins     enable row level security;
alter table public.readiness_snapshots  enable row level security;
alter table public.subscriptions        enable row level security;

drop policy if exists "milestones_own"   on public.milestones;
create policy "milestones_own"
  on public.milestones for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "checkins_own"     on public.weekly_check_ins;
create policy "checkins_own"
  on public.weekly_check_ins for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "snapshots_own"    on public.readiness_snapshots;
create policy "snapshots_own"
  on public.readiness_snapshots for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "subscriptions_own" on public.subscriptions;
create policy "subscriptions_own"
  on public.subscriptions for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

create index if not exists idx_milestones_user_id   on public.milestones (user_id);
create index if not exists idx_milestones_user_week on public.milestones (user_id, week_number);
create index if not exists idx_checkins_user_week   on public.weekly_check_ins (user_id, week_number);
create index if not exists idx_snapshots_user_week  on public.readiness_snapshots (user_id, week_number);
create index if not exists idx_subscriptions_user   on public.subscriptions (user_id);


notify pgrst, 'reload schema';
