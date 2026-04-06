-- ============================================================
-- GEAUX OPS — Migration 016
-- Add a check constraint to group_members.role_in_group.
--
-- Previously: free-form text, no constraint.
-- Now: must be one of the workspace-level roles:
--   owner | admin | partner | manager | worker | viewer
--
-- Note: team_member / family_member are global user_role values;
-- within a specific workspace the granular roles above apply.
--
-- Null is allowed — a member with no explicit workspace role
-- inherits the most restrictive access (viewer-equivalent).
-- ============================================================

-- Normalise any existing values that would violate the new constraint.
-- Unknown/invalid values default down to 'viewer' for safety.
update public.group_members
set    role_in_group = 'viewer'
where  role_in_group is not null
  and  role_in_group not in ('owner', 'admin', 'partner', 'manager', 'worker', 'viewer');

-- Add the check constraint (NULL passes automatically in Postgres).
alter table public.group_members
  add constraint group_members_role_in_group_check
  check (role_in_group in ('owner', 'admin', 'partner', 'manager', 'worker', 'viewer'));
