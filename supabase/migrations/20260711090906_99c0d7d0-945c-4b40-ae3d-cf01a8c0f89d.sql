
REVOKE EXECUTE ON FUNCTION public.seed_free_subscription() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

CREATE POLICY "No direct access to payment events"
  ON public.payment_events FOR SELECT
  TO authenticated
  USING (false);
