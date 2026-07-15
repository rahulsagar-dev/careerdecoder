
-- 1. input_hash columns for cache-by-input
ALTER TABLE public.career_recommendations ADD COLUMN IF NOT EXISTS input_hash text;
ALTER TABLE public.skill_analysis          ADD COLUMN IF NOT EXISTS input_hash text;
ALTER TABLE public.market_data             ADD COLUMN IF NOT EXISTS input_hash text;
ALTER TABLE public.resume_analysis         ADD COLUMN IF NOT EXISTS input_hash text;
ALTER TABLE public.linkedin_analysis       ADD COLUMN IF NOT EXISTS input_hash text;

CREATE INDEX IF NOT EXISTS idx_career_recs_user_hash    ON public.career_recommendations (user_id, input_hash);
CREATE INDEX IF NOT EXISTS idx_skill_analysis_user_hash ON public.skill_analysis (user_id, input_hash);
CREATE INDEX IF NOT EXISTS idx_market_data_user_hash    ON public.market_data (user_id, input_hash);
CREATE INDEX IF NOT EXISTS idx_resume_analysis_user_hash ON public.resume_analysis (user_id, input_hash);
CREATE INDEX IF NOT EXISTS idx_linkedin_analysis_user_hash ON public.linkedin_analysis (user_id, input_hash);

-- 2. active_generations: prevents duplicate parallel jobs per user+feature
CREATE TABLE IF NOT EXISTS public.active_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feature text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, feature)
);
GRANT SELECT ON public.active_generations TO authenticated;
GRANT ALL    ON public.active_generations TO service_role;
ALTER TABLE public.active_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own active generations"
  ON public.active_generations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 3. pending_generations: queue for expensive AI jobs that failed under load
CREATE TABLE IF NOT EXISTS public.pending_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feature text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','done','failed')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb,
  error_message text,
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pending_generations TO authenticated;
GRANT ALL    ON public.pending_generations TO service_role;
ALTER TABLE public.pending_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own pending generations"
  ON public.pending_generations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_pending_gen_status ON public.pending_generations (status, created_at);
CREATE INDEX IF NOT EXISTS idx_pending_gen_user   ON public.pending_generations (user_id, created_at DESC);

DROP TRIGGER IF EXISTS set_pending_generations_updated_at ON public.pending_generations;
CREATE TRIGGER set_pending_generations_updated_at
  BEFORE UPDATE ON public.pending_generations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
