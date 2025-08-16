-- Update demo user mapping to use consistent IDs with AuthContext

-- Clear existing demo user data and reinsert with consistent IDs
DELETE FROM public.demo_user_mapping;

INSERT INTO public.demo_user_mapping (demo_id, display_name, role, departments) VALUES
('00000000-0000-0000-0000-000000000001', 'ראש העיר', 'mayor'::app_role, 
 ARRAY['finance'::department_slug, 'education'::department_slug, 'engineering'::department_slug, 
       'welfare'::department_slug, 'non-formal'::department_slug, 'business'::department_slug, 
       'city-improvement'::department_slug, 'enforcement'::department_slug, 'ceo'::department_slug]),
('00000000-0000-0000-0000-000000000002', 'מנכל העירייה', 'ceo'::app_role,
 ARRAY['finance'::department_slug, 'education'::department_slug, 'engineering'::department_slug, 
       'welfare'::department_slug, 'non-formal'::department_slug, 'business'::department_slug, 
       'city-improvement'::department_slug, 'enforcement'::department_slug, 'ceo'::department_slug]),
('00000000-0000-0000-0000-000000000003', 'מנהל פיננסים', 'manager'::app_role, ARRAY['finance'::department_slug]),
('00000000-0000-0000-0000-000000000004', 'מנהל חינוך', 'manager'::app_role, ARRAY['education'::department_slug]),
('00000000-0000-0000-0000-000000000005', 'מנהל הנדסה', 'manager'::app_role, ARRAY['engineering'::department_slug]),
('00000000-0000-0000-0000-000000000006', 'מנהל רווחה', 'manager'::app_role, ARRAY['welfare'::department_slug]),
('00000000-0000-0000-0000-000000000007', 'מנהל חינוך בלתי פורמאלי', 'manager'::app_role, ARRAY['non-formal'::department_slug]),
('00000000-0000-0000-0000-000000000008', 'מנהל רישוי עסקים', 'manager'::app_role, ARRAY['business'::department_slug]),
('00000000-0000-0000-0000-000000000009', 'מנהל שיפור פני העיר', 'manager'::app_role, ARRAY['city-improvement'::department_slug]),
('00000000-0000-0000-0000-000000000010', 'מנהל אכיפה', 'manager'::app_role, ARRAY['enforcement'::department_slug]);