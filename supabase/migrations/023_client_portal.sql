-- Client Portal schema additions
--
-- 1. is_client_visible: marks a job comment as visible in the client portal.
--    Team internal notes (default false) stay hidden from clients.
--    Portal-submitted comments are always created with this flag set to true.
--
-- 2. submitted_via_portal: flags jobs that originated from the client portal's
--    "Submit Request" flow, so the team knows to triage them.

ALTER TABLE job_comments
  ADD COLUMN IF NOT EXISTS is_client_visible BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS submitted_via_portal BOOLEAN NOT NULL DEFAULT false;

-- Index to efficiently query client-visible comments per job
CREATE INDEX IF NOT EXISTS idx_job_comments_client_visible
  ON job_comments (job_id, is_client_visible)
  WHERE is_client_visible = true;

-- Index to quickly surface portal-submitted jobs in the team dashboard
CREATE INDEX IF NOT EXISTS idx_jobs_portal
  ON jobs (submitted_via_portal)
  WHERE submitted_via_portal = true;
