-- Update RLS policies for public_inquiries to support department-based access
DROP POLICY IF EXISTS "Users can manage their own inquiries" ON public.public_inquiries;

-- Create new RLS policies similar to other department-managed tables
CREATE POLICY "CEO can delete public inquiries" 
ON public.public_inquiries 
FOR DELETE 
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can insert public inquiries" 
ON public.public_inquiries 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can select all public inquiries" 
ON public.public_inquiries 
FOR SELECT 
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can update public inquiries" 
ON public.public_inquiries 
FOR UPDATE 
USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "Mayor can delete public inquiries" 
ON public.public_inquiries 
FOR DELETE 
USING (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can insert public inquiries" 
ON public.public_inquiries 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can select all public inquiries" 
ON public.public_inquiries 
FOR SELECT 
USING (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Mayor can update public inquiries" 
ON public.public_inquiries 
FOR UPDATE 
USING (has_role(auth.uid(), 'mayor'::app_role));

CREATE POLICY "Managers can delete public inquiries by department" 
ON public.public_inquiries 
FOR DELETE 
USING (has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), 'inquiries'::department_slug));

CREATE POLICY "Managers can insert public inquiries by department" 
ON public.public_inquiries 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), 'inquiries'::department_slug));

CREATE POLICY "Managers can select public inquiries by department" 
ON public.public_inquiries 
FOR SELECT 
USING (has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), 'inquiries'::department_slug));

CREATE POLICY "Managers can update public inquiries by department" 
ON public.public_inquiries 
FOR UPDATE 
USING (has_role(auth.uid(), 'manager'::app_role) AND has_department(auth.uid(), 'inquiries'::department_slug));

-- Create inquiries department manager user with new unique ID
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
  '77777777-7777-7777-7777-777777777777',
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
('77777777-7777-7777-7777-777777777777', 'manager');

-- Insert department assignment for inquiries manager
INSERT INTO public.user_departments (user_id, department) VALUES 
('77777777-7777-7777-7777-777777777777', 'inquiries');

-- Create profile for inquiries manager
INSERT INTO public.profiles (id, display_name) VALUES 
('77777777-7777-7777-7777-777777777777', 'מנהל פניות ציבור');