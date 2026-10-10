-- =============================================================================
-- Magnate 26-27 — Team Registration Schema
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- SAFE TO RE-RUN on a fresh or existing database:
--   · CREATE TABLE/SEQUENCE IF NOT EXISTS  → no-op if already exists
--   · CREATE OR REPLACE FUNCTION           → replaces function body in-place
--   · CREATE UNIQUE INDEX IF NOT EXISTS    → no-op if the named index exists
--   · ALTER TABLE … ADD COLUMN IF NOT EXISTS → no-op if column exists
--   · No DROP TABLE, no TRUNCATE, no data deleted
--
-- Server credentials — never prefix with NEXT_PUBLIC_:
--   SUPABASE_URL        = your project URL
--   SUPABASE_SECRET_KEY = your sb_secret_... key  (server-side only, never browser)
--
-- Events:
--   ideathon  OPEN    1–4 members per team
--   casecom   OPEN    2–5 members per team
--   Open/closed is controlled by registration-config.js, NOT by the database.
--
-- CaseCom notes:
--   The official Google Form only collects email from the Team Leader.
--   Members 2–5 do not provide an email; the API inserts a unique synthetic
--   placeholder (cc-pN-<timestamp>-<rand>@casecom.internal) to satisfy the
--   NOT NULL constraint.  The casecom_export view will show these placeholders
--   for non-leader member email columns — organisers can ignore them.
--
-- Every team member (leader and non-leaders) must supply:
--   name · email (unique per event, case-insensitive) · whatsapp (format-validated only)
-- =============================================================================

-- ── Sequences — human-readable registration IDs ───────────────────────────────
-- MAG-ID-0001 … (Ideathon)    MAG-CC-0001 … (CaseCom)
create sequence if not exists public.magnate_id_seq start 1;
create sequence if not exists public.magnate_cc_seq start 1;

-- ── registrations ─────────────────────────────────────────────────────────────
create table if not exists public.registrations (
  id         uuid        primary key default gen_random_uuid(),
  reg_code   text        not null unique,           -- e.g. MAG-ID-0042
  event      text        not null
               check (event in ('ideathon', 'casecom')),
  team_name  text        not null
               check (char_length(trim(team_name)) between 2 and 100),
  extra      jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  -- composite PK used by the FK on registration_members.event
  unique (id, event)
);

-- Case-insensitive team-name uniqueness within each event.
create unique index if not exists registrations_team_unique
  on public.registrations (event, lower(trim(team_name)));

-- ── registration_members ──────────────────────────────────────────────────────
-- Every member (position 1 = leader, 2-5 = others) must have name, email, whatsapp.
-- Email is stored in lowercase and is unique per event (case-insensitive).
-- WhatsApp is format-validated (10 digits) but NOT unique per event —
-- a person may appear on multiple teams in the same event if needed.
create table if not exists public.registration_members (
  id         uuid        primary key default gen_random_uuid(),
  team_id    uuid        not null,
  event      text        not null,
  position   smallint    not null check (position between 1 and 5),
  name       text        not null check (char_length(trim(name)) between 2 and 100),
  email      text        not null check (char_length(email) between 5 and 254),
             -- stored lowercase; uniqueness enforced by index below
  whatsapp   text        not null check (whatsapp ~ '^[0-9]{10}$'),
  extra      jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  foreign key (team_id, event)
    references public.registrations (id, event)
    on delete cascade,

  unique (team_id, position)   -- one row per position within a team
);

-- ── Migration guards — safe no-ops on a newly created table ──────────────────
alter table public.registration_members
  add column if not exists extra      jsonb       not null default '{}'::jsonb;

alter table public.registration_members
  add column if not exists created_at timestamptz not null default now();

-- Tighten email to NOT NULL if it was nullable in an older schema.
-- Wrapped in a DO block so the statement is skipped (not errored) when the
-- column is already NOT NULL, and warns clearly if NULL rows still exist.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'registration_members'
      and column_name  = 'email'
      and is_nullable  = 'YES'
  ) then
    if exists (select 1 from public.registration_members where email is null limit 1) then
      raise exception
        'Cannot set email NOT NULL: NULL rows exist in registration_members. '
        'Update or remove those rows first, then re-run this script.';
    end if;
    alter table public.registration_members alter column email set not null;
  end if;
