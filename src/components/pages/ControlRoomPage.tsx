import { useState, useRef } from "react";
import { DashboardIcon } from "../dashboard/DashboardIcon";
import { DashboardCard, DashboardBtn, LivePill } from "../dashboard/DashboardAtoms";
import { MOCK_PRODUCTS, MOCK_CHAT } from "@/lib/dashboard-data";

export function ControlRoomPage() {
  const [tab, setTab] = useState<"products" | "chat" | "settings">("products");
  const [isLive, setIsLive] = useState(false);
  const [pinned, setPinned] = useState<typeof MOCK_PRODUCTS[0] | null>(null);
  const [chatMsg, setChatMsg] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [msgs, setMsgs] = useState(MOCK_CHAT);
  const chatRef = useRef<HTMLDivElement>(null);

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
          Control Room — <span className="text-muted-foreground font-medium">Summer Flash Sale</span>
        </h1>
        <div className="flex items-center gap-2.5">
          {isLive && <LivePill />}
          {isLive && <span className="font-mono text-[12px] text-muted-foreground">00:14:32</span>}
          <DashboardBtn variant={isLive ? "danger" : "live"} icon={isLive ? "x" : "signal"} onClick={() => setIsLive((p) => !p)}>
            {isLive ? "End Show" : "Go Live"}
          </DashboardBtn>
        </div>
      </div>

      <div className="animate-fade-up-1 grid grid-cols-[1fr_380px] gap-4 items-start">
        {/* Stream Preview */}
        <div className="flex flex-col gap-3">
          <DashboardCard className="overflow-hidden">
            <div className="bg-sidebar aspect-video relative flex items-center justify-center">
              {isLive ? (
                <div className="absolute inset-0 bg-gradient-to-br from-sidebar via-[#1a1f2e] to-[#0f172a] flex items-center justify-center flex-col gap-2.5">
                  <div className="w-[60px] h-[60px] rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
                    <DashboardIcon name="cam" size={22} className="text-sky-300" strokeWidth={1.4} />
                  </div>
                  <p className="font-display font-bold text-[13px] text-sidebar-foreground">Streaming…</p>
                  <div className="absolute top-3 left-3"><LivePill /></div>
                  <div className="absolute top-3 right-3 flex items-center gap-[5px] bg-black/50 rounded-full py-[3px] px-2.5">
                    <DashboardIcon name="users" size={11} className="text-card" strokeWidth={2} />
                    <span className="text-[11px] text-card font-display font-bold">142</span>
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
                <input defaultValue="Summer Flash Sale" className="w-full bg-muted border border-border rounded-md px-3 py-2 text-[13px] outline-none focus:border-primary" />
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
