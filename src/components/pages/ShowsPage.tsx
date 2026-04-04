import { useState } from "react";
import { DashboardIcon } from "../dashboard/DashboardIcon";
import { DashboardCard, SectionHead, DashboardBtn, StatusPill, EmptyState, FieldRow, UploadZone, DashboardToggle } from "../dashboard/DashboardAtoms";
import { MOCK_SHOWS, MOCK_PRODUCTS } from "@/lib/dashboard-data";

export function ShowsPage({ onControlRoom }: { onControlRoom: (id: string) => void }) {
  const [view, setView] = useState<"list" | "create" | "analytics">("list");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  if (view === "create") return <ShowForm onBack={() => setView("list")} />;
  if (view === "analytics") return <ShowAnalytics onBack={() => setView("list")} />;

  const filtered = MOCK_SHOWS.filter(
    (s) => (filter === "all" || s.status === filter) && s.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5">
      <SectionHead title="Live Shows" sub={`${MOCK_SHOWS.length} shows total`} action={<DashboardBtn icon="plus" onClick={() => setView("create")}>Create Live Show</DashboardBtn>} />

      {/* Filters */}
      <DashboardCard className="p-3 px-4 animate-fade-up-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex gap-1">
            {["all", "live", "scheduled", "ended"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-[5px] rounded-full border text-[11px] font-display font-bold cursor-pointer tracking-[.03em] transition-colors ${
                  filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex-1 relative min-w-[160px]">
            <DashboardIcon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" strokeWidth={2} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search shows…" className="w-full pl-[30px] h-[34px] text-[12px] bg-muted border border-border rounded-md px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
      </DashboardCard>

      {/* Table */}
      <DashboardCard className="overflow-hidden animate-fade-up-2">
        {filtered.length === 0 ? (
          <EmptyState icon="shows" title="No shows found" body="Try changing your filters or create a new show" cta="Create Live Show" onCta={() => setView("create")} />
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Show", "Status", "Published", "Start Time", "Host", "Viewers", ""].map((h) => (
                  <th key={h} className="text-left px-3.5 py-2.5 text-[11px] font-display font-bold text-muted-foreground uppercase tracking-[.05em] border-b border-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((show) => (
                <tr key={show.id} className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
                  <td className="px-3.5 py-3 text-[13px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-md bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center shrink-0">
                        <DashboardIcon name="shows" size={14} className="text-primary" strokeWidth={1.6} />
                      </div>
                      <span className="font-semibold">{show.title}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-3"><StatusPill status={show.status} /></td>
                  <td className="px-3.5 py-3"><StatusPill status={show.published ? "Published" : "Draft"} /></td>
                  <td className="px-3.5 py-3 text-muted-foreground text-[12px]">{show.startTime}</td>
                  <td className="px-3.5 py-3 text-[12px]">{show.host}</td>
                  <td className="px-3.5 py-3 font-semibold">{show.viewers > 0 ? show.viewers.toLocaleString() : "—"}</td>
                  <td className="px-3.5 py-3">
                    <div className="flex gap-1">
                      {show.status === "live" && <DashboardBtn size="sm" variant="live" onClick={() => onControlRoom(show.id)}>Control Room</DashboardBtn>}
                      {show.status === "ended" && <DashboardBtn size="sm" variant="secondary" onClick={() => setView("analytics")}>Analytics</DashboardBtn>}
                      <DashboardBtn size="sm" variant="ghost" icon="edit" onClick={() => setView("create")} />
                      <DashboardBtn size="sm" variant="danger" icon="trash" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DashboardCard>
    </div>
  );
}

function ShowForm({ onBack }: { onBack: () => void }) {
  const [priv, setPriv] = useState(false);
  const [pass, setPass] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-fade-up flex items-center gap-3">
        <button onClick={onBack} className="bg-transparent border-none cursor-pointer text-muted-foreground flex"><DashboardIcon name="chev_r" size={18} strokeWidth={2} className="rotate-180" /></button>
        <h1 className="font-display font-extrabold text-[22px] tracking-tight">Create your Live Show</h1>
      </div>

      <DashboardCard className="p-[22px] animate-fade-up-1">
        <h2 className="font-display font-bold text-sm mb-[18px]">Basic Details</h2>
        <div className="flex flex-col gap-3.5">
          <FieldRow label="Title" required><input placeholder="Enter title of the show here" className="w-full bg-muted border border-border rounded-md px-3 py-2.5 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></FieldRow>
          <FieldRow label="Description"><textarea placeholder="Enter description" className="w-full bg-muted border border-border rounded-md px-3 py-2.5 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y min-h-[88px]" /></FieldRow>
          <FieldRow label="Show Time" required>
            <div className="flex gap-2 items-center">
              <input type="datetime-local" defaultValue="2026-03-22T21:03" className="flex-1 bg-muted border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary" />
              <span className="text-muted-foreground text-[13px]">→</span>
              <input type="datetime-local" defaultValue="2026-03-22T22:03" className="flex-1 bg-muted border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary" />
            </div>
          </FieldRow>
          <FieldRow label="Choose or Add a Host" required>
            <input placeholder="Type Host name & select" className="w-full bg-muted border border-border rounded-md px-3 py-2.5 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </FieldRow>
          <div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <p className="text-[13px] font-medium">Make this Show Private</p>
              <DashboardToggle on={priv} onToggle={() => setPriv((p) => !p)} />
            </div>
            <div className="flex items-center justify-between py-3">
              <p className="text-[13px] font-medium">Make this Show Password Protected</p>
              <DashboardToggle on={pass} onToggle={() => setPass((p) => !p)} />
            </div>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard className="p-[22px] animate-fade-up-2">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="font-display font-bold text-sm">Promote Products</h2>
          <DashboardBtn size="sm" variant="ghost" icon="plus">Add Products</DashboardBtn>
        </div>
        <div className="flex flex-col gap-2">
          {MOCK_PRODUCTS.slice(0, 2).map((p) => (
            <div key={p.id} className="flex items-center gap-2.5 p-2.5 px-3 border border-border rounded-md bg-card hover:border-primary/50 transition-colors">
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-base">{p.thumb}</div>
              <div className="flex-1"><p className="text-[12px] font-semibold">{p.title}</p><p className="text-[11px] text-muted-foreground">KES {p.price.toLocaleString()}</p></div>
              <DashboardBtn size="sm" variant="danger" icon="trash" />
            </div>
          ))}
        </div>
      </DashboardCard>

      <DashboardCard className="p-[22px] animate-fade-up-3">
        <h2 className="font-display font-bold text-sm mb-[18px]">Player Settings</h2>
        <FieldRow label="Banner" required help="Recommended: 1280×720px">
          <UploadZone height={100} hint="JPG, PNG — 1280×720 recommended" />
        </FieldRow>
      </DashboardCard>

      <div className="animate-fade-up-4 flex justify-end gap-2.5">
        <DashboardBtn variant="secondary" onClick={onBack}>Cancel</DashboardBtn>
        <DashboardBtn variant="ghost">Save</DashboardBtn>
        <DashboardBtn>Publish</DashboardBtn>
      </div>
    </div>
  );
}

function ShowAnalytics({ onBack }: { onBack: () => void }) {
  const metrics = [
    { label: "Total Viewers", live: 389, recorded: 142, color: "text-primary" },
    { label: "Add to Cart", live: 47, recorded: 23, color: "text-purple" },
    { label: "Engagement Rate", live: 66, recorded: 33, color: "text-success", pct: true },
    { label: "Revenue (KES)", live: 87500, recorded: 34200, color: "text-warning" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-fade-up flex items-center gap-3">
        <button onClick={onBack} className="bg-transparent border-none cursor-pointer text-muted-foreground flex"><DashboardIcon name="chev_r" size={18} strokeWidth={2} className="rotate-180" /></button>
        <div>
          <h1 className="font-display font-extrabold text-[22px] tracking-tight">Electronics Week — Analytics</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Mar 18, 2026 · Ended</p>
        </div>
      </div>

      <div className="animate-fade-up-1 grid grid-cols-2 gap-3">
        {metrics.map((m, i) => (
          <DashboardCard key={i} className="p-[18px_20px] hover:shadow-custom hover:-translate-y-px transition-all">
            <p className="text-[11px] text-muted-foreground font-semibold tracking-[.04em] mb-3">{m.label.toUpperCase()}</p>
            <div className="flex gap-4">
              {[{ label: "Live", val: m.live }, { label: "Recorded", val: m.recorded }].map((side) => (
                <div key={side.label}>
                  <p className={`font-display font-extrabold text-[22px] tracking-tight ${m.color}`}>
                    {m.pct ? `${side.val}%` : side.val.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 font-medium mt-0.5">{side.label}</p>
                </div>
              ))}
            </div>
          </DashboardCard>
        ))}
      </div>

      <DashboardCard className="p-5 animate-fade-up-2">
        <h3 className="font-display font-bold text-sm mb-4">Engagement Breakdown</h3>
        <div className="flex flex-col gap-3.5">
          {[
            { label: "Comments", live: 12, recorded: 8, color: "bg-primary" },
            { label: "Reactions", live: 28, recorded: 15, color: "bg-purple" },
            { label: "Add-to-cart", live: 47, recorded: 23, color: "bg-success" },
            { label: "Purchases", live: 6, recorded: 4, color: "bg-warning" },
          ].map((e, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <span className="text-[12px] font-semibold">{e.label}</span>
                <span className="text-[12px] text-muted-foreground">Live: {e.live} · Recorded: {e.recorded}</span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${e.color}`} style={{ width: `${(e.live / (e.live + e.recorded)) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>
    </div>
  );
}
