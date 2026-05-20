-- ─────────────────────────────────────────────────────────────────────────────
-- Northstar AI — Hard Database Verification
-- File: 004_hard_verify.sql
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Run ONE query at a time in Supabase SQL Editor.
-- Do NOT run all at once — each query diagnoses a specific layer.
-- Expected outputs are documented below each query.
-- ─────────────────────────────────────────────────────────────────────────────


-- ══════════════════════════════════════════════════════════════════════════════
-- BLOCK A — VERIFY WHICH DATABASE / PROJECT YOU ARE CONNECTED TO
-- Run this FIRST. Confirm this matches your Supabase project's database name.
-- ══════════════════════════════════════════════════════════════════════════════

-- A1. Current database name and connected user
select
  current_database()  as database_name,
  current_user        as connected_as,
  session_user        as session_user,
  inet_server_addr()  as server_ip,
  version()           as postgres_version;

-- ✓ database_name should match your Supabase project (usually "postgres")
-- ✓ connected_as should be "postgres" or "authenticator"
-- ✗ If database_name is wrong, you are querying the wrong project


-- A2. Confirm the Supabase project reference (matches .env SUPABASE_URL)
-- Your NEXT_PUBLIC_SUPABASE_URL looks like: https://<ref>.supabase.co
-- The ref is the first part of the hostname.
-- This query returns the setting that PostgREST uses to identify itself:
select current_setting('app.settings.jwt_secret', true) as jwt_configured,
       current_setting('request.jwt.claim.sub',  true)  as sub_claim;

-- ✓ If jwt_configured is not null, this is a Supabase-managed database
-- ✗ If both are null, you may be connected to a local Postgres, not Supabase


-- ══════════════════════════════════════════════════════════════════════════════
-- BLOCK B — LIST ALL TABLES IN ALL SCHEMAS
-- ══════════════════════════════════════════════════════════════════════════════

-- B1. Every table across every schema (not just public)
select table_schema,
       table_name,
       table_type
from   information_schema.tables
where  table_schema not in ('pg_catalog', 'information_schema')
order  by table_schema, table_name;

-- ✓ You should see "public" rows for: profiles, onboarding_submissions,
--   roadmaps, milestones, subscriptions
-- ✗ If onboarding_submissions is absent: table was never created
-- ✗ If it appears under a different schema: PostgREST is not exposing it


-- B2. Same check but using pg_tables (bypasses information_schema caching)
select schemaname, tablename, tableowner
from   pg_tables
where  schemaname not in ('pg_catalog', 'information_schema', 'pg_toast')
order  by schemaname, tablename;

-- ✓ onboarding_submissions should appear with schemaname = 'public'
-- If B1 and B2 disagree: information_schema cache is stale — trust pg_tables


-- ══════════════════════════════════════════════════════════════════════════════
-- BLOCK C — DIRECT EXISTENCE CHECK FOR onboarding_submissions
-- ══════════════════════════════════════════════════════════════════════════════

-- C1. Does the table exist? (most direct possible check)
select exists (
  select 1
  from   pg_class      c
  join   pg_namespace  n on n.oid = c.relnamespace
  where  n.nspname = 'public'
    and  c.relname  = 'onboarding_submissions'
    and  c.relkind  = 'r'   -- 'r' = ordinary table
) as table_exists;

-- ✓ true  → table exists in public schema
-- ✗ false → table does not exist; create it using BLOCK F below


-- C2. Full column list for onboarding_submissions
select
  ordinal_position as pos,
  column_name,
  data_type,
  is_nullable,
  column_default
from   information_schema.columns
where  table_schema = 'public'
  and  table_name   = 'onboarding_submissions'
order  by ordinal_position;

-- ✓ Expected 19 columns: id, user_id, current_role, experience_level,
--   years_of_experience, current_skills, resume_storage_path, resume_file_name,
--   target_role, target_company_size, target_timeline_months,
--   available_hours_per_week, career_struggles, preferred_work_type,
--   confidence_score, status, completed_at, created_at, updated_at
-- ✗ 0 rows → table does not exist


-- ══════════════════════════════════════════════════════════════════════════════
-- BLOCK D — RLS STATE
-- ══════════════════════════════════════════════════════════════════════════════