end;
$$;

-- ── Uniqueness indexes ────────────────────────────────────────────────────────

-- Email: unique per event, case-insensitive, covers every row (email is NOT NULL).
-- The previous schema used a partial index (WHERE email IS NOT NULL) with the
-- same name. Drop it first so we can create the unconditional replacement.
-- DROP INDEX IF EXISTS is safe — it is a no-op when the index does not exist.
drop index if exists public.registration_members_email_unique;
create unique index registration_members_email_unique
  on public.registration_members (event, lower(email));

-- NOTE: There is intentionally NO unique index on (event, whatsapp).
-- WhatsApp is required and format-validated (10 digits) but a person is
-- allowed to appear on more than one team within the same event.

-- Performance index for the team+position join inside register_team()
create index if not exists registration_members_team_pos_idx
  on public.registration_members (team_id, position);

-- ── register_team() ───────────────────────────────────────────────────────────
-- Atomically inserts one team and all its members in a single transaction.
-- Called only by the Next.js API route via the service-role client.
--
-- Returns jsonb { reg_code text, already boolean }
--   already = false  → fresh registration, new reg_code issued
--   already = true   → team_name already taken for this event (23505 was raised
--                       and caught internally only for the leader-WhatsApp retry
--                       path; all other duplicates propagate as 23505 to the caller)
--
-- Raises (code 22023) for:
--   · unknown event
--   · member count outside the allowed range
--   · any member missing name, email, or whatsapp
--   · malformed email (basic format check)
--   · blank team name
--
-- Raises (code 23505) for unique violations that the API layer handles:
--   · registrations_team_unique   → team name already taken for this event
--   · registration_members_email_unique → email already used in this event
--
-- Email is normalised (trimmed + lowercased) before storage.
-- WhatsApp and name are trimmed before storage.
create or replace function public.register_team(
  p_event     text,    -- 'ideathon' | 'casecom'
  p_team_name text,
  p_extra     jsonb,   -- team-level extra fields (pass '{}' when none)
  p_members   jsonb    -- JSON array of { name, email, whatsapp, extra? }
) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_min       int;
  v_max       int;
  v_count     int;
  v_code      text;
  v_team      uuid;
  v_team_name text;   -- trimmed team name
  m           jsonb;
  i           int  := 0;
  v_name      text;
  v_email     text;
  v_whatsapp  text;
