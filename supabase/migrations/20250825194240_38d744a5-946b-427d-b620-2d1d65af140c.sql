-- Completely disable RLS for regular_budget table for now
ALTER TABLE public.regular_budget DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies completely
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.regular_budget;
DROP POLICY IF EXISTS "Users can delete their own regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Users can insert their own regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Users can update their own regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Users can view their own regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Authenticated users can select regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Authenticated users can insert regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Authenticated users can update regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Authenticated users can delete regular budget" ON public.regular_budget;