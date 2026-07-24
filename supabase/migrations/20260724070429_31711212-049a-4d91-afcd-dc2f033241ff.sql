
CREATE POLICY "Deny client inserts on referrals"
ON public.referrals FOR INSERT TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "Deny client updates on referrals"
ON public.referrals FOR UPDATE TO anon, authenticated
USING (false) WITH CHECK (false);

CREATE POLICY "Deny client deletes on referrals"
ON public.referrals FOR DELETE TO anon, authenticated
USING (false);
