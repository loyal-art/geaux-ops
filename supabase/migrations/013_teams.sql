-- ============================================================
-- GEAUX OPS — Migration 013
-- Create `teams` table.
-- Teams are sub-groups within a workspace (groups row).
-- A workspace owner/admin can create and manage teams;
-- workspace members can view teams they belong to.
-- ============================================================

create table public.teams (
  id          uuid primary key default uuid_generate_v4(),
  group_id    uuid references public.groups(id) on delete cascade not null,
  name        text not null,
  description text,
  created_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index idx_teams_group_id   on public.teams(group_id);
create index idx_teams_created_at on public.teams(created_at desc);

-- ── RLS ────────────────────────────────────────────────────────────────────────

alter table public.teams enable row level security;

-- Workspace members can view teams in their workspace.
-- Global owner can view all teams.
create policy "teams_select"
  on public.teams for select
  using (
    auth.uid() is not null
    and (
      public.is_owner()
      or exists (
        select 1 from public.group_members gm
        where gm.group_id = teams.group_id
          and gm.user_id  = auth.uid()
      )
    )
  );

-- Workspace owner/admin can create teams in their workspace.
create policy "teams_insert"
  on public.teams for insert
  with check (
    public.is_owner()
    or exists (
      select 1 from public.group_members gm
      where gm.group_id     = group_id
        and gm.user_id      = auth.uid()
        and gm.role_in_group in ('owner', 'admin')
    )
  );

-- Workspace owner/admin can update teams.
create policy "teams_update"
  on public.teams for update
  using (
    public.is_owner()
    or exists (
      select 1 from public.group_members gm
      where gm.group_id     = teams.group_id
        and gm.user_id      = auth.uid()
        and gm.role_in_group in ('owner', 'admin')
    )
  );

-- Workspace owner/admin can delete teams.
create policy "teams_delete"
  on public.teams for delete
  using (
    public.is_owner()
    or exists (
      select 1 from public.group_members gm
      where gm.group_id     = teams.group_id
        and gm.user_id      = auth.uid()
        and gm.role_in_group in ('owner', 'admin')
    )
  );
