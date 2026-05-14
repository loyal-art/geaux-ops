-- ============================================================
-- GEAUX OPS — Migration 026
-- Add job_metadata jsonb column to jobs table.
--
-- Holds form-specific structured data for job types that go beyond
-- the generic title/category/priority schema. First consumer is the
-- Notary Request flow (signer_name, location_address, proposed_date,
-- proposed_time, document_type, number_of_signatures,
-- witness_requirement, service_quote, special_instructions).
-- ============================================================

alter table public.jobs
  add column if not exists job_metadata jsonb not null default '{}'::jsonb;
