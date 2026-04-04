
-- 1. Make resumes bucket private
UPDATE storage.buckets SET public = false WHERE id = 'resumes';

-- 2. Drop old public SELECT policy if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can view resumes') THEN
    DROP POLICY "Public can view resumes" ON storage.objects;
  END IF;
END $$;

-- 3. Create owner-scoped SELECT policy for resumes
CREATE POLICY "Users can view own resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Add missing UPDATE RLS policies

CREATE POLICY "Users can update own recommendations"
ON career_recommendations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skill analysis"
ON skill_analysis FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project suggestions"
ON project_suggestions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resume analysis"
ON resume_analysis FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own github analysis"
ON github_analysis FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own repo analysis"
ON repo_analysis FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM github_analysis ga
  WHERE ga.id = repo_analysis.analysis_id
  AND ga.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM github_analysis ga
  WHERE ga.id = repo_analysis.analysis_id
  AND ga.user_id = auth.uid()
));
