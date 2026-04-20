import { useEffect, useRef, useState, FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import Hls from "hls.js";
import { supabase } from "@/integrations/supabase/client";
import { useStreamChat, colorForUser } from "@/hooks/useStreamChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Eye, Send, ShoppingBag, Radio } from "lucide-react";

type Stream = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  media_mtx_path: string;
  thumbnail_url: string | null;
  recorded_url: string | null;
};

type Product = {
  id: string;
  name: string;
  price: number | null;
  currency: string | null;
  thumbnail_url: string | null;
  product_url: string | null;
  position: number;
};

const Watch = () => {
  const { streamId } = useParams<{ streamId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<Stream | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("Guest");
  const [chatInput, setChatInput] = useState("");

  const { messages, viewerCount, sendMessage, userId } = useStreamChat(streamId ?? null, displayName);

  // Load stream + products + viewer profile
  useEffect(() => {
    if (!streamId) return;
    let cancelled = false;
    (async () => {
      const [{ data: s, error: sErr }, { data: p }] = await Promise.all([
        supabase.from("streams").select("id,title,description,status,media_mtx_path,thumbnail_url,recorded_url").eq("id", streamId).maybeSingle(),
        supabase.from("stream_products").select("*").eq("stream_id", streamId).order("position", { ascending: true }),
      ]);
      if (cancelled) return;
      if (sErr || !s) {
        setError("Stream not found");
      } else {
        setStream(s as Stream);
        setProducts((p ?? []) as Product[]);
      }
      setLoading(false);

      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        const { data: prof } = await supabase.from("profiles").select("display_name,email").eq("id", u.user.id).maybeSingle();
        setDisplayName(prof?.display_name || prof?.email?.split("@")[0] || "Viewer");
      }
    })();
    return () => { cancelled = true; };
  }, [streamId]);

  // HLS playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    const hlsHost = (import.meta.env.VITE_MEDIA_MTX_HLS_HOST as string | undefined) || "media-mtx.yourdomain.com";
    const src = stream.recorded_url || `https://${hlsHost}/${stream.media_mtx_path}/index.m3u8`;

    let hls: Hls | null = null;
    if (Hls.isSupported() && !src.endsWith(".mp4")) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(src);
      hls.attachMedia(video);
    } else {
      video.src = src;
    }
    return () => { hls?.destroy(); };
  }, [stream]);

  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    if (!userId) {
      setError("Sign in to chat");
      return;
    }
    const { error: sendErr } = await sendMessage(chatInput);
    if (!sendErr) setChatInput("");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading…</div>;
  }
  if (error || !stream) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <p className="text-lg">{error || "Stream not available"}</p>
        <Link to="/" className="text-primary underline">Go home</Link>
      </div>
    );
  }

  const isLive = stream.status === "live";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-display text-lg font-bold">LiveShop</Link>
        <div className="flex items-center gap-3 text-sm">
          {isLive && (
            <Badge variant="destructive" className="gap-1">
              <Radio className="h-3 w-3" /> LIVE
            </Badge>
          )}
          <span className="flex items-center gap-1 text-muted-foreground">
            <Eye className="h-4 w-4" /> {viewerCount}
          </span>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_360px] gap-0 max-w-[1400px] mx-auto">
        {/* Video + products */}
        <div className="flex flex-col">
          <div className="relative bg-black aspect-video">
            <video
              ref={videoRef}
              controls
              autoPlay
              playsInline
              poster={stream.thumbnail_url ?? undefined}
              className="w-full h-full"
            />
          </div>

          <div className="p-4 sm:p-6">
            <h1 className="text-2xl font-display font-bold">{stream.title}</h1>
            {stream.description && (
              <p className="mt-2 text-muted-foreground">{stream.description}</p>
            )}

            {products.length > 0 && (
              <section className="mt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" /> Featured products
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                  {products.map((p) => (
                    <Card key={p.id} className="min-w-[180px] max-w-[180px] snap-start overflow-hidden">
                      {p.thumbnail_url ? (
                        <img src={p.thumbnail_url} alt={p.name} className="w-full h-32 object-cover" />
                      ) : (
                        <div className="w-full h-32 bg-muted" />
                      )}
                      <div className="p-3">
                        <p className="text-sm font-medium line-clamp-2">{p.name}</p>
                        {p.price != null && (
                          <p className="mt-1 text-sm text-primary font-semibold">
                            {p.currency || "USD"} {Number(p.price).toFixed(2)}
                          </p>
                        )}
                        {p.product_url && (
                          <Button asChild size="sm" className="mt-2 w-full">
                            <a href={p.product_url} target="_blank" rel="noopener noreferrer">Buy now</a>
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Chat */}
        <aside className="border-l border-border flex flex-col h-[60vh] lg:h-[calc(100vh-57px)]">
          <div className="px-4 py-3 border-b border-border font-semibold">Live chat</div>
          <ScrollArea className="flex-1 px-4 py-3">
            <div className="space-y-2">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground">No messages yet. Say hi!</p>
              )}
              {messages.map((m) => (
                <div key={m.id} className="text-sm">
                  <span className="font-semibold mr-2" style={{ color: colorForUser(m.user_id) }}>
                    {m.display_name || "Viewer"}
                  </span>
                  <span className="text-foreground">{m.message}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
          <form onSubmit={onSend} className="p-3 border-t border-border flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={userId ? "Send a message…" : "Sign in to chat"}
              disabled={!userId}
              maxLength={500}
            />
            <Button type="submit" size="icon" disabled={!userId || !chatInput.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
          {!userId && (
            <div className="px-3 pb-3 text-xs text-muted-foreground">
              <Link to="/auth" className="text-primary underline">Sign in</Link> to join the chat.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Watch;