-- D1. RLS enabled/disabled for every public table
select
  c.relname                                    as table_name,
  case when c.relrowsecurity then 'YES' else 'NO' end as rls_enabled,
  case when c.relforcerowsecurity then 'YES' else 'NO' end as rls_forced
from   pg_class     c
join   pg_namespace n on n.oid = c.relnamespace
where  n.nspname = 'public'
  and  c.relkind  = 'r'
order  by c.relname;

-- ✓ onboarding_submissions should show rls_enabled = YES
-- ✗ NO → table exists but RLS is off; run BLOCK G to fix


-- D2. All RLS policies on all public tables
select
  tablename,
  policyname,
  cmd        as applies_to,
  qual       as using_expression,
  with_check as with_check_expression,
  roles
from   pg_policies
where  schemaname = 'public'
order  by tablename, policyname;

-- ✓ onboarding_submissions should have: "submissions: own row" (ALL)
-- ✗ Missing policy → authenticated users are blocked by default RLS
-- ✗ Empty results → no policies exist anywhere; run BLOCK G


-- ══════════════════════════════════════════════════════════════════════════════
-- BLOCK E — POSTGREST SCHEMA VISIBILITY
-- ══════════════════════════════════════════════════════════════════════════════

-- E1. Which schemas does this Supabase instance expose via PostgREST?
-- PostgREST only serves tables in schemas listed in its configuration.
-- Supabase exposes "public" by default; custom schemas must be added explicitly.
select current_setting('pgrst.db_schemas', true) as exposed_schemas;

-- ✓ Should contain "public"
-- ✗ null or missing "public" → PostgREST won't serve any public tables
--   Fix: Dashboard → Settings → API → DB Schema → add "public" → Save


-- E2. Force PostgREST schema cache reload (run after any DDL change)
notify pgrst, 'reload schema';

-- ✓ Supabase SQL Editor will show: "NOTIFY" in the output
-- After this, wait 2–3 seconds then retry your API call


-- E3. Directly probe what PostgREST sees (bypass application layer)
-- Run this from the SQL editor — it simulates a PostgREST read
select *
from   public.onboarding_submissions
limit  0;

-- ✓ Returns 0 rows with column headers → table is visible and queryable
-- ✗ ERROR: relation "public.onboarding_submissions" does not exist
--   → table genuinely does not exist; proceed to BLOCK F
-- ✗ ERROR: permission denied
--   → RLS is blocking even the schema check; proceed to BLOCK G


-- ══════════════════════════════════════════════════════════════════════════════
-- BLOCK F — MINIMAL STANDALONE TABLE CREATION
-- Use this if C1 confirmed the table does not exist.
-- This version has NO foreign key to profiles — it is fully self-contained.
-- It will unblock the API immediately even before profiles is set up.
-- ══════════════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

create table if not exists public.onboarding_submissions (
  id                       uuid        primary key default uuid_generate_v4(),
  user_id                  uuid        not null,
  current_role             text        not null,
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
  updated_at               timestamptz not null default now()
);

-- ✓ Run C1 again after this — table_exists should now be true
-- Once confirmed: proceed to BLOCK G (RLS), then BLOCK H (insert test)


-- ══════════════════════════════════════════════════════════════════════════════
-- BLOCK G — STANDALONE RLS SETUP FOR onboarding_submissions ONLY
-- Run this after BLOCK F confirms the table exists.
-- ══════════════════════════════════════════════════════════════════════════════

-- G1. Enable RLS
alter table public.onboarding_submissions enable row level security;

-- G2. Create the policy (idempotent)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where  schemaname = 'public'
      and  tablename  = 'onboarding_submissions'
      and  policyname = 'submissions: own row'
  ) then
    create policy "submissions: own row"
      on public.onboarding_submissions
      for all
      using      (auth.uid() = user_id)
      with check (auth.uid() = user_id);
    raise notice 'Policy created';
  else
    raise notice 'Policy already exists';
  end if;
end $$;

-- G3. Reload PostgREST cache
notify pgrst, 'reload schema';

-- ✓ Verify with D1 and D2 that rls_enabled = YES and policy row appears


