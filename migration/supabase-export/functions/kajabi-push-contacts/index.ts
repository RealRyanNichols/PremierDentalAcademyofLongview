// kajabi-push-contacts: push our collected site leads + students (Supabase) INTO Kajabi as
// contacts so they're on the Kajabi marketing email lists. Resumable via public.kajabi_pushed
// (find-or-create dedupes against Kajabi too). Secret-gated (body.secret == ENROLL_WELCOME_SECRET).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const KAJABI_TOKEN_URL = "https://api.kajabi.com/v1/oauth/token";
const KAJABI_API = "https://api.kajabi.com/v1";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const J = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return J({ error: "POST only" }, 405);
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const body = await req.json().catch(() => ({}));
  const limit = Math.min(Number(body.limit) || 100, 300);

  const { data: rows } = await sb.from("app_secrets").select("key,value").in("key", ["ENROLL_WELCOME_SECRET", "KAJABI_CLIENT_ID", "KAJABI_CLIENT_SECRET", "KAJABI_SITE_ID"]);
  const cfg: Record<string, string> = {}; (rows || []).forEach((r: any) => cfg[r.key] = r.value);
  if (!body.secret || body.secret !== cfg["ENROLL_WELCOME_SECRET"]) return J({ error: "unauthorized" }, 401);
  const cid = cfg["KAJABI_CLIENT_ID"], csec = cfg["KAJABI_CLIENT_SECRET"], site = cfg["KAJABI_SITE_ID"];
  if (!cid || !csec || !site) return J({ error: "kajabi creds missing" }, 400);

  // OAuth
  const tr = await fetch(KAJABI_TOKEN_URL, { method: "POST", headers: { "content-type": "application/json", "User-Agent": UA }, body: JSON.stringify({ grant_type: "client_credentials", client_id: cid, client_secret: csec }) });
  const tj = await tr.json().catch(() => ({}));
  const token = tj.access_token;
  if (!token) return J({ ok: false, step: "oauth", detail: tj }, 502);
  const H = { Authorization: "Bearer " + token, "User-Agent": UA };

  // Gather candidate emails (leads + profiles) with a name, excluding already-pushed.
  const [{ data: leads }, { data: profs }, { data: pushed }] = await Promise.all([
    sb.from("leads").select("email,first_name,last_name").like("email", "%@%"),
    sb.from("profiles").select("email,first_name,last_name").like("email", "%@%"),
    sb.from("kajabi_pushed").select("email"),
  ]);
  const done = new Set((pushed || []).map((r: any) => r.email));
  const map = new Map<string, { name: string }>();
  const add = (e: string, f?: string, l: string = "") => {
    const email = String(e || "").toLowerCase().trim();
    if (!email || !email.includes("@") || done.has(email)) return;
    const name = [f, l].filter(Boolean).join(" ").trim();
    if (!map.has(email) || (name && !map.get(email)!.name)) map.set(email, { name });
  };
  (leads || []).forEach((r: any) => add(r.email, r.first_name, r.last_name));
  (profs || []).forEach((r: any) => add(r.email, r.first_name, r.last_name));

  const targets = Array.from(map.entries()).slice(0, limit);
  const summary = { processed: 0, created: 0, found: 0, errors: [] as any[] };

  for (const [email, info] of targets) {
    try {
      // Find existing contact
      const fu = KAJABI_API + "/contacts?filter[site_id]=" + encodeURIComponent(site) + "&filter[email_contains]=" + encodeURIComponent(email) + "&page[size]=20";
      const fr = await fetch(fu, { headers: { ...H, Accept: "application/json" } });
      const fj = await fr.json().catch(() => ({}));
      let contactId: string | null = ((fj.data || []).find((c: any) => String(c.attributes?.email || "").toLowerCase() === email) || {}).id || null;
      if (contactId) { summary.found++; }
      else {
        const cr = await fetch(KAJABI_API + "/contacts", { method: "POST", headers: { ...H, "Content-Type": "application/vnd.api+json", Accept: "application/vnd.api+json" }, body: JSON.stringify({ data: { type: "contacts", attributes: { name: info.name || email, email }, relationships: { site: { data: { type: "sites", id: String(site) } } } } }) });
        const cj = await cr.json().catch(() => ({}));
        contactId = cj.data?.id || null;
        if (!contactId) { summary.errors.push({ email, detail: cj?.errors || cj }); continue; }
        summary.created++;
      }
      await sb.from("kajabi_pushed").upsert({ email, kajabi_id: contactId ? String(contactId) : null }, { onConflict: "email" });
      summary.processed++;
    } catch (e) { summary.errors.push({ email, error: String(e) }); }
  }

  const { count: remaining } = await sb.from("kajabi_pushed").select("email", { count: "exact", head: true });
  return J({ ok: true, summary, total_candidates: map.size, pushed_table_count: remaining });
});
