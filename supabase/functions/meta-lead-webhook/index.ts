// meta-lead-webhook: Meta Lead Ads → public.leads → Kajabi drip.
// Built per TODO-META-LEAD-WEBHOOK.md (Lead #1, Mandy Saxo, was bridged by
// hand — this makes it automatic).
//
// GET  — Meta webhook verification: echoes hub.challenge when hub.verify_token
//        matches META_VERIFY_TOKEN. Fails closed if the secret isn't set.
// POST — verifies X-Hub-Signature-256 (HMAC-SHA256 with META_APP_SECRET) over
//        the RAW body, pulls each leadgen_id from the payload, fetches the
//        lead's field_data from the Graph API with META_PAGE_TOKEN, then:
//          1) INSERTs into public.leads (source 'facebook_ad', utm jsonb,
//             landing_page 'meta_lead_form', form answers in message,
//             pipeline_stage 'new') — deduped per leadgen id
//          2) POSTs name/email/phone to the Kajabi "FB Lead Ad" form
//             (KAJABI_FB_FORM_URL secret) → workflow 813105 → 30-day drip
//
// Secrets live in public.app_secrets (same pattern as buy-product):
//   META_VERIFY_TOKEN, META_APP_SECRET, META_PAGE_TOKEN, KAJABI_FB_FORM_URL.
// Deployed with verify_jwt=false (Meta can't send a Supabase JWT); the verify
// token + HMAC signature are the auth. Without secrets the function rejects
// everything — safe to deploy before Meta is configured.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GRAPH = "https://graph.facebook.com/v21.0";

const J = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });

async function hmacHex(secret: string, body: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: secretRows } = await sb.from("app_secrets").select("key,value")
    .in("key", ["META_VERIFY_TOKEN", "META_APP_SECRET", "META_PAGE_TOKEN", "KAJABI_FB_FORM_URL"]);
  const cfg: Record<string, string> = {};
  (secretRows || []).forEach((r: { key: string; value: string }) => (cfg[r.key] = r.value));

  // ── Meta verification handshake ──
  if (req.method === "GET") {
    const u = new URL(req.url);
    const mode = u.searchParams.get("hub.mode");
    const token = u.searchParams.get("hub.verify_token");
    const challenge = u.searchParams.get("hub.challenge") || "";
    if (mode === "subscribe" && cfg["META_VERIFY_TOKEN"] && token === cfg["META_VERIFY_TOKEN"]) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }
  if (req.method !== "POST") return J({ error: "Method not allowed" }, 405);

  // ── Signature check over the raw body (fail closed) ──
  const raw = await req.text();
  const appSecret = cfg["META_APP_SECRET"] || "";
  const sigHeader = req.headers.get("x-hub-signature-256") || "";
  if (!appSecret || !sigHeader.startsWith("sha256=")) return J({ error: "Unauthorized" }, 401);
  const expected = "sha256=" + (await hmacHex(appSecret, raw));
  if (expected !== sigHeader) return J({ error: "Bad signature" }, 401);

  const payload = JSON.parse(raw || "{}");
  const pageToken = cfg["META_PAGE_TOKEN"] || "";
  const results: unknown[] = [];

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== "leadgen") continue;
      const leadgenId = String(change.value?.leadgen_id || "");
      if (!leadgenId) continue;

      // Dedupe: Meta retries deliveries — skip if we already logged this lead.
      const { data: dupe } = await sb.from("leads").select("id").ilike("message", `%[leadgen:${leadgenId}]%`).limit(1);
      if (dupe && dupe.length) { results.push({ leadgenId, skipped: "duplicate" }); continue; }

      // Pull the actual answers from the Graph API.
      let fields: Record<string, string> = {};
      try {
        const r = await fetch(`${GRAPH}/${leadgenId}?fields=field_data,created_time,ad_id,campaign_id,form_id&access_token=${encodeURIComponent(pageToken)}`);
        const j = await r.json();
        if (!r.ok) { results.push({ leadgenId, error: j?.error?.message || r.status }); continue; }
        (j.field_data || []).forEach((f: { name: string; values?: string[] }) => { fields[(f.name || "").toLowerCase()] = (f.values || [])[0] || ""; });
        fields["_ad_id"] = j.ad_id || ""; fields["_campaign_id"] = j.campaign_id || ""; fields["_form_id"] = j.form_id || "";
      } catch (e) { results.push({ leadgenId, error: String(e) }); continue; }

      const fullName = fields["full_name"] || [fields["first_name"], fields["last_name"]].filter(Boolean).join(" ") || "";
      const [first, ...rest] = fullName.trim().split(/\s+/);
      const email = (fields["email"] || "").toLowerCase();
      const phone = fields["phone_number"] || fields["phone"] || "";
      // Everything that isn't a standard contact field is a custom question answer.
      const answers = Object.entries(fields)
        .filter(([k]) => !["full_name", "first_name", "last_name", "email", "phone_number", "phone"].includes(k) && !k.startsWith("_"))
        .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(" · ");

      const { error: insErr } = await sb.from("leads").insert({
        first_name: first || "FB",
        last_name: rest.join(" ") || null,
        email: email || null,
        phone: phone || null,
        source: "facebook_ad",
        landing_page: "meta_lead_form",
        interest_path: "in-person",
        pipeline_stage: "new",
        status: "new",
        utm: { utm_source: "facebook", utm_medium: "paid", utm_campaign: "july-class-leads-v2" },
        message: `FB instant-form lead — ${answers || "no custom answers"} · ad:${fields["_ad_id"]} form:${fields["_form_id"]} [leadgen:${leadgenId}]`,
      });

      // Kajabi drip: submit the "FB Lead Ad" form so workflow 813105 fires.
      let kajabi: unknown = "skipped (KAJABI_FB_FORM_URL not set)";
      if (cfg["KAJABI_FB_FORM_URL"] && email) {
        try {
          const fd = new URLSearchParams({ "form_submission[name]": fullName, "form_submission[email]": email, "form_submission[phone]": phone });
          const kr = await fetch(cfg["KAJABI_FB_FORM_URL"], { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: fd.toString(), redirect: "manual" });
          kajabi = { status: kr.status };
        } catch (e) { kajabi = { error: String(e) }; }
      }
      results.push({ leadgenId, inserted: !insErr, insertError: insErr?.message, kajabi });
    }
  }

  return J({ ok: true, results });
});