-- ══════════════════════════════════════════════════════════════════════════════
-- BLOCK H — STANDALONE INSERT TEST
-- Proves the full write path works end-to-end before involving the app.
-- Replace <YOUR-USER-UUID> with your actual Supabase user ID.
-- Get it from: Dashboard → Authentication → Users → copy the UUID.
-- ══════════════════════════════════════════════════════════════════════════════

-- H1. Insert a test row using the service role (bypasses RLS)
-- Run this from SQL Editor — it uses the postgres/service role implicitly
insert into public.onboarding_submissions (
  user_id,
  current_role,
  experience_level,
  years_of_experience,
  current_skills,
  target_role,
  target_company_size,
  target_timeline_months,
  available_hours_per_week,
  career_struggles,
  preferred_work_type,
  confidence_score,
  status,
  completed_at,
  updated_at
)
values (
  'aaaaaaaa-0000-0000-0000-000000000001'::uuid,  -- replace with your real user UUID
  'Software Engineer',
  'mid',
  3,
  array['TypeScript', 'React', 'Node.js'],
  'Senior Software Engineer',
  'growth',
  4,
  10,
  array['system design', 'algorithms'],
  'remote',
  6,
  'complete',
  now(),
  now()
);

-- ✓ "INSERT 1" in output → write path works
-- ✗ ERROR: relation does not exist → BLOCK F was not run
-- ✗ ERROR: new row violates check constraint → check your enum values match exactly


-- H2. Read the test row back
select id, user_id, current_role, target_role, status
from   public.onboarding_submissions
where  user_id = 'aaaaaaaa-0000-0000-0000-000000000001'::uuid;

-- ✓ Returns 1 row → table is readable


-- H3. Clean up the test row
delete from public.onboarding_submissions
where  user_id = 'aaaaaaaa-0000-0000-0000-000000000001'::uuid;

-- ✓ "DELETE 1" → cleanup worked


-- ══════════════════════════════════════════════════════════════════════════════
-- BLOCK I — ISOLATION WORKFLOW (run in this exact order after above confirms)
-- ══════════════════════════════════════════════════════════════════════════════

-- Step 1: confirm table exists (C1)
-- Step 2: confirm RLS is on + policy exists (D1, D2)
-- Step 3: force reload
notify pgrst, 'reload schema';

-- Step 4: wait 3 seconds, then test the API route directly with curl:
--
--   curl -X POST https://<ref>.supabase.co/rest/v1/onboarding_submissions \
--     -H "apikey: <SUPABASE_ANON_KEY>" \
--     -H "Authorization: Bearer <USER_JWT_TOKEN>" \
--     -H "Content-Type: application/json" \
--     -d '{"user_id":"<your-uuid>","current_role":"test"}'
--
-- ✓ 201 Created → API layer works, app code works
-- ✗ PGRST205 → schema cache still stale; go to Dashboard → Settings → API → Reload
-- ✗ 401 → JWT is invalid or expired
-- ✗ 42501 → RLS policy is blocking; check BLOCK G ran correctly


-- ══════════════════════════════════════════════════════════════════════════════
-- BLOCK J — IF ALL ELSE FAILS: full schema + rls from scratch in one shot
-- Run this only if BLOCK F + G are still not working.
-- Drops and recreates the table cleanly (DESTRUCTIVE — only if no real data).
-- ══════════════════════════════════════════════════════════════════════════════

-- J1. DROP (only run if you have no real user data)
-- drop table if exists public.onboarding_submissions cascade;

-- J2. Full recreate with all constraints + RLS in one transaction
-- (uncomment and run after the drop above)

/*
begin;

  create extension if not exists "uuid-ossp";

  create table public.onboarding_submissions (
    id                       uuid        primary key default uuid_generate_v4(),
    user_id                  uuid        not null unique,
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

  alter table public.onboarding_submissions enable row level security;

  create policy "submissions: own row"
    on public.onboarding_submissions
    for all
    using      (auth.uid() = user_id)
    with check (auth.uid() = user_id);

  create index idx_onboarding_user on public.onboarding_submissions(user_id);

  notify pgrst, 'reload schema';

commit;
*/

-- ✓ "COMMIT" in output → full table created in a single atomic transaction
