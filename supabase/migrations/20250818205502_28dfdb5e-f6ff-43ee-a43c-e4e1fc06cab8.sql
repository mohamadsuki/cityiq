-- Create public inquiries table
CREATE TABLE public.public_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_number TEXT UNIQUE NOT NULL DEFAULT CONCAT('INQ-', EXTRACT(year FROM now())::text, '-', LPAD(nextval('public_inquiry_seq')::text, 4, '0')),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  inquiry_type TEXT NOT NULL CHECK (inquiry_type IN ('complaint', 'request', 'information', 'licensing', 'maintenance', 'other')),
  source TEXT NOT NULL CHECK (source IN ('whatsapp', 'email', 'phone', 'in_person', 'website', 'social_media')),
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'waiting_approval', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID,
  department_slug department_slug,
  response TEXT,
  internal_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sequence for inquiry numbers
CREATE SEQUENCE IF NOT EXISTS public_inquiry_seq START 1;

-- Enable RLS
ALTER TABLE public.public_inquiries ENABLE ROW LEVEL SECURITY;

-- Create policies for public inquiries
CREATE POLICY "Mayor can manage all inquiries" 
ON public.public_inquiries 
FOR ALL 
USING (has_role_demo(auth.uid(), 'mayor'::app_role))
WITH CHECK (has_role_demo(auth.uid(), 'mayor'::app_role));

CREATE POLICY "CEO can manage all inquiries" 
ON public.public_inquiries 
FOR ALL 
USING (has_role_demo(auth.uid(), 'ceo'::app_role))
WITH CHECK (has_role_demo(auth.uid(), 'ceo'::app_role));

CREATE POLICY "Managers can manage inquiries by department" 
ON public.public_inquiries 
FOR ALL 
USING (has_role_demo(auth.uid(), 'manager'::app_role) AND has_department_demo(auth.uid(), department_slug))
WITH CHECK (has_role_demo(auth.uid(), 'manager'::app_role) AND has_department_demo(auth.uid(), department_slug));

CREATE POLICY "Users can manage their own inquiries" 
ON public.public_inquiries 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_public_inquiries_updated_at
BEFORE UPDATE ON public.public_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();