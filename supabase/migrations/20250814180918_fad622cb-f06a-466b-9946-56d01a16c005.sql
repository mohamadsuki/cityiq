-- Remove the restrictive policies and create one simple policy for authenticated users
DROP POLICY IF EXISTS "Mayor/Ceo can insert city settings" ON public.city_settings;
DROP POLICY IF EXISTS "Mayor/Ceo can update city settings" ON public.city_settings;
DROP POLICY IF EXISTS "Mayor/CEO can manage city settings" ON public.city_settings;
DROP POLICY IF EXISTS "Mayor/CEO can insert initial city settings" ON public.city_settings;
DROP POLICY IF EXISTS "Authenticated users can read city settings" ON public.city_settings;
DROP POLICY IF EXISTS "Authenticated users can manage city settings (temporary)" ON public.city_settings;

-- Create simple policies for authenticated users
CREATE POLICY "Authenticated users can read city settings" 
ON public.city_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert city settings" 
ON public.city_settings 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND id = 'global');

CREATE POLICY "Authenticated users can update city settings" 
ON public.city_settings 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND id = 'global')
WITH CHECK (auth.uid() IS NOT NULL AND id = 'global');

-- Ensure we have a default record
INSERT INTO public.city_settings (id, city_name, population, logo_url) 
VALUES ('global', 'שם העיר', 342857, null)
ON CONFLICT (id) DO NOTHING;