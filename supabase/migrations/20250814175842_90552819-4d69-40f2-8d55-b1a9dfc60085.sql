-- Drop the conflicting policy first
DROP POLICY IF EXISTS "Mayor/CEO can insert initial city settings" ON public.city_settings;

-- Update the existing policy to allow both insert and upsert scenarios
DROP POLICY IF EXISTS "Mayor/CEO can insert city settings" ON public.city_settings;

-- Create a comprehensive policy for mayor/ceo to insert/upsert city settings
CREATE POLICY "Mayor/CEO can manage city settings" 
ON public.city_settings 
FOR INSERT 
WITH CHECK (
  (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'ceo'::app_role))
  AND id = 'global'
);