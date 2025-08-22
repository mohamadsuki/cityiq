-- First, let's just update RLS policies for public_inquiries
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