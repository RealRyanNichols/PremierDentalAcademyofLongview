// meta-leadgen: bridge Meta (Facebook/Instagram) Instant-Form lead ads INTO the lead pipeline.
// Two ways in:
//   (A) Meta Lead Ads webhook. GET = verify handshake (hub.verify_token == META_VERIFY_TOKEN, echo
//       hub.challenge). POST leadgen event -> fetch the full lead from Graph API with FB_PAGE_TOKEN.
//   (B) Simple JSON POST (Zapier / manual): { secret, email, first_name, last_name, phone, schedule,
//       form_name } where secret == ENROLL_WELCOME_SECRET.
// For each lead: INSERT into public.leads (fires trg_notify_new_lead -> Amanda alert +
// autoresponder), then SUBMIT the Kajabi "FB Lead Ad" form (2149482473) -> 30-day drip.
// Idempotent on the Meta leadgen_id (stored in leads.utm).
// Secrets (public.app_secrets): META_VERIFY_TOKEN, FB_PAGE_TOKEN, ENROLL_WELCOME_SECRET,
//   FB_PAGE_ID, and optionally META_APP_SECRET.
//
// ══ v5/v6 (2026-08-22): SECURITY ═════════════════════════════════════════════════════
// The Meta webhook path used to accept ANY unauthenticated POST shaped like
// {object:"page", entry:[...]}. It now runs four independent gates. An attacker has to beat
// ALL of them, and beating them still yields nothing:
//
//   1. SIGNATURE  — X-Hub-Signature-256, HMAC-SHA256 over the raw body, constant-time compare.
//                   Enforced whenever META_APP_SECRET exists. This is the real lock.
//   2. PAGE MATCH — every entry[].id must equal our own FB_PAGE_ID.
//   3. RATE LIMIT — unsigned deliveries are capped (see LIMITS below) via hit_rate_limit().
//                   Signed deliveries skip the cap entirely — Meta can burst safely.
//   4. GRAPH TRUTH — NO lead field is ever read from the request body. Every value is
//                   re-fetched from Meta with OUR page token. A forged leadgen_id returns
//                   no field_data and is skipped for having no contact details.
//
// v6 changes, both from live-fire testing of v5 against the deployed endpoint:
//
//   • BUDGET IS SPENT ON WORK, NOT ON REQUESTS. v5 counted every unsigned POST. That let junk
//     that costs us nothing (an empty entry[].changes ping) eat the hourly budget and 429 a
//     real lead that arrived behind it. v6 charges the budget only when a delivery actually
//     forces an outbound Graph call — i.e. a leadgen_id we have never seen. Empty pings and
//     replays are free, so an attacker can no longer starve real leads with cheap noise.
//   • DEDUPE BEFORE THE GRAPH CALL. v5 fetched the lead from Graph and deduped afterward, so
//     replaying one real leadgen_id burned a Graph call every single time. v6 checks
//     leads.utm->meta_leadgen_id first; a replay now costs one indexed SELECT and nothing else.
//
//   Known limit, measured not assumed: the per-IP cap is defeated by anything behind a NAT
//   pool or rotating IPs — 68 test deliveries from this workspace spread across 7 egress IPs
//   and never tripped the per-IP counter. The GLOBAL cap is the backstop that actually held
//   (allowed 60, rejected 61+). Per-IP stays because it still kills a single-source flood.
//
// Why the signature is staged rather than mandatory: META_APP_SECRET lives in the Meta App
// Dashboard for app 1373520258018547, which sits under AMANDA'S Facebook account, behind her
// password plus a second password confirmation. It cannot be read programmatically — no Graph
// endpoint returns an app secret — and the webhook callback URL cannot be changed without an
// app access token, which is itself app_id|app_secret. Hard-failing without it would have taken
// down a live pipeline carrying 51 leads in the last 30 days off paid ads. Gates 2–4 hold the
// line until the secret is added; the moment it is, gate 1 turns on with no code change.
//
// verify_jwt stays false: Meta cannot present a Supabase JWT.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GRAPH = "https://graph.facebook.com/v19.0";
const KAJABI_FORM_BASE = "https://premierdentalacademyoflongview.mykajabi.com/forms/2149482473";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const J = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });

// Real traffic is ~2 leads/day. These count NEW leadgen ids on unsigned deliveries only —
// the only thing that costs us an outbound Graph call. Generous versus reality, brutal versus abuse.
const LIMIT_GLOBAL_PER_HOUR = 60;
const LIMIT_PER_IP_PER_HOUR = 20;

async function hmacHex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Constant-time compare so a timing side-channel can't be used to guess the signature.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  return (xff.split(",")[0] || req.headers.get("cf-connecting-ip") || "unknown").trim();
}

async function underLimit(sb: any, bucket: string, max: number): Promise<boolean> {
  try {
    const { data, error } = await sb.rpc("hit_rate_limit", { p_bucket: bucket, p_max: max, p_window: "01:00:00" });
    if (error) return true; // limiter unavailable -> don't drop real leads over it
    return data !== false;
  } catch (_e) { return true; }
}

