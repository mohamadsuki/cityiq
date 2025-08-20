-- Now drop demo functions and table since policies are removed
DROP FUNCTION IF EXISTS public.has_role_demo(uuid, app_role);
DROP FUNCTION IF EXISTS public.has_department_demo(uuid, department_slug);
DROP TABLE IF EXISTS public.demo_user_mapping;

-- Re-create all policies using standard has_role and has_department functions

-- Projects table policies
CREATE POLICY "CEO can insert projects" ON public.projects
FOR INSERT WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can select all projects" ON public.projects
FOR SELECT USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can update projects" ON public.projects
FOR UPDATE USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can delete projects" ON public.projects
FOR DELETE USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "Mayor can insert projects" ON public.projects
FOR INSERT WITH CHECK (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can select all projects" ON public.projects
FOR SELECT USING (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can update projects" ON public.projects
FOR UPDATE USING (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can delete projects" ON public.projects
FOR DELETE USING (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Managers can insert projects by department" ON public.projects
FOR INSERT WITH CHECK (has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), department_slug));

CREATE POLICY "Managers can select projects by department" ON public.projects
FOR SELECT USING (has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), department_slug));

CREATE POLICY "Managers can update projects by department" ON public.projects
FOR UPDATE USING (has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), department_slug));

CREATE POLICY "Managers can delete projects by department" ON public.projects
FOR DELETE USING (has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), department_slug));

-- Tasks table policies
CREATE POLICY "CEO can select all tasks" ON public.tasks
FOR SELECT USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can insert tasks" ON public.tasks
FOR INSERT WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can update tasks" ON public.tasks
FOR UPDATE USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can delete tasks" ON public.tasks
FOR DELETE USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "Mayor can select all tasks" ON public.tasks
FOR SELECT USING (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can insert tasks" ON public.tasks
FOR INSERT WITH CHECK (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can update tasks" ON public.tasks
FOR UPDATE USING (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can delete tasks" ON public.tasks
FOR DELETE USING (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Managers can select department tasks" ON public.tasks
FOR SELECT USING (has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), department_slug));

CREATE POLICY "Managers can update department tasks" ON public.tasks
FOR UPDATE USING (has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), department_slug));

-- Public inquiries policies
CREATE POLICY "CEO can manage all inquiries" ON public.public_inquiries
FOR ALL USING (has_role(auth.uid(), 'ceo'::app_role))
WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "Mayor can manage all inquiries" ON public.public_inquiries
FOR ALL USING (has_role(auth.uid(), 'mayor'::app_role))
WITH CHECK (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Managers can manage inquiries by department" ON public.public_inquiries
FOR ALL USING (has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), department_slug))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), department_slug));

-- Collection data policies
CREATE POLICY "CEO can delete collection data" ON public.collection_data
FOR DELETE USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can insert collection data" ON public.collection_data
FOR INSERT WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can select all collection data" ON public.collection_data
FOR SELECT USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can update collection data" ON public.collection_data
FOR UPDATE USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "Mayor can delete collection data" ON public.collection_data
FOR DELETE USING (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can insert collection data" ON public.collection_data
FOR INSERT WITH CHECK (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can select all collection data" ON public.collection_data
FOR SELECT USING (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can update collection data" ON public.collection_data
FOR UPDATE USING (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Managers can access finance collection data" ON public.collection_data
FOR ALL USING (has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), 'finance'::department_slug))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), 'finance'::department_slug));

-- Regular budget policies
CREATE POLICY "CEO can delete regular budget" ON public.regular_budget
FOR DELETE USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can insert regular budget" ON public.regular_budget
FOR INSERT WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can select all regular budget" ON public.regular_budget
FOR SELECT USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can update regular budget" ON public.regular_budget
FOR UPDATE USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "Mayor can delete regular budget" ON public.regular_budget
FOR DELETE USING (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can insert regular budget" ON public.regular_budget
FOR INSERT WITH CHECK (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can select all regular budget" ON public.regular_budget
FOR SELECT USING (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can update regular budget" ON public.regular_budget
FOR UPDATE USING (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Managers can access finance regular budget" ON public.regular_budget
FOR ALL USING (has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), 'finance'::department_slug))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), 'finance'::department_slug));