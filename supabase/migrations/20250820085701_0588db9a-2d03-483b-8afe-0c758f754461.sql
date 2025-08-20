-- Convert from demo system to real Supabase Auth system

-- 1. Create user_roles and user_departments tables if they don't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.user_departments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    department department_slug NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, department)
);

-- Enable RLS on these tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_departments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT USING (has_role(auth.uid(), 'mayor') OR has_role(auth.uid(), 'ceo'));

-- Create RLS policies for user_departments
CREATE POLICY "Users can view their own departments" ON public.user_departments
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all departments" ON public.user_departments
FOR SELECT USING (has_role(auth.uid(), 'mayor') OR has_role(auth.uid(), 'ceo'));

-- 2. Drop demo-related functions
DROP FUNCTION IF EXISTS public.has_role_demo(uuid, app_role);
DROP FUNCTION IF EXISTS public.has_department_demo(uuid, department_slug);

-- 3. Drop demo_user_mapping table
DROP TABLE IF EXISTS public.demo_user_mapping;

-- 4. Update all RLS policies to use standard functions instead of demo functions

-- Update projects table policies
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

-- Create standard RLS policies for projects
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

-- Update public_inquiries table policies
DROP POLICY IF EXISTS "CEO can manage all inquiries" ON public.public_inquiries;
DROP POLICY IF EXISTS "Mayor can manage all inquiries" ON public.public_inquiries;
DROP POLICY IF EXISTS "Managers can manage inquiries by department" ON public.public_inquiries;

CREATE POLICY "CEO can manage all inquiries" ON public.public_inquiries
FOR ALL USING (has_role(auth.uid(), 'ceo'::app_role))
WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "Mayor can manage all inquiries" ON public.public_inquiries
FOR ALL USING (has_role(auth.uid(), 'mayor'::app_role))
WITH CHECK (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Managers can manage inquiries by department" ON public.public_inquiries
FOR ALL USING (has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), department_slug))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), department_slug));

-- Update collection_data table policies
DROP POLICY IF EXISTS "CEO can delete collection data" ON public.collection_data;
DROP POLICY IF EXISTS "CEO can insert collection data" ON public.collection_data;
DROP POLICY IF EXISTS "CEO can select all collection data" ON public.collection_data;
DROP POLICY IF EXISTS "CEO can update collection data" ON public.collection_data;
DROP POLICY IF EXISTS "Mayor can delete collection data" ON public.collection_data;
DROP POLICY IF EXISTS "Mayor can insert collection data" ON public.collection_data;
DROP POLICY IF EXISTS "Mayor can select all collection data" ON public.collection_data;
DROP POLICY IF EXISTS "Mayor can update collection data" ON public.collection_data;
DROP POLICY IF EXISTS "Managers can access finance collection data" ON public.collection_data;

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

-- Update regular_budget table policies
DROP POLICY IF EXISTS "CEO can delete regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "CEO can insert regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "CEO can select all regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "CEO can update regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Mayor can delete regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Mayor can insert regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Mayor can select all regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Mayor can update regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Managers can access finance regular budget" ON public.regular_budget;

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