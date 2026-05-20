-- ─────────────────────────────────────────────────────────────────────────────
-- Northstar AI — Post-Migration Validation Queries
-- File: 003_validate.sql
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Run AFTER 003_consolidated.sql completes.
-- Run each query individually in the SQL Editor and check the expected output.
-- ─────────────────────────────────────────────────────────────────────────────


-- ─── V1. All tables exist ─────────────────────────────────────────────────────
-- Expected: 5 rows — profiles, onboarding_submissions, roadmaps, milestones, subscriptions

select table_name
from   information_schema.tables
where  table_schema = 'public'
  and  table_type   = 'BASE TABLE'
  and  table_name  in ('profiles','onboarding_submissions','roadmaps','milestones','subscriptions')
order by table_name;


-- ─── V2. onboarding_submissions — all columns present ────────────────────────
-- Expected: 19 rows (id through updated_at)

select column_name, data_type, is_nullable, column_default
from   information_schema.columns
where  table_schema = 'public'
  and  table_name   = 'onboarding_submissions'
order by ordinal_position;


-- ─── V3. Unique constraints exist on all 3 tables that need them ─────────────
-- Expected: 3 rows

select constraint_schema, table_name, constraint_name, constraint_type
from   information_schema.table_constraints
where  constraint_schema = 'public'
  and  constraint_type   = 'UNIQUE'
  and  constraint_name  in (
         'onboarding_submissions_user_id_key',
         'roadmaps_user_id_key',
         'subscriptions_user_id_key'
       )
order by table_name;


-- ─── V4. RLS is enabled on all tables ────────────────────────────────────────
-- Expected: 5 rows, all with rowsecurity = true

select relname       as table_name,
       relrowsecurity as rls_enabled
from   pg_class
where  relnamespace = 'public'::regnamespace
  and  relname     in ('profiles','onboarding_submissions','roadmaps','milestones','subscriptions')
order by relname;


-- ─── V5. RLS policies exist ───────────────────────────────────────────────────
-- Expected: 5 rows

select tablename, policyname, cmd, roles
from   pg_policies
where  schemaname = 'public'
  and  tablename  in ('profiles','onboarding_submissions','roadmaps','milestones','subscriptions')
order by tablename, policyname;


-- ─── V6. Indexes exist ───────────────────────────────────────────────────────
-- Expected: 5 rows (idx_onboarding_user through idx_subscriptions_user)

select indexname, tablename
from   pg_indexes
where  schemaname = 'public'
  and  indexname  in (
         'idx_onboarding_user',
         'idx_roadmaps_user',
         'idx_milestones_roadmap',
         'idx_milestones_user',
         'idx_subscriptions_user'
       )
order by tablename;


-- ─── V7. Foreign key references are correct ──────────────────────────────────
-- Expected: 6 rows — one FK per reference

select
  tc.table_name            as source_table,
  kcu.column_name          as fk_column,
  ccu.table_name           as references_table,
  ccu.column_name          as references_column,
  rc.delete_rule
from information_schema.table_constraints         tc
join information_schema.key_column_usage           kcu on tc.constraint_name = kcu.constraint_name
join information_schema.referential_constraints    rc  on tc.constraint_name = rc.constraint_name
join information_schema.constraint_column_usage    ccu on rc.unique_constraint_name = ccu.constraint_name
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema    = 'public'
order by tc.table_name;


-- ─── V8. Auth trigger is wired up ────────────────────────────────────────────
-- Expected: 1 row — on_auth_user_created on auth.users AFTER INSERT

select trigger_name, event_manipulation, event_object_schema, event_object_table, action_timing
from   information_schema.triggers
where  trigger_name = 'on_auth_user_created';


-- ─── V9. Profiles row exists for your own user ───────────────────────────────
-- Expected: 1 row with your email and onboarding_complete = false (or true)
-- Run while authenticated — relies on auth.uid()

select id, email, onboarding_complete, created_at
from   public.profiles
where  id = auth.uid();

-- If this returns 0 rows, your profile row is missing.
-- Run this to backfill it manually:
--
-- insert into public.profiles (id, email)
-- values (auth.uid(), (select email from auth.users where id = auth.uid()))
-- on conflict (id) do nothing;


-- ─── V10. Check onboarding_submissions for your user (after submitting) ───────
-- Expected: 1 row with status = 'complete' after finishing onboarding

select user_id, current_role, target_role, status, completed_at
from   public.onboarding_submissions
where  user_id = auth.uid();


-- ─── V11. Check roadmaps for your user (after AI analysis runs) ──────────────
-- Expected: 1 row with gap_analysis IS NOT NULL after analysis completes

select user_id, title, readiness_score,
       (gap_analysis is not null) as has_analysis,
       updated_at
from   public.roadmaps
where  user_id = auth.uid();


-- ─── V12. PostgREST schema cache is current ──────────────────────────────────
-- Expected: row returned — if PostgREST can see the table, PGRST205 won't occur

select *
from   public.onboarding_submissions
limit  0;

-- If you still get PGRST205 after running 003_consolidated.sql:
-- 1. Dashboard → Settings → API → scroll to "Schema" → click Reload
-- 2. Or re-run: notify pgrst, 'reload schema';
