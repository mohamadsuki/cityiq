-- Update status check constraint to include 'pending'
ALTER TABLE public.public_inquiries 
DROP CONSTRAINT public_inquiries_status_check;

ALTER TABLE public.public_inquiries 
ADD CONSTRAINT public_inquiries_status_check 
CHECK (status = ANY (ARRAY['new'::text, 'in_progress'::text, 'waiting_approval'::text, 'pending'::text, 'resolved'::text, 'closed'::text]));