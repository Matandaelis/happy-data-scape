-- chat_messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  display_name text,
  message text NOT NULL CHECK (length(message) BETWEEN 1 AND 1000),
  is_question boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_stream_created ON public.chat_messages(stream_id, created_at DESC);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper: can moderate chat in a workspace
CREATE OR REPLACE FUNCTION public.can_moderate_chat(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
      AND role IN ('workspace_admin','admin','moderator','streamer')
  ) OR EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = _workspace_id AND public.is_tenant_owner(_user_id, w.tenant_id)
  )
$$;

-- Anyone can read non-deleted messages (public viewing)
CREATE POLICY "Anyone reads chat" ON public.chat_messages
FOR SELECT USING (is_deleted = false);

-- Authenticated users can post as themselves
CREATE POLICY "Users post chat" ON public.chat_messages
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Author or moderator can update (used for soft-delete)
CREATE POLICY "Author or moderator updates chat" ON public.chat_messages
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.streams s
    WHERE s.id = chat_messages.stream_id
      AND public.can_moderate_chat(auth.uid(), s.workspace_id)
  )
);

-- Author or moderator can hard-delete
CREATE POLICY "Author or moderator deletes chat" ON public.chat_messages
FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.streams s
    WHERE s.id = chat_messages.stream_id
      AND public.can_moderate_chat(auth.uid(), s.workspace_id)
  )
);

-- Realtime
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;