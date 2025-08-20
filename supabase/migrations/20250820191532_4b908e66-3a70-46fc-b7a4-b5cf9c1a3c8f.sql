-- Add RLS policies for managers to only access projects in their departments
CREATE POLICY "Managers can select projects by department" 
ON public.projects 
FOR SELECT 
USING (has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), department_slug));

CREATE POLICY "Managers can insert projects by department" 
ON public.projects 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), department_slug));

CREATE POLICY "Managers can update projects by department" 
ON public.projects 
FOR UPDATE 
USING (has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), department_slug));

CREATE POLICY "Managers can delete projects by department" 
ON public.projects 
FOR DELETE 
USING (has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), department_slug));

-- Add CEO and Mayor policies for full access
CREATE POLICY "CEO can select all projects" 
ON public.projects 
FOR SELECT 
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can insert projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can update projects" 
ON public.projects 
FOR UPDATE 
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can delete projects" 
ON public.projects 
FOR DELETE 
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "Mayor can select all projects" 
ON public.projects 
FOR SELECT 
USING (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can insert projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can update projects" 
ON public.projects 
FOR UPDATE 
USING (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can delete projects" 
ON public.projects 
FOR DELETE 
USING (has_role(auth.uid(), 'mayor'::app_role));