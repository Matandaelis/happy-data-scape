// Public endpoint called by MediaMTX to authorize publish/read
// MediaMTX sends: ?user=<stream_key>&pass=<unused>&path=live/...&action=publish|read
// We verify the stream_key + path against the streams table.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    let user = url.searchParams.get("user") ?? "";
    let pass = url.searchParams.get("pass") ?? "";
    let path = url.searchParams.get("path") ?? "";
    const action = url.searchParams.get("action") ?? "publish";

    // MediaMTX may also POST JSON
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({} as any));
      user = body.user ?? user;
      pass = body.password ?? body.pass ?? pass;
      path = body.path ?? path;
    }

    // Stream key may arrive as `user` or `pass` depending on MediaMTX config
    const streamKey = pass || user;
    if (!streamKey || !path) {
      return new Response("forbidden", { status: 401 });
    }

    // Normalize: MediaMTX paths usually start without leading slash
    const normalizedPath = path.replace(/^\/+/, "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.rpc("validate_stream_key", {
      _stream_key: streamKey,
      _path: normalizedPath,
    });

    if (error) {
      console.error("validate_stream_key error", error);
      return new Response("error", { status: 500 });
    }

    if (data === true) {
      return new Response("ok", { status: 200 });
    }
    return new Response("forbidden", { status: 401 });
  } catch (e) {
    console.error("media-mtx-auth error", e);
    return new Response("error", { status: 500 });
  }
});
