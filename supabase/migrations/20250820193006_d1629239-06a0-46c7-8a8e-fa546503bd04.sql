-- Drop ALL existing policies on projects table first
DROP POLICY IF EXISTS "CEO can select all projects" ON public.projects;
DROP POLICY IF EXISTS "CEO can insert projects" ON public.projects;
DROP POLICY IF EXISTS "CEO can update projects" ON public.projects;
DROP POLICY IF EXISTS "CEO can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Mayor can select all projects" ON public.projects;
DROP POLICY IF EXISTS "Mayor can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Mayor can update projects" ON public.projects;
DROP POLICY IF EXISTS "Mayor can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated managers can select projects by department" ON public.projects;
DROP POLICY IF EXISTS "Authenticated managers can insert projects by department" ON public.projects;
DROP POLICY IF EXISTS "Authenticated managers can update projects by department" ON public.projects;
DROP POLICY IF EXISTS "Authenticated managers can delete projects by department" ON public.projects;
DROP POLICY IF EXISTS "Demo users can view projects by department access" ON public.projects;
DROP POLICY IF EXISTS "Demo users can insert projects by department" ON public.projects;
DROP POLICY IF EXISTS "Demo users can update projects by department" ON public.projects;
DROP POLICY IF EXISTS "Demo users can delete projects by department" ON public.projects;
DROP POLICY IF EXISTS "Demo users filter projects by department" ON public.projects;
DROP POLICY IF EXISTS "Demo managers can select projects by department" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- Now drop demo-related functions
DROP FUNCTION IF EXISTS public.has_role_demo(uuid, app_role);
DROP FUNCTION IF EXISTS public.has_department_demo(uuid, department_slug);

-- Drop demo user mapping table
DROP TABLE IF EXISTS public.demo_user_mapping;

-- Create clean RLS policies for projects table using only regular auth
-- Mayor can see all projects
CREATE POLICY "Mayor can select all projects" 
ON public.projects 
FOR SELECT 
USING (has_role(auth.uid(), 'mayor'::app_role));

-- CEO can see all projects
CREATE POLICY "CEO can select all projects" 
ON public.projects 
FOR SELECT 
USING (has_role(auth.uid(), 'ceo'::app_role));

-- Managers can only see projects from their departments
CREATE POLICY "Managers can select projects by department" 
ON public.projects 
FOR SELECT 
USING (
  has_role(auth.uid(), 'manager'::app_role) 
  AND has_department(auth.uid(), department_slug)
);

-- Users can see their own projects
CREATE POLICY "Users can view their own projects" 
ON public.projects 
FOR SELECT 
USING (auth.uid() = user_id);

-- Mayor can insert projects
CREATE POLICY "Mayor can insert projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'mayor'::app_role));

-- CEO can insert projects
CREATE POLICY "CEO can insert projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));

-- Managers can insert projects in their departments
CREATE POLICY "Managers can insert projects by department" 
ON public.projects 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role) 
  AND has_department(auth.uid(), department_slug)
);

-- Users can insert their own projects
CREATE POLICY "Users can insert their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Mayor can update projects
CREATE POLICY "Mayor can update projects" 
ON public.projects 
FOR UPDATE 
USING (has_role(auth.uid(), 'mayor'::app_role));

-- CEO can update projects
CREATE POLICY "CEO can update projects" 
ON public.projects 
FOR UPDATE 
USING (has_role(auth.uid(), 'ceo'::app_role));

-- Managers can update projects in their departments
CREATE POLICY "Managers can update projects by department" 
ON public.projects 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'manager'::app_role) 
  AND has_department(auth.uid(), department_slug)
);

-- Users can update their own projects
CREATE POLICY "Users can update their own projects" 
ON public.projects 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Mayor can delete projects
CREATE POLICY "Mayor can delete projects" 
ON public.projects 
FOR DELETE 
USING (has_role(auth.uid(), 'mayor'::app_role));

-- CEO can delete projects
CREATE POLICY "CEO can delete projects" 
ON public.projects 
FOR DELETE 
USING (has_role(auth.uid(), 'ceo'::app_role));

-- Managers can delete projects in their departments
CREATE POLICY "Managers can delete projects by department" 
ON public.projects 
FOR DELETE 
USING (
  has_role(auth.uid(), 'manager'::app_role) 
  AND has_department(auth.uid(), department_slug)
);

-- Users can delete their own projects
CREATE POLICY "Users can delete their own projects" 
ON public.projects 
FOR DELETE 
USING (auth.uid() = user_id);