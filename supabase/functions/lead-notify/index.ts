// lead-notify — fires on a new public.leads insert (via the notify_new_lead trigger,
// pg_net). Emails Amanda a new-lead alert and sends genuine prospects an autoresponder,
// via Resend. Deployed + wired live (see db/migrations + docs/lead-email-runbook.md).
//
// Auth: requires ?secret=<LEAD_NOTIFY_SECRET> (from public.app_secrets). verify_jwt is off
// because the Postgres trigger calls it server-side via pg_net, not with a user JWT.
// Secrets (public.app_secrets): RESEND_API_KEY, LEAD_NOTIFY_SECRET.
// Platform-provided: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
//
// Routing rules:
//   - Quo leads (source contains "quo") are skipped — the Quo webhook already notifies.
//   - Admin alert → Amanda for every other lead.
//   - Applicant autoresponder → only genuine prospects with an email (NOT employer leads,
//     whose copy would be wrong).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_FROM_ENV = Deno.env.get("RESEND_API_KEY");
const FROM = "Amanda at Premier Dental Academy <hello@premierdentalacademyoflongview.com>";
const ADMIN_EMAIL = "hello@premierdentalacademyoflongview.com";
const ADMIN_LEADS_URL = "https://www.premierdentalacademyoflongview.com/admin/leads";

const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });
const esc = (x: unknown) =>
  String(x ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let o = 0;
  for (let i = 0; i < a.length; i++) o |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return o === 0;
}

function notifyHtml(l: Record<string, unknown>): string {
  const name = (esc(l.first_name) + " " + esc(l.last_name)).trim();
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
  <div style="background:#0d9488;color:#fff;padding:18px 24px;border-radius:12px 12px 0 0">
    <h1 style="margin:0;font-size:18px">🦷 New lead — ${name}</h1>
    <p style="margin:4px 0 0;font-size:13px;opacity:.9">via ${esc(l.source)} · ${esc(l.created_at)}</p>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:24px">
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 0;color:#64748b;width:120px">Phone</td><td style="padding:6px 0"><a href="tel:${esc(l.phone)}" style="color:#0d9488;font-weight:600">${esc(l.phone)}</a></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Email</td><td style="padding:6px 0"><a href="mailto:${esc(l.email)}" style="color:#0d9488">${esc(l.email)}</a></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Interest</td><td style="padding:6px 0">${esc(l.interest_path)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;vertical-align:top">Details</td><td style="padding:6px 0;color:#334155;white-space:pre-wrap">${esc(l.message)}</td></tr>
    </table>
    <div style="margin-top:20px;text-align:center">
      <a href="tel:${esc(l.phone)}" style="display:inline-block;background:#f59e0b;color:#fff;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px;margin:0 4px">📞 Call now</a>
      <a href="${ADMIN_LEADS_URL}" style="display:inline-block;background:#0f172a;color:#fff;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px;margin:0 4px">Open in admin</a>
    </div>
  </div>
</div>`;
}

function autoresponderHtml(firstName: string): string {
  const fn = esc(firstName) || "there";
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
  <div style="text-align:center;padding:24px 24px 8px">
    <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" alt="Premier Dental Academy of Longview" width="48" height="48" style="border-radius:10px" />
  </div>
  <div style="border:1px solid #e2e8f0;border-radius:14px;padding:28px 26px;margin:8px">
    <h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 12px">Thanks, ${fn} — we've got you. 🎉</h1>
    <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 14px">I'm Amanda, the founder of Premier Dental Academy of Longview. Someone from our team will personally reach out <strong>as quickly as possible</strong> — no payment or commitment required.</p>
    <div style="text-align:center;margin:0 0 18px">
      <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="display:inline-block;background:#0d9488;color:#fff;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:10px;margin:4px">Try the free practice exam →</a>
    </div>
    <p style="font-size:14px;line-height:1.6;color:#475569;margin:0">Prefer to talk now? Call or text me at <a href="tel:+19039136444" style="color:#0d9488;font-weight:700">(903) 913-6444</a>.</p>
    <p style="font-size:13px;color:#94a3b8;margin:18px 0 0">Premier Dental Academy of Longview · 2800 Gilmer Rd, Suite 106, Longview, TX 75604</p>
  </div>
</div>`;
}

async function sendEmail(apiKey: string, to: string, subject: string, html: string): Promise<boolean> {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey, "content-type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!r.ok) console.error("[lead-notify] Resend error", r.status, await r.text());
  return r.ok;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: rows } = await sb.from("app_secrets").select("key,value").in("key", ["RESEND_API_KEY", "LEAD_NOTIFY_SECRET"]);
    const cfg: Record<string, string> = {};
    (rows || []).forEach((r: { key: string; value: string }) => (cfg[r.key] = r.value));

    const SECRET = cfg["LEAD_NOTIFY_SECRET"] || "";
    const provided = url.searchParams.get("secret") || req.headers.get("x-lead-secret") || "";
    if (!SECRET || !safeEqual(provided, SECRET)) return json({ error: "unauthorized" }, 401);

    const apiKey = cfg["RESEND_API_KEY"] || RESEND_FROM_ENV || "";
    if (!apiKey) return json({ error: "missing RESEND_API_KEY" }, 200);

    const body = await req.json().catch(() => ({}));
    const lead = (body && (body as Record<string, unknown>).record) ? (body as Record<string, unknown>).record as Record<string, unknown> : body as Record<string, unknown>;
    if (!lead || (!lead.email && !lead.phone)) return json({ skipped: "no contact info" }, 200);

    const src = String(lead.source || "").toLowerCase();
    const interest = String(lead.interest_path || "").toLowerCase();
    if (src.includes("quo")) return json({ skipped: "quo notifies separately" }, 200);
    const isEmployer = src.includes("employer") || interest.includes("employer");

    // Admin alert for every non-Quo lead.
    await sendEmail(apiKey, ADMIN_EMAIL,
      "New lead: " + esc(lead.first_name) + " " + esc(lead.last_name) + " (" + esc(lead.source) + ")",
      notifyHtml(lead));

    // Applicant autoresponder — genuine prospects only (employer copy would be wrong).
    let sentAuto = false;
    if (lead.email && !isEmployer) {
      sentAuto = await sendEmail(apiKey, String(lead.email),
        "We got your application — Premier Dental Academy of Longview",
        autoresponderHtml(String(lead.first_name || "")));
    }
    return json({ ok: true, admin: true, autoresponder: sentAuto }, 200);
  } catch (e) {
    console.error("[lead-notify] threw:", e);
    return json({ error: "caught" }, 200); // never retry-storm the pipeline
  }
});
