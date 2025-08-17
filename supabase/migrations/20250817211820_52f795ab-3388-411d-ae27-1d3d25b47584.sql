-- Drop existing complex policy and create a simpler one
DROP POLICY IF EXISTS "Allow tabarim access for authenticated users" ON public.tabarim;

-- Create a simple policy that allows all operations for specific demo users and finance department
CREATE POLICY "Finance users can manage tabarim" 
ON public.tabarim 
FOR ALL
USING (
  -- Allow specific demo user UUIDs
  user_id::text IN (
    '11111111-1111-1111-1111-111111111111', -- mayor
    '22222222-2222-2222-2222-222222222222', -- ceo  
    '33333333-3333-3333-3333-333333333333'  -- finance
  )
  OR
  -- Allow demo users with finance access
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = user_id::text
    AND 'finance'::department_slug = ANY(dum.departments)
  )
)
WITH CHECK (
  -- Same conditions for inserting new rows
  user_id::text IN (
    '11111111-1111-1111-1111-111111111111', -- mayor
    '22222222-2222-2222-2222-222222222222', -- ceo  
    '33333333-3333-3333-3333-333333333333'  -- finance
  )
  OR
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = user_id::text
    AND 'finance'::department_slug = ANY(dum.departments)
  )
);