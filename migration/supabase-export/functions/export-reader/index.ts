// export-reader: returns a file from the PRIVATE course-assets bucket as text.
// Secret-gated (?secret= must match app_secrets.AUTOMATIONS_SECRET) — used by the
// course-content build pipeline to read the kajabi-export/ lesson HTML + meta
// from SQL (pg_net) without exposing the bucket. Read-only; path is confined to
// the kajabi-export/ prefix.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: row } = await sb.from("app_secrets").select("value").eq("key", "AUTOMATIONS_SECRET").maybeSingle();
  if (!row?.value || url.searchParams.get("secret") !== row.value) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
  }
  const path = url.searchParams.get("path") || "";
  if (!path.startsWith("kajabi-export/") || path.includes("..")) {
    return new Response(JSON.stringify({ error: "path must be under kajabi-export/" }), { status: 400, headers: { "content-type": "application/json" } });
  }
  const { data, error } = await sb.storage.from("course-assets").download(path);
  if (error || !data) {
    return new Response(JSON.stringify({ error: error?.message || "not found" }), { status: 404, headers: { "content-type": "application/json" } });
  }
  const text = await data.text();
  return new Response(text, { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } });
});
