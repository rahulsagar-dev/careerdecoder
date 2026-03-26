
-- Table: learning_roadmaps
CREATE TABLE public.learning_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  career_title TEXT NOT NULL,
  total_steps INTEGER NOT NULL DEFAULT 0,
  completed_steps INTEGER NOT NULL DEFAULT 0,
  progress INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roadmaps" ON public.learning_roadmaps FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own roadmaps" ON public.learning_roadmaps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own roadmaps" ON public.learning_roadmaps FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own roadmaps" ON public.learning_roadmaps FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Table: roadmap_steps
CREATE TABLE public.roadmap_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL REFERENCES public.learning_roadmaps(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  resources TEXT[] DEFAULT '{}'::text[],
  estimated_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.roadmap_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own steps" ON public.roadmap_steps FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.learning_roadmaps lr WHERE lr.id = roadmap_steps.roadmap_id AND lr.user_id = auth.uid()));
CREATE POLICY "Users can insert own steps" ON public.roadmap_steps FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.learning_roadmaps lr WHERE lr.id = roadmap_steps.roadmap_id AND lr.user_id = auth.uid()));
CREATE POLICY "Users can update own steps" ON public.roadmap_steps FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.learning_roadmaps lr WHERE lr.id = roadmap_steps.roadmap_id AND lr.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.learning_roadmaps lr WHERE lr.id = roadmap_steps.roadmap_id AND lr.user_id = auth.uid()));

-- Table: project_suggestions
CREATE TABLE public.project_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'Beginner',
  skills_covered TEXT[] DEFAULT '{}'::text[],
  estimated_time TEXT NOT NULL DEFAULT '1 week',
  project_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON public.project_suggestions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON public.project_suggestions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.project_suggestions FOR DELETE TO authenticated USING (auth.uid() = user_id);
