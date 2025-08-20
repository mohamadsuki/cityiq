-- Update projects table RLS policies to support demo users

-- Drop existing policies
DROP POLICY IF EXISTS "CEO can insert projects" ON public.projects;
DROP POLICY IF EXISTS "CEO can select all projects" ON public.projects;
DROP POLICY IF EXISTS "CEO can update projects" ON public.projects;
DROP POLICY IF EXISTS "CEO can delete projects" ON public.projects;

DROP POLICY IF EXISTS "Mayor can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Mayor can select all projects" ON public.projects;
DROP POLICY IF EXISTS "Mayor can update projects" ON public.projects;
DROP POLICY IF EXISTS "Mayor can delete projects" ON public.projects;

DROP POLICY IF EXISTS "Managers can insert projects by department" ON public.projects;
DROP POLICY IF EXISTS "Managers can select projects by department" ON public.projects;
DROP POLICY IF EXISTS "Managers can update projects by department" ON public.projects;
DROP POLICY IF EXISTS "Managers can delete projects by department" ON public.projects;

-- Create new policies that support demo users
CREATE POLICY "CEO can insert projects" ON public.projects
FOR INSERT WITH CHECK (has_role_demo(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can select all projects" ON public.projects
FOR SELECT USING (has_role_demo(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can update projects" ON public.projects
FOR UPDATE USING (has_role_demo(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can delete projects" ON public.projects
FOR DELETE USING (has_role_demo(auth.uid(), 'ceo'::app_role));

CREATE POLICY "Mayor can insert projects" ON public.projects
FOR INSERT WITH CHECK (has_role_demo(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can select all projects" ON public.projects
FOR SELECT USING (has_role_demo(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can update projects" ON public.projects
FOR UPDATE USING (has_role_demo(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can delete projects" ON public.projects
FOR DELETE USING (has_role_demo(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Managers can insert projects by department" ON public.projects
FOR INSERT WITH CHECK (has_role_demo(auth.uid(), 'manager'::app_role) AND has_department_demo(auth.uid(), department_slug));

CREATE POLICY "Managers can select projects by department" ON public.projects
FOR SELECT USING (has_role_demo(auth.uid(), 'manager'::app_role) AND has_department_demo(auth.uid(), department_slug));

CREATE POLICY "Managers can update projects by department" ON public.projects
FOR UPDATE USING (has_role_demo(auth.uid(), 'manager'::app_role) AND has_department_demo(auth.uid(), department_slug));

CREATE POLICY "Managers can delete projects by department" ON public.projects
FOR DELETE USING (has_role_demo(auth.uid(), 'manager'::app_role) AND has_department_demo(auth.uid(), department_slug));