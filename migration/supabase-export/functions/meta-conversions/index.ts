// meta-conversions v4 (2026-08-11) — full CRM lead-stage sync to Meta.
//
// v3 only reported 'converted'. Meta optimizes far better when it also learns which
// leads were QUALIFIED (real prospect) and DISQUALIFIED (junk) — that is how the
// algorithm learns to stop buying bad leads. This version reports every stage change
// once, keyed by (lead_id, stage) in public.meta_lead_stage_sent so nothing double-fires.
//
// Stage map (from leads.pipeline_stage / leads.status):
//   enrolled | paying              -> 'Converted'    (value 3000 USD)
//   interested | tour_booked        -> 'Qualified'
//   lost (status closed)            -> 'Disqualified'
// Matching: Meta lead_id (from utm.meta_leadgen_id) + hashed email/phone.
// event_time is NOW because Meta rejects events older than 7 days and the event
// represents the stage change we are reporting, not the original opt-in.
//
// Guarded by ?key=. ?dry=1 previews. Safe no-op until META_DATASET_ID + META_CAPI_TOKEN exist.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GRAPH = "https://graph.facebook.com/v21.0";
const GUARD = "REDACTED-see-migration/supabase-export/README";
const J = (o: unknown, s = 200) => new Response(JSON.stringify(o, null, 2), { status: s, headers: { "content-type": "application/json" } });
async function sha256(v: string) { const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v)); return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join(""); }
const norm = (s: string) => (s || "").trim().toLowerCase();
const digits = (s: string) => (s || "").replace(/\D/g, "");

function stageFor(l: any): { stage: string; event: string; value: number } | null {
  const ps = String(l.pipeline_stage || "").toLowerCase();
  const st = String(l.status || "").toLowerCase();
  if (ps === "enrolled" || ps === "paying" || st === "converted") return { stage: "converted", event: "Converted", value: 3000 };
  if (ps === "lost" || st === "closed") return { stage: "disqualified", event: "Disqualified", value: 0 };
  if (ps === "interested" || ps === "tour_booked") return { stage: "qualified", event: "Qualified", value: 0 };
  return null;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.searchParams.get("key") !== GUARD) return J({ error: "forbidden" }, 403);
  const dry = url.searchParams.get("dry") === "1";
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: rows } = await sb.from("app_secrets").select("key,value").in("key", ["META_DATASET_ID", "META_CAPI_TOKEN", "META_TEST_EVENT_CODE"]);
  const cfg: Record<string, string> = {}; (rows || []).forEach((r: any) => cfg[r.key] = r.value);
  if (!cfg.META_DATASET_ID || !cfg.META_CAPI_TOKEN) {
    return J({ ok: false, configured: false, need: ["META_DATASET_ID", "META_CAPI_TOKEN"] });
  }

  // Only Facebook-sourced leads can be attributed — they carry the Meta lead id.
  const { data: leads, error } = await sb.from("leads")
    .select("id,first_name,last_name,email,phone,utm,status,pipeline_stage,created_at")
    .limit(1000);
  if (error) return J({ ok: false, error: error.message });

  const { data: already } = await sb.from("meta_lead_stage_sent").select("lead_id,stage");
  const seen = new Set((already || []).map((r: any) => `${r.lead_id}:${r.stage}`));

  const nowSec = Math.floor(Date.now() / 1000);
  const events: any[] = [];
  for (const l of leads || []) {
    if (!l?.utm || !l.utm.meta_leadgen_id) continue;
    const s = stageFor(l);
    if (!s) continue;
    if (seen.has(`${l.id}:${s.stage}`)) continue;
    const ud: any = { lead_id: String(l.utm.meta_leadgen_id) };
    if (l.email) ud.em = [await sha256(norm(l.email))];
    if (l.phone) { let p = digits(l.phone); if (p.length === 10) p = "1" + p; if (p) ud.ph = [await sha256(p)]; }
    events.push({
      event_name: s.event,
      event_time: nowSec,
      action_source: "system_generated",
      lead_event_source: "crm",
      user_data: ud,
      custom_data: { event_source: "crm", lead_event_source: "Premier Dental Academy CRM", lead_event: s.stage, value: s.value, currency: "USD" },
      _lead: l.id, _stage: s.stage,
    });
  }

  if (dry) {
    const by: Record<string, number> = {};
    events.forEach((e) => by[e._stage] = (by[e._stage] || 0) + 1);
    return J({ ok: true, configured: true, dry: true, pending: events.length, by_stage: by, sample: events.slice(0, 2) });
  }

  let sendRes: any = { skipped: "nothing new to report" };
  if (events.length) {
    const payload: any = { data: events.map(({ _lead, _stage, ...e }) => e) };
    if (cfg.META_TEST_EVENT_CODE) payload.test_event_code = cfg.META_TEST_EVENT_CODE;
    const r = await fetch(`${GRAPH}/${cfg.META_DATASET_ID}/events?access_token=${encodeURIComponent(cfg.META_CAPI_TOKEN)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    sendRes = { status: r.status, body: await r.json().catch(() => ({})) };
    if (r.ok) {
      await sb.from("meta_lead_stage_sent").upsert(events.map((e) => ({ lead_id: e._lead, stage: e._stage })), { onConflict: "lead_id,stage" });
      const conv = events.filter((e) => e._stage === "converted").map((e) => e._lead);
      if (conv.length) await sb.from("leads").update({ meta_conversion_sent_at: new Date().toISOString() }).in("id", conv);
    }
  }
  const by: Record<string, number> = {};
  events.forEach((e) => by[e._stage] = (by[e._stage] || 0) + 1);
  return J({ ok: true, configured: true, sent: events.length, by_stage: by, meta: sendRes });
});
