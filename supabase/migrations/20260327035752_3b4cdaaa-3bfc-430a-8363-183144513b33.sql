
CREATE TABLE public.resume_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  extracted_skills TEXT[] DEFAULT '{}'::TEXT[],
  extracted_experience JSONB DEFAULT '[]'::JSONB,
  extracted_projects JSONB DEFAULT '[]'::JSONB,
  tech_stack TEXT[] DEFAULT '{}'::TEXT[],
  ats_score INTEGER NOT NULL DEFAULT 0,
  strengths TEXT[] DEFAULT '{}'::TEXT[],
  weaknesses TEXT[] DEFAULT '{}'::TEXT[],
  suggestions TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.resume_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resume analysis"
  ON public.resume_analysis FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resume analysis"
  ON public.resume_analysis FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own resume analysis"
  ON public.resume_analysis FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
