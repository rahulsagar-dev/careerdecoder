
DROP POLICY IF EXISTS "Users can insert own review" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own review" ON public.reviews;

CREATE POLICY "Users can insert own review"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status IN ('approved','pending'));

CREATE POLICY "Users can update own review"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id OR private.is_admin(auth.uid()))
  WITH CHECK (
    (auth.uid() = user_id AND status IN ('approved','pending'))
    OR private.is_admin(auth.uid())
  );
