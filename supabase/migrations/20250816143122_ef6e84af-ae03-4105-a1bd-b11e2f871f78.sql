-- Fix user_owns_budget_record function to handle demo users properly
CREATE OR REPLACE FUNCTION public.user_owns_budget_record(record_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- First try regular auth for real users
  SELECT 
    CASE 
      WHEN auth.uid() IS NOT NULL THEN 
        -- Regular user - check ownership or demo permissions
        CASE 
          WHEN auth.uid()::text LIKE 'demo-%' THEN 
            EXISTS (
              SELECT 1 FROM public.demo_user_mapping dum
              WHERE dum.demo_id = auth.uid()::text 
              AND 'finance'::department_slug = ANY(dum.departments)
            )
          ELSE auth.uid() = record_user_id 
        END
      ELSE 
        -- When auth.uid() is NULL, check if record_user_id matches any demo user with finance access
        EXISTS (
          SELECT 1 FROM public.demo_user_mapping dum
          WHERE dum.demo_id = record_user_id::text 
          AND 'finance'::department_slug = ANY(dum.departments)
        )
        OR
        -- Also allow specific demo user UUIDs that have finance permissions
        record_user_id::text IN (
          '11111111-1111-1111-1111-111111111111', -- mayor
          '22222222-2222-2222-2222-222222222222', -- ceo  
          '33333333-3333-3333-3333-333333333333'  -- finance
        )
    END;
$function$