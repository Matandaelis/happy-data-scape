import { ReactNode } from "react";
import { DashboardIcon } from "./DashboardIcon";
import type { IconName } from "@/lib/dashboard-icons";

/* ─── DashboardCard ─── */
export function DashboardCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-lg shadow-sm-custom ${className}`}>
      {children}
    </div>
  );
}

/* ─── SectionHead ─── */
export function SectionHead({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 animate-fade-up">
      <div>
        <h1 className="font-display font-extrabold text-[22px] tracking-tight leading-tight">{title}</h1>
        {sub && <p className="text-muted-foreground text-[13px] mt-1">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ─── EmptyState ─── */
export function EmptyState({ icon, title, body, cta, onCta }: {
  icon: IconName; title: string; body: string; cta?: string; onCta?: () => void;
}) {
  return (
    <DashboardCard className="py-[72px] px-10 flex flex-col items-center gap-4 text-center">
      <div className="w-[76px] h-[76px] rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <DashboardIcon name={icon} size={26} className="text-primary" strokeWidth={1.2} />
      </div>
      <div>
        <p className="font-display font-bold text-[15px] mb-1">{title}</p>
        <p className="text-[13px] text-muted-foreground">{body}</p>
      </div>
      {cta && (
        <DashboardBtn onClick={onCta} icon="plus">{cta}</DashboardBtn>
      )}
    </DashboardCard>
  );
}

/* ─── DashboardBtn ─── */
type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "live";
type BtnSize = "sm" | "md" | "lg";

const BTN_VARIANTS: Record<BtnVariant, string> = {
  primary: "bg-primary text-primary-foreground shadow-[0_2px_6px_hsl(var(--brand-glow))]",
  secondary: "bg-card text-foreground border border-border",
  ghost: "bg-transparent text-muted-foreground border border-border",
  danger: "bg-red-50 text-red-600 border border-red-300",
  live: "bg-live text-primary-foreground shadow-[0_2px_8px_hsl(var(--live-glow))]",
};

const BTN_SIZES: Record<BtnSize, string> = {
  sm: "px-3 py-1 text-[11px]",
  md: "px-4 py-2 text-[12px]",
  lg: "px-[22px] py-2.5 text-[13px]",
};

export function DashboardBtn({ children, variant = "primary", size = "md", icon, onClick, className = "", type = "button", disabled = false }: {
  children?: ReactNode; variant?: BtnVariant; size?: BtnSize; icon?: IconName; onClick?: () => void; className?: string; type?: "button" | "submit" | "reset"; disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 border-none cursor-pointer font-display font-bold rounded-md tracking-[.01em] whitespace-nowrap transition-all hover:opacity-90 active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]} ${className}`}
    >
      {icon && <DashboardIcon name={icon} size={13} strokeWidth={2.2} />}
      {children}
    </button>
  );
}

/* ─── StatusPill ─── */
export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    live: "bg-live/10 text-live border-live",
    scheduled: "bg-blue-50 text-primary border-blue-200",
    ended: "bg-gray-100 text-gray-500 border-gray-300",
    Published: "bg-emerald-50 text-success border-emerald-200",
    Draft: "bg-amber-50 text-warning border-amber-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-display font-bold tracking-[.03em] border ${styles[status] || ""}`}>
      {status === "live" && <span className="live-dot w-[5px] h-[5px] rounded-full bg-live block" />}
      {status}
    </span>
  );
}

/* ─── LivePill ─── */
export function LivePill() {
  return (
    <span className="inline-flex items-center gap-[5px] bg-live/10 border border-live rounded-full px-2.5 py-0.5 text-[11px] font-display font-extrabold text-live tracking-[.04em]">
      <span className="live-dot w-1.5 h-1.5 rounded-full bg-live block" />
      LIVE
    </span>
  );
}

/* ─── Toggle ─── */
export function DashboardToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-10 h-[22px] rounded-full border-none cursor-pointer transition-colors shrink-0 ${on ? "bg-primary" : "bg-gray-300"}`}
    >
      <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-card shadow-sm transition-all ${on ? "left-[21px]" : "left-[3px]"}`} />
    </button>
  );
}

/* ─── FieldRow ─── */
export function FieldRow({ label, required, help, children }: {
  label: string; required?: boolean; help?: string; children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[5px]">
      <label className="text-[12px] font-semibold flex items-center gap-1">
        {label} {required && <span className="text-live">*</span>}
        {help && <span title={help} className="text-muted-foreground/50 cursor-help text-[12px]">ⓘ</span>}
      </label>
      {children}
    </div>
  );
}

/* ─── UploadZone ─── */
export function UploadZone({ hint, height = 120 }: { hint?: string; height?: number }) {
  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:border-primary hover:bg-primary/5 text-center"
      style={{ height }}
    >
      <DashboardIcon name="upload" size={22} className="text-muted-foreground/40" strokeWidth={1.4} />
      <div>
        <p className="text-[13px] text-primary font-semibold">Click to upload</p>
        <p className="text-[11px] text-muted-foreground/50 mt-0.5">{hint || "or drag and drop"}</p>
      </div>
    </div>
  );
}

/* ─── Accordion ─── */
export function DashboardAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div>
      {items.map((item, i) => (
        <div key={i} className="border-b border-border last:border-b-0">
          <button
            className="flex items-center justify-between w-full py-3 bg-transparent border-none cursor-pointer text-[13px] font-medium text-left gap-3"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span>{item.q}</span>
            <DashboardIcon name={open === i ? "chev_d" : "chev_r"} size={13} className="text-muted-foreground" strokeWidth={2} />
          </button>
          {open === i && <div className="pb-3 text-[13px] text-muted-foreground leading-relaxed">{item.a}</div>}
        </div>
      ))}
    </div>
  );
}

import { useState } from "react";
