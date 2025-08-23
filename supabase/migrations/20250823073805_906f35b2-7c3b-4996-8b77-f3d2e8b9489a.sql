-- Temporary policy to allow demo users to insert licenses
CREATE POLICY "Demo users can insert licenses" 
ON public.licenses 
FOR INSERT 
WITH CHECK (
  user_id::text IN (
    '11111111-1111-1111-1111-111111111111', -- mayor
    '22222222-2222-2222-2222-222222222222', -- ceo  
    '33333333-3333-3333-3333-333333333333'  -- finance/business
  )
);