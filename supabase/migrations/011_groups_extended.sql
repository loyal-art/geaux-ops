-- ============================================================
-- GEAUX OPS — Migration 011
-- Extend groups table with type, contact info, locations, notes.
-- jobs.group_id and jobs.client_name are already nullable — no-op.
-- ============================================================

-- Add type column with check constraint
alter table public.groups
  add column if not exists type text not null default 'business'
    check (type in ('business', 'household', 'personal', 'misc'));

-- Add contact / location fields
alter table public.groups
  add column if not exists contact_email text;

alter table public.groups
  add column if not exists contact_phone text;

alter table public.groups
  add column if not exists locations jsonb not null default '[]';

alter table public.groups
  add column if not exists notes text;

-- jobs.group_id and jobs.client_name are already nullable in the schema —
-- no migration needed for those columns.
