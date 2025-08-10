-- Create a minimal health-check table (idempotent)
CREATE TABLE IF NOT EXISTS public.app_health (
  id BIGSERIAL PRIMARY KEY,
  message TEXT NOT NULL DEFAULT 'ok',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.app_health ENABLE ROW LEVEL SECURITY;

-- Allow public (anonymous) reads for health checks
DROP POLICY IF EXISTS "Public can read app health" ON public.app_health;
CREATE POLICY "Public can read app health"
  ON public.app_health
  FOR SELECT
  USING (true);

-- Seed one row if table is empty
INSERT INTO public.app_health (message)
SELECT 'ok'
WHERE NOT EXISTS (SELECT 1 FROM public.app_health);
