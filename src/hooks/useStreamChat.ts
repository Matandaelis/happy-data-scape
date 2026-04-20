import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type ChatMessage = {
  id: string;
  stream_id: string;
  user_id: string;
  display_name: string | null;
  message: string;
  is_question: boolean;
  is_deleted: boolean;
  created_at: string;
};

const COLORS = ["#e0241e", "#0ea5e9", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6"];
export const colorForUser = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
};

export function useStreamChat(streamId: string | null, displayName: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!streamId) {
      setMessages([]);
      setViewerCount(0);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("stream_id", streamId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(200);
      if (!cancelled && data) setMessages(data as ChatMessage[]);
    })();

    const presenceKey = userId ?? `anon-${crypto.randomUUID()}`;
    const channel = supabase.channel(`stream:${streamId}`, {
      config: { presence: { key: presenceKey } },
    });

    channel
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "chat_messages",
        filter: `stream_id=eq.${streamId}`,
      }, (payload) => {
        const m = payload.new as ChatMessage;
        if (!m.is_deleted) setMessages((p) => [...p, m]);
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "chat_messages",
        filter: `stream_id=eq.${streamId}`,
      }, (payload) => {
        const m = payload.new as ChatMessage;
        setMessages((p) => p.filter((x) => x.id !== m.id || !m.is_deleted).map((x) => (x.id === m.id ? m : x)));
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setViewerCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [streamId, userId]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !streamId || !userId) return { error: "Not signed in" };
      const { error } = await supabase.from("chat_messages").insert({
        stream_id: streamId,
        user_id: userId,
        display_name: displayName,
        message: trimmed,
      });
      return { error: error?.message };
    },
    [streamId, userId, displayName],
  );

  const deleteMessage = useCallback(async (id: string) => {
    await supabase.from("chat_messages").update({ is_deleted: true }).eq("id", id);
    setMessages((p) => p.filter((m) => m.id !== id));
  }, []);

  return { messages, viewerCount, sendMessage, deleteMessage, userId };
}
