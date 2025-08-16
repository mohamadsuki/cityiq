-- Create demo users with proper UUIDs
WITH demo_users AS (
  SELECT 
    gen_random_uuid() as user_id,
    'demo-mayor' as demo_id,
    'mayor'::app_role as role,
    ARRAY['finance'::department_slug, 'education'::department_slug, 'engineering'::department_slug, 
          'welfare'::department_slug, 'non-formal'::department_slug, 'business'::department_slug, 
          'city-improvement'::department_slug, 'enforcement'::department_slug, 'ceo'::department_slug] as departments
  UNION ALL
  SELECT 
    gen_random_uuid() as user_id,
    'demo-ceo' as demo_id,
    'ceo'::app_role as role,
    ARRAY['finance'::department_slug, 'education'::department_slug, 'engineering'::department_slug, 
          'welfare'::department_slug, 'non-formal'::department_slug, 'business'::department_slug, 
          'city-improvement'::department_slug, 'enforcement'::department_slug, 'ceo'::department_slug] as departments
  UNION ALL
  SELECT gen_random_uuid(), 'demo-finance', 'manager'::app_role, ARRAY['finance'::department_slug]
  UNION ALL
  SELECT gen_random_uuid(), 'demo-education', 'manager'::app_role, ARRAY['education'::department_slug]
  UNION ALL
  SELECT gen_random_uuid(), 'demo-engineering', 'manager'::app_role, ARRAY['engineering'::department_slug]
  UNION ALL
  SELECT gen_random_uuid(), 'demo-welfare', 'manager'::app_role, ARRAY['welfare'::department_slug]
  UNION ALL
  SELECT gen_random_uuid(), 'demo-nonformal', 'manager'::app_role, ARRAY['non-formal'::department_slug]
  UNION ALL
  SELECT gen_random_uuid(), 'demo-business', 'manager'::app_role, ARRAY['business'::department_slug]
  UNION ALL
  SELECT gen_random_uuid(), 'demo-cityimprovement', 'manager'::app_role, ARRAY['city-improvement'::department_slug]
  UNION ALL
  SELECT gen_random_uuid(), 'demo-enforcement', 'manager'::app_role, ARRAY['enforcement'::department_slug]
),
insert_roles AS (
  INSERT INTO public.user_roles (user_id, role)
  SELECT user_id, role FROM demo_users
  ON CONFLICT (user_id, role) DO NOTHING
  RETURNING user_id
)
INSERT INTO public.user_departments (user_id, department)
SELECT du.user_id, unnest(du.departments)
FROM demo_users du
ON CONFLICT (user_id, department) DO NOTHING;