
-- App role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'workspace_admin', 'streamer', 'moderator', 'analyst', 'creator', 'viewer');

-- Plan enum
CREATE TYPE public.tenant_plan AS ENUM ('starter', 'pro', 'enterprise');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Tenants
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  plan public.tenant_plan NOT NULL DEFAULT 'starter',
  branding JSONB NOT NULL DEFAULT '{}'::jsonb,
  media_mtx_user TEXT,
  media_mtx_pass TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Workspaces
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Workspace members (roles live here)
CREATE TABLE public.workspace_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id, role)
);
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Security definer: has workspace role
CREATE OR REPLACE FUNCTION public.has_workspace_role(_user_id UUID, _workspace_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id AND role = _role
  )
$$;

-- Security definer: is workspace member (any role)
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  )
$$;

-- Security definer: is tenant owner
CREATE OR REPLACE FUNCTION public.is_tenant_owner(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.tenants WHERE id = _tenant_id AND owner_id = _user_id)
$$;

-- Tenants RLS
CREATE POLICY "Owners view their tenants" ON public.tenants
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Users create tenants" ON public.tenants
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners update their tenants" ON public.tenants
  FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owners delete their tenants" ON public.tenants
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- Workspaces RLS
CREATE POLICY "Members view workspaces" ON public.workspaces
  FOR SELECT TO authenticated USING (
    public.is_workspace_member(auth.uid(), id) OR public.is_tenant_owner(auth.uid(), tenant_id)
  );
CREATE POLICY "Tenant owner creates workspaces" ON public.workspaces
  FOR INSERT TO authenticated WITH CHECK (public.is_tenant_owner(auth.uid(), tenant_id));
CREATE POLICY "Workspace admins update workspaces" ON public.workspaces
  FOR UPDATE TO authenticated USING (
    public.has_workspace_role(auth.uid(), id, 'workspace_admin') OR public.is_tenant_owner(auth.uid(), tenant_id)
  );
CREATE POLICY "Tenant owner deletes workspaces" ON public.workspaces
  FOR DELETE TO authenticated USING (public.is_tenant_owner(auth.uid(), tenant_id));

-- Workspace members RLS
CREATE POLICY "Members view workspace memberships" ON public.workspace_members
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR public.is_workspace_member(auth.uid(), workspace_id)
  );
CREATE POLICY "Workspace admins manage members" ON public.workspace_members
  FOR INSERT TO authenticated WITH CHECK (
    public.has_workspace_role(auth.uid(), workspace_id, 'workspace_admin')
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_id AND public.is_tenant_owner(auth.uid(), w.tenant_id)
    )
  );
CREATE POLICY "Workspace admins update members" ON public.workspace_members
  FOR UPDATE TO authenticated USING (
    public.has_workspace_role(auth.uid(), workspace_id, 'workspace_admin')
    OR EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND public.is_tenant_owner(auth.uid(), w.tenant_id))
  );
CREATE POLICY "Workspace admins delete members" ON public.workspace_members
  FOR DELETE TO authenticated USING (
    public.has_workspace_role(auth.uid(), workspace_id, 'workspace_admin')
    OR EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND public.is_tenant_owner(auth.uid(), w.tenant_id))
  );

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_workspaces_updated BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Slugify helper
CREATE OR REPLACE FUNCTION public.slugify(input TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT regexp_replace(lower(coalesce(input,'')), '[^a-z0-9]+', '-', 'g')
$$;

-- Auto provision: profile + default tenant + workspace + admin membership on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_display TEXT;
  v_base TEXT;
  v_slug TEXT;
  v_tenant_id UUID;
  v_workspace_id UUID;
  v_i INT := 0;
BEGIN
  v_display := COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, v_display);

  v_base := COALESCE(NULLIF(public.slugify(v_display), ''), 'workspace');
  v_slug := v_base;
  WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = v_slug) LOOP
    v_i := v_i + 1;
    v_slug := v_base || '-' || v_i::text;
  END LOOP;

  INSERT INTO public.tenants (slug, name, owner_id)
  VALUES (v_slug, COALESCE(v_display,'My Tenant') || '''s Tenant', NEW.id)
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.workspaces (tenant_id, name, slug)
  VALUES (v_tenant_id, 'Default', 'default')
  RETURNING id INTO v_workspace_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace_id, NEW.id, 'workspace_admin');

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
