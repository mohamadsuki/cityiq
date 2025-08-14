-- Fix security issue: Restrict city settings access to authenticated users only
-- Drop the overly permissive public access policy
DROP POLICY IF EXISTS "City settings readable by everyone" ON public.city_settings;

-- Create a secure policy that only allows authenticated users to read city settings
CREATE POLICY "Authenticated users can read city settings" 
ON public.city_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);