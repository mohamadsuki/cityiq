-- First, ensure we have the demo user mappings
INSERT INTO demo_user_mapping (demo_id, roles, departments) VALUES
  ('11111111-1111-1111-1111-111111111111', ARRAY['mayor'], ARRAY['finance','education','engineering','welfare','non-formal','business','city-improvement','enforcement']),
  ('22222222-2222-2222-2222-222222222222', ARRAY['ceo'], ARRAY['finance','education','engineering','welfare','non-formal','business','city-improvement','enforcement']),
  ('33333333-3333-3333-3333-333333333333', ARRAY['manager'], ARRAY['finance']),
  ('44444444-4444-4444-4444-444444444444', ARRAY['manager'], ARRAY['education']),
  ('55555555-5555-5555-5555-555555555555', ARRAY['manager'], ARRAY['engineering']),
  ('66666666-6666-6666-6666-666666666666', ARRAY['manager'], ARRAY['welfare']),
  ('77777777-7777-7777-7777-777777777777', ARRAY['manager'], ARRAY['non-formal']),
  ('88888888-8888-8888-8888-888888888888', ARRAY['manager'], ARRAY['business']),
  ('99999999-9999-9999-9999-999999999999', ARRAY['manager'], ARRAY['city-improvement']),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', ARRAY['manager'], ARRAY['enforcement'])
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