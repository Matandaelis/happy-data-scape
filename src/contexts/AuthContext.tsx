import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Workspace = { id: string; name: string; slug: string; tenant_id: string };
type Tenant = { id: string; slug: string; name: string; plan: string };

type Ctx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  tenant: Tenant | null;
  workspace: Workspace | null;
  workspaces: Workspace[];
  setActiveWorkspace: (w: Workspace) => void;
  signOut: () => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
};

const AuthCtx = createContext<Ctx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  const loadWorkspaces = async (uid: string) => {
    const { data: members } = await supabase
      .from("workspace_members")
      .select("workspace_id, workspaces(id, name, slug, tenant_id)")
      .eq("user_id", uid);
    const ws: Workspace[] = (members || [])
      .map((m: any) => m.workspaces)
      .filter(Boolean);
    setWorkspaces(ws);
    if (ws.length && !workspace) {
      setWorkspace(ws[0]);
      const { data: t } = await supabase.from("tenants").select("*").eq("id", ws[0].tenant_id).maybeSingle();
      if (t) setTenant(t as Tenant);
    }
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadWorkspaces(s.user.id), 0);
      } else {
        setWorkspaces([]); setWorkspace(null); setTenant(null);
      }
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s); setUser(s?.user ?? null);
      if (s?.user) loadWorkspaces(s.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setActiveWorkspace = async (w: Workspace) => {
    setWorkspace(w);
    const { data: t } = await supabase.from("tenants").select("*").eq("id", w.tenant_id).maybeSingle();
    if (t) setTenant(t as Tenant);
  };

  const signOut = async () => { await supabase.auth.signOut(); };
  const refreshWorkspaces = async () => { if (user) await loadWorkspaces(user.id); };

  return (
    <AuthCtx.Provider value={{ user, session, loading, tenant, workspace, workspaces, setActiveWorkspace, signOut, refreshWorkspaces }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
};
