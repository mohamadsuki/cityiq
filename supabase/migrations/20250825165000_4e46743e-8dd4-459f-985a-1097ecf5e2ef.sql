-- Add total_businesses_in_city field to city_settings table
ALTER TABLE public.city_settings 
ADD COLUMN total_businesses_in_city integer DEFAULT NULL;