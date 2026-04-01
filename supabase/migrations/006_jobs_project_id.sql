-- ============================================================
-- GEAUX OPS — Schema Migration 006
-- Add project_id to jobs for project-level grouping
-- Run after 005_projects.sql
-- ============================================================

alter table public.jobs
  add column project_id uuid references public.projects(id) on delete set null;

create index idx_jobs_project_id
  on public.jobs(project_id) where project_id is not null;
