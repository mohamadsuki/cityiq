-- Fix tabarim policies to work with demo users and null auth.uid()
-- Drop all existing policies first
DROP POLICY IF EXISTS "CEO can insert tabarim" ON public.tabarim;
DROP POLICY IF EXISTS "CEO can select all tabarim" ON public.tabarim;
DROP POLICY IF EXISTS "CEO can update tabarim" ON public.tabarim;
DROP POLICY IF EXISTS "CEO can delete tabarim" ON public.tabarim;
DROP POLICY IF EXISTS "Mayor can insert tabarim" ON public.tabarim;
DROP POLICY IF EXISTS "Mayor can select all tabarim" ON public.tabarim;
DROP POLICY IF EXISTS "Mayor can update tabarim" ON public.tabarim;
DROP POLICY IF EXISTS "Mayor can delete tabarim" ON public.tabarim;
DROP POLICY IF EXISTS "Finance managers can manage tabarim" ON public.tabarim;
DROP POLICY IF EXISTS "Users can insert their own tabarim" ON public.tabarim;
DROP POLICY IF EXISTS "Users can view their own tabarim" ON public.tabarim;
DROP POLICY IF EXISTS "Users can update their own tabarim" ON public.tabarim;
DROP POLICY IF EXISTS "Users can delete their own tabarim" ON public.tabarim;

-- Create more permissive policies that work with demo users
CREATE POLICY "Allow tabarim access for authenticated users" ON public.tabarim
FOR ALL
USING (
  -- Allow if user has any role in demo mapping
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum 
    WHERE dum.demo_id = COALESCE(auth.uid()::text, user_id::text)
  )
  OR
  -- Allow if user_id matches specific demo user IDs
  user_id::text IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222', 
    '33333333-3333-3333-3333-333333333333'
  )
)
WITH CHECK (
  -- Same conditions for insert/update
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum 
    WHERE dum.demo_id = COALESCE(auth.uid()::text, user_id::text)
  )
  OR
  user_id::text IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222', 
    '33333333-3333-3333-3333-333333333333'
  )
);