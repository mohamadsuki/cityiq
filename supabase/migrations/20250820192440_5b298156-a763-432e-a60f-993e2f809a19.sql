-- First, ensure we have the demo user mappings with correct type casting
INSERT INTO demo_user_mapping (demo_id, roles, departments) VALUES
  ('11111111-1111-1111-1111-111111111111', ARRAY['mayor'::app_role], ARRAY['finance'::department_slug,'education'::department_slug,'engineering'::department_slug,'welfare'::department_slug,'non-formal'::department_slug,'business'::department_slug,'city-improvement'::department_slug,'enforcement'::department_slug]),
  ('22222222-2222-2222-2222-222222222222', ARRAY['ceo'::app_role], ARRAY['finance'::department_slug,'education'::department_slug,'engineering'::department_slug,'welfare'::department_slug,'non-formal'::department_slug,'business'::department_slug,'city-improvement'::department_slug,'enforcement'::department_slug]),
  ('33333333-3333-3333-3333-333333333333', ARRAY['manager'::app_role], ARRAY['finance'::department_slug]),
  ('44444444-4444-4444-4444-444444444444', ARRAY['manager'::app_role], ARRAY['education'::department_slug]),
  ('55555555-5555-5555-5555-555555555555', ARRAY['manager'::app_role], ARRAY['engineering'::department_slug]),
  ('66666666-6666-6666-6666-666666666666', ARRAY['manager'::app_role], ARRAY['welfare'::department_slug]),
  ('77777777-7777-7777-7777-777777777777', ARRAY['manager'::app_role], ARRAY['non-formal'::department_slug]),
  ('88888888-8888-8888-8888-888888888888', ARRAY['manager'::app_role], ARRAY['business'::department_slug]),
  ('99999999-9999-9999-9999-999999999999', ARRAY['manager'::app_role], ARRAY['city-improvement'::department_slug]),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', ARRAY['manager'::app_role], ARRAY['enforcement'::department_slug])
ON CONFLICT (demo_id) DO UPDATE SET
  roles = EXCLUDED.roles,
  departments = EXCLUDED.departments;

-- Drop the problematic policies and recreate them properly
DROP POLICY IF EXISTS "Demo managers can select projects by department" ON public.projects;

-- Create a simpler demo policy that checks if the project department matches any department in demo_user_mapping
-- This will work for all demo users based on their user_id matching departments
CREATE POLICY "Demo users can view projects by department access" 
ON public.projects 
FOR SELECT 
USING (
  auth.uid() IS NULL AND (
    -- Mayor and CEO can see all projects in demo mode
    EXISTS (
      SELECT 1 FROM demo_user_mapping dum
      WHERE dum.demo_id = projects.user_id::text 
      AND ('mayor'::app_role = ANY(dum.roles) OR 'ceo'::app_role = ANY(dum.roles))
    )
    OR
    -- Managers can only see projects in their department
    EXISTS (
      SELECT 1 FROM demo_user_mapping dum
      WHERE dum.demo_id = projects.user_id::text 
      AND 'manager'::app_role = ANY(dum.roles)
      AND projects.department_slug = ANY(dum.departments)
    )
  )
);