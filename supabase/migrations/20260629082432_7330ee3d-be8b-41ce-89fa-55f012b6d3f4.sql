CREATE POLICY "Users upload bug screenshots to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'bug-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users view their own bug screenshots"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'bug-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete their own bug screenshots"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'bug-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