// Have we already taken this lead? Cheap indexed lookup, run BEFORE any Graph call.
async function alreadyHave(sb: any, leadgenId: string): Promise<boolean> {
  try {
    const { data } = await sb.from("leads").select("id").contains("utm", { meta_leadgen_id: leadgenId }).maybeSingle();
    return !!data;
  } catch (_e) { return false; }
}

// Raise the "META_APP_SECRET is missing" alert at most once a day.
async function warnUnsigned(sb: any) {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await sb.from("admin_alerts")
      .select("id").eq("kind", "security").eq("resolved", false)
      .ilike("title", "%META_APP_SECRET%").gte("created_at", since).limit(1);
    if (recent && recent.length) return;
    await sb.from("admin_alerts").insert({
      kind: "security",
      title: "Facebook lead webhook is running unsigned (META_APP_SECRET not set)",
      detail: "meta-leadgen accepted a Facebook lead delivery it could not cryptographically verify, because META_APP_SECRET is not configured. Leads are still safe: the page id must match, deliveries are rate limited, and every lead field is re-fetched from Meta with our own page token, so nothing can be injected. To close it fully, get the App Secret from the Meta App Dashboard for app 1373520258018547 (it is under Amanda's Facebook account, Settings > Basic > App Secret) and store it in app_secrets as META_APP_SECRET. No code change or redeploy needed after that.",
    });
  } catch (_e) { /* never let alerting break lead intake */ }
}

function pick(fd: Array<{ name: string; values: string[] }>, ...keys: string[]): string {
  for (const k of keys) {
    const f = fd.find((x) => (x.name || "").toLowerCase() === k);
    if (f && f.values && f.values.length) return String(f.values[0]);
  }
  for (const k of keys) {
    const f = fd.find((x) => (x.name || "").toLowerCase().includes(k));
    if (f && f.values && f.values.length) return String(f.values[0]);
  }
  return "";
}

