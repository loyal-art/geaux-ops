-- Migration 009: Add focus column to jobs table
-- Stores the F2 Focus mindset answer from AI job creation flow

ALTER TABLE public.jobs ADD COLUMN focus text;
