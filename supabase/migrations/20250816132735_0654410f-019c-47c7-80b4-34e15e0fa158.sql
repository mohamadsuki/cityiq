-- Update RLS policies for regular_budget table to use demo-compatible functions

-- Drop old policies
DROP POLICY IF EXISTS "CEO can delete regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "CEO can insert regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "CEO can select all regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "CEO can update regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Mayor can delete regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Mayor can insert regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Mayor can select all regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Mayor can update regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Users can delete their own regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Users can insert their own regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Users can update their own regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Users can view their own regular budget" ON public.regular_budget;

-- Create new policies using demo-compatible functions
CREATE POLICY "CEO can delete regular budget" 
ON public.regular_budget 
FOR DELETE 
USING (has_role_demo(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can insert regular budget" 
ON public.regular_budget 
FOR INSERT 
WITH CHECK (has_role_demo(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can select all regular budget" 
ON public.regular_budget 
FOR SELECT 
USING (has_role_demo(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can update regular budget" 
ON public.regular_budget 
FOR UPDATE 
USING (has_role_demo(auth.uid(), 'ceo'::app_role));

CREATE POLICY "Mayor can delete regular budget" 
ON public.regular_budget 
FOR DELETE 
USING (has_role_demo(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can insert regular budget" 
ON public.regular_budget 
FOR INSERT 
WITH CHECK (has_role_demo(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can select all regular budget" 
ON public.regular_budget 
FOR SELECT 
USING (has_role_demo(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can update regular budget" 
ON public.regular_budget 
FOR UPDATE 
USING (has_role_demo(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Managers can access finance regular budget" 
ON public.regular_budget 
FOR ALL 
USING (has_role_demo(auth.uid(), 'manager'::app_role) AND has_department_demo(auth.uid(), 'finance'::department_slug))
WITH CHECK (has_role_demo(auth.uid(), 'manager'::app_role) AND has_department_demo(auth.uid(), 'finance'::department_slug));

CREATE POLICY "Users can delete their own regular budget" 
ON public.regular_budget 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own regular budget" 
ON public.regular_budget 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own regular budget" 
ON public.regular_budget 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own regular budget" 
ON public.regular_budget 
FOR SELECT 
USING (auth.uid()::text = user_id::text);