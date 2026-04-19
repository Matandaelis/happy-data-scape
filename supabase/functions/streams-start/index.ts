import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RTMP_HOST = Deno.env.get("MEDIA_MTX_RTMP_HOST") ?? "rtmp://media-mtx.yourdomain.com";
const HLS_HOST = Deno.env.get("MEDIA_MTX_HLS_HOST") ?? "https://media-mtx.yourdomain.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const body = await req.json().catch(() => ({}));
    const { workspace_id, title, description, stream_id } = body ?? {};

    if (!workspace_id || typeof workspace_id !== "string") {
      return new Response(JSON.stringify({ error: "workspace_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve tenant + workspace slugs for MediaMTX path
    const { data: ws, error: wsErr } = await supabase
      .from("workspaces")
      .select("id, slug, tenant_id, tenants(slug)")
      .eq("id", workspace_id)
      .maybeSingle();
    if (wsErr || !ws) {
      return new Response(JSON.stringify({ error: "Workspace not found or no access" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tenantSlug = (ws as any).tenants?.slug ?? "tenant";

    let stream: any;
    if (stream_id) {
      // Resume / start an existing scheduled stream
      const { data: existing, error: exErr } = await supabase
        .from("streams")
        .select("*")
        .eq("id", stream_id)
        .eq("workspace_id", workspace_id)
        .maybeSingle();
      if (exErr || !existing) {
        return new Response(JSON.stringify({ error: "Stream not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: updated, error: updErr } = await supabase
        .from("streams")
        .update({ status: "live", start_time: new Date().toISOString() })
        .eq("id", existing.id)
        .select("*")
        .maybeSingle();
      if (updErr) throw updErr;
      stream = updated;
    } else {
      // Generate a unique media path: live/{tenant}/{workspace}/{uuid}
      const newId = crypto.randomUUID();
      const mediaPath = `live/${tenantSlug}/${ws.slug}/${newId}`;
      const { data: created, error: insErr } = await supabase
        .from("streams")
        .insert({
          id: newId,
          workspace_id,
          created_by: userId,
          title: title || "Untitled Stream",
          description: description ?? null,
          status: "live",
          start_time: new Date().toISOString(),
          media_mtx_path: mediaPath,
        })
        .select("*")
        .maybeSingle();
      if (insErr) throw insErr;
      stream = created;
    }

    return new Response(JSON.stringify({
      stream,
      ingest: {
        rtmp_url: `${RTMP_HOST}/${stream.media_mtx_path}`,
        stream_key: stream.stream_key,
      },
      playback: {
        hls_url: `${HLS_HOST}/${stream.media_mtx_path}/index.m3u8`,
        webrtc_url: `${HLS_HOST}/webrtc/play?path=/${stream.media_mtx_path}`,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("streams-start error", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
