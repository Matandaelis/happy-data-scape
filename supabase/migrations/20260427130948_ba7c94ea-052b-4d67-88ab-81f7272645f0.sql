CREATE TABLE public.shoppable_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  original_url TEXT NOT NULL,
  processed_url TEXT,
  thumbnail_url TEXT,
  product_markers JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_platform TEXT NOT NULL DEFAULT 'upload',
  status TEXT NOT NULL DEFAULT 'draft',
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shoppable_videos ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_shoppable_videos_workspace_created ON public.shoppable_videos (workspace_id, created_at DESC);
CREATE INDEX idx_shoppable_videos_status ON public.shoppable_videos (status);

CREATE TRIGGER update_shoppable_videos_updated_at
BEFORE UPDATE ON public.shoppable_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Members view workspace shoppable videos"
ON public.shoppable_videos
FOR SELECT
TO authenticated
USING (
  public.is_workspace_member(auth.uid(), workspace_id)
  OR EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = shoppable_videos.workspace_id
      AND public.is_tenant_owner(auth.uid(), w.tenant_id)
  )
);

CREATE POLICY "Stream managers create shoppable videos"
ON public.shoppable_videos
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_manage_streams(auth.uid(), workspace_id)
  AND created_by = auth.uid()
);

CREATE POLICY "Stream managers update shoppable videos"
ON public.shoppable_videos
FOR UPDATE
TO authenticated
USING (public.can_manage_streams(auth.uid(), workspace_id))
WITH CHECK (public.can_manage_streams(auth.uid(), workspace_id));

CREATE POLICY "Stream managers delete shoppable videos"
ON public.shoppable_videos
FOR DELETE
TO authenticated
USING (public.can_manage_streams(auth.uid(), workspace_id));

INSERT INTO storage.buckets (id, name, public)
VALUES ('shoppable-videos', 'shoppable-videos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public reads shoppable video media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'shoppable-videos');

CREATE POLICY "Workspace users upload shoppable video media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shoppable-videos'
  AND public.is_workspace_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Workspace users update shoppable video media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'shoppable-videos'
  AND public.is_workspace_member(auth.uid(), (storage.foldername(name))[1]::uuid)
)
WITH CHECK (
  bucket_id = 'shoppable-videos'
  AND public.is_workspace_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Workspace users delete shoppable video media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'shoppable-videos'
  AND public.is_workspace_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);