import { useState } from "react";
import { DashboardIcon } from "./DashboardIcon";
import type { IconName } from "@/lib/dashboard-icons";

type NavItem = {
  k: string;
  l: string;
  i: IconName;
  badge?: string;
  children?: { k: string; l: string }[];
};

const NAV: NavItem[] = [
  { k: "overview", l: "Overview", i: "home" },
  { k: "shows", l: "Live Shows", i: "shows" },
  { k: "videos", l: "Shoppable Videos", i: "videos" },
  { k: "playlists", l: "Playlists", i: "list", badge: "NEW" },
  { k: "hosts", l: "Hosts", i: "hosts" },
  {
    k: "settings", l: "Settings", i: "gear",
    children: [
      { k: "settings-store", l: "Store" },
      { k: "settings-branding", l: "Custom Branding" },
      { k: "settings-notifs", l: "Email & SMS Notifications" },
    ],
  },
  {
    k: "stream", l: "Stream Configuration", i: "stream",
    children: [{ k: "simulcast", l: "Simulcast" }],
  },
  { k: "integrations", l: "Integrations", i: "plug" },
  { k: "help", l: "Help", i: "help" },
];

export function DashboardSidebar({
  active,
  setActive,
  mobileOpen,
  onClose,
}: {
  active: string;
  setActive: (k: string) => void;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ settings: true, stream: false });
  const toggle = (k: string) => setExpanded((p) => ({ ...p, [k]: !p[k] }));
  const isGroupActive = (item: NavItem) => item.children?.some((c) => c.k === active);

  const handleNav = (k: string) => {
    setActive(k);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-[99] lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 w-[228px] bg-sidebar border-r border-sidebar-border flex flex-col z-[100] overflow-hidden transition-transform duration-200 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-[18px] h-14 flex items-center justify-between border-b border-sidebar-border shrink-0">
          <div>
            <div className="font-display font-extrabold text-base text-sidebar-active-text tracking-tight leading-none">LiveShop</div>
            <div className="text-[9px] text-sidebar-foreground uppercase tracking-[.09em] font-semibold mt-0.5">Video Commerce</div>
          </div>
          <button onClick={onClose} className="lg:hidden bg-transparent border-none cursor-pointer text-sidebar-foreground p-1">
            <DashboardIcon name="x" size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
          {NAV.map((item) => {
            const isActive = active === item.k || isGroupActive(item);
            return (
              <div key={item.k}>
                <button
                  onClick={() => (item.children ? toggle(item.k) : handleNav(item.k))}
                  className={`w-full flex items-center gap-2 px-2.5 py-[7px] rounded-md border-none cursor-pointer text-left text-[13px] relative transition-colors ${
                    isActive
                      ? "bg-sidebar-active text-sidebar-active-text font-semibold"
                      : "bg-transparent text-sidebar-foreground font-normal hover:bg-sidebar-accent"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-[18%] bottom-[18%] w-[2.5px] bg-primary rounded-r" />
                  )}
                  <DashboardIcon name={item.i} size={14} strokeWidth={1.6} className={isActive ? "text-sidebar-active-text" : ""} />
                  <span className="flex-1">{item.l}</span>
                  {item.badge && (
                    <span className="text-[9px] font-display font-extrabold tracking-[.07em] bg-warning text-card px-[5px] py-[1px] rounded">
                      {item.badge}
                    </span>
                  )}
                  {item.children && <DashboardIcon name={expanded[item.k] ? "chev_d" : "chev_r"} size={11} strokeWidth={2} />}
                </button>
                {item.children && expanded[item.k] && (
                  <div className="ml-3 pl-3 border-l border-sidebar-border mt-0.5 flex flex-col">
                    {item.children.map((c) => (
                      <button
                        key={c.k}
                        onClick={() => handleNav(c.k)}
                        className={`w-full text-left py-[5px] px-2 rounded-md border-none cursor-pointer text-[12px] transition-colors ${
                          active === c.k
                            ? "bg-sidebar-active text-sidebar-active-text font-semibold"
                            : "bg-transparent text-sidebar-foreground font-normal hover:bg-sidebar-accent"
                        }`}
                      >
                        {c.l}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3 flex flex-col gap-1.5 shrink-0">
          <button className="flex items-center gap-[7px] py-1.5 px-2 bg-transparent border-none cursor-pointer text-sidebar-foreground text-[12px] rounded-md w-full text-left hover:bg-sidebar-accent">
            <DashboardIcon name="demo" size={12} /> Book a Demo
          </button>
          <button className="flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-br from-primary to-purple text-card border-none rounded-md cursor-pointer font-display font-bold text-[12px] shadow-[0_2px_8px_hsl(var(--brand-glow))]">
            <DashboardIcon name="zap" size={12} fill="currentColor" strokeWidth={0} /> Upgrade
          </button>
          <div className="flex items-center gap-2 py-1 px-0.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center shrink-0">
              <span className="font-display font-extrabold text-[10px] text-card">EM</span>
            </div>
            <span className="text-[12px] text-sidebar-foreground font-medium flex-1 overflow-hidden text-ellipsis whitespace-nowrap">Elis Matanda</span>
            <button className="bg-transparent border-none cursor-pointer text-sidebar-foreground p-0.5">
              <DashboardIcon name="logout" size={13} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
