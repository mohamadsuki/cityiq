-- Add 'other' to the source check constraint
ALTER TABLE public.public_inquiries 
DROP CONSTRAINT public_inquiries_source_check;

ALTER TABLE public.public_inquiries 
ADD CONSTRAINT public_inquiries_source_check 
CHECK (source = ANY (ARRAY['whatsapp'::text, 'email'::text, 'phone'::text, 'in_person'::text, 'website'::text, 'social_media'::text, 'other'::text]));