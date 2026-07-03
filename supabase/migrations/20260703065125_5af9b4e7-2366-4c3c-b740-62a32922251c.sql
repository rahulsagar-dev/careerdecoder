
DROP POLICY IF EXISTS "Anyone can submit support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Anyone can submit bug reports" ON public.bug_reports;

CREATE POLICY "Authenticated users can submit support tickets"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can submit bug reports"
ON public.bug_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
