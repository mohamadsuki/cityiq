-- Remove demo user logic from user_owns_budget_record function
CREATE OR REPLACE FUNCTION public.user_owns_budget_record(record_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Only check if the authenticated user owns the record
  SELECT auth.uid() = record_user_id;
$function$