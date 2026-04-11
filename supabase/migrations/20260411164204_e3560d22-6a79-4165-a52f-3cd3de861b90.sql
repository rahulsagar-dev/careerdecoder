ALTER TABLE public.market_data
  ADD COLUMN IF NOT EXISTS skill_demand_scores jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS role_growth_rate double precision DEFAULT 0,
  ADD COLUMN IF NOT EXISTS competition_level text DEFAULT 'Medium'::text,
  ADD COLUMN IF NOT EXISTS declining_skills text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS market_position_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS high_impact_skills text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS strategy_plan text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS last_updated timestamp with time zone DEFAULT now();