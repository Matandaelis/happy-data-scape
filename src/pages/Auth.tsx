import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { DashboardBtn } from "@/components/dashboard/DashboardAtoms";

const schema = z.object({
  email: z.string().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
  displayName: z.string().trim().min(1).max(80).optional(),
});

export default function Auth() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && user) nav("/", { replace: true }); }, [user, loading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, displayName: mode === "signup" ? displayName : undefined });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: displayName },
          },
        });
        if (error) throw error;
        toast.success("Account created. You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally { setBusy(false); }
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[400px] bg-card border border-border rounded-xl p-7 shadow-lg-custom">
        <div className="mb-6 text-center">
          <h1 className="font-display font-extrabold text-2xl tracking-tight">LiveShop</h1>
          <p className="text-[12px] text-muted-foreground mt-1">{mode === "signin" ? "Sign in to your account" : "Create your account"}</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <input
              value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display name"
              className="bg-muted border border-border rounded-md px-3 py-2.5 text-[13px] outline-none focus:border-primary"
            />
          )}
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com" autoComplete="email"
            className="bg-muted border border-border rounded-md px-3 py-2.5 text-[13px] outline-none focus:border-primary"
          />
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Password" autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="bg-muted border border-border rounded-md px-3 py-2.5 text-[13px] outline-none focus:border-primary"
          />
          <DashboardBtn type="submit" disabled={busy}>{busy ? "Please wait…" : (mode === "signin" ? "Sign In" : "Create Account")}</DashboardBtn>
        </form>

        <div className="my-4 flex items-center gap-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button onClick={google} className="w-full bg-card border border-border rounded-md py-2.5 text-[13px] font-medium hover:bg-muted transition-colors">
          Continue with Google
        </button>

        <p className="text-center text-[12px] text-muted-foreground mt-5">
          {mode === "signin" ? "No account?" : "Already have one?"}{" "}
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-primary font-semibold bg-transparent border-none cursor-pointer">
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
        <p className="text-center text-[11px] text-muted-foreground mt-3">
          <Link to="/" className="hover:underline">Back to home</Link>
        </p>
      </div>
    </div>
  );
}
