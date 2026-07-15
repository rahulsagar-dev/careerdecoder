
CREATE TABLE public.linkedin_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL DEFAULT 0,
  headline_score INTEGER NOT NULL DEFAULT 0,
  about_score INTEGER NOT NULL DEFAULT 0,
  experience_score INTEGER NOT NULL DEFAULT 0,
  skills_score INTEGER NOT NULL DEFAULT 0,
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  keyword_gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
  parsed_text TEXT,
  target_career TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.linkedin_analysis TO authenticated;
GRANT ALL ON public.linkedin_analysis TO service_role;

ALTER TABLE public.linkedin_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own linkedin analyses"
  ON public.linkedin_analysis FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own linkedin analyses"
  ON public.linkedin_analysis FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own linkedin analyses"
  ON public.linkedin_analysis FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own linkedin analyses"
  ON public.linkedin_analysis FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_linkedin_analysis_updated_at
  BEFORE UPDATE ON public.linkedin_analysis
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_linkedin_analysis_user_created ON public.linkedin_analysis(user_id, created_at DESC);