async function kajabiFormSubmit(email: string, name: string, phone: string) {
  try {
    const g = await fetch(KAJABI_FORM_BASE, { headers: { "User-Agent": UA, "Accept": "text/html" } });
    const setCookie = g.headers.get("set-cookie") || "";
    const cookie = setCookie.split(/,(?=[^ ;]+=)/).map((c) => c.split(";")[0].trim()).filter(Boolean).join("; ");
    const html = await g.text();
    const m = html.match(/name=\"authenticity_token\"[^>]*value=\"([^\"]+)\"/) ||
      html.match(/value=\"([^\"]+)\"[^>]*name=\"authenticity_token\"/) ||
      html.match(/csrf-token\"[^>]*content=\"([^\"]+)\"/);
    const token = m ? m[1] : "";
    const body = new URLSearchParams();
    if (token) body.set("authenticity_token", token);
    body.set("form_submission[name]", name || email);
    body.set("form_submission[email]", email);
    if (phone) body.set("form_submission[phone_number]", phone);
    const p = await fetch(KAJABI_FORM_BASE + "/form_submissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": UA,
        "Accept": "application/json, text/html;q=0.9, */*;q=0.8",
        "Referer": KAJABI_FORM_BASE,
        "Origin": "https://premierdentalacademyoflongview.mykajabi.com",
        ...(cookie ? { "Cookie": cookie } : {}),
      },
      body: body.toString(),
      redirect: "manual",
    });
    return { ok: p.status >= 200 && p.status < 400, status: p.status, had_token: !!token };
  } catch (e) { return { ok: false, error: String(e) }; }
}

async function processLead(sb: any, lead: { email: string; first_name: string; last_name: string; phone: string; schedule?: string; form_name?: string; leadgen_id?: string }) {
  const email = (lead.email || "").toLowerCase().trim();
  if (!email && !lead.phone) return { skipped: "no contact" };
  if (lead.leadgen_id && await alreadyHave(sb, lead.leadgen_id)) return { deduped: true, leadgen_id: lead.leadgen_id };
  const sched = lead.schedule || "";
  const ins = {
    email, first_name: lead.first_name || "", last_name: lead.last_name || "", phone: lead.phone || "",
    source: "facebook_lead_ad", interest_path: "rda", path_preference: sched || null,
    message: "Facebook lead ad" + (lead.form_name ? " (" + lead.form_name + ")" : "") + (sched ? " · Schedule: " + sched : ""),
    status: "new", pipeline_stage: "new", landing_page: "facebook_lead_form",
    utm: { source: "facebook", medium: "paid_social", campaign: "rda_leads_longview", meta_leadgen_id: lead.leadgen_id || null, form: lead.form_name || null },
  };
  const { data: row, error } = await sb.from("leads").insert(ins).select("id").single();
  if (error) return { ok: false, step: "insert_lead", error: error.message };
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim();
  const kaj = await kajabiFormSubmit(email, name, lead.phone || "");
  return { ok: true, lead_id: row?.id, kajabi_form: kaj };
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: rows } = await sb.from("app_secrets").select("key,value")
    .in("key", ["META_VERIFY_TOKEN", "FB_PAGE_TOKEN", "ENROLL_WELCOME_SECRET", "META_APP_SECRET", "FB_PAGE_ID"]);
  const cfg: Record<string, string> = {}; (rows || []).forEach((r: any) => cfg[r.key] = r.value);

  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const tok = url.searchParams.get("hub.verify_token");
    const ch = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && tok && cfg.META_VERIFY_TOKEN && tok === cfg.META_VERIFY_TOKEN) return new Response(ch || "", { status: 200 });
    return J({ error: "verify failed" }, 403);
  }
  if (req.method !== "POST") return J({ error: "POST only" }, 405);

  // Raw body first — the signature covers the exact bytes Meta sent.
  const raw = await req.text();
  let body: any = {};
  try { body = JSON.parse(raw || "{}"); } catch { body = {}; }

  // ── Path B: Zapier / manual JSON, authenticated by its own shared secret ──
  if (body && body.email && body.secret) {
    if (!cfg.ENROLL_WELCOME_SECRET || body.secret !== cfg.ENROLL_WELCOME_SECRET) return J({ error: "unauthorized" }, 401);
    const r = await processLead(sb, { email: body.email, first_name: body.first_name || "", last_name: body.last_name || "", phone: body.phone || "", schedule: body.schedule || "", form_name: body.form_name || "zapier", leadgen_id: body.leadgen_id });
    return J({ ok: true, via: "json", result: r });
  }

  // ── Path A: Meta Lead Ads webhook ──
  if (body && body.object === "page" && Array.isArray(body.entry)) {
    const appSecret = cfg.META_APP_SECRET || "";
    const sigHeader = req.headers.get("x-hub-signature-256") || "";
    let signed = false;

    // GATE 1 — signature, when we have a secret to check it with.
    if (appSecret) {
      if (!sigHeader.startsWith("sha256=")) return J({ error: "missing signature" }, 401);
      const expected = "sha256=" + (await hmacHex(appSecret, raw));
      if (!safeEqual(expected, sigHeader)) return J({ error: "bad signature" }, 401);
      signed = true;
    }

    // GATE 2 — the delivery must be for OUR page.
    const ourPage = String(cfg.FB_PAGE_ID || "").trim();
    if (ourPage) {
      const claimed = (body.entry || []).map((e: any) => String(e?.id || ""));
      if (!claimed.length || !claimed.every((id: string) => id === ourPage)) {
        return J({ error: "unrecognized page" }, 401);
      }
    }

    if (!signed) await warnUnsigned(sb);
    if (!cfg.FB_PAGE_TOKEN) return J({ ok: false, error: "FB_PAGE_TOKEN not set" }, 200);

    const ip = clientIp(req);
    const results: any[] = [];
    let limited = false;

    for (const entry of body.entry) {
      for (const ch of (entry.changes || [])) {
        if (ch.field !== "leadgen") continue;
        const v = ch.value || {};
        const leadgenId = v.leadgen_id;
        if (!leadgenId) continue;

        // Free: we already have this lead. No Graph call, no budget spent. Kills replay.
        if (await alreadyHave(sb, String(leadgenId))) { results.push({ deduped: true, leadgen_id: leadgenId }); continue; }

        // GATE 3 — charge the budget only for work that costs an outbound Graph call, and
        // only on unsigned traffic. Signed deliveries are exempt so Meta can burst.
        if (!signed) {
          const okGlobal = await underLimit(sb, "meta-leadgen:global", LIMIT_GLOBAL_PER_HOUR);
          const okIp = await underLimit(sb, "meta-leadgen:ip:" + ip, LIMIT_PER_IP_PER_HOUR);
          if (!okGlobal || !okIp) { limited = true; break; }
        }

        try {
          // GATE 4 — every field below comes from Meta's own API, never from the request.
          const lr = await fetch(GRAPH + "/" + leadgenId + "?access_token=" + encodeURIComponent(cfg.FB_PAGE_TOKEN));
          const lj = await lr.json().catch(() => ({}));
          const fd = lj.field_data || [];
          const full = pick(fd, "full_name");
          const first = pick(fd, "first_name") || (full ? full.split(" ")[0] : "");
          const last = pick(fd, "last_name") || (full ? full.split(" ").slice(1).join(" ") : "");
          const lead = { email: pick(fd, "email"), first_name: first, last_name: last, phone: pick(fd, "phone_number", "phone"), schedule: pick(fd, "which_class_schedule_fits_your_life?", "schedule", "class"), form_name: v.form_id ? "meta_form_" + v.form_id : "meta", leadgen_id: leadgenId };
          results.push(await processLead(sb, lead));
        } catch (e) { results.push({ error: String(e), leadgen_id: leadgenId }); }
      }
      if (limited) break;
    }

    // 429 tells Meta to retry, so a real lead caught behind an abuse burst is delayed, not lost.
    if (limited) return J({ error: "rate limited", processed: results.length, results }, 429);
    return J({ ok: true, via: "meta_webhook", signed, processed: results.length, results });
  }

  return J({ ok: false, error: "unrecognized payload" }, 200);
});