begin

  -- ── 1. Event guard ─────────────────────────────────────────────────────────
  if p_event = 'ideathon' then
    v_min := 1; v_max := 4;
  elsif p_event = 'casecom' then
    v_min := 2; v_max := 5;
  else
    raise exception 'Unknown event "%". Must be ideathon or casecom.', p_event
      using errcode = '22023';
  end if;

  -- ── 2. Team name validation ─────────────────────────────────────────────────
  v_team_name := trim(coalesce(p_team_name, ''));
  if char_length(v_team_name) < 2 then
    raise exception 'Team name must be at least 2 characters (got "%").', v_team_name
      using errcode = '22023';
  end if;
  if char_length(v_team_name) > 100 then
    raise exception 'Team name must be at most 100 characters.'
      using errcode = '22023';
  end if;

  -- ── 3. Members array guard ─────────────────────────────────────────────────
  if p_members is null or jsonb_typeof(p_members) <> 'array' then
    raise exception 'p_members must be a non-null JSON array.'
      using errcode = '22023';
  end if;

  v_count := jsonb_array_length(p_members);
  if v_count < v_min or v_count > v_max then
    raise exception 'Event % requires %–% members; got %.', p_event, v_min, v_max, v_count
      using errcode = '22023';
  end if;

  -- ── 4. Per-member field validation ─────────────────────────────────────────
  -- Validate all members before writing anything (fail-fast).
  for m in select value from jsonb_array_elements(p_members) loop
    i := i + 1;

    v_name     := trim(coalesce(m->>'name',     ''));
    v_email    := lower(trim(coalesce(m->>'email',    '')));
    v_whatsapp := trim(coalesce(m->>'whatsapp', ''));

    if char_length(v_name) < 2 then
      raise exception 'Member %: name must be at least 2 characters (got "%").', i, v_name
        using errcode = '22023';
    end if;
    if char_length(v_name) > 100 then
      raise exception 'Member %: name must be at most 100 characters.', i
        using errcode = '22023';
    end if;

    if v_email = '' then
      raise exception 'Member %: email is required.', i
        using errcode = '22023';
    end if;
    -- Basic email format: something@something.something
    if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
      raise exception 'Member %: "%" is not a valid email address.', i, v_email
        using errcode = '22023';
    end if;
    if char_length(v_email) > 254 then
      raise exception 'Member %: email must be at most 254 characters.', i
        using errcode = '22023';
    end if;

    if v_whatsapp = '' then
      raise exception 'Member %: whatsapp is required.', i
        using errcode = '22023';
    end if;
    if v_whatsapp !~ '^[0-9]{10}$' then
      raise exception 'Member %: whatsapp must be exactly 10 digits (got "%").', i, v_whatsapp
        using errcode = '22023';
    end if;
  end loop;

  -- Reset counter for insert loop.
  i := 0;

  -- ── 5. Generate registration ID ────────────────────────────────────────────
  if p_event = 'casecom' then
    v_code := 'MAG-CC-' || lpad(nextval('public.magnate_cc_seq')::text, 4, '0');
  else
    v_code := 'MAG-ID-' || lpad(nextval('public.magnate_id_seq')::text, 4, '0');
  end if;

  -- ── 6. Insert team row ─────────────────────────────────────────────────────
  -- A 23505 on registrations_team_unique means this team name is already taken.
  -- We propagate that error to the caller (the API handles it as a 409).
  -- There is no longer a "retry shortcut" that silently returns the existing
  -- reg_code — that approach was fragile because it matched on team name +
  -- leader WhatsApp only, ignoring whether the rest of the member details matched.
  insert into public.registrations (reg_code, event, team_name, extra)
  values (v_code, p_event, v_team_name, coalesce(p_extra, '{}'::jsonb))
  returning id into v_team;

  -- ── 7. Insert member rows ──────────────────────────────────────────────────
  -- Email stored lowercase (normalised above). WhatsApp stored as supplied (digits only).
  for m in select value from jsonb_array_elements(p_members) loop
    i := i + 1;

    v_name     := trim(m->>'name');
    v_email    := lower(trim(m->>'email'));
    v_whatsapp := trim(m->>'whatsapp');

    insert into public.registration_members
      (team_id, event, position, name, email, whatsapp, extra)
    values (
      v_team,
      p_event,
      i,
      v_name,
      v_email,
      v_whatsapp,
      coalesce(m->'extra', '{}'::jsonb)
    );
  end loop;

  return jsonb_build_object('reg_code', v_code, 'already', false);
end;
$$;

-- ── Row Level Security ────────────────────────────────────────────────────────
-- RLS ON, no public/anon/authenticated policies.
-- Only service_role (SUPABASE_SECRET_KEY, server-side) may access these tables.
alter table public.registrations        enable row level security;
alter table public.registration_members enable row level security;

revoke all on public.registrations        from anon, authenticated;
revoke all on public.registration_members from anon, authenticated;
revoke all on public.magnate_id_seq       from anon, authenticated;
revoke all on public.magnate_cc_seq       from anon, authenticated;

revoke all on function public.register_team(text, text, jsonb, jsonb)
  from public, anon, authenticated;

grant execute on function public.register_team(text, text, jsonb, jsonb)
  to service_role;

-- ── Export views ─────────────────────────────────────────────────────────────
-- security_invoker = true → views run with the caller's privileges.
-- service_role accesses these directly; anon/authenticated cannot (revoked below).

