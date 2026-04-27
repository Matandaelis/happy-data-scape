UPDATE storage.buckets
SET public = false
WHERE id = 'shoppable-videos';

DROP POLICY IF EXISTS "Public reads shoppable video media" ON storage.objects;

CREATE POLICY "Workspace members view shoppable video media"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'shoppable-videos'
  AND public.is_workspace_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);