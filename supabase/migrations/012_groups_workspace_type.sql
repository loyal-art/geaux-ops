-- ============================================================
-- GEAUX OPS — Migration 012
-- Rename concept: groups → workspaces.
-- Table stays `groups`; update the `type` check constraint to
-- include 'group' (generic workspace type) alongside the
-- existing values, keeping 'misc' for backward compatibility.
-- ============================================================

-- Drop the auto-named check constraint added in migration 011.
-- Postgres names it <table>_<column>_check by convention.
alter table public.groups
  drop constraint if exists groups_type_check;

-- Re-add with the expanded set: business | household | group | personal | misc
-- 'group'  = generic team/group workspace (new)
-- 'misc'   = kept for any rows already using it
alter table public.groups
  add constraint groups_type_check
  check (type in ('business', 'household', 'group', 'personal', 'misc'));
