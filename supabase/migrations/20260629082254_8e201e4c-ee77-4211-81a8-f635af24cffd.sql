CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  subject text NOT NULL,
  category text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.support_tickets TO authenticated;
GRANT INSERT ON public.support_tickets TO anon;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit support tickets" ON public.support_tickets FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users view their own support tickets" ON public.support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  expected_behavior text,
  steps_to_reproduce text,
  severity text NOT NULL DEFAULT 'medium',
  browser_info text,
  page_url text,
  screenshot_url text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.bug_reports TO authenticated;
GRANT INSERT ON public.bug_reports TO anon;
GRANT ALL ON public.bug_reports TO service_role;
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit bug reports" ON public.bug_reports FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users view their own bug reports" ON public.bug_reports FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  context text NOT NULL,
  rating text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can submit feedback" ON public.feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view their own feedback" ON public.feedback FOR SELECT TO authenticated USING (auth.uid() = user_id);
