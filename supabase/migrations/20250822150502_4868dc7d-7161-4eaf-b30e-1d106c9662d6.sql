-- Add domain column to public_inquiries table
ALTER TABLE public.public_inquiries 
ADD COLUMN domain text;