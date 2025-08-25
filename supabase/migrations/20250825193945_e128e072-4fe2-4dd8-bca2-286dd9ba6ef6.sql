-- Fix RLS policies for regular_budget table to work with real users
-- Drop existing policies
DROP POLICY IF EXISTS "Users can delete their own regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Users can insert their own regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Users can update their own regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Users can view their own regular budget" ON public.regular_budget;

-- Create new simplified policies that work with authenticated users
CREATE POLICY "Authenticated users can select regular budget" 
ON public.regular_budget 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert regular budget" 
ON public.regular_budget 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can update regular budget" 
ON public.regular_budget 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete regular budget" 
ON public.regular_budget 
FOR DELETE 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);