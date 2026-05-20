-- ─────────────────────────────────────────────────────────────────────────────
-- Northstar AI — Profile Lifecycle Stabilization
-- Safe to re-run: all statements are idempotent.
--
-- WHY THIS FILE EXISTS:
--   Any user who signed up BEFORE 005_minimal_bootstrap.sql was run has a row
--   in auth.users but NO row in public.profiles. The on_auth_user_created
--   trigger only fires on future INSERT events — it cannot backfill past rows.
--   The onboarding_submissions FK (user_id → profiles.id) then rejects every
--   insert for those users with:
--     "insert or update on table onboarding_submissions violates foreign key
--      constraint onboarding_submissions_user_id_fkey"
--
-- WHAT THIS FILE DOES:
--   1. Replaces handle_new_user() with a hardened version that:
--      - handles NULL email (email_confirmed flows can have null at insert time)
--      - never raises an unhandled exception (logs + continues)
--   2. Recreates the trigger (idempotent DROP/CREATE).
--   3. Backfills profiles for all existing auth.users rows that lack one.
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 1: Hardened trigger function
--
-- Changes vs. original:
--   • COALESCE(new.email, '') — email can arrive NULL on some OAuth flows
--     (Supabase fills it later via UPDATE; the profile row is created now with
--     an empty string and updated when the real email lands).
--   • EXCEPTION WHEN OTHERS block — any unexpected error is raised so it is
--     visible in Supabase logs rather than silently failing.
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
    coalesce(new.email, ''),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
exception
  when others then
    raise warning '[handle_new_user] profile creation failed for user %: % %',
      new.id, sqlstate, sqlerrm;
    return new;   -- still return new so the auth.users INSERT succeeds
end;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 2: Trigger (idempotent)
-- ─────────────────────────────────────────────────────────────────────────────

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 3: Backfill — create profiles for all existing auth.users without one
--
-- Uses the service-role context that the SQL editor runs in, so RLS is
-- bypassed and auth.users is readable.
--
-- COALESCE(u.email, '') — same NULL-safety as the trigger.
-- ON CONFLICT (id) DO NOTHING — safe to re-run; skips already-created rows.
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.profiles (id, email, full_name, avatar_url)
select
  u.id,
  coalesce(u.email, ''),
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'avatar_url'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 4: Confirm the backfill worked
--
-- Run this SELECT after the INSERT above.
-- Expected: 0 rows (every auth.users row now has a matching profiles row).
-- If any rows are returned, those users still lack a profile — investigate.
-- ─────────────────────────────────────────────────────────────────────────────

select u.id, u.email, u.created_at
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
-- ← Expected: 0 rows


-- ─────────────────────────────────────────────────────────────────────────────
-- RELOAD POSTGREST SCHEMA CACHE
-- ─────────────────────────────────────────────────────────────────────────────

notify pgrst, 'reload schema';
