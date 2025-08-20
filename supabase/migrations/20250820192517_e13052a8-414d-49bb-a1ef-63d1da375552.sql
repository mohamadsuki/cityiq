-- Drop existing policy first
DROP POLICY IF EXISTS "Demo users can view projects by department access" ON public.projects;

-- Create the correct demo policy that filters projects by department
CREATE POLICY "Demo users can view projects by department access" 
ON public.projects 
FOR SELECT 
USING (
  auth.uid() IS NULL AND (
    -- Mayor and CEO can see all projects in demo mode
    EXISTS (
      SELECT 1 FROM demo_user_mapping dum
      WHERE dum.demo_id = projects.user_id::text 
      AND ('mayor'::app_role = ANY(dum.roles) OR 'ceo'::app_role = ANY(dum.roles))
    )
    OR
    -- Managers can only see projects in their department
    EXISTS (
      SELECT 1 FROM demo_user_mapping dum
      WHERE dum.demo_id = projects.user_id::text 
      AND 'manager'::app_role = ANY(dum.roles)
      AND projects.department_slug = ANY(dum.departments)
    )
  )
);