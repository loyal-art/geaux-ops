-- ============================================================
-- GEAUX OPS — Schema Migration 005
-- Client Management: projects table + RLS
-- Run after 004_clients.sql
-- ============================================================

-- ── Enum ───────────────────────────────────────────────────────────────────────

create type project_status as enum ('active', 'paused', 'complete');

-- ── Table ──────────────────────────────────────────────────────────────────────

create table public.projects (
  id          uuid primary key default uuid_generate_v4(),
  client_id   uuid references public.clients(id) on delete cascade not null,
  name        text not null,
  description text,
  status      project_status not null default 'active',
  created_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Auto-update updated_at on every row change ─────────────────────────────────

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on public.projects
  for each row execute procedure public.set_updated_at();

-- ── Indexes ────────────────────────────────────────────────────────────────────

create index idx_projects_client_id  on public.projects(client_id);
create index idx_projects_status     on public.projects(status);
create index idx_projects_created_at on public.projects(created_at desc);

-- ── RLS ────────────────────────────────────────────────────────────────────────

alter table public.projects enable row level security;

-- Owner can do everything
create policy "projects_all_owner"
  on public.projects for all
  using (public.is_owner())
  with check (public.is_owner());

-- All other authenticated users can view projects
create policy "projects_select"
  on public.projects for select
  using (auth.uid() is not null);
