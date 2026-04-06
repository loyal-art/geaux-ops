-- ============================================================
-- GEAUX OPS — Migration 019
-- Helper function: resolve_user_workspace_role
--
-- Returns the effective role a user holds within a specific
-- workspace (groups row).  Used by RLS policies and application
-- code to make role-based decisions without repeating logic.
--
-- Resolution order:
--   1. Explicit role_in_group from group_members (most specific)
--   2. 'owner' if the user has the global app owner role
--   3. NULL if no relationship exists
-- ============================================================

create or replace function public.resolve_user_workspace_role(
  p_user_id  uuid,
  p_group_id uuid
)
returns text
language sql
security definer
stable
as $$
  select coalesce(
    -- 1. Explicit workspace-level role
    (
      select gm.role_in_group
      from   public.group_members gm
      where  gm.user_id  = p_user_id
        and  gm.group_id = p_group_id
    ),
    -- 2. Global app owner falls back to workspace 'owner' everywhere
    (
      select case when u.role = 'owner' then 'owner' end
      from   public.users u
      where  u.id = p_user_id
    )
  );
$$;
