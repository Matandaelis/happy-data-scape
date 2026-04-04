import { DashboardIcon } from "../dashboard/DashboardIcon";
import { DashboardCard, SectionHead, DashboardBtn, LivePill } from "../dashboard/DashboardAtoms";
import { MOCK_SHOWS } from "@/lib/dashboard-data";

export function OverviewPage({ onNavigate }: { onNavigate: (k: string) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="animate-fade-up">
        <h1 className="font-display font-extrabold text-[22px] tracking-tight">Welcome Elis Matanda!</h1>
        <p className="text-muted-foreground text-[13px] mt-1">
          22 Mar 2026 – 05 Apr 2026 &nbsp;·&nbsp;
          <span className="text-amber-800 font-bold bg-amber-100 rounded px-1.5 py-[1px] text-[11px]">IN TRIAL</span>
          &nbsp;&nbsp;
          <span className="inline-flex gap-3 ml-1">
            <span className="inline-flex items-center gap-1 text-[12px]"><span className="w-[7px] h-[7px] rounded-full bg-primary inline-block" />Shows</span>
            <span className="inline-flex items-center gap-1 text-[12px]"><span className="w-[7px] h-[7px] rounded-full bg-purple inline-block" />Shoppable Videos</span>
          </span>
        </p>
      </div>

      {/* Stats */}
      <div className="animate-fade-up-1 grid grid-cols-2 gap-3">
        {[
          { label: "Total Created", icon: "shows" as const, left: "0/∞", right: "0/∞", c: "text-live" },
          { label: "Total Duration", icon: "signal" as const, left: "0s", right: "0s", c: "text-primary" },
          { label: "Total Unique Views", icon: "eye" as const, left: "0", right: "0", c: "text-purple" },
          { label: "Overage", icon: "zap" as const, left: "0", right: "0", c: "text-success" },
        ].map((s, i) => (
          <DashboardCard key={i} className="p-[18px_20px] relative overflow-hidden hover:shadow-custom hover:-translate-y-px transition-all">
            <div className="absolute top-3.5 right-3.5 w-[30px] h-[30px] rounded-full bg-current/10 flex items-center justify-center">
              <DashboardIcon name={s.icon} size={13} className={s.c} strokeWidth={1.8} />
            </div>
            <p className="text-[11px] text-muted-foreground font-semibold tracking-[.04em] mb-2.5">{s.label}</p>
            <div className="flex gap-4">
              {[{ v: s.left, t: "Shows" }, { v: s.right, t: "Shoppable Videos" }].map((side, j) => (
                <div key={j}>
                  <p className={`font-display font-extrabold text-[20px] tracking-tight leading-none ${s.c}`}>{side.v}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-[3px] font-medium">{side.t}</p>
                </div>
              ))}
            </div>
          </DashboardCard>
        ))}
      </div>

      {/* How to Videos */}
      <DashboardCard className="p-5 animate-fade-up-2">
        <h2 className="font-display font-bold text-sm mb-3.5">How to Videos</h2>
        <div className="grid grid-cols-2 gap-3">
          {["How to Create a Live Show?", "How to Create a Shoppable Video?"].map((v, i) => (
            <div key={i} className="bg-sidebar rounded-md aspect-video flex flex-col items-center justify-center gap-2 cursor-pointer p-4 border border-sidebar-border">
              <div className="w-9 h-9 rounded-full bg-sidebar-accent border border-sidebar-border flex items-center justify-center">
                <DashboardIcon name="shows" size={15} className="text-sidebar-foreground" strokeWidth={1.5} />
              </div>
              <p className="font-display font-bold text-[11px] text-sidebar-foreground text-center leading-tight">{v}</p>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* Upcoming Shows empty */}
      <DashboardCard className="overflow-hidden animate-fade-up-3">
        <div className="flex border-b border-border">
          {["Upcoming Shows", "Recent Videos"].map((t, i) => (
            <button key={t} className={`flex-1 py-2.5 px-4 font-display font-bold text-[12px] border-b-2 bg-transparent border-none cursor-pointer transition-colors ${i === 0 ? "text-primary border-b-primary" : "text-muted-foreground border-b-transparent"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="py-12 px-8 flex flex-col items-center gap-4 text-center">
          <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
            <DashboardIcon name="shows" size={26} className="text-primary" strokeWidth={1.2} />
          </div>
          <div>
            <p className="font-display font-bold text-sm">No Shows Available</p>
            <p className="text-[12px] text-muted-foreground mt-1">Create your first live show to get started</p>
          </div>
          <DashboardBtn icon="plus" onClick={() => onNavigate("shows")}>Create Test Show</DashboardBtn>
        </div>
      </DashboardCard>

      {/* API Keys */}
      <DashboardCard className="p-5 animate-fade-up-4">
        <div className="flex items-center gap-3 p-3.5 px-4 bg-muted rounded-md border border-border mb-4">
          <div className="w-[34px] h-[34px] bg-[#7f54b3] rounded-[7px] flex items-center justify-center shrink-0">
            <DashboardIcon name="store" size={15} className="text-card" strokeWidth={1.6} />
          </div>
          <div className="flex-1">
            <p className="font-display font-bold text-[13px]">WooCommerce</p>
            <p className="text-[12px] text-muted-foreground">Learn how to integrate Live Shopping into your Website</p>
          </div>
          <button onClick={() => onNavigate("integrations")} className="text-[12px] text-primary font-semibold bg-transparent border-none cursor-pointer flex items-center gap-[3px] shrink-0">
            Learn More <DashboardIcon name="chev_r" size={12} strokeWidth={2} />
          </button>
        </div>

        <h2 className="font-display font-bold text-sm mb-3.5">Platform API Keys</h2>
        {[
          { label: "Public Key", value: "LpOSg8KD9ckhGfWY" },
          { label: "Private Key", value: "sk_live_a1b2c3d4e5f6••••" },
        ].map((k, i) => (
          <div key={i} className="flex items-center gap-3 p-3 px-3.5 bg-muted rounded-md border border-border mb-2 last:mb-0">
            <div className="w-[30px] h-[30px] rounded-full bg-primary/10 border border-primary flex items-center justify-center shrink-0">
              <DashboardIcon name="lock" size={12} className="text-primary" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground font-bold tracking-[.05em] uppercase mb-0.5">{k.label}</p>
              <p className="font-mono text-[12px] font-bold tracking-[.02em]">{k.value}</p>
            </div>
          </div>
        ))}
      </DashboardCard>
    </div>
  );
}
