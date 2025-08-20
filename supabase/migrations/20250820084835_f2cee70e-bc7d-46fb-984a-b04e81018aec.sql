-- Add missing demo users to support all demo roles
INSERT INTO demo_user_mapping (demo_id, role, departments, display_name) VALUES
('44444444-4444-4444-4444-444444444444', 'manager', ARRAY['education']::department_slug[], 'מנהל חינוך (דמו)'),
('55555555-5555-5555-5555-555555555555', 'manager', ARRAY['engineering']::department_slug[], 'מנהל הנדסה (דמו)'),
('66666666-6666-6666-6666-666666666666', 'manager', ARRAY['welfare']::department_slug[], 'מנהל רווחה (דמו)'),
('77777777-7777-7777-7777-777777777777', 'manager', ARRAY['non-formal']::department_slug[], 'מנהל חינוך בלתי פורמאלי (דמו)'),
('88888888-8888-8888-8888-888888888888', 'manager', ARRAY['business']::department_slug[], 'מנהל רישוי עסקים (דמו)'),
('99999999-9999-9999-9999-999999999999', 'manager', ARRAY['city-improvement']::department_slug[], 'מנהל שיפור פני העיר (דמו)'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'manager', ARRAY['enforcement']::department_slug[], 'מנהל אכיפה (דמו)')
ON CONFLICT (demo_id) DO UPDATE SET
  role = EXCLUDED.role,
  departments = EXCLUDED.departments,
  display_name = EXCLUDED.display_name;