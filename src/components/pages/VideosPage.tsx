import { useState } from "react";
import { DashboardIcon } from "../dashboard/DashboardIcon";
import { DashboardCard, SectionHead, DashboardBtn, StatusPill, EmptyState, FieldRow, UploadZone } from "../dashboard/DashboardAtoms";
import { MOCK_VIDEOS, MOCK_PRODUCTS } from "@/lib/dashboard-data";

export function VideosPage() {
  const [view, setView] = useState<"list" | "create">("list");
  const [search, setSearch] = useState("");

  if (view === "create") return (
    <div className="flex flex-col gap-5">
      <div className="animate-fade-up flex items-center gap-3">
        <button onClick={() => setView("list")} className="bg-transparent border-none cursor-pointer text-muted-foreground flex"><DashboardIcon name="chev_r" size={18} strokeWidth={2} className="rotate-180" /></button>
        <h1 className="font-display font-extrabold text-[22px] tracking-tight">Create your Shoppable Video</h1>
      </div>
      <DashboardCard className="p-[22px] animate-fade-up-1">
        <h2 className="font-display font-bold text-sm mb-[18px]">Basic Details</h2>
        <div className="flex flex-col gap-3.5">
          <FieldRow label="Title" required><input placeholder="Enter title for your shoppable video" className="w-full bg-muted border border-border rounded-md px-3 py-2.5 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></FieldRow>
          <FieldRow label="Thumbnail Image" required help="Recommended: 9:16 portrait"><UploadZone height={130} hint="JPG, PNG — 9:16 portrait recommended" /></FieldRow>
        </div>
      </DashboardCard>
      <DashboardCard className="p-[22px] animate-fade-up-2">
        <FieldRow label="Upload Video" required help="MP4, MOV — max 10 minutes">
          <UploadZone height={180} hint="MP4, MOV accepted" />
        </FieldRow>
      </DashboardCard>
      <DashboardCard className="p-[22px] animate-fade-up-3">
        <div className="flex justify-between mb-3.5">
          <h2 className="font-display font-bold text-sm">Promote Products</h2>
          <DashboardBtn size="sm" variant="ghost" icon="plus">Add Products</DashboardBtn>
        </div>
        <div className="flex flex-col gap-2">
          {MOCK_PRODUCTS.slice(0, 2).map((p) => (
            <div key={p.id} className="flex items-center gap-2.5 p-2.5 px-3 border border-border rounded-md bg-card">
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-base">{p.thumb}</div>
              <div className="flex-1"><p className="text-[12px] font-semibold">{p.title}</p><p className="text-[11px] text-muted-foreground">KES {p.price.toLocaleString()}</p></div>
              <DashboardBtn size="sm" variant="danger" icon="trash" />
            </div>
          ))}
        </div>
      </DashboardCard>
      <div className="animate-fade-up-4 flex justify-end gap-2.5">
        <DashboardBtn variant="secondary" onClick={() => setView("list")}>Cancel</DashboardBtn>
        <DashboardBtn variant="ghost">Save</DashboardBtn>
        <DashboardBtn>Publish</DashboardBtn>
      </div>
    </div>
  );

  const filtered = MOCK_VIDEOS.filter((v) => v.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-5">
      <SectionHead title="Shoppable Videos" sub={`${MOCK_VIDEOS.length} videos`} action={<DashboardBtn icon="plus" onClick={() => setView("create")}>Create Shoppable Video</DashboardBtn>} />
      <DashboardCard className="p-3 px-4 animate-fade-up-1">
        <div className="flex gap-2.5">
          <div className="flex-1 relative">
            <DashboardIcon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" strokeWidth={2} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search videos…" className="w-full pl-[30px] h-[34px] text-[12px] bg-muted border border-border rounded-md px-3 py-2 outline-none focus:border-primary" />
          </div>
        </div>
      </DashboardCard>
      <DashboardCard className="overflow-hidden animate-fade-up-2">
        {filtered.length === 0 ? (
          <EmptyState icon="videos" title="No videos found" body="Create your first shoppable video" cta="Create Shoppable Video" onCta={() => setView("create")} />
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>{["Video", "Status", "Views", "Duration", ""].map((h) => <th key={h} className="text-left px-3.5 py-2.5 text-[11px] font-display font-bold text-muted-foreground uppercase tracking-[.05em] border-b border-border">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-11 h-11 rounded-md bg-muted flex items-center justify-center text-xl shrink-0">{v.thumb}</div>
                      <span className="font-semibold text-[13px]">{v.title}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-3"><StatusPill status={v.published ? "Published" : "Draft"} /></td>
                  <td className="px-3.5 py-3 font-semibold">{v.views > 0 ? v.views.toLocaleString() : "—"}</td>
                  <td className="px-3.5 py-3 text-muted-foreground font-mono text-[12px]">{v.duration}</td>
                  <td className="px-3.5 py-3">
                    <div className="flex gap-1">
                      <DashboardBtn size="sm" variant="ghost" icon="edit" />
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
