// fb-schedule — lists and schedules posts on the school's Facebook Page, and can store the
// Page access token in app_secrets.
//
// 2026-08-22 security fix. This function ran as service role and was reachable by anyone on
// the internet: its only gate was the GUARD literal hardcoded a few lines below, which is
// visible to anyone who can read this source. Whoever had it could schedule posts to the
// school's Facebook Page and, via mode="settoken", overwrite the stored Page token in
// app_secrets. verify_jwt is now true and the caller must additionally be a signed-in user
// with profiles.is_admin — the same pattern mux-upload uses. The GUARD check is kept as a
// second factor so existing callers that send it keep working unchanged.
// NOTE: the GUARD literal is still in this source and should be treated as public. It is a
// speed bump, not a credential; rotate it (and the FB tokens) at your convenience.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GRAPH = "https://graph.facebook.com/v19.0";
const PAGE_ID = "180743142587539";
const GUARD = "REDACTED-see-migration/supabase-export/README";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "POST, GET, OPTIONS", "content-type": "application/json" };
const J = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: CORS });

async function resolve(tok: string) {
  try {
    const acc = await (await fetch(`${GRAPH}/me/accounts?fields=name,access_token,tasks&limit=100&access_token=${encodeURIComponent(tok)}`)).json();
    const pg = (acc && acc.data ? acc.data : []).find((p: any) => p.id === PAGE_ID);
    if (pg && pg.access_token) return { token: pg.access_token, via: "me_accounts" };
  } catch (_) {}
  try {
    const pj = await (await fetch(`${GRAPH}/${PAGE_ID}?fields=access_token&access_token=${encodeURIComponent(tok)}`)).json();
    if (pj && pj.access_token) return { token: pj.access_token, via: "page_field" };
  } catch (_) {}
  return { token: tok, via: "direct" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  let body: any = {};
  try { body = await req.json(); } catch (_) { try { body = JSON.parse(await req.text()); } catch (_) {} }
  if (body.guard !== GUARD) return J({ error: "unauthorized" }, 401);

  // 2026-08-22: the GUARD above is a hardcoded literal in this file, so on its own it proves
  // nothing. Require a real signed-in admin as the primary gate. A bare anon key is a valid
  // JWT to the platform but resolves to no user here, so it fails this check.
  const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  const { data: u } = await sb.auth.getUser(jwt);
  if (!u?.user) return J({ error: "unauthorized" }, 401);
  const { data: prof } = await sb.from("profiles").select("is_admin").eq("id", u.user.id).maybeSingle();
  const isAdmin = !!prof?.is_admin;
  if (!isAdmin) return J({ error: "admin only" }, 403);

  if (body.mode === "settoken") {
    // This branch takes a token straight out of the request body and writes it into
    // app_secrets under FB_POST_TOKEN, which every later run of this function then uses to
    // act as the school's Facebook Page. It is the highest-value branch here, so the admin
    // requirement is asserted again explicitly rather than relying only on the check above
    // surviving future edits or reordering.
    if (!isAdmin) return J({ error: "admin only" }, 403);
    const tok = (body.token || "").trim();
    if (tok.length < 40) return J({ ok: false, error: "too short", len: tok.length });
    const { error } = await sb.from("app_secrets").upsert({ key: "FB_POST_TOKEN", value: tok }, { onConflict: "key" });
    return J({ ok: !error, error: error ? error.message : null });
  }

  const { data: rows } = await sb.from("app_secrets").select("key,value").in("key", ["FB_POST_TOKEN", "FB_PAGE_TOKEN"]);
  const map: Record<string, string> = {}; (rows || []).forEach((r: any) => map[r.key] = r.value);
  const srcTok = map.FB_POST_TOKEN || map.FB_PAGE_TOKEN || "";
  if (!srcTok) return J({ error: "no token" }, 200);
  const R = await resolve(srcTok);

  if (body.mode === "list") {
    let all: any[] = [];
    let url: string | null = `${GRAPH}/${PAGE_ID}/scheduled_posts?fields=id,scheduled_publish_time&limit=100&access_token=${encodeURIComponent(R.token)}`;
    for (let i = 0; i < 6 && url; i++) {
      const j: any = await (await fetch(url)).json().catch(() => ({}));
      if (j && j.data) all = all.concat(j.data);
      url = j && j.paging && j.paging.next ? j.paging.next : null;
    }
    return J({ count: all.length, times: all.map((p: any) => Number(p.scheduled_publish_time)).sort((a, b) => a - b) });
  }

  if (body.mode === "post") {
    const items = Array.isArray(body.items) ? body.items : [];
    const out = await Promise.all(items.map(async (it: any) => {
      try {
        const p = new URLSearchParams();
        p.set("url", it.url); p.set("caption", it.message || ""); p.set("published", "false");
        p.set("scheduled_publish_time", String(it.t)); p.set("access_token", R.token);
        const r = await fetch(`${GRAPH}/${PAGE_ID}/photos`, { method: "POST", body: p });
        const j = await r.json().catch(() => ({}));
        return { n: it.n, ok: r.ok, status: r.status, id: j.id || null, error: j.error ? (j.error.message || j.error) : null };
      } catch (e) { return { n: it.n, ok: false, error: String(e) }; }
    }));
    return J({ posted: out.length, via: R.via, ok: out.filter((o) => o.ok).length, fails: out.filter((o) => !o.ok) });
  }

  return J({ error: "bad mode" }, 200);
});
