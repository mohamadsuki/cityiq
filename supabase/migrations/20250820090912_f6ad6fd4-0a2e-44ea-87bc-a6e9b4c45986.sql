-- Drop the policy that depends on demo_user_mapping
DROP POLICY IF EXISTS "Users can manage their own inquiries" ON public.public_inquiries;

-- Now drop demo functions and table
DROP FUNCTION IF EXISTS public.has_role_demo(uuid, app_role);
DROP FUNCTION IF EXISTS public.has_department_demo(uuid, department_slug);
DROP TABLE IF EXISTS public.demo_user_mapping;

-- Re-create the user inquiries policy using standard auth
CREATE POLICY "Users can manage their own inquiries" ON public.public_inquiries
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);