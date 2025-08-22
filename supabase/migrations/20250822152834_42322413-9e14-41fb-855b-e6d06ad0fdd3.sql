-- Create inquiries manager with username 'inquiries'
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
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'inquiries',
  crypt('inquiry123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  ''
);

-- Insert manager role
INSERT INTO public.user_roles (user_id, role) VALUES 
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'manager');

-- Insert department assignment
INSERT INTO public.user_departments (user_id, department) VALUES 
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'inquiries');

-- Create profile
INSERT INTO public.profiles (id, display_name) VALUES 
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'מנהל פניות ציבור');