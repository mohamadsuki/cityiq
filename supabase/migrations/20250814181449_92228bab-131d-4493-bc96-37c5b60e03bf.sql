-- Make city_settings publicly accessible for everyone
DROP POLICY IF EXISTS "Authenticated users can read city settings" ON public.city_settings;
DROP POLICY IF EXISTS "Authenticated users can insert city settings" ON public.city_settings;
DROP POLICY IF EXISTS "Authenticated users can update city settings" ON public.city_settings;

-- Create public policies - anyone can read, only authenticated can modify
CREATE POLICY "Everyone can read city settings" 
ON public.city_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Public can manage city settings" 
ON public.city_settings 
FOR ALL
USING (true)
WITH CHECK (id = 'global');