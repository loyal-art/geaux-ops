-- ============================================================
-- GEAUX OPS — Migration 025
-- Add step_dependencies table to support blocking relationships
-- between job steps (Flow View dependency editing — Part 1).
--
-- step_id            — the step that is blocked / waiting
-- blocked_by_step_id — the step that must complete first
-- ============================================================

create table public.step_dependencies (
  id                 uuid        primary key default gen_random_uuid(),
  step_id            uuid        not null references public.job_steps(id) on delete cascade,
  blocked_by_step_id uuid        not null references public.job_steps(id) on delete cascade,
  created_at         timestamptz not null default now(),

  unique (step_id, blocked_by_step_id),
  check  (step_id != blocked_by_step_id)
);

-- Indexes for efficient lookups in both directions
create index idx_step_dependencies_step_id
  on public.step_dependencies (step_id);

create index idx_step_dependencies_blocked_by
  on public.step_dependencies (blocked_by_step_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table public.step_dependencies enable row level security;

-- SELECT — anyone who can access the job that owns the step can view its dependencies.
create policy "step_dependencies_select"
  on public.step_dependencies for select
  using (
    exists (
      select 1 from public.job_steps s
      where  s.id = step_id
        and  public.can_access_job(s.job_id)
    )
  );

-- INSERT — only manager-or-above (or job owner/creator) can add dependencies.
-- Mirrors the job_steps_insert policy.
create policy "step_dependencies_insert"
  on public.step_dependencies for insert
  with check (
    exists (
      select 1 from public.job_steps s
      join   public.jobs j on j.id = s.job_id
      where  s.id = step_id
        and (
          public.is_owner()
          or j.created_by    = auth.uid()
          or j.owner_user_id = auth.uid()
          or (j.group_id is not null and public.is_workspace_manager_or_above(j.group_id))
        )
    )
  );

-- DELETE — only manager-or-above (or job owner/creator) can remove dependencies.
-- Mirrors the job_steps_delete policy.
create policy "step_dependencies_delete"
  on public.step_dependencies for delete
  using (
    exists (
      select 1 from public.job_steps s
      join   public.jobs j on j.id = s.job_id
      where  s.id = step_id
        and (
          public.is_owner()
          or j.created_by    = auth.uid()
          or j.owner_user_id = auth.uid()
          or (j.group_id is not null and public.is_workspace_manager_or_above(j.group_id))
        )
    )
  );
