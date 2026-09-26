// meta-discover: READ-ONLY. Uses the Facebook tokens already in app_secrets to
// list ad accounts, pixels/datasets, granted permissions, and lead forms, so we
// can wire the Conversions API (Conversion Leads) without asking for new creds.
// Guarded by ?key= constant. No writes, no money, no external data leaves Meta.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GRAPH = "https://graph.facebook.com/v21.0";
const GUARD = "REDACTED-see-migration/supabase-export/README";
const J = (o: unknown, s = 200) => new Response(JSON.stringify(o, null, 2), { status: s, headers: { "content-type": "application/json" } });
async function g(path: string, token: string, fields?: string) {
  const u = `${GRAPH}/${path}?access_token=${encodeURIComponent(token)}` + (fields ? `&fields=${encodeURIComponent(fields)}` : "");
  const r = await fetch(u); const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data: j };
}
Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.searchParams.get("key") !== GUARD) return J({ error: "forbidden" }, 403);
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: rows } = await sb.from("app_secrets").select("key,value").in("key", ["FB_LONG_USER_TOKEN", "FB_PAGE_TOKEN", "FB_PAGE_ID"]);
  const cfg: Record<string, string> = {}; (rows || []).forEach((r: any) => cfg[r.key] = r.value);
  const user = cfg.FB_LONG_USER_TOKEN || ""; const page = cfg.FB_PAGE_TOKEN || ""; const pageId = cfg.FB_PAGE_ID || "";
  const out: any = { has_user_token: !!user, has_page_token: !!page, page_id: pageId };
  out.me = (await g("me", user, "id,name")).data;
  out.permissions = (await g("me/permissions", user)).data;
  out.adaccounts = (await g("me/adaccounts", user, "id,account_id,name,account_status")).data;
  out.businesses = (await g("me/businesses", user, "id,name")).data;
  out.pixels = [];
  const accts = (out.adaccounts && out.adaccounts.data) || [];
  for (const a of accts) {
    const p = await g(`${a.id}/adspixels`, user, "id,name,last_fired_time");
    out.pixels.push({ acct: a.id, acct_name: a.name, result: p.data?.data || p.data });
  }
  out.forms = pageId ? (await g(`${pageId}/leadgen_forms`, page, "id,name,status,leads_count")).data : null;
  return J({ ok: true, out });
});
