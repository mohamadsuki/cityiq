-- Remove the status column from tabarim table since it was removed from the form
ALTER TABLE public.tabarim DROP COLUMN IF EXISTS status;