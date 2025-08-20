-- First, drop ALL policies that use demo functions across all tables

-- Drop all policies on tasks table that use demo functions
DROP POLICY IF EXISTS "CEO can select all tasks" ON public.tasks;
DROP POLICY IF EXISTS "CEO can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "CEO can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "CEO can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Mayor can select all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Mayor can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Mayor can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Mayor can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Managers can select department tasks" ON public.tasks;
DROP POLICY IF EXISTS "Managers can update department tasks" ON public.tasks;

-- Drop all policies on regular_budget table that use demo functions
DROP POLICY IF EXISTS "CEO can delete regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "CEO can insert regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "CEO can select all regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "CEO can update regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Mayor can delete regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Mayor can insert regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Mayor can select all regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Mayor can update regular budget" ON public.regular_budget;
DROP POLICY IF EXISTS "Managers can access finance regular budget" ON public.regular_budget;

-- Drop all policies on collection_data table that use demo functions
DROP POLICY IF EXISTS "CEO can delete collection data" ON public.collection_data;
DROP POLICY IF EXISTS "CEO can insert collection data" ON public.collection_data;
DROP POLICY IF EXISTS "CEO can select all collection data" ON public.collection_data;
DROP POLICY IF EXISTS "CEO can update collection data" ON public.collection_data;
DROP POLICY IF EXISTS "Mayor can delete collection data" ON public.collection_data;
DROP POLICY IF EXISTS "Mayor can insert collection data" ON public.collection_data;
DROP POLICY IF EXISTS "Mayor can select all collection data" ON public.collection_data;
DROP POLICY IF EXISTS "Mayor can update collection data" ON public.collection_data;
DROP POLICY IF EXISTS "Managers can access finance collection data" ON public.collection_data;

-- Drop all policies on public_inquiries table that use demo functions
DROP POLICY IF EXISTS "Mayor can manage all inquiries" ON public.public_inquiries;
DROP POLICY IF EXISTS "CEO can manage all inquiries" ON public.public_inquiries;
DROP POLICY IF EXISTS "Managers can manage inquiries by department" ON public.public_inquiries;

-- Drop all policies on projects table that use demo functions
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