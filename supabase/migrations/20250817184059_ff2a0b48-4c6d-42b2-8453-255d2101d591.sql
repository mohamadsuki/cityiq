-- Fix the search_path security issue by properly recreating the function and trigger
-- First drop the trigger that depends on the function
DROP TRIGGER IF EXISTS calculate_surplus_deficit_trigger ON public.collection_data;

-- Then drop the function
DROP FUNCTION IF EXISTS public.calculate_surplus_deficit();

-- Recreate the function with proper security settings
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

-- Recreate the trigger
CREATE TRIGGER calculate_surplus_deficit_trigger
  BEFORE INSERT OR UPDATE ON public.collection_data
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_surplus_deficit();