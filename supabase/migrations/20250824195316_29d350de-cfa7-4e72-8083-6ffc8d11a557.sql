-- Add rejection_reason column to grants table
ALTER TABLE public.grants 
ADD COLUMN rejection_reason text;

-- Add comment for documentation
COMMENT ON COLUMN public.grants.rejection_reason IS 'Reason for rejection when status is נדחה or לא רלוונטי';