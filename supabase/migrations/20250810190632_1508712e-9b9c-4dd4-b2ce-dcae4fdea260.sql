-- STEP 1: Add enum values only (separate transaction)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'ceo'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'ceo';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'department_slug') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'department_slug' AND e.enumlabel = 'ceo'
    ) THEN
      ALTER TYPE public.department_slug ADD VALUE 'ceo';
    END IF;
  END IF;
END $$;