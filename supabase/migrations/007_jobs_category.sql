-- ============================================================
-- GEAUX OPS — Schema Migration 007
-- Add category column to jobs for dashboard tab filtering
-- Run after 006_jobs_project_id.sql
-- ============================================================

alter table public.jobs
  add column category text not null default 'misc'
  check (category in ('business', 'home', 'personal', 'misc'));

create index idx_jobs_category on public.jobs(category);
