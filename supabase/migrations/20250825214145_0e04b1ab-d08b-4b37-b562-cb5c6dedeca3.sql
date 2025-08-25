-- Add column for cumulative execution (ביצוע מצטבר)
ALTER TABLE public.regular_budget 
ADD COLUMN cumulative_execution numeric DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN public.regular_budget.cumulative_execution IS 'ביצוע מצטבר - הנתון מעמודת ביצוע מצטבר בקובץ האקסל';