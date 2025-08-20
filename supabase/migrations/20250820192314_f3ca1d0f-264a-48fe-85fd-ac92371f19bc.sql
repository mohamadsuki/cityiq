-- Drop existing demo and manager policies for projects
DROP POLICY IF EXISTS "Demo users can select all projects" ON public.projects;
DROP POLICY IF EXISTS "Demo users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Demo users can update projects" ON public.projects;
DROP POLICY IF EXISTS "Demo users can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Managers can select projects by department" ON public.projects;
DROP POLICY IF EXISTS "Managers can insert projects by department" ON public.projects;
DROP POLICY IF EXISTS "Managers can update projects by department" ON public.projects;
DROP POLICY IF EXISTS "Managers can delete projects by department" ON public.projects;

-- Create new demo-specific policies that filter by department
-- Demo users can see projects where both the project creator and viewer are in the same department
CREATE POLICY "Demo managers can select projects by department" 
ON public.projects 
FOR SELECT 
USING (
  auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM demo_user_mapping dum1, demo_user_mapping dum2
    WHERE dum1.demo_id = projects.user_id::text 
    AND dum2.demo_id = projects.user_id::text
    AND projects.department_slug = ANY(dum1.departments)
    AND (
      'mayor'::app_role = ANY(dum2.roles) OR 
      'ceo'::app_role = ANY(dum2.roles) OR
      (
        'manager'::app_role = ANY(dum2.roles) AND 
        projects.department_slug = ANY(dum2.departments)
      )
    )
  )
);

-- For authenticated users, use the existing logic with demo-compatible functions
CREATE POLICY "Authenticated managers can select projects by department" 
ON public.projects 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  has_role_demo(auth.uid(), 'manager'::app_role) AND 
  has_department_demo(auth.uid(), department_slug)
);

-- Demo users can insert projects in their department
CREATE POLICY "Demo users can insert projects by department" 
ON public.projects 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM demo_user_mapping dum
    WHERE dum.demo_id = projects.user_id::text 
    AND (
      'mayor'::app_role = ANY(dum.roles) OR 
      'ceo'::app_role = ANY(dum.roles) OR
      (
        'manager'::app_role = ANY(dum.roles) AND 
        projects.department_slug = ANY(dum.departments)
      )
    )
  )
);

-- Authenticated users can insert projects in their department
CREATE POLICY "Authenticated managers can insert projects by department" 
ON public.projects 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  has_role_demo(auth.uid(), 'manager'::app_role) AND 
  has_department_demo(auth.uid(), department_slug)
);

-- Demo users can update projects in their department
CREATE POLICY "Demo users can update projects by department" 
ON public.projects 
FOR UPDATE 
USING (
  auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM demo_user_mapping dum
    WHERE dum.demo_id = projects.user_id::text 
    AND (
      'mayor'::app_role = ANY(dum.roles) OR 
      'ceo'::app_role = ANY(dum.roles) OR
      (
        'manager'::app_role = ANY(dum.roles) AND 
        projects.department_slug = ANY(dum.departments)
      )
    )
  )
);

-- Authenticated users can update projects in their department
CREATE POLICY "Authenticated managers can update projects by department" 
ON public.projects 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  has_role_demo(auth.uid(), 'manager'::app_role) AND 
  has_department_demo(auth.uid(), department_slug)
);

-- Demo users can delete projects in their department
CREATE POLICY "Demo users can delete projects by department" 
ON public.projects 
FOR DELETE 
USING (
  auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM demo_user_mapping dum
    WHERE dum.demo_id = projects.user_id::text 
    AND (
      'mayor'::app_role = ANY(dum.roles) OR 
      'ceo'::app_role = ANY(dum.roles) OR
      (
        'manager'::app_role = ANY(dum.roles) AND 
        projects.department_slug = ANY(dum.departments)
      )
    )
  )
);

-- Authenticated users can delete projects in their department
CREATE POLICY "Authenticated managers can delete projects by department" 
ON public.projects 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND 
  has_role_demo(auth.uid(), 'manager'::app_role) AND 
  has_department_demo(auth.uid(), department_slug)
);