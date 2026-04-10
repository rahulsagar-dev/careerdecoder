ALTER TABLE public.interview_sessions
  ADD COLUMN IF NOT EXISTS current_question_index INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS difficulty_level TEXT NOT NULL DEFAULT 'easy',
  ADD COLUMN IF NOT EXISTS topics_covered TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS weak_topics TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS follow_up_count INTEGER NOT NULL DEFAULT 0;