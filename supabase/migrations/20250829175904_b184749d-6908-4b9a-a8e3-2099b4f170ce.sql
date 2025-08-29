-- Update recent education tasks created by mayor to have assigned_by_role = 'mayor'
UPDATE tasks 
SET assigned_by_role = 'mayor'
WHERE created_by = '11111111-1111-1111-1111-111111111111' 
  AND department_slug = 'education'
  AND assigned_by_role IS NULL;