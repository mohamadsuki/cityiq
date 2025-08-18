-- Update existing tasks created by mayor to have correct assigned_by_role
UPDATE public.tasks 
SET assigned_by_role = 'mayor'
WHERE created_by::text IN (
  SELECT demo_id FROM demo_user_mapping WHERE role = 'mayor'
) AND assigned_by_role IS NULL;

-- Update existing tasks created by ceo to have correct assigned_by_role  
UPDATE public.tasks 
SET assigned_by_role = 'ceo'
WHERE created_by::text IN (
  SELECT demo_id FROM demo_user_mapping WHERE role = 'ceo'
) AND assigned_by_role IS NULL;