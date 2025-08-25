-- Fix RLS policies for licenses table - drop existing and recreate
DROP POLICY IF EXISTS "Enhanced demo users access for licenses" ON public.licenses;

-- Create a comprehensive demo access policy that covers all operations
CREATE POLICY "Demo users comprehensive access for licenses" 
ON public.licenses 
FOR ALL
USING (
  -- Allow demo users and when no auth
  (user_id)::text = ANY (ARRAY[
    '11111111-1111-1111-1111-111111111111'::text, 
    '22222222-2222-2222-2222-222222222222'::text, 
    '33333333-3333-3333-3333-333333333333'::text
  ])
  OR auth.uid() IS NULL
)
WITH CHECK (
  -- Allow demo users and when no auth to insert/update
  (user_id)::text = ANY (ARRAY[
    '11111111-1111-1111-1111-111111111111'::text, 
    '22222222-2222-2222-2222-222222222222'::text, 
    '33333333-3333-3333-3333-333333333333'::text
  ])
  OR auth.uid() IS NULL
);