-- Create a demo user mapping table to map our local user IDs to permissions
CREATE TABLE IF NOT EXISTS public.demo_user_mapping (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  demo_id text UNIQUE NOT NULL,
  roles app_role[] DEFAULT '{}',
  departments department_slug[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Insert our predefined users into the mapping table with proper casting
INSERT INTO public.demo_user_mapping (demo_id, roles, departments) VALUES
  ('11111111-1111-1111-1111-111111111111', ARRAY['mayor']::app_role[], ARRAY[]::department_slug[]),
  ('22222222-2222-2222-2222-222222222222', ARRAY['ceo']::app_role[], ARRAY[]::department_slug[]),
  ('33333333-3333-3333-3333-333333333333', ARRAY['manager']::app_role[], ARRAY['finance']::department_slug[]),
  ('44444444-4444-4444-4444-444444444444', ARRAY['manager']::app_role[], ARRAY['education']::department_slug[]),
  ('55555555-5555-5555-5555-555555555555', ARRAY['manager']::app_role[], ARRAY['engineering']::department_slug[]),
  ('66666666-6666-6666-6666-666666666666', ARRAY['manager']::app_role[], ARRAY['welfare']::department_slug[]),
  ('77777777-7777-7777-7777-777777777777', ARRAY['manager']::app_role[], ARRAY['non-formal']::department_slug[]),
  ('88888888-8888-8888-8888-888888888888', ARRAY['manager']::app_role[], ARRAY['business']::department_slug[])
ON CONFLICT (demo_id) DO UPDATE SET
  roles = EXCLUDED.roles,
  departments = EXCLUDED.departments;

-- Create helper functions for demo mode
CREATE OR REPLACE FUNCTION public.has_role_demo(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN auth.uid() IS NOT NULL THEN 
        -- Regular auth mode
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = _user_id AND ur.role = _role
        )
      ELSE 
        -- Demo mode - check demo user mapping
        EXISTS (
          SELECT 1 FROM public.demo_user_mapping dum
          WHERE dum.demo_id = _user_id::text AND _role = ANY(dum.roles)
        )
    END;
$$;

CREATE OR REPLACE FUNCTION public.has_department_demo(_user_id uuid, _department department_slug)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN auth.uid() IS NOT NULL THEN 
        -- Regular auth mode
        EXISTS (
          SELECT 1 FROM public.user_departments ud
          WHERE ud.user_id = _user_id AND ud.department = _department
        )
      ELSE 
        -- Demo mode - check demo user mapping
        EXISTS (
          SELECT 1 FROM public.demo_user_mapping dum
          WHERE dum.demo_id = _user_id::text AND _department = ANY(dum.departments)
        )
    END;
$$;

-- Update RLS policies for tasks to work in demo mode
DROP POLICY IF EXISTS "Demo mode tasks access" ON public.tasks;

-- Simple demo access policy for tasks
CREATE POLICY "Demo tasks access" ON public.tasks
FOR ALL USING (auth.uid() IS NULL) 
WITH CHECK (auth.uid() IS NULL);

-- Add policies for profiles table in demo mode
CREATE POLICY "Demo profiles access" ON public.profiles
FOR ALL USING (auth.uid() IS NULL) 
WITH CHECK (auth.uid() IS NULL);

-- Add policies for task acknowledgements in demo mode
CREATE POLICY "Demo task_ack access" ON public.task_acknowledgements
FOR ALL USING (auth.uid() IS NULL) 
WITH CHECK (auth.uid() IS NULL);

-- Update storage policies for avatars bucket in demo mode
CREATE POLICY "Demo avatars access" ON storage.objects
FOR ALL USING (bucket_id = 'avatars' AND auth.uid() IS NULL) 
WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NULL);