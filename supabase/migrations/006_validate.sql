-- ─────────────────────────────────────────────────────────────────────────────
-- Validation queries — run AFTER 006_stabilize_profile_lifecycle.sql
-- Run each query individually in the SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────


-- V1. Trigger function exists and is security definer
select
  routine_name,
  routine_type,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name   = 'handle_new_user';
-- Expected: 1 row — routine_type = FUNCTION, security_type = DEFINER


-- V2. Trigger is attached to auth.users
select
  trigger_name,
  event_manipulation,
  event_object_schema,
  event_object_table,
  action_timing
from information_schema.triggers
where trigger_name = 'on_auth_user_created';
-- Expected: 1 row — event_object_table = users, action_timing = AFTER, event_manipulation = INSERT


-- V3. Every auth.users row has a matching profiles row (0 orphans)
select u.id, u.email, u.created_at
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
-- Expected: 0 rows


-- V4. profiles count matches auth.users count
select
  (select count(*) from auth.users)    as auth_users,
  (select count(*) from public.profiles) as profiles;
-- Expected: both counts are equal


-- V5. Foreign key constraints are correct
select
  tc.constraint_name,
  tc.table_name             as child_table,
  kcu.column_name           as child_column,
  ccu.table_schema          as parent_schema,
  ccu.table_name            as parent_table,
  ccu.column_name           as parent_column,
  rc.delete_rule
from information_schema.table_constraints    tc
join information_schema.key_column_usage     kcu on kcu.constraint_name = tc.constraint_name
join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name
join information_schema.referential_constraints rc  on rc.constraint_name  = tc.constraint_name
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema    = 'public'
order by tc.table_name;
-- Expected 3 rows:
--   profiles.id              → auth.users.id    CASCADE
--   onboarding_submissions.user_id → profiles.id CASCADE
--   roadmaps.user_id               → profiles.id CASCADE


-- V6. RLS enabled on all 3 tables
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('profiles', 'onboarding_submissions', 'roadmaps');
-- Expected: all 3 rows show rls_enabled = true


-- V7. Policies exist and are correct
select
  tablename,
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename;
-- Expected: 3 rows
--   profiles              → profiles_own          ALL
--   onboarding_submissions→ submissions_own        ALL
--   roadmaps              → roadmaps_own           ALL
-- qual and with_check should both reference auth.uid()


-- V8. Simulate end-to-end: onboarding_submissions is reachable (no PGRST205)
select * from public.onboarding_submissions limit 0;
-- Expected: 0 rows with column headers — not an error
