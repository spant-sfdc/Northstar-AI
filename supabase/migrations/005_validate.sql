-- ─────────────────────────────────────────────────────────────────────────────
-- Validation queries — run AFTER 005_minimal_bootstrap.sql
-- Run each query individually. Expected output is noted below each one.
-- ─────────────────────────────────────────────────────────────────────────────


-- V1. Tables exist
select table_name
from   information_schema.tables
where  table_schema = 'public'
  and  table_name in ('profiles', 'onboarding_submissions', 'roadmaps')
order  by table_name;
-- Expected: 3 rows


-- V2. onboarding_submissions columns (confirms current_role column exists)
select column_name, data_type, is_nullable
from   information_schema.columns
where  table_schema = 'public'
  and  table_name   = 'onboarding_submissions'
order  by ordinal_position;
-- Expected: 20 rows — id through updated_at
-- current_role should appear as column_name = 'current_role', data_type = 'text'


-- V3. RLS is enabled
select relname as table_name, relrowsecurity as rls_enabled
from   pg_class
where  relnamespace = 'public'::regnamespace
  and  relname in ('profiles', 'onboarding_submissions', 'roadmaps');
-- Expected: all 3 rows show rls_enabled = true


-- V4. Policies exist
select tablename, policyname, cmd
from   pg_policies
where  schemaname = 'public'
order  by tablename;
-- Expected: 3 rows — profiles_own, submissions_own, roadmaps_own


-- V5. Trigger exists for auto-profile creation
select trigger_name, event_object_table
from   information_schema.triggers
where  trigger_name = 'on_auth_user_created';
-- Expected: 1 row on auth.users


-- V6. PostgREST can see the table (no PGRST205)
select * from public.onboarding_submissions limit 0;
-- Expected: 0 rows with column headers — not an error
