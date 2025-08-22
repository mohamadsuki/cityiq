-- Add 'suggestion' to the inquiry_type check constraint
ALTER TABLE public.public_inquiries 
DROP CONSTRAINT public_inquiries_inquiry_type_check;

ALTER TABLE public.public_inquiries 
ADD CONSTRAINT public_inquiries_inquiry_type_check 
CHECK (inquiry_type = ANY (ARRAY['complaint'::text, 'request'::text, 'information'::text, 'licensing'::text, 'maintenance'::text, 'suggestion'::text, 'other'::text]));