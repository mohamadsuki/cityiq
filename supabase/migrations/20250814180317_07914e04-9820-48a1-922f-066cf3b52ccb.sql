-- Allow all authenticated users to read and write city_settings temporarily for debugging
CREATE POLICY "Authenticated users can manage city settings (temporary)" 
ON public.city_settings 
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);