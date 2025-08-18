-- Drop the existing policy that doesn't work with demo users
DROP POLICY IF EXISTS "Users can manage their own inquiries" ON public.public_inquiries;

-- Create a new policy that works with both demo and real users
CREATE POLICY "Users can manage their own inquiries"
ON public.public_inquiries
FOR ALL 
USING (
  -- For authenticated users
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  -- For demo users - allow if user_id matches any demo user with appropriate role
  (user_id::text IN (
    SELECT demo_id FROM demo_user_mapping
  ))
)
WITH CHECK (
  -- For authenticated users
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  -- For demo users - allow if user_id matches any demo user with appropriate role
  (user_id::text IN (
    SELECT demo_id FROM demo_user_mapping
  ))
);