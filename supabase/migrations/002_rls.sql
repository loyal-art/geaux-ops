-- ============================================================
-- GEAUX OPS — RLS Policies Migration 002
-- Run AFTER 001_schema.sql
-- ============================================================

-- Enable RLS on all tables
alter table public.users             enable row level security;
alter table public.groups            enable row level security;
alter table public.group_members     enable row level security;
alter table public.job_templates     enable row level security;
alter table public.jobs              enable row level security;
alter table public.job_steps         enable row level security;
alter table public.job_comments      enable row level security;
alter table public.recurring_schedules enable row level security;
alter table public.notifications     enable row level security;
alter table public.allowance_ledger  enable row level security;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Check if the current user has the 'owner' role
create or replace function public.is_owner()
returns boolean as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'owner'
  );
$$ language sql security definer stable;

-- Check if the current user is a member of a given group
create or replace function public.is_group_member(p_group_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Check if the current user can access a given job
-- (owner of app, creator, assignee, or member of the job's group)
create or replace function public.can_access_job(p_job_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.jobs j
    where j.id = p_job_id
      and (
        public.is_owner()
        or j.created_by  = auth.uid()
        or j.assigned_to = auth.uid()
        or (j.group_id is not null and public.is_group_member(j.group_id))
      )
  );
$$ language sql security definer stable;

-- ============================================================
-- USERS POLICIES
-- ============================================================

-- Anyone signed in can view all profiles (needed for @mentions, assignee display)
create policy "users_select"
  on public.users for select
  using (auth.uid() is not null);

-- Users can only update their own profile
create policy "users_update_own"
  on public.users for update
  using (id = auth.uid());

-- Owner can update any user (e.g. change roles)
create policy "users_update_owner"
  on public.users for update
  using (public.is_owner());

-- ============================================================
-- GROUPS POLICIES
-- ============================================================

create policy "groups_select"
  on public.groups for select
  using (auth.uid() is not null);

create policy "groups_all_owner"
  on public.groups for all
  using (public.is_owner());

-- ============================================================
-- GROUP MEMBERS POLICIES
-- ============================================================

create policy "group_members_select"
  on public.group_members for select
  using (auth.uid() is not null);

create policy "group_members_all_owner"
  on public.group_members for all
  using (public.is_owner());

-- ============================================================
-- JOB TEMPLATES POLICIES
-- ============================================================

-- All signed-in users can view templates
create policy "job_templates_select"
  on public.job_templates for select
  using (auth.uid() is not null);

-- Only owners can create/edit/delete templates
create policy "job_templates_all_owner"
  on public.job_templates for all
  using (public.is_owner());

-- ============================================================
-- JOBS POLICIES
-- ============================================================

-- Users can see jobs they own, are assigned to, or that are in their groups
create policy "jobs_select"
  on public.jobs for select
  using (
    auth.uid() is not null
    and (
      public.is_owner()
      or created_by  = auth.uid()
      or assigned_to = auth.uid()
      or (group_id is not null and public.is_group_member(group_id))
    )
  );

-- Owners, partners, and team members can create jobs
create policy "jobs_insert"
  on public.jobs for insert
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid()
        and role in ('owner', 'partner', 'team_member')
    )
  );

-- Owners, job creators, and assignees can update jobs
create policy "jobs_update"
  on public.jobs for update
  using (
    public.is_owner()
    or created_by  = auth.uid()
    or assigned_to = auth.uid()
  );

-- Only owners can delete jobs
create policy "jobs_delete_owner"
  on public.jobs for delete
  using (public.is_owner());

-- ============================================================
-- JOB STEPS POLICIES
-- ============================================================

-- Users can view steps if they can access the parent job
create policy "job_steps_select"
  on public.job_steps for select
  using (public.can_access_job(job_id));

-- Users can insert steps if they can access the parent job
create policy "job_steps_insert"
  on public.job_steps for insert
  with check (public.can_access_job(job_id));

-- Users can update steps if they can access the parent job
-- (checking off steps is the core action — broadly allowed for any job participant)
create policy "job_steps_update"
  on public.job_steps for update
  using (public.can_access_job(job_id));

-- Only owners can delete steps
create policy "job_steps_delete"
  on public.job_steps for delete
  using (public.is_owner() or public.can_access_job(job_id));

-- ============================================================
-- JOB COMMENTS POLICIES
-- ============================================================

-- Users can view comments on jobs they can access
create policy "job_comments_select"
  on public.job_comments for select
  using (public.can_access_job(job_id));

-- Any authenticated user can post a comment to a job they can access
create policy "job_comments_insert"
  on public.job_comments for insert
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and public.can_access_job(job_id)
  );

-- Users can only delete their own comments; owners can delete any
create policy "job_comments_delete"
  on public.job_comments for delete
  using (user_id = auth.uid() or public.is_owner());

-- ============================================================
-- RECURRING SCHEDULES POLICIES
-- ============================================================

create policy "recurring_select"
  on public.recurring_schedules for select
  using (auth.uid() is not null);

create policy "recurring_all_owner"
  on public.recurring_schedules for all
  using (public.is_owner());

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================

-- Users see only their own notifications
create policy "notifications_select"
  on public.notifications for select
  using (user_id = auth.uid());

-- Mark as read (update own)
create policy "notifications_update"
  on public.notifications for update
  using (user_id = auth.uid());

-- System/owner can insert notifications
create policy "notifications_insert"
  on public.notifications for insert
  with check (auth.uid() is not null);

-- ============================================================
-- ALLOWANCE LEDGER POLICIES
-- ============================================================

-- Kids see their own; owners see all
create policy "allowance_select"
  on public.allowance_ledger for select
  using (user_id = auth.uid() or public.is_owner());

-- Only owners can insert/update/delete ledger entries
create policy "allowance_all_owner"
  on public.allowance_ledger for all
  using (public.is_owner());
