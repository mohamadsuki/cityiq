-- Create sequence for inquiry numbers
CREATE SEQUENCE public.public_inquiry_seq START WITH 1 INCREMENT BY 1;

-- Create public inquiries table
CREATE TABLE public.public_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_number TEXT NOT NULL DEFAULT concat('INQ-', EXTRACT(year FROM now())::text, '-', lpad(nextval('public_inquiry_seq')::text, 4, '0')),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  subject TEXT NOT NULL,
  description TEXT,
  inquiry_type TEXT NOT NULL CHECK (inquiry_type IN ('complaint', 'request', 'information', 'suggestion', 'other')),
  source TEXT NOT NULL CHECK (source IN ('whatsapp', 'email', 'phone', 'in_person', 'website', 'other')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'pending', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  department_slug department_slug,
  assigned_to UUID,
  internal_notes TEXT,
  response TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.public_inquiries ENABLE ROW LEVEL SECURITY;

-- Create policies for public inquiries
CREATE POLICY "Users can manage their own inquiries"
ON public.public_inquiries
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mayor can manage all inquiries"
ON public.public_inquiries
FOR ALL 
USING (has_role_demo(auth.uid(), 'mayor'))
WITH CHECK (has_role_demo(auth.uid(), 'mayor'));

CREATE POLICY "CEO can manage all inquiries"
ON public.public_inquiries
FOR ALL 
USING (has_role_demo(auth.uid(), 'ceo'))
WITH CHECK (has_role_demo(auth.uid(), 'ceo'));

CREATE POLICY "Managers can manage inquiries by department"
ON public.public_inquiries
FOR ALL 
USING (has_role_demo(auth.uid(), 'manager') AND has_department_demo(auth.uid(), department_slug))
WITH CHECK (has_role_demo(auth.uid(), 'manager') AND has_department_demo(auth.uid(), department_slug));

-- Create trigger for updating timestamps
CREATE TRIGGER update_public_inquiries_updated_at
  BEFORE UPDATE ON public.public_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();