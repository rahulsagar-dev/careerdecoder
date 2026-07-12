
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'inr',
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz;

-- Idempotency for webhook events
CREATE UNIQUE INDEX IF NOT EXISTS payment_events_event_id_key
  ON public.payment_events (provider, event_id)
  WHERE event_id IS NOT NULL;

-- One counter row per user/feature/period
CREATE UNIQUE INDEX IF NOT EXISTS usage_counters_user_feature_period_key
  ON public.usage_counters (user_id, feature, period_start);

-- service_role write policies (drop-then-create pattern is fine)
DROP POLICY IF EXISTS "Service role manages subscriptions" ON public.subscriptions;
CREATE POLICY "Service role manages subscriptions"
  ON public.subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages usage" ON public.usage_counters;
CREATE POLICY "Service role manages usage"
  ON public.usage_counters FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages payment events" ON public.payment_events;
CREATE POLICY "Service role manages payment events"
  ON public.payment_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Grants (in case tables predate the grant rule)
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.usage_counters TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
GRANT ALL ON public.usage_counters TO service_role;
GRANT ALL ON public.payment_events TO service_role;
