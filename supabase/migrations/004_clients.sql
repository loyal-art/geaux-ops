-- ============================================================
-- GEAUX OPS — Schema Migration 004
-- Client Management: clients table + RLS
-- Run after 003_seed_templates.sql
-- ============================================================

-- ── Table ──────────────────────────────────────────────────────────────────────

create table public.clients (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  contact_name  text,
  contact_email text,
  contact_phone text,
  locations     jsonb not null default '[]',
  notes         text,
  created_by    uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- ── Indexes ────────────────────────────────────────────────────────────────────

create index idx_clients_name       on public.clients(name);
create index idx_clients_created_at on public.clients(created_at desc);

-- ── RLS ────────────────────────────────────────────────────────────────────────

alter table public.clients enable row level security;

-- Owner can do everything (insert, update, delete, select)
create policy "clients_all_owner"
  on public.clients for all
  using (public.is_owner())
  with check (public.is_owner());

-- All other authenticated users can view clients
create policy "clients_select"
  on public.clients for select
  using (auth.uid() is not null);
