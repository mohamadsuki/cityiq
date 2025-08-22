-- Add missing columns to grants table for Excel import
ALTER TABLE public.grants 
ADD COLUMN IF NOT EXISTS project_description text,
ADD COLUMN IF NOT EXISTS responsible_person text,
ADD COLUMN IF NOT EXISTS submission_amount numeric,
ADD COLUMN IF NOT EXISTS support_amount numeric,
ADD COLUMN IF NOT EXISTS approved_amount numeric,
ADD COLUMN IF NOT EXISTS municipality_participation numeric,
ADD COLUMN IF NOT EXISTS notes text;