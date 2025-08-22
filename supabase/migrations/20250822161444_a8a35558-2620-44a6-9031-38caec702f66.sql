-- Add new fields for inquiry handling
ALTER TABLE public.public_inquiries 
ADD COLUMN assigned_handler TEXT,
ADD COLUMN assigned_at DATE;