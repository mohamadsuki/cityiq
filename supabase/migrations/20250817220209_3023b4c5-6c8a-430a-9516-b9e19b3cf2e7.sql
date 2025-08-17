-- Change domain column to accept Hebrew text instead of enum
ALTER TABLE public.tabarim 
ALTER COLUMN domain TYPE text;

-- Update existing domain values to Hebrew
UPDATE public.tabarim SET domain = 
  CASE 
    WHEN domain = 'education_buildings' THEN 'מוסדות חינוך'
    WHEN domain = 'public_buildings' THEN 'מוסדות ציבור - בינוי'
    WHEN domain = 'infrastructure_roads' THEN 'תשתיות וכבישים'
    WHEN domain = 'planning' THEN 'תכנון'
    WHEN domain = 'welfare' THEN 'רווחה'
    WHEN domain = 'environment' THEN 'איכות הסביבה'
    WHEN domain = 'activities' THEN 'פעילויות תרבות'
    WHEN domain = 'public_spaces' THEN 'מרחבים ציבוריים' 
    WHEN domain = 'digital' THEN 'דיגיטל וטכנולוגיה'
    WHEN domain = 'organizational' THEN 'ארגוני'
    WHEN domain = 'energy' THEN 'אנרגיה'
    WHEN domain = 'veterinary' THEN 'וטרינר'
    ELSE 'אחר'
  END;

-- Change funding source columns to accept Hebrew text instead of enum
ALTER TABLE public.tabarim 
ALTER COLUMN funding_source1 TYPE text,
ALTER COLUMN funding_source2 TYPE text, 
ALTER COLUMN funding_source3 TYPE text;