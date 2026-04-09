
-- Create interview_sessions table
CREATE TABLE public.interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mode TEXT NOT NULL DEFAULT 'Technical',
  role TEXT NOT NULL DEFAULT '',
  score INTEGER NOT NULL DEFAULT 0,
  feedback JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.interview_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.interview_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.interview_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.interview_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create interview_messages table
CREATE TABLE public.interview_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  sender TEXT NOT NULL DEFAULT 'ai',
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.interview_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.interview_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.interview_sessions s WHERE s.id = interview_messages.session_id AND s.user_id = auth.uid()));
CREATE POLICY "Users can insert own messages" ON public.interview_messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.interview_sessions s WHERE s.id = interview_messages.session_id AND s.user_id = auth.uid()));
CREATE POLICY "Users can delete own messages" ON public.interview_messages FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.interview_sessions s WHERE s.id = interview_messages.session_id AND s.user_id = auth.uid()));

-- Create market_data table
CREATE TABLE public.market_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  trending_skills TEXT[] DEFAULT '{}'::text[],
  salary_range TEXT DEFAULT '',
  demand_level TEXT DEFAULT 'Medium',
  insights TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own market data" ON public.market_data FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own market data" ON public.market_data FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own market data" ON public.market_data FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own market data" ON public.market_data FOR DELETE TO authenticated USING (auth.uid() = user_id);
