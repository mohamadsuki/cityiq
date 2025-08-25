-- Fix RLS policies for licenses table to allow demo users to insert data
-- Update existing policy to be more permissive for demo users

DROP POLICY IF EXISTS "Demo users can insert licenses" ON public.licenses;

-- Create a more comprehensive demo access policy
CREATE POLICY "Enhanced demo users access for licenses" 
ON public.licenses 
FOR ALL
USING (
  -- Allow demo users to access all records
  (user_id)::text = ANY (ARRAY[
    '11111111-1111-1111-1111-111111111111'::text, 
    '22222222-2222-2222-2222-222222222222'::text, 
    '33333333-3333-3333-3333-333333333333'::text
  ])
  OR 
  -- Also allow when there's no auth (for demo mode)
  auth.uid() IS NULL
)
WITH CHECK (
  -- Allow demo users to insert records
  (user_id)::text = ANY (ARRAY[
    '11111111-1111-1111-1111-111111111111'::text, 
    '22222222-2222-2222-2222-222222222222'::text, 
    '33333333-3333-3333-3333-333333333333'::text
  ])
  OR 
  -- Also allow when there's no auth (for demo mode)
  auth.uid() IS NULL
);