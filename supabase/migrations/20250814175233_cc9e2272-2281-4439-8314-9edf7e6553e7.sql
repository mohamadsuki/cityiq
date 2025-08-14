-- Add population field to city settings
ALTER TABLE public.city_settings 
ADD COLUMN population integer DEFAULT 342857;