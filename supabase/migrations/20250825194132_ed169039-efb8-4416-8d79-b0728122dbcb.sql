-- Completely remove and recreate RLS policies for regular_budget table
-- First, disable RLS temporarily to clean up
ALTER TABLE public.regular_budget DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can delete their own regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Users can insert their own regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Users can update their own regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Users can view their own regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Authenticated users can select regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Authenticated users can insert regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Authenticated users can update regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Authenticated users can delete regular budget" ON public.regular_budget;

-- Re-enable RLS
ALTER TABLE public.regular_budget ENABLE ROW LEVEL SECURITY;

-- Create very simple policies that definitely work
CREATE POLICY "Allow all operations for authenticated users" 
ON public.regular_budget 
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);