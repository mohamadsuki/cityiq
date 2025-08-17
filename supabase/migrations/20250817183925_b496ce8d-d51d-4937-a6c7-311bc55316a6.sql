-- Add surplus_deficit column to collection_data table for calculating difference between actual collection and relative budget
ALTER TABLE public.collection_data 
ADD COLUMN surplus_deficit numeric;

-- Update existing records to calculate surplus_deficit
UPDATE public.collection_data 
SET surplus_deficit = COALESCE(actual_collection, 0) - COALESCE(relative_budget, 0);

-- Add a trigger to automatically calculate surplus_deficit when data is inserted or updated
CREATE OR REPLACE FUNCTION public.calculate_surplus_deficit()
RETURNS TRIGGER AS $$
BEGIN
  NEW.surplus_deficit = COALESCE(NEW.actual_collection, 0) - COALESCE(NEW.relative_budget, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic calculation
CREATE TRIGGER calculate_surplus_deficit_trigger
  BEFORE INSERT OR UPDATE ON public.collection_data
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_surplus_deficit();