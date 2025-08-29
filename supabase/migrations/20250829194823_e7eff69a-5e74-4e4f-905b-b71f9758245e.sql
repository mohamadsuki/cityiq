-- Add new columns to collection_data table for enhanced collection tracking
ALTER TABLE public.collection_data 
ADD COLUMN IF NOT EXISTS property_description text,
ADD COLUMN IF NOT EXISTS source_year integer DEFAULT EXTRACT(year FROM now()),
ADD COLUMN IF NOT EXISTS service_description text,
ADD COLUMN IF NOT EXISTS payer_id text,
ADD COLUMN IF NOT EXISTS payer_name text,
ADD COLUMN IF NOT EXISTS total_debt numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS cash numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS interest numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS indexation numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS nominal_balance numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS real_balance numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS collection_percentage numeric DEFAULT 0;