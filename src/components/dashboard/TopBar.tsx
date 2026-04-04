import { useState } from "react";
import { DashboardIcon } from "./DashboardIcon";
import { DashboardBtn } from "./DashboardAtoms";

export function TopBar({ onNavigate }: { onNavigate: (k: string) => void }) {
  const [cOpen, setCOpen] = useState(false);
  const [pOpen, setPOpen] = useState(false);

  return (
    <header className="fixed top-0 left-[228px] right-0 h-14 bg-card border-b border-border flex items-center justify-between px-6 z-[90]">
      <div className="text-[11px] text-muted-foreground font-medium">
        <span className="font-display font-bold text-foreground text-[12px]">22 Mar 2026 – 05 Apr 2026</span>
        <span className="ml-1.5 bg-amber-100 text-amber-800 rounded px-[7px] py-[2px] text-[10px] font-bold tracking-[.04em]">IN TRIAL</span>
      </div>
      <div className="flex items-center gap-2">
        {/* Create dropdown */}
        <div className="relative">
          <DashboardBtn icon="plus" onClick={() => { setCOpen((p) => !p); setPOpen(false); }}>
            Create <DashboardIcon name="chev_d" size={10} strokeWidth={2.5} />
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
        {/* Playlist dropdown */}
        <div className="relative">
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
          <span className="text-[12px] font-semibold">Elis</span>
          <DashboardIcon name="chev_d" size={11} className="text-muted-foreground" strokeWidth={2} />
        </div>
      </div>
    </header>
  );
}
