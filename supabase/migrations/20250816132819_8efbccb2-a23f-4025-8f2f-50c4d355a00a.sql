-- Update user-specific policies to handle both UUID and demo string IDs properly

-- Drop the user-specific policies that won't work with demo users
DROP POLICY IF EXISTS "Users can delete their own regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Users can insert their own regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Users can update their own regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Users can view their own regular budget" ON public.regular_budget;

-- Create a function to check if current user owns a budget record
CREATE OR REPLACE FUNCTION public.user_owns_budget_record(record_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- For demo users, we'll allow access if they have finance role
  SELECT 
    CASE 
      -- If auth.uid() looks like a demo user (starts with demo-), check demo permissions
      WHEN auth.uid()::text LIKE 'demo-%' THEN 
        EXISTS (
          SELECT 1 FROM public.demo_user_mapping dum
          WHERE dum.demo_id = auth.uid()::text 
          AND 'finance'::department_slug = ANY(dum.departments)
        )
      -- For regular users, check if they own the record
      ELSE auth.uid() = record_user_id 
    END;
$$;

-- Create new user-specific policies using the helper function
CREATE POLICY "Users can delete their own regular budget" 
ON public.regular_budget 
FOR DELETE 
USING (user_owns_budget_record(user_id));

CREATE POLICY "Users can insert their own regular budget" 
ON public.regular_budget 
FOR INSERT 
WITH CHECK (user_owns_budget_record(user_id));

CREATE POLICY "Users can update their own regular budget" 
ON public.regular_budget 
FOR UPDATE 
USING (user_owns_budget_record(user_id));

CREATE POLICY "Users can view their own regular budget" 
ON public.regular_budget 
FOR SELECT 
USING (user_owns_budget_record(user_id));