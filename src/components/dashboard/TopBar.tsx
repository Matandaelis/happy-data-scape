import { useState } from "react";
import { DashboardIcon } from "./DashboardIcon";
import { DashboardBtn } from "./DashboardAtoms";
import { useAuth } from "@/contexts/AuthContext";

export function TopBar({ onNavigate, onMenuToggle }: { onNavigate: (k: string) => void; onMenuToggle: () => void }) {
  const { user, workspace, workspaces, setActiveWorkspace, signOut } = useAuth();
  const [wsOpen, setWsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const initials = (user?.user_metadata?.display_name || user?.email || "U")
    .split(/[\s@]+/).map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();
  const [cOpen, setCOpen] = useState(false);
  const [pOpen, setPOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 lg:left-[228px] right-0 h-14 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 z-[90]">
      <div className="flex items-center gap-3">
        {/* Hamburger - mobile only */}
        <button onClick={onMenuToggle} className="lg:hidden bg-transparent border-none cursor-pointer text-foreground p-1">
          <DashboardIcon name="list" size={20} strokeWidth={2} />
        </button>
        <div className="text-[11px] text-muted-foreground font-medium hidden sm:block">
          <span className="font-display font-bold text-foreground text-[12px]">22 Mar 2026 – 05 Apr 2026</span>
          <span className="ml-1.5 bg-amber-100 text-amber-800 rounded px-[7px] py-[2px] text-[10px] font-bold tracking-[.04em]">IN TRIAL</span>
        </div>
        {/* Mobile: just logo text */}
        <span className="sm:hidden font-display font-extrabold text-sm tracking-tight">LiveShop</span>
      </div>
      <div className="flex items-center gap-2">
        {/* Create dropdown */}
        <div className="relative">
          <DashboardBtn icon="plus" onClick={() => { setCOpen((p) => !p); setPOpen(false); }}>
            <span className="hidden sm:inline">Create</span> <DashboardIcon name="chev_d" size={10} strokeWidth={2.5} />
          </DashboardBtn>
          {cOpen && (
            <div className="absolute top-[calc(100%+6px)] right-0 bg-card border border-border rounded-lg shadow-lg-custom min-w-[180px] overflow-hidden z-[200]">
              {["Live Show", "Shoppable Video"].map((l, i) => (
                <button
                  key={l}
                  onClick={() => { setCOpen(false); onNavigate(i === 0 ? "shows" : "videos"); }}
                  className="block w-full text-left px-4 py-2.5 bg-transparent border-none cursor-pointer text-[13px] text-foreground hover:bg-muted transition-colors border-b border-border last:border-b-0"
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Playlist dropdown - hidden on small mobile */}
        <div className="relative hidden sm:block">
          <DashboardBtn variant="secondary" icon="plus" onClick={() => { setPOpen((p) => !p); setCOpen(false); }}>
            Playlist <DashboardIcon name="chev_d" size={10} strokeWidth={2.5} />
          </DashboardBtn>
          {pOpen && (
            <div className="absolute top-[calc(100%+6px)] right-0 bg-card border border-border rounded-lg shadow-lg-custom min-w-[180px] overflow-hidden z-[200]">
              {["Create Playlist", "Manage Playlists"].map((l) => (
                <button
                  key={l}
                  onClick={() => { setPOpen(false); onNavigate("playlists"); }}
                  className="block w-full text-left px-4 py-2.5 bg-transparent border-none cursor-pointer text-[13px] text-foreground hover:bg-muted transition-colors border-b border-border last:border-b-0"
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* User */}
        <div className="flex items-center gap-[7px] py-[5px] px-2.5 border border-border rounded-md cursor-pointer bg-card">
          <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center">
            <span className="font-display font-extrabold text-[9px] text-card">EM</span>
          </div>
          <span className="text-[12px] font-semibold hidden sm:inline">Elis</span>
          <DashboardIcon name="chev_d" size={11} className="text-muted-foreground hidden sm:block" strokeWidth={2} />
        </div>
      </div>
    </header>
  );
}
