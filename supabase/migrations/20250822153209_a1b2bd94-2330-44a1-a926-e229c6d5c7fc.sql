-- Delete the incorrect inquiries users first
DELETE FROM public.profiles WHERE id IN ('14fb3bc2-7803-433a-95ed-2a336f062166', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');
DELETE FROM public.user_departments WHERE user_id IN ('14fb3bc2-7803-433a-95ed-2a336f062166', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');
DELETE FROM public.user_roles WHERE user_id IN ('14fb3bc2-7803-433a-95ed-2a336f062166', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');
DELETE FROM auth.users WHERE id IN ('14fb3bc2-7803-433a-95ed-2a336f062166', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');

-- Create inquiries manager with proper email format like other managers
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
  '99999999-9999-9999-9999-999999999999',
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
('99999999-9999-9999-9999-999999999999', 'manager');

-- Insert department assignment
INSERT INTO public.user_departments (user_id, department) VALUES 
('99999999-9999-9999-9999-999999999999', 'inquiries');

-- Create profile
INSERT INTO public.profiles (id, display_name) VALUES 
('99999999-9999-9999-9999-999999999999', 'מנהל פניות ציבור');