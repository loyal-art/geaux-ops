-- ============================================================
-- GEAUX OPS — Schema Migration 008
-- Invite system: invites table + RLS
-- Run after 007_jobs_category.sql
-- ============================================================

-- ── Table ──────────────────────────────────────────────────────────────────────

create table public.invites (
  id          uuid primary key default uuid_generate_v4(),
  email       text not null,
  role        user_role not null default 'team_member',
  invited_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  accepted_at timestamptz
);

-- Prevent duplicate pending invites for the same email
create unique index idx_invites_email_pending
  on public.invites(lower(email))
  where accepted_at is null;

create index idx_invites_email      on public.invites(lower(email));
create index idx_invites_created_at on public.invites(created_at desc);

-- ── RLS ────────────────────────────────────────────────────────────────────────

alter table public.invites enable row level security;

-- Only the owner can view, create, and delete invites.
-- Signup invite-checks bypass RLS via the service-role client.
create policy "invites_all_owner"
  on public.invites for all
  using (public.is_owner())
  with check (public.is_owner());
