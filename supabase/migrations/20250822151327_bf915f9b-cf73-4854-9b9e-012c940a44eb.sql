-- Create inquiries department manager user with completely new UUID
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
  'b0e7a5d1-c8f2-4a3e-9b1d-2f6a8c4e7b9a',
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
('b0e7a5d1-c8f2-4a3e-9b1d-2f6a8c4e7b9a', 'manager');

-- Insert department assignment for inquiries manager
INSERT INTO public.user_departments (user_id, department) VALUES 
('b0e7a5d1-c8f2-4a3e-9b1d-2f6a8c4e7b9a', 'inquiries');

-- Create profile for inquiries manager
INSERT INTO public.profiles (id, display_name) VALUES 
('b0e7a5d1-c8f2-4a3e-9b1d-2f6a8c4e7b9a', 'מנהל פניות ציבור');