-- Drop all existing policies for public_inquiries
DROP POLICY IF EXISTS "CEO can delete public inquiries" ON public.public_inquiries;
DROP POLICY IF EXISTS "CEO can insert public inquiries" ON public.public_inquiries;
DROP POLICY IF EXISTS "CEO can select all public inquiries" ON public.public_inquiries;
DROP POLICY IF EXISTS "CEO can update public inquiries" ON public.public_inquiries;
DROP POLICY IF EXISTS "Mayor can delete public inquiries" ON public.public_inquiries;
DROP POLICY IF EXISTS "Mayor can insert public inquiries" ON public.public_inquiries;
DROP POLICY IF EXISTS "Mayor can select all public inquiries" ON public.public_inquiries;
DROP POLICY IF EXISTS "Mayor can update public inquiries" ON public.public_inquiries;
DROP POLICY IF EXISTS "Managers can delete public inquiries by department" ON public.public_inquiries;
DROP POLICY IF EXISTS "Managers can insert public inquiries by department" ON public.public_inquiries;
DROP POLICY IF EXISTS "Managers can select public inquiries by department" ON public.public_inquiries;
DROP POLICY IF EXISTS "Managers can update public inquiries by department" ON public.public_inquiries;

-- Create a simpler policy that allows all authenticated users access for now
CREATE POLICY "Authenticated users can manage public inquiries" 
ON public.public_inquiries 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);