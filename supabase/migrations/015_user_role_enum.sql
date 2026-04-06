-- ============================================================
-- GEAUX OPS — Migration 015
-- Expand the `user_role` enum.
--
-- Existing values (kept for backward compat):
--   owner, partner, team_member, family_member
--
-- New values added:
--   admin    — workspace-level admin (same power as owner within a workspace)
--   manager  — manages a team or sub-group of work
--   worker   — executes assigned work; cannot create or delete jobs
--   viewer   — read-only access
--
-- Full intended set:
--   owner, admin, partner, manager, worker, team_member, family_member, viewer
--
-- NOTE: ALTER TYPE ... ADD VALUE cannot run inside a transaction block.
-- Supabase runs each migration file as a single implicit transaction;
-- these statements execute outside of one here by design.
-- ============================================================

alter type public.user_role add value if not exists 'admin'   after 'owner';
alter type public.user_role add value if not exists 'manager' after 'partner';
alter type public.user_role add value if not exists 'worker'  after 'manager';
alter type public.user_role add value if not exists 'viewer'  after 'family_member';
