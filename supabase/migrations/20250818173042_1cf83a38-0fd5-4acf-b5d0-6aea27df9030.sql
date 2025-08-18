-- Create a realistic task from mayor to business department
INSERT INTO public.tasks (
  title,
  description,
  department_slug,
  priority,
  status,
  due_at,
  created_by,
  assigned_by_role,
  tags,
  progress_percent
) VALUES (
  'עדכון מערכת רישוי עסקים דיגיטלי',
  'יש לעדכן את מערכת הרישוי הדיגיטלי לעסקים כדי לשפר את השירות לתושבים. הכנת דוח על מצב המערכת הנוכחית והמלצות לשדרוג. תיאום עם מחלקת מחשוב והכנת תקציב מפורט.',
  'business',
  'high',
  'todo',
  (now() + interval '2 weeks'),
  '11111111-1111-1111-1111-111111111111', -- mayor demo user
  'mayor',
  ARRAY['רישוי', 'דיגיטציה', 'שירות לקוחות'],
  0
)