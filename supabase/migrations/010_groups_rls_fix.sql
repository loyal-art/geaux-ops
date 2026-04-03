-- ============================================================
-- GEAUX OPS — Migration 010
-- Fix groups / group_members RLS: add explicit WITH CHECK
-- so owner INSERT/UPDATE are gated properly.
-- ============================================================

-- Drop and recreate groups_all_owner with explicit with check
drop policy if exists "groups_all_owner" on public.groups;

create policy "groups_insert_owner"
  on public.groups for insert
  with check (public.is_owner());

create policy "groups_update_owner"
  on public.groups for update
  using  (public.is_owner())
  with check (public.is_owner());

create policy "groups_delete_owner"
  on public.groups for delete
  using (public.is_owner());

-- Drop and recreate group_members_all_owner with explicit with check
drop policy if exists "group_members_all_owner" on public.group_members;

create policy "group_members_insert_owner"
  on public.group_members for insert
  with check (public.is_owner());

create policy "group_members_update_owner"
  on public.group_members for update
  using  (public.is_owner())
  with check (public.is_owner());

create policy "group_members_delete_owner"
  on public.group_members for delete
  using (public.is_owner());
