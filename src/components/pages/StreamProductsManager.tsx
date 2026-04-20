import { useEffect, useState, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DashboardIcon } from "../dashboard/DashboardIcon";
import { DashboardBtn } from "../dashboard/DashboardAtoms";

export type StreamProduct = {
  id: string;
  stream_id: string;
  name: string;
  price: number | null;
  currency: string | null;
  thumbnail_url: string | null;
  product_url: string | null;
  position: number;
};

type FormState = {
  id?: string;
  name: string;
  price: string;
  currency: string;
  thumbnail_url: string;
  product_url: string;
};

const empty: FormState = { name: "", price: "", currency: "USD", thumbnail_url: "", product_url: "" };

export function StreamProductsManager({ streamId }: { streamId: string | null }) {
  const [items, setItems] = useState<StreamProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!streamId) { setItems([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("stream_products")
      .select("*")
      .eq("stream_id", streamId)
      .order("position", { ascending: true });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setItems((data ?? []) as StreamProduct[]);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [streamId]);

  const startEdit = (p: StreamProduct) => {
    setForm({
      id: p.id,
      name: p.name,
      price: p.price?.toString() ?? "",
      currency: p.currency ?? "USD",
      thumbnail_url: p.thumbnail_url ?? "",
      product_url: p.product_url ?? "",
    });
    setShowForm(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!streamId) { toast.error("Start the stream first"); return; }
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const payload = {
      stream_id: streamId,
      name: form.name.trim(),
      price: form.price ? Number(form.price) : null,
      currency: form.currency || "USD",
      thumbnail_url: form.thumbnail_url || null,
      product_url: form.product_url || null,
    };
    let error;
    if (form.id) {
      ({ error } = await supabase.from("stream_products").update(payload).eq("id", form.id));
    } else {
      const nextPos = items.length ? Math.max(...items.map((i) => i.position)) + 1 : 0;
      ({ error } = await supabase.from("stream_products").insert({ ...payload, position: nextPos }));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(form.id ? "Product updated" : "Product added");
    setForm(empty);
    setShowForm(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("stream_products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setItems((p) => p.filter((x) => x.id !== id));
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const a = items[idx], b = items[target];
    // optimistic swap
    const next = [...items];
    next[idx] = { ...b, position: a.position };
    next[target] = { ...a, position: b.position };
    next.sort((x, y) => x.position - y.position);
    setItems(next);
    const [r1, r2] = await Promise.all([
      supabase.from("stream_products").update({ position: b.position }).eq("id", a.id),
      supabase.from("stream_products").update({ position: a.position }).eq("id", b.id),
    ]);
    if (r1.error || r2.error) { toast.error("Reorder failed"); load(); }
  };

  if (!streamId) {
    return (
      <div className="p-6 text-center text-[12px] text-muted-foreground">
        Go live to attach products to your stream.
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100% - 43px)" }}>
      <div className="p-3 flex items-center gap-2">
        <p className="text-[11px] text-muted-foreground font-display font-bold uppercase tracking-[.05em] flex-1">
          {items.length} product{items.length === 1 ? "" : "s"}
        </p>
        <DashboardBtn size="sm" icon="plus" onClick={() => { setForm(empty); setShowForm((s) => !s); }}>
          {showForm ? "Close" : "Add"}
        </DashboardBtn>
      </div>

      {showForm && (
        <form onSubmit={submit} className="px-3 pb-3 flex flex-col gap-2 border-b border-border">
          <input
            placeholder="Product name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-muted border border-border rounded-md px-2.5 py-1.5 text-[12px] outline-none focus:border-primary"
          />
          <div className="grid grid-cols-[1fr_80px] gap-2">
            <input
              placeholder="Price"
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="bg-muted border border-border rounded-md px-2.5 py-1.5 text-[12px] outline-none focus:border-primary"
            />
            <input
              placeholder="USD"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
              className="bg-muted border border-border rounded-md px-2.5 py-1.5 text-[12px] outline-none focus:border-primary"
            />
          </div>
          <input
            placeholder="Thumbnail URL"
            value={form.thumbnail_url}
            onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
            className="bg-muted border border-border rounded-md px-2.5 py-1.5 text-[12px] outline-none focus:border-primary"
          />
          <input
            placeholder="Product URL (Buy link)"
            value={form.product_url}
            onChange={(e) => setForm({ ...form, product_url: e.target.value })}
            className="bg-muted border border-border rounded-md px-2.5 py-1.5 text-[12px] outline-none focus:border-primary"
          />
          <div className="flex gap-2">
            <DashboardBtn size="sm" type="submit" disabled={saving}>
              {saving ? "Saving…" : form.id ? "Update" : "Add product"}
            </DashboardBtn>
            <DashboardBtn size="sm" variant="secondary" type="button" onClick={() => { setShowForm(false); setForm(empty); }}>
              Cancel
            </DashboardBtn>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {loading && <p className="text-[11px] text-muted-foreground text-center">Loading…</p>}
        {!loading && items.length === 0 && (
          <p className="text-[11px] text-muted-foreground text-center mt-6">No products yet — add one above.</p>
        )}
        {items.map((p, i) => (
          <div key={p.id} className="flex items-center gap-2.5 p-2.5 px-3 border border-border rounded-md bg-card">
            {p.thumbnail_url ? (
              <img src={p.thumbnail_url} alt={p.name} className="w-9 h-9 rounded-md object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                <DashboardIcon name="cart" size={14} className="text-muted-foreground" strokeWidth={2} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold leading-tight truncate">{p.name}</p>
              {p.price != null && (
                <p className="text-[11px] text-success font-bold">
                  {p.currency || "USD"} {Number(p.price).toFixed(2)}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30"
                title="Move up"
              >▲</button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                className="bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-30"
                title="Move down"
              >▼</button>
            </div>
            <DashboardBtn size="sm" variant="secondary" onClick={() => startEdit(p)}>Edit</DashboardBtn>
            <DashboardBtn size="sm" variant="danger" icon="trash" onClick={() => remove(p.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}
