-- Create a demo user mapping table to handle demo users separately
CREATE TABLE IF NOT EXISTS public.demo_user_mapping (
  demo_id TEXT PRIMARY KEY,
  display_name TEXT,
  role app_role NOT NULL,
  departments department_slug[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on demo user mapping
ALTER TABLE public.demo_user_mapping ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read demo user mappings (since they're just for demo purposes)
CREATE POLICY "Anyone can read demo user mappings" ON public.demo_user_mapping
FOR SELECT USING (true);

-- Insert demo user data
INSERT INTO public.demo_user_mapping (demo_id, display_name, role, departments) VALUES
('demo-mayor', 'ראש העיר', 'mayor'::app_role, 
 ARRAY['finance'::department_slug, 'education'::department_slug, 'engineering'::department_slug, 
       'welfare'::department_slug, 'non-formal'::department_slug, 'business'::department_slug, 
       'city-improvement'::department_slug, 'enforcement'::department_slug, 'ceo'::department_slug]),
('demo-ceo', 'מנכל העירייה', 'ceo'::app_role,
 ARRAY['finance'::department_slug, 'education'::department_slug, 'engineering'::department_slug, 
       'welfare'::department_slug, 'non-formal'::department_slug, 'business'::department_slug, 
       'city-improvement'::department_slug, 'enforcement'::department_slug, 'ceo'::department_slug]),
('demo-finance', 'מנהל פיננסים', 'manager'::app_role, ARRAY['finance'::department_slug]),
('demo-education', 'מנהל חינוך', 'manager'::app_role, ARRAY['education'::department_slug]),
('demo-engineering', 'מנהל הנדסה', 'manager'::app_role, ARRAY['engineering'::department_slug]),
('demo-welfare', 'מנהל רווחה', 'manager'::app_role, ARRAY['welfare'::department_slug]),
('demo-nonformal', 'מנהל חינוך בלתי פורמאלי', 'manager'::app_role, ARRAY['non-formal'::department_slug]),
('demo-business', 'מנהל רישוי עסקים', 'manager'::app_role, ARRAY['business'::department_slug]),
('demo-cityimprovement', 'מנהל שיפור פני העיר', 'manager'::app_role, ARRAY['city-improvement'::department_slug]),
('demo-enforcement', 'מנהל אכיפה', 'manager'::app_role, ARRAY['enforcement'::department_slug])
ON CONFLICT (demo_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  departments = EXCLUDED.departments;

-- Create functions to handle demo users in RLS policies
CREATE OR REPLACE FUNCTION public.has_role_demo(user_id_param uuid, role_param app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  -- First check regular users
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = user_id_param AND ur.role = role_param
  )
  OR
  -- Then check demo users
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = user_id_param::text AND dum.role = role_param
  );
$$;

CREATE OR REPLACE FUNCTION public.has_department_demo(user_id_param uuid, department_param department_slug)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  -- First check regular users
  SELECT EXISTS (
    SELECT 1 FROM public.user_departments ud
    WHERE ud.user_id = user_id_param AND ud.department = department_param
  )
  OR
  -- Then check demo users
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = user_id_param::text AND department_param = ANY(dum.departments)
  );
$$;