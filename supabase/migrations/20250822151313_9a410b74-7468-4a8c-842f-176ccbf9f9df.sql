-- Create inquiries department manager user with unique ID
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
  '88888888-8888-8888-8888-888888888888',
  'inquiries@city.local',
  crypt('inquiry123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  ''
);

-- Insert manager role for inquiries department manager
INSERT INTO public.user_roles (user_id, role) VALUES 
('88888888-8888-8888-8888-888888888888', 'manager');

-- Insert department assignment for inquiries manager
INSERT INTO public.user_departments (user_id, department) VALUES 
('88888888-8888-8888-8888-888888888888', 'inquiries');

-- Create profile for inquiries manager
INSERT INTO public.profiles (id, display_name) VALUES 
('88888888-8888-8888-8888-888888888888', 'מנהל פניות ציבור');