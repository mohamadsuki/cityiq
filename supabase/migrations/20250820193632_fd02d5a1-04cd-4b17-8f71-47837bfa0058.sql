-- Create user_roles and user_departments tables if they don't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.user_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  department department_slug NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, department)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_departments ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for these tables
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own departments" ON public.user_departments  
FOR SELECT USING (auth.uid() = user_id);

-- Insert demo user data into the proper tables
INSERT INTO public.user_roles (user_id, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'mayor'),
  ('22222222-2222-2222-2222-222222222222', 'ceo'),
  ('33333333-3333-3333-3333-333333333333', 'manager'),
  ('44444444-4444-4444-4444-444444444444', 'manager'),
  ('55555555-5555-5555-5555-555555555555', 'manager'),
  ('66666666-6666-6666-6666-666666666666', 'manager'),
  ('77777777-7777-7777-7777-777777777777', 'manager'),
  ('88888888-8888-8888-8888-888888888888', 'manager'),
  ('99999999-9999-9999-9999-999999999999', 'manager'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'manager')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_departments (user_id, department) VALUES
  -- Mayor has access to all departments
  ('11111111-1111-1111-1111-111111111111', 'finance'),
  ('11111111-1111-1111-1111-111111111111', 'education'),
  ('11111111-1111-1111-1111-111111111111', 'engineering'),
  ('11111111-1111-1111-1111-111111111111', 'welfare'),
  ('11111111-1111-1111-1111-111111111111', 'non-formal'),
  ('11111111-1111-1111-1111-111111111111', 'business'),
  ('11111111-1111-1111-1111-111111111111', 'city-improvement'),
  ('11111111-1111-1111-1111-111111111111', 'enforcement'),
  -- CEO has access to all departments  
  ('22222222-2222-2222-2222-222222222222', 'finance'),
  ('22222222-2222-2222-2222-222222222222', 'education'),
  ('22222222-2222-2222-2222-222222222222', 'engineering'),
  ('22222222-2222-2222-2222-222222222222', 'welfare'),
  ('22222222-2222-2222-2222-222222222222', 'non-formal'),
  ('22222222-2222-2222-2222-222222222222', 'business'),
  ('22222222-2222-2222-2222-222222222222', 'city-improvement'),
  ('22222222-2222-2222-2222-222222222222', 'enforcement'),
  -- Department managers
  ('33333333-3333-3333-3333-333333333333', 'finance'),
  ('44444444-4444-4444-4444-444444444444', 'education'),
  ('55555555-5555-5555-5555-555555555555', 'engineering'),
  ('66666666-6666-6666-6666-666666666666', 'welfare'),
  ('77777777-7777-7777-7777-777777777777', 'non-formal'),
  ('88888888-8888-8888-8888-888888888888', 'business'),
  ('99999999-9999-9999-9999-999999999999', 'city-improvement'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'enforcement')
ON CONFLICT (user_id, department) DO NOTHING;

-- Update RLS policies to work with NULL auth.uid() (demo mode)
DROP POLICY IF EXISTS "Mayor can select all projects" ON public.projects;
DROP POLICY IF EXISTS "CEO can select all projects" ON public.projects;
DROP POLICY IF EXISTS "Managers can select projects by department" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;

-- Create new policies that work with both authenticated and demo users
CREATE POLICY "Mayor can select all projects" ON public.projects FOR SELECT USING (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'mayor'::app_role)) OR
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id::text IN (
      SELECT DISTINCT user_id::text FROM projects p2 WHERE p2.user_id = projects.user_id
    ) AND ur.role = 'mayor'::app_role
  ))
);

CREATE POLICY "CEO can select all projects" ON public.projects FOR SELECT USING (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'ceo'::app_role)) OR  
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id::text IN (
      SELECT DISTINCT user_id::text FROM projects p2 WHERE p2.user_id = projects.user_id
    ) AND ur.role = 'ceo'::app_role
  ))
);

CREATE POLICY "Managers can select projects by department" ON public.projects FOR SELECT USING (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), department_slug)) OR
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN user_departments ud ON ur.user_id = ud.user_id
    WHERE ur.user_id::text IN (
      SELECT DISTINCT user_id::text FROM projects p2 WHERE p2.user_id = projects.user_id
    ) 
    AND ur.role = 'manager'::app_role 
    AND ud.department = projects.department_slug
  ))
);

CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() IS NULL
);

-- Update INSERT policies  
DROP POLICY IF EXISTS "Mayor can insert projects" ON public.projects;
DROP POLICY IF EXISTS "CEO can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Managers can insert projects by department" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;

CREATE POLICY "Allow all inserts in demo mode" ON public.projects FOR INSERT WITH CHECK (auth.uid() IS NULL);
CREATE POLICY "Mayor can insert projects" ON public.projects FOR INSERT WITH CHECK (has_role(auth.uid(), 'mayor'::app_role));
CREATE POLICY "CEO can insert projects" ON public.projects FOR INSERT WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "Managers can insert projects by department" ON public.projects FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), department_slug)
);
CREATE POLICY "Users can insert their own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update UPDATE policies
DROP POLICY IF EXISTS "Mayor can update projects" ON public.projects;
DROP POLICY IF EXISTS "CEO can update projects" ON public.projects; 
DROP POLICY IF EXISTS "Managers can update projects by department" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;

CREATE POLICY "Allow all updates in demo mode" ON public.projects FOR UPDATE USING (auth.uid() IS NULL);
CREATE POLICY "Mayor can update projects" ON public.projects FOR UPDATE USING (has_role(auth.uid(), 'mayor'::app_role));
CREATE POLICY "CEO can update projects" ON public.projects FOR UPDATE USING (has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "Managers can update projects by department" ON public.projects FOR UPDATE USING (
  has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), department_slug)
);
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);

-- Update DELETE policies  
DROP POLICY IF EXISTS "Mayor can delete projects" ON public.projects;
DROP POLICY IF EXISTS "CEO can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Managers can delete projects by department" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

CREATE POLICY "Allow all deletes in demo mode" ON public.projects FOR DELETE USING (auth.uid() IS NULL);
CREATE POLICY "Mayor can delete projects" ON public.projects FOR DELETE USING (has_role(auth.uid(), 'mayor'::app_role));
CREATE POLICY "CEO can delete projects" ON public.projects FOR DELETE USING (has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "Managers can delete projects by department" ON public.projects FOR DELETE USING (
  has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), department_slug)
);
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);