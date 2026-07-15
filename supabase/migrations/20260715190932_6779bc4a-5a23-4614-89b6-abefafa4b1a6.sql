
CREATE POLICY "Admins view all bug reports" ON public.bug_reports FOR SELECT TO authenticated USING (private.is_admin(auth.uid()));
CREATE POLICY "Admins update bug reports" ON public.bug_reports FOR UPDATE TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY "Admins view all support tickets" ON public.support_tickets FOR SELECT TO authenticated USING (private.is_admin(auth.uid()));
CREATE POLICY "Admins update support tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
