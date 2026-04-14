-- Flow View foundation: parent/child step tree
--
-- Adding parent_step_id creates a self-referential tree on job_steps.
-- Top-level steps have parent_step_id = NULL.
-- Child steps reference their parent's id, enabling the radial flow view.
-- ON DELETE SET NULL so deleting a parent demotes its children to top-level
-- rather than deleting the whole subtree.

ALTER TABLE job_steps
  ADD COLUMN IF NOT EXISTS parent_step_id UUID
    REFERENCES job_steps(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_job_steps_parent
  ON job_steps(parent_step_id)
  WHERE parent_step_id IS NOT NULL;
