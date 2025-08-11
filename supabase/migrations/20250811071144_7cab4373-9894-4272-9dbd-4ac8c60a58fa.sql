-- Add notes and image_urls to projects table
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS image_urls text[];