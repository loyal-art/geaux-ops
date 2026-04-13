-- Add three new job lifecycle statuses:
--   waiting — blocked on external input (client, vendor, etc.)
--   ready   — work can begin; assigned and prepared
--   queued  — scheduled for a future work window
--
-- PostgreSQL requires ADD VALUE to be in its own transaction and
-- cannot be used inside a transaction block that also modifies data,
-- so each statement runs independently.

ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'waiting' AFTER 'in_progress';
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'ready'   AFTER 'waiting';
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'queued'  AFTER 'ready';
