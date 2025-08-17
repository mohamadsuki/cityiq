-- Fix the search_path security issue by recreating the function with proper security settings
DROP FUNCTION IF EXISTS public.calculate_surplus_deficit();

CREATE OR REPLACE FUNCTION public.calculate_surplus_deficit()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.surplus_deficit = COALESCE(NEW.actual_collection, 0) - COALESCE(NEW.relative_budget, 0);
  RETURN NEW;
END;
$$;