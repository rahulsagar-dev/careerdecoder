
-- Move is_admin() out of the public API schema so anon/authenticated cannot call
-- it directly via PostgREST while RLS policies can still invoke it internally.
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = _user_id), false)
$$;

REVOKE ALL ON FUNCTION private.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid) TO authenticated, anon, service_role;

-- Repoint existing policies to the private helper.
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews" ON public.reviews
  FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id OR private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can update own review" ON public.reviews;
CREATE POLICY "Users can update own review" ON public.reviews
  FOR UPDATE
  USING (auth.uid() = user_id OR private.is_admin(auth.uid()))
  WITH CHECK (((auth.uid() = user_id) AND (status = 'pending')) OR private.is_admin(auth.uid()));

-- Remove the public-schema definer function now that nothing references it.
DROP FUNCTION IF EXISTS public.is_admin(uuid);

-- Harden the remaining SECURITY DEFINER trigger function: no direct call access.
REVOKE ALL ON FUNCTION public.seed_free_subscription() FROM PUBLIC, anon, authenticated;
