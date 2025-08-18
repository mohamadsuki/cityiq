-- Drop existing demo policy and recreate
DROP POLICY IF EXISTS "Demo mode tasks access" ON public.tasks;

-- Allow demo mode access - when no auth.uid(), allow access based on hardcoded demo user patterns
CREATE POLICY "Demo mode tasks access" ON public.tasks
FOR ALL
USING (
  -- When auth.uid() is null (demo mode), allow broader access
  auth.uid() IS NULL
)
WITH CHECK (
  -- When auth.uid() is null (demo mode), allow broader access  
  auth.uid() IS NULL
);