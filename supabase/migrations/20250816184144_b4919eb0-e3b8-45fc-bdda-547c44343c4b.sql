-- Add missing demo user mappings for the IDs used in the application
INSERT INTO public.demo_user_mapping (demo_id, display_name, role, departments) VALUES
('11111111-1111-1111-1111-111111111111', 'ראש העיר (דמו)', 'mayor', ARRAY['finance', 'education', 'engineering', 'welfare', 'non-formal', 'business', 'city-improvement', 'enforcement', 'ceo']::department_slug[]),
('22222222-2222-2222-2222-222222222222', 'מנכ"ל העירייה (דמו)', 'ceo', ARRAY['finance', 'education', 'engineering', 'welfare', 'non-formal', 'business', 'city-improvement', 'enforcement', 'ceo']::department_slug[]),
('33333333-3333-3333-3333-333333333333', 'מנהל פיננסים (דמו)', 'manager', ARRAY['finance']::department_slug[]);