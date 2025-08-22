-- Create inquiries manager with proper email format and new ID
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  'f1e2d3c4-b5a6-9708-1a2b-3c4d5e6f7890',
  'inquiries@city.gov.il',
  crypt('inquiry123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  ''
);

-- Insert manager role
INSERT INTO public.user_roles (user_id, role) VALUES 
('f1e2d3c4-b5a6-9708-1a2b-3c4d5e6f7890', 'manager');

-- Insert department assignment
INSERT INTO public.user_departments (user_id, department) VALUES 
('f1e2d3c4-b5a6-9708-1a2b-3c4d5e6f7890', 'inquiries');

-- Create profile
INSERT INTO public.profiles (id, display_name) VALUES 
('f1e2d3c4-b5a6-9708-1a2b-3c4d5e6f7890', 'מנהל פניות ציבור');