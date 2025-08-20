-- Enable RLS on the demo_user_mapping table
ALTER TABLE public.demo_user_mapping ENABLE ROW LEVEL SECURITY;

-- Allow read access to demo user mapping table for demo mode
CREATE POLICY "Demo user mapping read access" ON public.demo_user_mapping
FOR SELECT USING (true);