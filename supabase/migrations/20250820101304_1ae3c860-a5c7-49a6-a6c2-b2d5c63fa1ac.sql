-- Create a demo user mapping table to map our local user IDs to permissions
CREATE TABLE IF NOT EXISTS public.demo_user_mapping (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  demo_id text UNIQUE NOT NULL,
  roles app_role[] DEFAULT '{}',
  departments department_slug[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Insert our predefined users into the mapping table
INSERT INTO public.demo_user_mapping (demo_id, roles, departments) VALUES
  ('11111111-1111-1111-1111-111111111111', ARRAY['mayor'], ARRAY[]::department_slug[]),
  ('22222222-2222-2222-2222-222222222222', ARRAY['ceo'], ARRAY[]::department_slug[]),
  ('33333333-3333-3333-3333-333333333333', ARRAY['manager'], ARRAY['finance']::department_slug[]),
  ('44444444-4444-4444-4444-444444444444', ARRAY['manager'], ARRAY['education']::department_slug[]),
  ('55555555-5555-5555-5555-555555555555', ARRAY['manager'], ARRAY['engineering']::department_slug[]),
  ('66666666-6666-6666-6666-666666666666', ARRAY['manager'], ARRAY['welfare']::department_slug[]),
  ('77777777-7777-7777-7777-777777777777', ARRAY['manager'], ARRAY['non-formal']::department_slug[]),
  ('88888888-8888-8888-8888-888888888888', ARRAY['manager'], ARRAY['business']::department_slug[])
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

CREATE POLICY "Demo tasks - mayors can manage all" ON public.tasks
FOR ALL USING (
  auth.uid() IS NULL AND 
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = created_by::text AND 'mayor' = ANY(dum.roles)
  )
) WITH CHECK (
  auth.uid() IS NULL AND 
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = created_by::text AND 'mayor' = ANY(dum.roles)
  )
);

CREATE POLICY "Demo tasks - ceos can manage all" ON public.tasks
FOR ALL USING (
  auth.uid() IS NULL AND 
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = created_by::text AND 'ceo' = ANY(dum.roles)
  )
) WITH CHECK (
  auth.uid() IS NULL AND 
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = created_by::text AND 'ceo' = ANY(dum.roles)
  )
);

CREATE POLICY "Demo tasks - managers can manage by department" ON public.tasks
FOR ALL USING (
  auth.uid() IS NULL AND 
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = created_by::text 
    AND 'manager' = ANY(dum.roles) 
    AND department_slug = ANY(dum.departments)
  )
) WITH CHECK (
  auth.uid() IS NULL AND 
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = created_by::text 
    AND 'manager' = ANY(dum.roles) 
    AND department_slug = ANY(dum.departments)
  )
);

CREATE POLICY "Demo tasks - view all for demo users" ON public.tasks
FOR SELECT USING (
  auth.uid() IS NULL AND 
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id::uuid = ANY(ARRAY[
      '11111111-1111-1111-1111-111111111111'::uuid,
      '22222222-2222-2222-2222-222222222222'::uuid,
      '33333333-3333-3333-3333-333333333333'::uuid,
      '44444444-4444-4444-4444-444444444444'::uuid,
      '55555555-5555-5555-5555-555555555555'::uuid,
      '66666666-6666-6666-6666-666666666666'::uuid,
      '77777777-7777-7777-7777-777777777777'::uuid,
      '88888888-8888-8888-8888-888888888888'::uuid
    ])
  )
);

-- Add policies for profiles table in demo mode
CREATE POLICY "Demo profiles - users can manage own" ON public.profiles
FOR ALL USING (
  auth.uid() IS NULL AND 
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = id::text
  )
) WITH CHECK (
  auth.uid() IS NULL AND 
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = id::text
  )
);

-- Add policies for task acknowledgements in demo mode
CREATE POLICY "Demo task_ack - managers can insert own" ON public.task_acknowledgements
FOR INSERT WITH CHECK (
  auth.uid() IS NULL AND 
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = manager_user_id::text
    AND EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_acknowledgements.task_id
      AND (
        'mayor' = ANY(dum.roles) OR
        'ceo' = ANY(dum.roles) OR
        ('manager' = ANY(dum.roles) AND t.department_slug = ANY(dum.departments))
      )
    )
  )
);

CREATE POLICY "Demo task_ack - view for demo users" ON public.task_acknowledgements
FOR SELECT USING (
  auth.uid() IS NULL AND 
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id::uuid = ANY(ARRAY[
      '11111111-1111-1111-1111-111111111111'::uuid,
      '22222222-2222-2222-2222-222222222222'::uuid,
      '33333333-3333-3333-3333-333333333333'::uuid,
      '44444444-4444-4444-4444-444444444444'::uuid,
      '55555555-5555-5555-5555-555555555555'::uuid,
      '66666666-6666-6666-6666-666666666666'::uuid,
      '77777777-7777-7777-7777-777777777777'::uuid,
      '88888888-8888-8888-8888-888888888888'::uuid
    ])
  )
);

-- Update storage policies for avatars bucket in demo mode
CREATE POLICY "Demo avatars - users can upload own" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid() IS NULL AND
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Demo avatars - users can update own" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND
  auth.uid() IS NULL AND
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Demo avatars - users can delete own" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND
  auth.uid() IS NULL AND
  EXISTS (
    SELECT 1 FROM public.demo_user_mapping dum
    WHERE dum.demo_id = (storage.foldername(name))[1]
  )
);