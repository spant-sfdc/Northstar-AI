-- ─────────────────────────────────────────────────────────────────────────────
-- Northstar AI — Razorpay Subscription Schema
-- Run AFTER 007_retention_engine.sql
-- Safe to re-run: all statements are idempotent
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 1: Extend the subscriptions table
-- ─────────────────────────────────────────────────────────────────────────────

-- Add Razorpay-specific columns (IF NOT EXISTS style via DO block)
alter table public.subscriptions
  add column if not exists razorpay_customer_id      text,
  add column if not exists razorpay_subscription_id  text,
  add column if not exists trial_ends_at             timestamptz;

-- Update plan constraint to support new tier names.
-- Keeps 'pro' for any pre-existing rows; adds 'premium' and 'advanced'.
alter table public.subscriptions
  drop constraint if exists subscriptions_plan_check;

alter table public.subscriptions
  add constraint subscriptions_plan_check
  check (plan in ('free', 'pro', 'premium', 'advanced'));


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 2: Unique index on razorpay_subscription_id (for webhook lookups)
-- ─────────────────────────────────────────────────────────────────────────────

create unique index if not exists idx_subscriptions_rzp_sub_id
  on public.subscriptions (razorpay_subscription_id)
  where razorpay_subscription_id is not null;


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 3: Update handle_new_user trigger to seed the subscription row
-- Creates a free subscription with a 7-day trial for every new signup.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Profile row
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  -- Free subscription with 7-day trial
  insert into public.subscriptions (user_id, plan, status, trial_ends_at)
  values (new.id, 'free', 'active', now() + interval '7 days')
  on conflict (user_id) do nothing;

  return new;
exception
  when others then
    raise warning '[handle_new_user] failed for user %: % %', new.id, sqlstate, sqlerrm;
    return new;
end;
$$;

-- Recreate trigger (idempotent)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 4: Backfill — create subscription rows for existing users without one
-- trial_ends_at = profile created_at + 7 days (retroactive, keeps it fair)
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.subscriptions (user_id, plan, status, trial_ends_at)
select
  p.id,
  'free',
  'active',
  p.created_at + interval '7 days'
from public.profiles p
left join public.subscriptions s on s.user_id = p.id
where s.user_id is null
on conflict (user_id) do nothing;


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 5: Validation — run to confirm the schema is correct
-- ─────────────────────────────────────────────────────────────────────────────

-- V1. Columns added (expect: razorpay_customer_id, razorpay_subscription_id, trial_ends_at)
-- select column_name, data_type from information_schema.columns
-- where table_schema = 'public' and table_name = 'subscriptions' order by ordinal_position;

-- V2. All profiles have a subscription row (expect: 0 rows)
-- select p.id from public.profiles p left join public.subscriptions s on s.user_id = p.id
-- where s.user_id is null;


notify pgrst, 'reload schema';
