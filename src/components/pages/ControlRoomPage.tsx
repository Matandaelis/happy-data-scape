import { useState, useRef } from "react";
import { DashboardIcon } from "../dashboard/DashboardIcon";
import { DashboardCard, DashboardBtn, LivePill } from "../dashboard/DashboardAtoms";
import { MOCK_PRODUCTS, MOCK_CHAT } from "@/lib/dashboard-data";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ActiveStream = {
  id: string;
  title: string;
  stream_key: string;
  media_mtx_path: string;
  status: string;
};

type StartResponse = {
  stream: ActiveStream;
  ingest: { rtmp_url: string; stream_key: string };
  playback: { hls_url: string; webrtc_url: string };
};

export function ControlRoomPage() {
  const { workspace } = useAuth();
  const [tab, setTab] = useState<"products" | "chat" | "settings">("products");
  const [pinned, setPinned] = useState<typeof MOCK_PRODUCTS[0] | null>(null);
  const [chatMsg, setChatMsg] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [msgs, setMsgs] = useState(MOCK_CHAT);
  const [showTitle, setShowTitle] = useState("Summer Flash Sale");
  const [activeStream, setActiveStream] = useState<StartResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCreds, setShowCreds] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const isLive = activeStream?.stream.status === "live";

  const goLive = async () => {
    if (!workspace) {
      toast.error("No active workspace");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke<StartResponse>("streams-start", {
        body: { workspace_id: workspace.id, title: showTitle },
      });
      if (error) throw error;
      if (!data) throw new Error("Empty response");
      setActiveStream(data);
      setShowCreds(true);
      toast.success("Stream started — push to RTMP to go live");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to start stream");
    } finally {
      setBusy(false);
    }
  };

  const endShow = async () => {
    if (!activeStream) return;
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("streams-end", {
        body: { stream_id: activeStream.stream.id },
      });
      if (error) throw error;
      setActiveStream(null);
      toast.success("Stream ended");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to end stream");
    } finally {
      setBusy(false);
    }
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const sendMsg = () => {
    if (!chatMsg.trim()) return;
    setMsgs((p) => [...p, { id: Date.now(), user: "Host", msg: chatMsg, color: "#e0241e", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setChatMsg("");
    setTimeout(() => chatRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 50);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-fade-up flex items-center gap-3 flex-wrap">
        <h1 className="font-display font-extrabold text-[22px] tracking-tight flex-1">
          Control Room — <span className="text-muted-foreground font-medium">{showTitle}</span>
        </h1>
        <div className="flex items-center gap-2.5">
          {isLive && <LivePill />}
          <DashboardBtn
            variant={isLive ? "danger" : "live"}
            icon={isLive ? "x" : "signal"}
            onClick={isLive ? endShow : goLive}
            disabled={busy || !workspace}
          >
            {busy ? "Working…" : isLive ? "End Show" : "Go Live"}
          </DashboardBtn>
        </div>
      </div>

      {activeStream && showCreds && (
        <DashboardCard className="animate-fade-up p-4 border-primary/30">
          <div className="flex items-start gap-3">
            <div className="flex-1 flex flex-col gap-2.5 min-w-0">
              <p className="font-display font-extrabold text-[12px] uppercase tracking-[.05em] text-primary">RTMP Ingest</p>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted-foreground font-semibold">Server URL</label>
                <div className="flex gap-1.5">
                  <input readOnly value={activeStream.ingest.rtmp_url} className="flex-1 bg-muted border border-border rounded-md px-2.5 py-1.5 text-[11px] font-mono outline-none" />
                  <DashboardBtn size="sm" variant="secondary" onClick={() => copy(activeStream.ingest.rtmp_url, "RTMP URL")}>Copy</DashboardBtn>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted-foreground font-semibold">Stream Key</label>
                <div className="flex gap-1.5">
                  <input readOnly type="password" value={activeStream.ingest.stream_key} className="flex-1 bg-muted border border-border rounded-md px-2.5 py-1.5 text-[11px] font-mono outline-none" />
                  <DashboardBtn size="sm" variant="secondary" onClick={() => copy(activeStream.ingest.stream_key, "Stream key")}>Copy</DashboardBtn>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">Paste these into OBS / your encoder, then start streaming.</p>
            </div>
            <DashboardBtn size="sm" variant="secondary" icon="x" onClick={() => setShowCreds(false)} />
          </div>
        </DashboardCard>
      )}

      <div className="animate-fade-up-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 items-start">
        {/* Stream Preview */}
        <div className="flex flex-col gap-3">
          <DashboardCard className="overflow-hidden">
            <div className="bg-sidebar aspect-video relative flex items-center justify-center">
              {isLive ? (
                <div className="absolute inset-0 bg-gradient-to-br from-sidebar via-[#1a1f2e] to-[#0f172a] flex items-center justify-center flex-col gap-2.5">
                  <div className="w-[60px] h-[60px] rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
                    <DashboardIcon name="cam" size={22} className="text-sky-300" strokeWidth={1.4} />
                  </div>
                  <p className="font-display font-bold text-[13px] text-sidebar-foreground">Awaiting encoder…</p>
                  <div className="absolute top-3 left-3"><LivePill /></div>
                  <div className="absolute top-3 right-3 flex items-center gap-[5px] bg-black/50 rounded-full py-[3px] px-2.5">
                    <DashboardIcon name="users" size={11} className="text-card" strokeWidth={2} />
                    <span className="text-[11px] text-card font-display font-bold">0</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2.5 opacity-50">
                  <DashboardIcon name="cam" size={32} className="text-sidebar-foreground" strokeWidth={1.2} />
                  <p className="font-display text-[12px] text-sidebar-foreground font-semibold">Stream not started</p>
                </div>
              )}
            </div>
            <div className="p-3 px-4 flex items-center gap-2 border-t border-border">
              {[
                { icon: "mic" as const, on: micOn, set: setMicOn, label: micOn ? "Mic On" : "Mic Off" },
                { icon: "cam" as const, on: camOn, set: setCamOn, label: camOn ? "Cam On" : "Cam Off" },
              ].map((ctrl) => (
                <button
                  key={ctrl.icon}
                  onClick={() => ctrl.set((p) => !p)}
                  className={`flex items-center gap-[5px] py-1.5 px-3 border rounded-md font-display text-[11px] font-bold cursor-pointer transition-all ${
                    ctrl.on ? "bg-muted border-border text-foreground" : "bg-red-50 border-red-300 text-red-600"
                  }`}
                >
                  <DashboardIcon name={ctrl.icon} size={13} strokeWidth={2} /> {ctrl.label}
                </button>
              ))}
              <div className="flex-1" />
              <span className="text-[11px] text-muted-foreground font-display font-semibold">RTMP: MediaMTX</span>
            </div>
          </DashboardCard>

          {pinned && (
            <DashboardCard className="p-3.5 px-4">
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-display font-extrabold text-live tracking-[.04em]">📌 PINNED</span>
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-base">{pinned.thumb}</div>
                <div className="flex-1">
                  <p className="text-[12px] font-semibold">{pinned.title}</p>
                  <p className="text-[11px] text-success font-bold">KES {pinned.price.toLocaleString()}</p>
                </div>
                <DashboardBtn size="sm" variant="secondary" onClick={() => setPinned(null)}>Unpin</DashboardBtn>
              </div>
            </DashboardCard>
          )}
        </div>

        {/* Action Panel */}
        <DashboardCard className="overflow-hidden min-h-[500px]">
          <div className="flex border-b border-border">
            {(["products", "chat", "settings"] as const).map((t) => (
              <button
                key={t}
                className={`flex-1 py-2.5 px-4 font-display font-bold text-[12px] capitalize border-b-2 bg-transparent border-x-0 border-t-0 cursor-pointer transition-colors ${
                  tab === t ? "text-primary border-b-primary" : "text-muted-foreground border-b-transparent"
                }`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "products" && (
            <div className="flex flex-col" style={{ height: "calc(100% - 43px)" }}>
              <div className="p-3">
                <div className="relative">
                  <DashboardIcon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" strokeWidth={2} />
                  <input placeholder="Search products…" className="w-full pl-7 h-8 text-[12px] bg-muted border border-border rounded-md px-3 py-2 outline-none focus:border-primary" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-2">
                {MOCK_PRODUCTS.map((p) => (
                  <div key={p.id} className={`flex items-center gap-2.5 p-2.5 px-3 border border-border rounded-md bg-card ${!p.inStock ? "opacity-60" : ""}`}>
                    <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center text-lg shrink-0">{p.thumb}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold leading-tight">{p.title}</p>
                      <p className="text-[11px] text-success font-bold">KES {p.price.toLocaleString()}</p>
                      {!p.inStock && <span className="text-[9px] text-red-600 font-extrabold tracking-[.04em]">OUT OF STOCK</span>}
                    </div>
                    <DashboardBtn
                      size="sm"
                      variant={pinned?.id === p.id ? "secondary" : "primary"}
                      onClick={() => setPinned(pinned?.id === p.id ? null : p)}
                    >
                      {pinned?.id === p.id ? "Unpin" : "Pin"}
                    </DashboardBtn>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "chat" && (
            <div className="flex flex-col h-[460px]">
              <div ref={chatRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
                {msgs.map((m) => (
                  <div key={m.id} className="flex gap-2 items-start">
                    <div className="w-[26px] h-[26px] rounded-full shrink-0 flex items-center justify-center font-display text-[9px] font-extrabold text-card" style={{ background: m.color }}>
                      {m.user[0]}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold mb-0.5" style={{ color: m.color }}>{m.user} · {m.time}</p>
                      <p className="text-[12px] bg-muted py-[5px] px-2.5 rounded-[0_8px_8px_8px] inline-block">{m.msg}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2.5 px-3 border-t border-border flex gap-1.5">
                <input
                  value={chatMsg}
                  onChange={(e) => setChatMsg(e.target.value)}
                  placeholder="Reply as host…"
                  className="flex-1 h-8 text-[12px] bg-muted border border-border rounded-md px-3 py-2 outline-none focus:border-primary"
                  onKeyDown={(e) => e.key === "Enter" && sendMsg()}
                />
                <button onClick={sendMsg} className="w-8 h-8 bg-primary border-none rounded-md cursor-pointer flex items-center justify-center">
                  <DashboardIcon name="send" size={13} className="text-primary-foreground" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}

          {tab === "settings" && (
            <div className="p-3.5 flex flex-col gap-3 overflow-y-auto">
              <div className="flex flex-col gap-[5px]">
                <label className="text-[12px] font-semibold">Show Title</label>
                <input value={showTitle} onChange={(e) => setShowTitle(e.target.value)} className="w-full bg-muted border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary" />
              </div>
              <div className="border-t border-border pt-3">
                <p className="font-display font-bold text-[12px] text-muted-foreground uppercase tracking-[.05em] mb-2.5">Simulcast Destinations</p>
                {["YouTube Live", "Facebook Live"].map((d, i) => (
                  <div key={i} className="bg-muted rounded-md p-2.5 border border-border text-[12px] mb-2">
                    <div className="flex justify-between mb-1.5">
                      <span className="font-display font-bold text-[11px]">{d}</span>
                      <DashboardBtn size="sm" variant="danger" icon="trash" />
                    </div>
                    <input placeholder="rtmp://…" className="w-full bg-card border border-border rounded-md px-2.5 py-1.5 text-[11px] outline-none mb-1.5" />
                    <input placeholder="Stream key" type="password" className="w-full bg-card border border-border rounded-md px-2.5 py-1.5 text-[11px] outline-none" />
                  </div>
                ))}
              </div>
              <DashboardBtn>Save Settings</DashboardBtn>
            </div>
          )}
        </DashboardCard>
      </div>
    </div>
  );
}
