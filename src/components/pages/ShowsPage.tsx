import { useEffect, useState, useCallback } from "react";
import { DashboardIcon } from "../dashboard/DashboardIcon";
import { DashboardCard, SectionHead, DashboardBtn, StatusPill, EmptyState, FieldRow } from "../dashboard/DashboardAtoms";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Stream = Database["public"]["Tables"]["streams"]["Row"];
type StreamStatus = Database["public"]["Enums"]["stream_status"];

export function ShowsPage({ onControlRoom }: { onControlRoom: (id: string) => void }) {
  const { workspace } = useAuth();
  const [view, setView] = useState<"list" | "form">("list");
  const [editing, setEditing] = useState<Stream | null>(null);
  const [filter, setFilter] = useState<"all" | StreamStatus>("all");
  const [search, setSearch] = useState("");
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStreams = useCallback(async () => {
    if (!workspace) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("streams")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setStreams(data || []);
    setLoading(false);
  }, [workspace]);

  useEffect(() => { loadStreams(); }, [loadStreams]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("streams").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Show deleted");
    setStreams((s) => s.filter((x) => x.id !== id));
  };

  if (view === "form") {
    return (
      <ShowForm
        workspaceId={workspace?.id}
        existing={editing}
        onBack={() => { setView("list"); setEditing(null); }}
        onSaved={() => { setView("list"); setEditing(null); loadStreams(); }}
      />
    );
  }

  if (!workspace) {
    return <DashboardCard className="p-10 text-center text-muted-foreground text-sm">Select a workspace to view shows.</DashboardCard>;
  }

  const filtered = streams.filter(
    (s) => (filter === "all" || s.status === filter) && s.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5">
      <SectionHead
        title="Live Shows"
        sub={loading ? "Loading…" : `${streams.length} show${streams.length === 1 ? "" : "s"} total`}
        action={<DashboardBtn icon="plus" onClick={() => { setEditing(null); setView("form"); }}>Create Live Show</DashboardBtn>}
      />

      <DashboardCard className="p-3 px-4 animate-fade-up-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex gap-1">
            {(["all", "live", "scheduled", "ended"] as const).map((f) => (
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

      <DashboardCard className="overflow-hidden animate-fade-up-2">
        {loading ? (
          <div className="py-16 text-center text-muted-foreground text-sm">Loading shows…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="shows"
            title={streams.length === 0 ? "No shows yet" : "No shows match"}
            body={streams.length === 0 ? "Create your first live show to get started" : "Try changing your filters"}
            cta="Create Live Show"
            onCta={() => { setEditing(null); setView("form"); }}
          />
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Show", "Status", "Start Time", "Viewers", ""].map((h) => (
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
                      <div>
                        <p className="font-semibold">{show.title}</p>
                        {show.description && <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-[260px]">{show.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3.5 py-3"><StatusPill status={show.status} /></td>
                  <td className="px-3.5 py-3 text-muted-foreground text-[12px]">
                    {show.start_time ? new Date(show.start_time).toLocaleString() : "—"}
                  </td>
                  <td className="px-3.5 py-3 font-semibold">{show.viewer_count > 0 ? show.viewer_count.toLocaleString() : "—"}</td>
                  <td className="px-3.5 py-3">
                    <div className="flex gap-1 justify-end">
                      {show.status === "live" && <DashboardBtn size="sm" variant="live" onClick={() => onControlRoom(show.id)}>Control Room</DashboardBtn>}
                      {show.status === "scheduled" && <DashboardBtn size="sm" variant="primary" onClick={() => onControlRoom(show.id)}>Open</DashboardBtn>}
                      <DashboardBtn size="sm" variant="ghost" icon="edit" onClick={() => { setEditing(show); setView("form"); }} />
                      <DashboardBtn size="sm" variant="danger" icon="trash" onClick={() => handleDelete(show.id, show.title)} />
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

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ShowForm({ workspaceId, existing, onBack, onSaved }: {
  workspaceId: string | undefined;
  existing: Stream | null;
  onBack: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [startTime, setStartTime] = useState(toLocalInput(existing?.start_time ?? null));
  const [endTime, setEndTime] = useState(toLocalInput(existing?.end_time ?? null));
  const [status, setStatus] = useState<StreamStatus>(existing?.status ?? "scheduled");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!workspaceId || !user) return toast.error("No active workspace");
    if (!title.trim()) return toast.error("Title is required");
    setSaving(true);
    try {
      if (existing) {
        const { error } = await supabase
          .from("streams")
          .update({
            title: title.trim(),
            description: description.trim() || null,
            start_time: startTime ? new Date(startTime).toISOString() : null,
            end_time: endTime ? new Date(endTime).toISOString() : null,
            status,
          })
          .eq("id", existing.id);
        if (error) throw error;
        toast.success("Show updated");
      } else {
        const path = `live/${workspaceId}/${crypto.randomUUID()}`;
        const { error } = await supabase.from("streams").insert({
          workspace_id: workspaceId,
          created_by: user.id,
          title: title.trim(),
          description: description.trim() || null,
          start_time: startTime ? new Date(startTime).toISOString() : null,
          end_time: endTime ? new Date(endTime).toISOString() : null,
          status,
          media_mtx_path: path,
        });
        if (error) throw error;
        toast.success("Show created");
      }
      onSaved();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-fade-up flex items-center gap-3">
        <button onClick={onBack} className="bg-transparent border-none cursor-pointer text-muted-foreground flex">
          <DashboardIcon name="chev_r" size={18} strokeWidth={2} className="rotate-180" />
        </button>
        <h1 className="font-display font-extrabold text-[22px] tracking-tight">
          {existing ? "Edit Live Show" : "Create your Live Show"}
        </h1>
      </div>

      <DashboardCard className="p-[22px] animate-fade-up-1">
        <h2 className="font-display font-bold text-sm mb-[18px]">Basic Details</h2>
        <div className="flex flex-col gap-3.5">
          <FieldRow label="Title" required>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title of the show here"
              className="w-full bg-muted border border-border rounded-md px-3 py-2.5 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </FieldRow>
          <FieldRow label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              className="w-full bg-muted border border-border rounded-md px-3 py-2.5 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y min-h-[88px]"
            />
          </FieldRow>
          <FieldRow label="Show Time">
            <div className="flex gap-2 items-center">
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="flex-1 bg-muted border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary"
              />
              <span className="text-muted-foreground text-[13px]">→</span>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="flex-1 bg-muted border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary"
              />
            </div>
          </FieldRow>
          <FieldRow label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StreamStatus)}
              className="w-full bg-muted border border-border rounded-md px-3 py-2.5 text-[13px] outline-none focus:border-primary"
            >
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="ended">Ended</option>
              <option value="recording">Recording</option>
            </select>
          </FieldRow>
        </div>
      </DashboardCard>

      <div className="animate-fade-up-2 flex justify-end gap-2.5">
        <DashboardBtn variant="secondary" onClick={onBack} disabled={saving}>Cancel</DashboardBtn>
        <DashboardBtn onClick={save} disabled={saving}>{saving ? "Saving…" : existing ? "Save Changes" : "Create Show"}</DashboardBtn>
      </div>
    </div>
  );
}
