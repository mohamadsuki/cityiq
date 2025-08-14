-- Fix RLS policy for city_settings to allow mayor/CEO to insert initial record
-- First, create policy to allow mayor/ceo to insert when no record exists
CREATE POLICY "Mayor/CEO can insert initial city settings" 
ON public.city_settings 
FOR INSERT 
WITH CHECK (
  (has_role(auth.uid(), 'mayor'::app_role) OR has_role(auth.uid(), 'ceo'::app_role))
  AND id = 'global'
);

-- Insert default city settings if not exists
INSERT INTO public.city_settings (id, city_name, population) 
VALUES ('global', 'שם העיר', 342857)
ON CONFLICT (id) DO NOTHING;