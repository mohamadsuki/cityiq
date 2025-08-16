-- Insert demo users and their roles/departments into the database

-- Insert demo user roles
INSERT INTO public.user_roles (user_id, role) VALUES
('demo-mayor', 'mayor'::app_role),
('demo-ceo', 'ceo'::app_role),
('demo-finance', 'manager'::app_role),
('demo-education', 'manager'::app_role),
('demo-engineering', 'manager'::app_role),
('demo-welfare', 'manager'::app_role),
('demo-nonformal', 'manager'::app_role),
('demo-business', 'manager'::app_role),
('demo-cityimprovement', 'manager'::app_role),
('demo-enforcement', 'manager'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Insert demo user departments
INSERT INTO public.user_departments (user_id, department) VALUES
-- Mayor - access to all departments
('demo-mayor', 'finance'::department_slug),
('demo-mayor', 'education'::department_slug),
('demo-mayor', 'engineering'::department_slug),
('demo-mayor', 'welfare'::department_slug),
('demo-mayor', 'non-formal'::department_slug),
('demo-mayor', 'business'::department_slug),
('demo-mayor', 'city-improvement'::department_slug),
('demo-mayor', 'enforcement'::department_slug),
('demo-mayor', 'ceo'::department_slug),

-- CEO - access to all departments
('demo-ceo', 'finance'::department_slug),
('demo-ceo', 'education'::department_slug),
('demo-ceo', 'engineering'::department_slug),
('demo-ceo', 'welfare'::department_slug),
('demo-ceo', 'non-formal'::department_slug),
('demo-ceo', 'business'::department_slug),
('demo-ceo', 'city-improvement'::department_slug),
('demo-ceo', 'enforcement'::department_slug),
('demo-ceo', 'ceo'::department_slug),

-- Individual department managers
('demo-finance', 'finance'::department_slug),
('demo-education', 'education'::department_slug),
('demo-engineering', 'engineering'::department_slug),
('demo-welfare', 'welfare'::department_slug),
('demo-nonformal', 'non-formal'::department_slug),
('demo-business', 'business'::department_slug),
('demo-cityimprovement', 'city-improvement'::department_slug),
('demo-enforcement', 'enforcement'::department_slug)
ON CONFLICT (user_id, department) DO NOTHING;