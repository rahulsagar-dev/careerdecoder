
-- Create career_recommendations table
CREATE TABLE public.career_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  career_title TEXT NOT NULL,
  match_score INTEGER NOT NULL DEFAULT 0,
  required_skills TEXT[] DEFAULT '{}',
  missing_skills TEXT[] DEFAULT '{}',
  description TEXT,
  salary_range TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create skill_analysis table
CREATE TABLE public.skill_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_skills INTEGER NOT NULL DEFAULT 0,
  matched_skills INTEGER NOT NULL DEFAULT 0,
  missing_skills INTEGER NOT NULL DEFAULT 0,
  readiness_score INTEGER NOT NULL DEFAULT 0,
  skill_distribution JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.career_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_analysis ENABLE ROW LEVEL SECURITY;

-- RLS policies for career_recommendations
CREATE POLICY "Users can view own recommendations" ON public.career_recommendations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recommendations" ON public.career_recommendations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own recommendations" ON public.career_recommendations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS policies for skill_analysis
CREATE POLICY "Users can view own analysis" ON public.skill_analysis FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analysis" ON public.skill_analysis FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own analysis" ON public.skill_analysis FOR DELETE TO authenticated USING (auth.uid() = user_id);
