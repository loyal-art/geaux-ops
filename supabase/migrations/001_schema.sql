-- ============================================================
-- GEAUX OPS — Schema Migration 001
-- Run this first in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('owner', 'partner', 'team_member', 'family_member');
create type job_status as enum ('unassigned', 'in_progress', 'blocked', 'cancelled', 'completed', 'archived');
create type job_priority as enum ('urgent', 'normal', 'low');
create type recurring_frequency as enum ('daily', 'weekdays', 'weekly', 'monthly');
create type allowance_status as enum ('earned', 'paid');

-- ============================================================
-- USERS
-- Mirrors auth.users with app-specific fields.
-- Auto-populated via trigger on sign-up.
-- ============================================================

create table public.users (
  id           uuid references auth.users(id) on delete cascade primary key,
  email        text not null,
  display_name text,
  role         user_role not null default 'family_member',
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- Trigger: auto-create user row when someone signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: promote the very first user to owner automatically
create or replace function public.promote_first_user_to_owner()
returns trigger as $$
begin
  if (select count(*) from public.users) = 1 then
    update public.users set role = 'owner' where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_first_user_promote
  after insert on public.users
  for each row execute procedure public.promote_first_user_to_owner();

-- ============================================================
-- GROUPS
-- Collections of users who share a job board.
-- ============================================================

create table public.groups (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  created_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- GROUP MEMBERS
-- ============================================================

create table public.group_members (
  group_id     uuid references public.groups(id) on delete cascade,
  user_id      uuid references public.users(id) on delete cascade,
  role_in_group text,
  joined_at    timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- ============================================================
-- JOB TEMPLATES
-- default_steps is a JSONB array of step objects:
-- [{ "text": "...", "sort_order": 0, "is_high_impact": true, "allowance_amount": 0 }]
-- ============================================================

create table public.job_templates (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  color         text not null default '#C8A44E',
  category      text not null default 'business',  -- business | household | custom
  default_steps jsonb not null default '[]',
  created_by    uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- JOBS
-- The central unit of work in Geaux Ops.
-- finish_definition = F1 (Finish): "What does done look like?"
-- ============================================================

create table public.jobs (
  id                uuid primary key default uuid_generate_v4(),
  template_id       uuid references public.job_templates(id) on delete set null,
  title             text not null,
  client_name       text,
  finish_definition text,                           -- F1: What does finished look like?
  status            job_status not null default 'unassigned',
  priority          job_priority not null default 'normal',
  assigned_to       uuid references public.users(id) on delete set null,
  group_id          uuid references public.groups(id) on delete set null,
  allowance_total   numeric(10,2) default 0,
  due_date          timestamptz,
  created_by        uuid references public.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  completed_at      timestamptz,
  archived_at       timestamptz
);

-- ============================================================
-- JOB STEPS
-- Checklist items within a job.
-- is_high_impact = F2 (Focus): marks the 80/20 high-value steps.
-- ============================================================

create table public.job_steps (
  id               uuid primary key default uuid_generate_v4(),
  job_id           uuid references public.jobs(id) on delete cascade not null,
  text             text not null,
  done             boolean not null default false,
  is_high_impact   boolean not null default false,  -- F2: Focus
  completed_by     uuid references public.users(id) on delete set null,
  completed_at     timestamptz,
  allowance_amount numeric(10,2) default 0,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now()
);

-- ============================================================
-- JOB COMMENTS
-- F4 (Follow-Up): running log of activity, issues, decisions.
-- ============================================================

create table public.job_comments (
  id         uuid primary key default uuid_generate_v4(),
  job_id     uuid references public.jobs(id) on delete cascade not null,
  user_id    uuid references public.users(id) on delete set null,
  text       text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RECURRING SCHEDULES
-- Links a template to a frequency so jobs auto-generate.
-- ============================================================

create table public.recurring_schedules (
  id                uuid primary key default uuid_generate_v4(),
  template_id       uuid references public.job_templates(id) on delete cascade not null,
  frequency         recurring_frequency not null default 'daily',
  group_id          uuid references public.groups(id) on delete set null,
  assigned_to       uuid references public.users(id) on delete set null,
  active            boolean not null default true,
  last_generated_at timestamptz,
  next_generate_at  timestamptz,
  created_at        timestamptz not null default now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create table public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references public.users(id) on delete cascade not null,
  type       text not null,
  job_id     uuid references public.jobs(id) on delete cascade,
  message    text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ALLOWANCE LEDGER
-- Tracks earnings per step per user. Payout handled outside app.
-- ============================================================

create table public.allowance_ledger (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references public.users(id) on delete cascade not null,
  job_id     uuid references public.jobs(id) on delete cascade,
  step_id    uuid references public.job_steps(id) on delete cascade,
  amount     numeric(10,2) not null default 0,
  status     allowance_status not null default 'earned',
  created_at timestamptz not null default now(),
  paid_at    timestamptz
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_jobs_status        on public.jobs(status);
create index idx_jobs_assigned_to   on public.jobs(assigned_to);
create index idx_jobs_group_id      on public.jobs(group_id);
create index idx_jobs_created_at    on public.jobs(created_at desc);
create index idx_jobs_due_date      on public.jobs(due_date) where due_date is not null;

create index idx_job_steps_job_id   on public.job_steps(job_id);
create index idx_job_steps_sort     on public.job_steps(job_id, sort_order);

create index idx_job_comments_job   on public.job_comments(job_id);
create index idx_job_comments_time  on public.job_comments(job_id, created_at);

create index idx_notifications_user on public.notifications(user_id);
create index idx_notifications_unread on public.notifications(user_id, read) where read = false;

create index idx_allowance_user     on public.allowance_ledger(user_id);
create index idx_allowance_status   on public.allowance_ledger(user_id, status);

create index idx_recurring_active   on public.recurring_schedules(active, next_generate_at) where active = true;
