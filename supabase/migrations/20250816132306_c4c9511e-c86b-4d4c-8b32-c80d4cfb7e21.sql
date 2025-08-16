-- Create fixed UUIDs for demo users and their roles/departments

-- Insert demo user roles with proper UUIDs
INSERT INTO public.user_roles (user_id, role) VALUES
('00000000-0000-0000-0000-000000000001', 'mayor'::app_role),
('00000000-0000-0000-0000-000000000002', 'ceo'::app_role),
('00000000-0000-0000-0000-000000000003', 'manager'::app_role),
('00000000-0000-0000-0000-000000000004', 'manager'::app_role),
('00000000-0000-0000-0000-000000000005', 'manager'::app_role),
('00000000-0000-0000-0000-000000000006', 'manager'::app_role),
('00000000-0000-0000-0000-000000000007', 'manager'::app_role),
('00000000-0000-0000-0000-000000000008', 'manager'::app_role),
('00000000-0000-0000-0000-000000000009', 'manager'::app_role),
('00000000-0000-0000-0000-000000000010', 'manager'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Insert demo user departments
INSERT INTO public.user_departments (user_id, department) VALUES
-- Mayor (UUID ending in 001)
('00000000-0000-0000-0000-000000000001', 'finance'::department_slug),
('00000000-0000-0000-0000-000000000001', 'education'::department_slug),
('00000000-0000-0000-0000-000000000001', 'engineering'::department_slug),
('00000000-0000-0000-0000-000000000001', 'welfare'::department_slug),
('00000000-0000-0000-0000-000000000001', 'non-formal'::department_slug),
('00000000-0000-0000-0000-000000000001', 'business'::department_slug),
('00000000-0000-0000-0000-000000000001', 'city-improvement'::department_slug),
('00000000-0000-0000-0000-000000000001', 'enforcement'::department_slug),
('00000000-0000-0000-0000-000000000001', 'ceo'::department_slug),

-- CEO (UUID ending in 002)
('00000000-0000-0000-0000-000000000002', 'finance'::department_slug),
('00000000-0000-0000-0000-000000000002', 'education'::department_slug),
('00000000-0000-0000-0000-000000000002', 'engineering'::department_slug),
('00000000-0000-0000-0000-000000000002', 'welfare'::department_slug),
('00000000-0000-0000-0000-000000000002', 'non-formal'::department_slug),
('00000000-0000-0000-0000-000000000002', 'business'::department_slug),
('00000000-0000-0000-0000-000000000002', 'city-improvement'::department_slug),
('00000000-0000-0000-0000-000000000002', 'enforcement'::department_slug),
('00000000-0000-0000-0000-000000000002', 'ceo'::department_slug),

-- Individual department managers
('00000000-0000-0000-0000-000000000003', 'finance'::department_slug),
('00000000-0000-0000-0000-000000000004', 'education'::department_slug),
('00000000-0000-0000-0000-000000000005', 'engineering'::department_slug),
('00000000-0000-0000-0000-000000000006', 'welfare'::department_slug),
('00000000-0000-0000-0000-000000000007', 'non-formal'::department_slug),
('00000000-0000-0000-0000-000000000008', 'business'::department_slug),
('00000000-0000-0000-0000-000000000009', 'city-improvement'::department_slug),
('00000000-0000-0000-0000-000000000010', 'enforcement'::department_slug)
ON CONFLICT (user_id, department) DO NOTHING;