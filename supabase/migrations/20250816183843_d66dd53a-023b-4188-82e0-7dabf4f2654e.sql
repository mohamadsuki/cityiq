-- Update RLS policies for tabarim table to support demo users

-- Drop existing policies
DROP POLICY IF EXISTS "CEO can insert tabarim" ON public.tabarim;
DROP POLICY IF EXISTS "CEO can select all tabarim" ON public.tabarim;
DROP POLICY IF EXISTS "CEO can update tabarim" ON public.tabarim;
DROP POLICY IF EXISTS "CEO can delete tabarim" ON public.tabarim;
DROP POLICY IF EXISTS "Mayor can insert tabarim" ON public.tabarim;
DROP POLICY IF EXISTS "Mayor can select all tabarim" ON public.tabarim;
DROP POLICY IF EXISTS "Mayor can update tabarim" ON public.tabarim;
DROP POLICY IF EXISTS "Mayor can delete tabarim" ON public.tabarim;

-- Create new policies with demo user support
CREATE POLICY "CEO can insert tabarim" ON public.tabarim
FOR INSERT 
WITH CHECK (has_role_demo(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can select all tabarim" ON public.tabarim
FOR SELECT 
USING (has_role_demo(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can update tabarim" ON public.tabarim
FOR UPDATE 
USING (has_role_demo(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can delete tabarim" ON public.tabarim
FOR DELETE 
USING (has_role_demo(auth.uid(), 'ceo'::app_role));

CREATE POLICY "Mayor can insert tabarim" ON public.tabarim
FOR INSERT 
WITH CHECK (has_role_demo(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can select all tabarim" ON public.tabarim
FOR SELECT 
USING (has_role_demo(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can update tabarim" ON public.tabarim
FOR UPDATE 
USING (has_role_demo(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can delete tabarim" ON public.tabarim
FOR DELETE 
USING (has_role_demo(auth.uid(), 'mayor'::app_role));

-- Add policy for finance managers to manage tabarim
CREATE POLICY "Finance managers can manage tabarim" ON public.tabarim
FOR ALL
USING (has_role_demo(auth.uid(), 'manager'::app_role) AND has_department_demo(auth.uid(), 'finance'::department_slug))
WITH CHECK (has_role_demo(auth.uid(), 'manager'::app_role) AND has_department_demo(auth.uid(), 'finance'::department_slug));