-- Ideathon: one row per team, name + email + whatsapp for all 4 positions.
create or replace view public.ideathon_export
  with (security_invoker = true) as
select
  r.reg_code,
  r.team_name,
  max(m.name)     filter (where m.position = 1) as leader_name,
  max(m.email)    filter (where m.position = 1) as leader_email,
  max(m.whatsapp) filter (where m.position = 1) as leader_whatsapp,
  max(m.name)     filter (where m.position = 2) as member2_name,
  max(m.email)    filter (where m.position = 2) as member2_email,
  max(m.whatsapp) filter (where m.position = 2) as member2_whatsapp,
  max(m.name)     filter (where m.position = 3) as member3_name,
  max(m.email)    filter (where m.position = 3) as member3_email,
  max(m.whatsapp) filter (where m.position = 3) as member3_whatsapp,
  max(m.name)     filter (where m.position = 4) as member4_name,
  max(m.email)    filter (where m.position = 4) as member4_email,
  max(m.whatsapp) filter (where m.position = 4) as member4_whatsapp,
  count(m.id)                                    as member_count,
  r.extra::text                                  as team_extra,
  jsonb_agg(m.extra order by m.position)::text   as members_extra,
  r.created_at
from public.registrations r
join public.registration_members m on m.team_id = r.id
where r.event = 'ideathon'
group by r.id
order by r.created_at;

-- CaseCom: one row per team, name + email + whatsapp for all 5 positions.
create or replace view public.casecom_export
  with (security_invoker = true) as
select
  r.reg_code,
  r.team_name,
  max(m.name)     filter (where m.position = 1) as leader_name,
  max(m.email)    filter (where m.position = 1) as leader_email,
  max(m.whatsapp) filter (where m.position = 1) as leader_whatsapp,
  max(m.name)     filter (where m.position = 2) as member2_name,
  max(m.email)    filter (where m.position = 2) as member2_email,
  max(m.whatsapp) filter (where m.position = 2) as member2_whatsapp,
  max(m.name)     filter (where m.position = 3) as member3_name,
  max(m.email)    filter (where m.position = 3) as member3_email,
  max(m.whatsapp) filter (where m.position = 3) as member3_whatsapp,
  max(m.name)     filter (where m.position = 4) as member4_name,
  max(m.email)    filter (where m.position = 4) as member4_email,
  max(m.whatsapp) filter (where m.position = 4) as member4_whatsapp,
  max(m.name)     filter (where m.position = 5) as member5_name,
  max(m.email)    filter (where m.position = 5) as member5_email,
  max(m.whatsapp) filter (where m.position = 5) as member5_whatsapp,
  count(m.id)                                    as member_count,
  r.extra::text                                  as team_extra,
  jsonb_agg(m.extra order by m.position)::text   as members_extra,
  r.created_at
from public.registrations r
join public.registration_members m on m.team_id = r.id
where r.event = 'casecom'
group by r.id
order by r.created_at;

-- All events: one row per member — includes every member's email.
create or replace view public.members_export
  with (security_invoker = true) as
select
  r.reg_code,
  r.event,
  r.team_name,
  m.position,
  m.name,
  m.email,
  m.whatsapp,
  m.extra::text as member_extra,
  r.created_at
from public.registrations r
join public.registration_members m on m.team_id = r.id
order by r.created_at, r.reg_code, m.position;

revoke all on public.ideathon_export from anon, authenticated;
revoke all on public.casecom_export  from anon, authenticated;
revoke all on public.members_export  from anon, authenticated;

-- ── Integrity audit queries (run manually; both must return zero rows) ────────
--
--   select event, lower(email), count(*)
--   from public.registration_members
--   group by 1, 2 having count(*) > 1;
--
--   select event, lower(trim(team_name)), count(*)
--   from public.registrations
--   group by 1, 2 having count(*) > 1;

-- ── Pre-launch cleanup (run manually AFTER testing, BEFORE going live) ─────────
--   truncate public.registrations cascade;
--   alter sequence public.magnate_id_seq restart with 1;
--   alter sequence public.magnate_cc_seq  restart with 1;