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
  gen_random_uuid(),
  'inquiries@city.local',
  crypt('inquiry123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  ''
);

-- Get the user ID we just created and store it in a variable for the other inserts
DO $$
DECLARE
    new_user_id uuid;
BEGIN
    -- Get the ID of the user we just created
    SELECT id INTO new_user_id FROM auth.users WHERE email = 'inquiries@city.local';
    
    -- Insert manager role for inquiries department manager
    INSERT INTO public.user_roles (user_id, role) VALUES 
    (new_user_id, 'manager');
    
    -- Insert department assignment for inquiries manager
    INSERT INTO public.user_departments (user_id, department) VALUES 
    (new_user_id, 'inquiries');
    
    -- Create profile for inquiries manager
    INSERT INTO public.profiles (id, display_name) VALUES 
    (new_user_id, 'מנהל פניות ציבור');
END $$;