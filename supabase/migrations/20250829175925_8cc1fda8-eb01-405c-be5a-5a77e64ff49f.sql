-- Insert a test task with assigned_by_role set to test the notification
INSERT INTO tasks (
  id,
  title, 
  description, 
  department_slug, 
  priority, 
  status, 
  created_by, 
  assigned_by_role,
  due_at
) VALUES (
  gen_random_uuid(),
  'משימה דחופה מראש העיר - בדיקת מערכת',
  'זו משימה לבדיקת התראות מההנהלה למחלקת החינוך',
  'education',
  'high',
  'todo',
  '11111111-1111-1111-1111-111111111111',
  'mayor',
  now() + interval '7 days'
);