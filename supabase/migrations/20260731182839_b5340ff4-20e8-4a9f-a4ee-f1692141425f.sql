CREATE TABLE public.anon_tool_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash text NOT NULL,
  tool text NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ip_hash, tool, day)
);

GRANT ALL ON public.anon_tool_usage TO service_role;

ALTER TABLE public.anon_tool_usage ENABLE ROW LEVEL SECURITY;
