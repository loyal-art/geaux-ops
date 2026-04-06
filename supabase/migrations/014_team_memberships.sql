-- ============================================================
-- GEAUX OPS — Migration 014
-- Create `team_memberships` table.
-- Tracks which users belong to which team and their role
-- within that team (lead | member).
-- ============================================================

create table public.team_memberships (
  id        uuid primary key default uuid_generate_v4(),
  team_id   uuid references public.teams(id)  on delete cascade not null,
  user_id   uuid references public.users(id)  on delete cascade not null,
  team_role text not null default 'member'
              check (team_role in ('lead', 'member')),
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create index idx_team_memberships_team_id on public.team_memberships(team_id);
create index idx_team_memberships_user_id on public.team_memberships(user_id);

-- ── RLS ────────────────────────────────────────────────────────────────────────

alter table public.team_memberships enable row level security;

-- A team member can see their own team's membership rows.
-- Workspace owner/admin can see all memberships for their workspace.
create policy "team_memberships_select"
  on public.team_memberships for select
  using (
    auth.uid() is not null
    and (
      public.is_owner()
      -- I am a member of this team
      or user_id = auth.uid()
      -- I am an owner/admin of the workspace this team belongs to
      or exists (
        select 1
        from   public.teams t
        join   public.group_members gm
               on gm.group_id = t.group_id and gm.user_id = auth.uid()
        where  t.id = team_id
          and  gm.role_in_group in ('owner', 'admin')
      )
    )
  );

-- Workspace owner/admin can add members to any team in their workspace.
create policy "team_memberships_insert"
  on public.team_memberships for insert
  with check (
    public.is_owner()
    or exists (
      select 1
      from   public.teams t
      join   public.group_members gm
             on gm.group_id = t.group_id and gm.user_id = auth.uid()
      where  t.id = team_id
        and  gm.role_in_group in ('owner', 'admin')
    )
  );

-- Workspace owner/admin can update membership roles.
create policy "team_memberships_update"
  on public.team_memberships for update
  using (
    public.is_owner()
    or exists (
      select 1
      from   public.teams t
      join   public.group_members gm
             on gm.group_id = t.group_id and gm.user_id = auth.uid()
      where  t.id = team_memberships.team_id
        and  gm.role_in_group in ('owner', 'admin')
    )
  );

-- Workspace owner/admin can remove members from teams.
create policy "team_memberships_delete"
  on public.team_memberships for delete
  using (
    public.is_owner()
    or exists (
      select 1
      from   public.teams t
      join   public.group_members gm
             on gm.group_id = t.group_id and gm.user_id = auth.uid()
      where  t.id = team_memberships.team_id
        and  gm.role_in_group in ('owner', 'admin')
    )
  );
