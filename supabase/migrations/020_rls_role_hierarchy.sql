-- ============================================================
-- GEAUX OPS — Migration 020
-- Update RLS policies on jobs, job_steps, job_comments to
-- enforce the workspace role hierarchy introduced in 015–019.
--
-- Role hierarchy (most → least permissive within a workspace):
--   owner   — full access to everything in the workspace
--   admin   — full access (same as owner within the workspace)
--   partner — full access within assigned workspaces
--   manager — full access within assigned teams
--   worker  — view + update assigned items, check off steps,
--              add comments; CANNOT create or delete jobs
--   viewer  — read-only
--
-- Global app `owner` role always bypasses workspace restrictions.
-- ============================================================

-- ── Updated helper functions ───────────────────────────────────────────────────

-- Extend can_access_job to recognise team membership and owner_user_id.
create or replace function public.can_access_job(p_job_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.jobs j
    where  j.id = p_job_id
      and (
        -- Global app owner
        public.is_owner()
        -- Job creator or explicit owner
        or j.created_by     = auth.uid()
        or j.owner_user_id  = auth.uid()
        -- Individual assignee
        or j.assigned_to    = auth.uid()
        -- Any member of the job's workspace
        or (j.group_id is not null and public.is_group_member(j.group_id))
        -- Any member of the job's assigned team
        or (
          j.assigned_team_id is not null
          and exists (
            select 1 from public.team_memberships tm
            where  tm.team_id = j.assigned_team_id
              and  tm.user_id = auth.uid()
          )
        )
      )
  );
$$;

-- True when the current user is owner/admin/partner in the given workspace.
-- Partners have the same broad rights as owners within their workspaces.
create or replace function public.is_workspace_admin_or_above(p_group_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select (
    public.is_owner()
    or exists (
      select 1 from public.group_members gm
      where  gm.group_id     = p_group_id
        and  gm.user_id      = auth.uid()
        and  gm.role_in_group in ('owner', 'admin', 'partner')
    )
  );
$$;

-- True when the current user is manager-or-above (owner/admin/partner/manager).
-- Managers can create/update/read jobs within their teams.
create or replace function public.is_workspace_manager_or_above(p_group_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select (
    public.is_owner()
    or exists (
      select 1 from public.group_members gm
      where  gm.group_id     = p_group_id
        and  gm.user_id      = auth.uid()
        and  gm.role_in_group in ('owner', 'admin', 'partner', 'manager')
    )
  );
$$;

-- ── JOBS ──────────────────────────────────────────────────────────────────────

-- Drop existing policies
drop policy if exists "jobs_select"       on public.jobs;
drop policy if exists "jobs_insert"       on public.jobs;
drop policy if exists "jobs_update"       on public.jobs;
drop policy if exists "jobs_delete_owner" on public.jobs;

-- SELECT — anyone who has any relationship to the job can see it.
-- Viewers (read-only) are included; they just can't mutate.
create policy "jobs_select"
  on public.jobs for select
  using (
    auth.uid() is not null
    and (
      public.is_owner()
      or created_by        = auth.uid()
      or owner_user_id     = auth.uid()
      or assigned_to       = auth.uid()
      or (group_id is not null and public.is_group_member(group_id))
      or (
        assigned_team_id is not null
        and exists (
          select 1 from public.team_memberships tm
          where  tm.team_id = assigned_team_id
            and  tm.user_id = auth.uid()
        )
      )
    )
  );

-- INSERT — manager-or-above within the target workspace, or a privileged
-- global role.  Workers and viewers cannot create jobs.
create policy "jobs_insert"
  on public.jobs for insert
  with check (
    auth.uid() is not null
    and (
      -- Global owner always allowed
      public.is_owner()
      -- Privileged global role (admin / partner / manager) without a specific workspace
      or exists (
        select 1 from public.users u
        where  u.id   = auth.uid()
          and  u.role in ('owner', 'admin', 'partner', 'manager')
      )
      -- Manager-or-above within the job's workspace
      or (group_id is not null and public.is_workspace_manager_or_above(group_id))
    )
  );

-- UPDATE — manager-or-above in the workspace can edit any job; workers can
-- update jobs where they are the assignee or owner (e.g. mark in-progress).
create policy "jobs_update"
  on public.jobs for update
  using (
    public.is_owner()
    or created_by    = auth.uid()
    or owner_user_id = auth.uid()
    or (group_id is not null and public.is_workspace_manager_or_above(group_id))
    -- Workers can update their assigned jobs (e.g. status changes)
    or assigned_to   = auth.uid()
  );

-- DELETE — only workspace admin-or-above (owner/admin/partner).
-- Workers and managers cannot delete jobs.
create policy "jobs_delete_owner"
  on public.jobs for delete
  using (
    public.is_owner()
    or (group_id is not null and public.is_workspace_admin_or_above(group_id))
  );

-- ── JOB STEPS ─────────────────────────────────────────────────────────────────

drop policy if exists "job_steps_select" on public.job_steps;
drop policy if exists "job_steps_insert" on public.job_steps;
drop policy if exists "job_steps_update" on public.job_steps;
drop policy if exists "job_steps_delete" on public.job_steps;

-- SELECT — any job participant (including workers / viewers) can read steps.
create policy "job_steps_select"
  on public.job_steps for select
  using (public.can_access_job(job_id));

-- INSERT — only manager-or-above (or the job owner/creator).
-- Workers cannot add new steps.
create policy "job_steps_insert"
  on public.job_steps for insert
  with check (
    exists (
      select 1 from public.jobs j
      where  j.id = job_id
        and (
          public.is_owner()
          or j.created_by    = auth.uid()
          or j.owner_user_id = auth.uid()
          or (j.group_id is not null and public.is_workspace_manager_or_above(j.group_id))
        )
    )
  );

-- UPDATE — any job participant can check off a step (core worker action).
create policy "job_steps_update"
  on public.job_steps for update
  using (public.can_access_job(job_id));

-- DELETE — only manager-or-above (or the job owner/creator).
create policy "job_steps_delete"
  on public.job_steps for delete
  using (
    exists (
      select 1 from public.jobs j
      where  j.id = job_id
        and (
          public.is_owner()
          or j.created_by    = auth.uid()
          or j.owner_user_id = auth.uid()
          or (j.group_id is not null and public.is_workspace_manager_or_above(j.group_id))
        )
    )
  );

-- ── JOB COMMENTS ──────────────────────────────────────────────────────────────

drop policy if exists "job_comments_select" on public.job_comments;
drop policy if exists "job_comments_insert" on public.job_comments;
drop policy if exists "job_comments_delete" on public.job_comments;

-- SELECT — any job participant can read comments.
create policy "job_comments_select"
  on public.job_comments for select
  using (public.can_access_job(job_id));

-- INSERT — any job participant (including workers) can post comments.
-- Comments are the primary F4 (Follow-Up) mechanism.
create policy "job_comments_insert"
  on public.job_comments for insert
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and public.can_access_job(job_id)
  );

-- DELETE — own comment, or workspace admin-or-above.
create policy "job_comments_delete"
  on public.job_comments for delete
  using (
    user_id = auth.uid()
    or public.is_owner()
    or exists (
      select 1 from public.jobs j
      where  j.id = job_id
        and  j.group_id is not null
        and  public.is_workspace_admin_or_above(j.group_id)
    )
  );
