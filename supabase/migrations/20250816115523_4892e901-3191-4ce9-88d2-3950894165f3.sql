-- Add new field for שיוך לתב"ר (TABA-R assignment)
ALTER TABLE public.projects 
ADD COLUMN tabar_assignment text;

-- Add comment to explain the field
COMMENT ON COLUMN public.projects.tabar_assignment IS 'שיוך לתב"ר - תקציב רב שנתי';

-- Update department_slug enum to include new departments
ALTER TYPE department_slug ADD VALUE 'city-improvement';
ALTER TYPE department_slug ADD VALUE 'enforcement';