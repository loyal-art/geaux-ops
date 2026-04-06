-- ============================================================
-- GEAUX OPS — Migration 017
-- Add ownership columns to the `jobs` table.
--
--   owner_user_id   — the person driving / accountable for this job
--                     (distinct from created_by which is the creator)
--   assigned_team_id — the team collectively responsible for this job
--                     (distinct from assigned_to which is an individual)
-- ============================================================

alter table public.jobs
  add column if not exists owner_user_id    uuid references public.users(id) on delete set null;

alter table public.jobs
  add column if not exists assigned_team_id uuid references public.teams(id) on delete set null;

create index if not exists idx_jobs_owner_user_id    on public.jobs(owner_user_id)
  where owner_user_id is not null;

create index if not exists idx_jobs_assigned_team_id on public.jobs(assigned_team_id)
  where assigned_team_id is not null;
