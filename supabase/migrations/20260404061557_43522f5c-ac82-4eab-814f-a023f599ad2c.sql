
-- GitHub Portfolio Analysis table
CREATE TABLE public.github_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  github_url TEXT NOT NULL,
  total_repos INTEGER NOT NULL DEFAULT 0,
  total_commits INTEGER NOT NULL DEFAULT 0,
  languages TEXT[] DEFAULT '{}'::text[],
  portfolio_score INTEGER NOT NULL DEFAULT 0,
  strengths TEXT[] DEFAULT '{}'::text[],
  weaknesses TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.github_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own github analysis"
ON public.github_analysis FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own github analysis"
ON public.github_analysis FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own github analysis"
ON public.github_analysis FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Repo-level Analysis table
CREATE TABLE public.repo_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES public.github_analysis(id) ON DELETE CASCADE,
  repo_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  stars INTEGER NOT NULL DEFAULT 0,
  forks INTEGER NOT NULL DEFAULT 0,
  primary_language TEXT DEFAULT '',
  commit_count INTEGER NOT NULL DEFAULT 0,
  complexity_score INTEGER NOT NULL DEFAULT 0,
  strengths TEXT[] DEFAULT '{}'::text[],
  weaknesses TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.repo_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own repo analysis"
ON public.repo_analysis FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.github_analysis ga
  WHERE ga.id = repo_analysis.analysis_id AND ga.user_id = auth.uid()
));

CREATE POLICY "Users can insert own repo analysis"
ON public.repo_analysis FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.github_analysis ga
  WHERE ga.id = repo_analysis.analysis_id AND ga.user_id = auth.uid()
));

CREATE POLICY "Users can delete own repo analysis"
ON public.repo_analysis FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.github_analysis ga
  WHERE ga.id = repo_analysis.analysis_id AND ga.user_id = auth.uid()
));
