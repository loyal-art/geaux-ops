-- ============================================================
-- GEAUX OPS — Migration 018
-- Add ownership columns to the `projects` table.
--
--   owner_user_id    — the person accountable for this project
--   assigned_team_id — the team collectively working on this project
-- ============================================================

alter table public.projects
  add column if not exists owner_user_id    uuid references public.users(id) on delete set null;

alter table public.projects
  add column if not exists assigned_team_id uuid references public.teams(id) on delete set null;

create index if not exists idx_projects_owner_user_id    on public.projects(owner_user_id)
  where owner_user_id is not null;

create index if not exists idx_projects_assigned_team_id on public.projects(assigned_team_id)
  where assigned_team_id is not null;
