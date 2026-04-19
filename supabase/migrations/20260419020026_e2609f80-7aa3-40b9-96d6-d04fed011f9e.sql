-- Enum for stream status
CREATE TYPE public.stream_status AS ENUM ('scheduled', 'live', 'ended', 'recording');

-- Streams table
CREATE TABLE public.streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status public.stream_status NOT NULL DEFAULT 'scheduled',
  stream_key TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  media_mtx_path TEXT NOT NULL UNIQUE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  viewer_count INT NOT NULL DEFAULT 0,
  recorded_url TEXT,
  simulcast_targets JSONB NOT NULL DEFAULT '[]'::jsonb,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_streams_workspace ON public.streams(workspace_id);
CREATE INDEX idx_streams_status ON public.streams(status);

-- Stream products
CREATE TABLE public.stream_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES public.streams(id) ON DELETE CASCADE,
  external_product_id TEXT,
  name TEXT NOT NULL,
  price NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  thumbnail_url TEXT,
  product_url TEXT,
  position INT NOT NULL DEFAULT 0,
  timestamp_shown TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stream_products_stream ON public.stream_products(stream_id);

-- Updated_at triggers
CREATE TRIGGER trg_streams_updated
BEFORE UPDATE ON public.streams
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_products ENABLE ROW LEVEL SECURITY;

-- Helper: can user manage streams in workspace? (admin or streamer roles, or tenant owner)
CREATE OR REPLACE FUNCTION public.can_manage_streams(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
      AND role IN ('workspace_admin','streamer','admin')
  ) OR EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = _workspace_id AND public.is_tenant_owner(_user_id, w.tenant_id)
  )
$$;

-- Helper: lookup stream by key for MediaMTX auth (security definer, bypasses RLS)
CREATE OR REPLACE FUNCTION public.validate_stream_key(_stream_key TEXT, _path TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.streams
    WHERE stream_key = _stream_key
      AND media_mtx_path = _path
      AND status IN ('scheduled','live','recording')
  )
$$;

-- RLS: streams
CREATE POLICY "Members view workspace streams"
ON public.streams FOR SELECT TO authenticated
USING (public.is_workspace_member(auth.uid(), workspace_id)
       OR EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND public.is_tenant_owner(auth.uid(), w.tenant_id)));

CREATE POLICY "Streamers create streams"
ON public.streams FOR INSERT TO authenticated
WITH CHECK (public.can_manage_streams(auth.uid(), workspace_id) AND created_by = auth.uid());

CREATE POLICY "Streamers update streams"
ON public.streams FOR UPDATE TO authenticated
USING (public.can_manage_streams(auth.uid(), workspace_id));

CREATE POLICY "Streamers delete streams"
ON public.streams FOR DELETE TO authenticated
USING (public.can_manage_streams(auth.uid(), workspace_id));

-- RLS: stream_products
CREATE POLICY "Members view stream products"
ON public.stream_products FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.streams s WHERE s.id = stream_id AND public.is_workspace_member(auth.uid(), s.workspace_id)));

CREATE POLICY "Streamers manage stream products insert"
ON public.stream_products FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.streams s WHERE s.id = stream_id AND public.can_manage_streams(auth.uid(), s.workspace_id)));

CREATE POLICY "Streamers manage stream products update"
ON public.stream_products FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.streams s WHERE s.id = stream_id AND public.can_manage_streams(auth.uid(), s.workspace_id)));

CREATE POLICY "Streamers manage stream products delete"
ON public.stream_products FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.streams s WHERE s.id = stream_id AND public.can_manage_streams(auth.uid(), s.workspace_id)));