-- Add new columns to projects table for logo and file support
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS file_urls TEXT[];

-- Update any existing projects to have null values for new columns
UPDATE public.projects 
SET logo_url = NULL, file_urls = NULL 
WHERE logo_url IS NULL OR file_urls IS NULL;