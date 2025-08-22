-- Fix RLS policies for grants table to match tabarim pattern
-- First, drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "CEO can delete grants" ON public.grants;
DROP POLICY IF EXISTS "CEO can insert grants" ON public.grants;
DROP POLICY IF EXISTS "CEO can select all grants" ON public.grants;
DROP POLICY IF EXISTS "CEO can update grants" ON public.grants;
DROP POLICY IF EXISTS "Managers can delete grants by department" ON public.grants;
DROP POLICY IF EXISTS "Managers can insert grants by department" ON public.grants;
DROP POLICY IF EXISTS "Managers can select grants by department" ON public.grants;
DROP POLICY IF EXISTS "Managers can update grants by department" ON public.grants;
DROP POLICY IF EXISTS "Mayor can delete grants" ON public.grants;
DROP POLICY IF EXISTS "Mayor can insert grants" ON public.grants;
DROP POLICY IF EXISTS "Mayor can select all grants" ON public.grants;
DROP POLICY IF EXISTS "Mayor can update grants" ON public.grants;
DROP POLICY IF EXISTS "Users can delete their own grants" ON public.grants;
DROP POLICY IF EXISTS "Users can insert their own grants" ON public.grants;
DROP POLICY IF EXISTS "Users can update their own grants" ON public.grants;
DROP POLICY IF EXISTS "Users can view their own grants" ON public.grants;

-- Create temporary permissive policy similar to tabarim
CREATE POLICY "Temporary permissive grants access" 
ON public.grants 
FOR ALL 
USING (true) 
WITH CHECK (true);