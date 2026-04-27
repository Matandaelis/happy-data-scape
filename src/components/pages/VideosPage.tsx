import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { DashboardIcon } from "../dashboard/DashboardIcon";
import { DashboardCard, SectionHead, DashboardBtn, StatusPill, EmptyState, FieldRow } from "../dashboard/DashboardAtoms";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ShoppableVideo = {
  id: string;
  workspace_id: string;
  created_by: string;
  title: string;
  description: string | null;
  original_url: string;
  processed_url: string | null;
  thumbnail_url: string | null;
  product_markers: unknown[];
  source_platform: string;
  status: "draft" | "published";
  duration_seconds: number;
  views: number;
  created_at: string;
};

type FormState = {
  title: string;
  description: string;
  sourcePlatform: string;
  status: "draft" | "published";
  productMarkers: string;
  videoFile: File | null;
  thumbnailFile: File | null;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  sourcePlatform: "upload",
  status: "draft",
  productMarkers: "[]",
  videoFile: null,
  thumbnailFile: null,
};

const db = supabase as any;

const publicStatus = (status: string) => status === "published" ? "Published" : "Draft";
const formatDuration = (seconds: number) => seconds > 0 ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` : "—";

function FileDrop({ label, file, accept, onChange }: { label: string; file: File | null; accept: string; onChange: (file: File | null) => void }) {
  return (
    <label className="border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:border-primary hover:bg-primary/5 text-center min-h-[130px] px-4">
      <DashboardIcon name="upload" size={22} className="text-muted-foreground/50" strokeWidth={1.4} />
      <div>
        <p className="text-[13px] text-primary font-semibold">{file ? file.name : label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{accept}</p>
      </div>
      <input type="file" accept={accept} className="hidden" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    </label>
  );
}

export function VideosPage() {
  const { workspace, user } = useAuth();
  const [view, setView] = useState<"list" | "create">("list");
  const [search, setSearch] = useState("");
  const [videos, setVideos] = useState<ShoppableVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ShoppableVideo | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [signedThumbs, setSignedThumbs] = useState<Record<string, string>>({});

  const filtered = useMemo(() => videos.filter((v) => v.title.toLowerCase().includes(search.toLowerCase())), [videos, search]);

  const loadVideos = async () => {
    if (!workspace) return;
    setLoading(true);
    const { data, error } = await db
      .from("shoppable_videos")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setVideos((data ?? []) as ShoppableVideo[]);
    setLoading(false);
  };

  useEffect(() => { loadVideos(); }, [workspace?.id]);

  useEffect(() => {
    const loadThumbs = async () => {
      const entries = await Promise.all(videos.map(async (v) => {
        if (!v.thumbnail_url) return null;
        const { data } = await supabase.storage.from("shoppable-videos").createSignedUrl(v.thumbnail_url, 60 * 60);
        return data?.signedUrl ? [v.id, data.signedUrl] as const : null;
      }));
      setSignedThumbs(Object.fromEntries(entries.filter(Boolean) as [string, string][]));
    };
    loadThumbs();
  }, [videos]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setView("create");
  };

  const openEdit = (video: ShoppableVideo) => {
    setEditing(video);
    setForm({
      title: video.title,
      description: video.description ?? "",
      sourcePlatform: video.source_platform,
      status: video.status,
      productMarkers: JSON.stringify(video.product_markers ?? [], null, 2),
      videoFile: null,
      thumbnailFile: null,
    });
    setView("create");
  };

  const uploadFile = async (file: File, folder: "videos" | "thumbs") => {
    if (!workspace) throw new Error("No active workspace");
    const ext = file.name.split(".").pop() || "bin";
    const path = `${workspace.id}/${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("shoppable-videos").upload(path, file, { upsert: false });
    if (error) throw error;
    return path;
  };

  const saveVideo = async (event: FormEvent) => {
    event.preventDefault();
    if (!workspace || !user) return;
    if (!editing && !form.videoFile) {
      toast.error("Upload a video file first");
      return;
    }
    setSaving(true);
    try {
      const markers = JSON.parse(form.productMarkers || "[]");
      if (!Array.isArray(markers)) throw new Error("Product markers must be a JSON array");
      const originalPath = form.videoFile ? await uploadFile(form.videoFile, "videos") : editing?.original_url;
      const thumbPath = form.thumbnailFile ? await uploadFile(form.thumbnailFile, "thumbs") : editing?.thumbnail_url;
      const payload = {
        workspace_id: workspace.id,
        created_by: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        original_url: originalPath,
        processed_url: originalPath,
        thumbnail_url: thumbPath ?? null,
        source_platform: form.sourcePlatform.trim() || "upload",
        status: form.status,
        product_markers: markers,
      };
      const query = editing
        ? db.from("shoppable_videos").update(payload).eq("id", editing.id)
        : db.from("shoppable_videos").insert(payload);
      const { error } = await query;
      if (error) throw error;
      toast.success(editing ? "Video updated" : "Video created");
      setView("list");
      await loadVideos();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save video");
    } finally {
      setSaving(false);
    }
  };

  const deleteVideo = async (video: ShoppableVideo) => {
    if (!confirm(`Delete ${video.title}?`)) return;
    const { error } = await db.from("shoppable_videos").delete().eq("id", video.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Video deleted");
      await loadVideos();
    }
  };

  const updateField = (key: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  if (view === "create") return (
    <form onSubmit={saveVideo} className="flex flex-col gap-5">
      <div className="animate-fade-up flex items-center gap-3">
        <button type="button" onClick={() => setView("list")} className="bg-transparent border-none cursor-pointer text-muted-foreground flex"><DashboardIcon name="chev_r" size={18} strokeWidth={2} className="rotate-180" /></button>
        <h1 className="font-display font-extrabold text-[22px] tracking-tight">{editing ? "Edit Shoppable Video" : "Create Shoppable Video"}</h1>
      </div>
      <DashboardCard className="p-[22px] animate-fade-up-1">
        <h2 className="font-display font-bold text-sm mb-[18px]">Basic Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <FieldRow label="Title" required><input required value={form.title} onChange={updateField("title")} placeholder="Enter title" className="w-full bg-muted border border-border rounded-md px-3 py-2.5 text-[13px] outline-none focus:border-primary" /></FieldRow>
          <FieldRow label="Source Platform"><input value={form.sourcePlatform} onChange={updateField("sourcePlatform")} className="w-full bg-muted border border-border rounded-md px-3 py-2.5 text-[13px] outline-none focus:border-primary" /></FieldRow>
          <FieldRow label="Status"><select value={form.status} onChange={updateField("status")} className="w-full bg-muted border border-border rounded-md px-3 py-2.5 text-[13px] outline-none focus:border-primary"><option value="draft">Draft</option><option value="published">Published</option></select></FieldRow>
          <FieldRow label="Description"><input value={form.description} onChange={updateField("description")} placeholder="Optional description" className="w-full bg-muted border border-border rounded-md px-3 py-2.5 text-[13px] outline-none focus:border-primary" /></FieldRow>
        </div>
      </DashboardCard>
      <DashboardCard className="p-[22px] animate-fade-up-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <FieldRow label="Upload Video" required={!editing} help="MP4, MOV — max 10 minutes"><FileDrop label={editing ? "Replace video" : "Click to upload video"} file={form.videoFile} accept="video/mp4,video/quicktime" onChange={(file) => setForm((p) => ({ ...p, videoFile: file }))} /></FieldRow>
          <FieldRow label="Thumbnail Image" help="Recommended: 9:16 portrait"><FileDrop label={editing ? "Replace thumbnail" : "Click to upload thumbnail"} file={form.thumbnailFile} accept="image/jpeg,image/png,image/webp" onChange={(file) => setForm((p) => ({ ...p, thumbnailFile: file }))} /></FieldRow>
        </div>
      </DashboardCard>
      <DashboardCard className="p-[22px] animate-fade-up-3">
        <FieldRow label="Product Markers JSON" help="Array of time-based product markers">
          <textarea value={form.productMarkers} onChange={updateField("productMarkers")} rows={7} className="w-full bg-muted border border-border rounded-md px-3 py-2.5 text-[12px] font-mono outline-none focus:border-primary" />
        </FieldRow>
      </DashboardCard>
      <div className="animate-fade-up-4 flex justify-end gap-2.5">
        <DashboardBtn variant="secondary" onClick={() => setView("list")}>Cancel</DashboardBtn>
        <DashboardBtn type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save Changes" : "Create Video"}</DashboardBtn>
      </div>
    </form>
  );

  return (
    <div className="flex flex-col gap-5">
      <SectionHead title="Shoppable Videos" sub={loading ? "Loading videos…" : `${videos.length} videos`} action={<DashboardBtn icon="plus" onClick={openCreate}>Create Shoppable Video</DashboardBtn>} />
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
          <EmptyState icon="videos" title={loading ? "Loading videos" : "No videos found"} body="Create your first shoppable video" cta="Create Shoppable Video" onCta={openCreate} />
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>{["Video", "Status", "Views", "Duration", ""].map((h) => <th key={h} className="text-left px-3.5 py-2.5 text-[11px] font-display font-bold text-muted-foreground uppercase tracking-[.05em] border-b border-border">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
                  <td className="px-3.5 py-3"><div className="flex items-center gap-2.5"><div className="w-11 h-11 rounded-md bg-muted overflow-hidden flex items-center justify-center shrink-0">{signedThumbs[v.id] ? <img src={signedThumbs[v.id]} alt="" className="w-full h-full object-cover" /> : <DashboardIcon name="videos" size={18} className="text-muted-foreground" />}</div><div><span className="font-semibold text-[13px] block">{v.title}</span><span className="text-[11px] text-muted-foreground">{v.source_platform}</span></div></div></td>
                  <td className="px-3.5 py-3"><StatusPill status={publicStatus(v.status)} /></td>
                  <td className="px-3.5 py-3 font-semibold">{v.views > 0 ? v.views.toLocaleString() : "—"}</td>
                  <td className="px-3.5 py-3 text-muted-foreground font-mono text-[12px]">{formatDuration(v.duration_seconds)}</td>
                  <td className="px-3.5 py-3"><div className="flex gap-1 justify-end"><DashboardBtn size="sm" variant="ghost" icon="edit" onClick={() => openEdit(v)} /><DashboardBtn size="sm" variant="danger" icon="trash" onClick={() => deleteVideo(v)} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DashboardCard>
    </div>
  );
}