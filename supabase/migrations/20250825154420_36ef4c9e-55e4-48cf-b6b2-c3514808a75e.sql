-- Add missing columns to licenses table
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS mobile text;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS validity text;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS business_nature text;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS request_date date;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS expiry_date date;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS request_type text;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS group_category text;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS reported_area numeric;