// lead-notify — emails Amanda a new-lead alert and sends the applicant an
// autoresponder, via Resend. Source-of-truth templates live in
// templates/email/lead-notification.html and applicant-autoresponder.html;
// the inline copies below must be kept in sync with them.
//
// ⚠️ NOT DEPLOYED YET. To turn it on, follow docs/lead-email-runbook.md
// (deploy the function, ensure RESEND_API_KEY is set, and add a Supabase
// Database Webhook on INSERT into public.leads pointing at this function).
//
// Trigger payload: a Supabase Database Webhook sends { type, table, record, ... }.
// It also accepts a plain lead object for manual testing.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const FROM = "Amanda at Premier Dental Academy <hello@premierdentalacademyoflongview.com>";
const ADMIN_EMAIL = "hello@premierdentalacademyoflongview.com"; // where new-lead alerts go
const ADMIN_LEADS_URL = "https://www.premierdentalacademyoflongview.com/admin/leads";

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

function notifyHtml(l: Record<string, unknown>): string {
  const name = `${esc(l.first_name)} ${esc(l.last_name)}`.trim();
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
      <tr><td style="padding:6px 0;color:#64748b;vertical-align:top">Details</td><td style="padding:6px 0;color:#334155">${esc(l.message)}</td></tr>
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
    <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 14px">I'm Amanda, the founder of Premier Dental Academy of Longview. Someone from our team will personally call you within <strong>1 business day</strong> — no payment or commitment required.</p>
    <div style="text-align:center;margin:0 0 18px">
      <a href="https://www.premierdentalacademyoflongview.com/tools/practice-exam" style="display:inline-block;background:#0d9488;color:#fff;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:10px;margin:4px">Try the free practice exam →</a>
    </div>
    <p style="font-size:14px;line-height:1.6;color:#475569;margin:0">Prefer to talk now? Call or text me at <a href="tel:+19039136444" style="color:#0d9488;font-weight:700">(903) 913-6444</a>.</p>
    <p style="font-size:13px;color:#94a3b8;margin:18px 0 0">Premier Dental Academy of Longview · 2800 Gilmer Rd, Suite 106, Longview, TX 75604</p>
  </div>
</div>`;
}

async function sendEmail(apiKey: string, to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!res.ok) console.error("[lead-notify] Resend error:", res.status, await res.text());
  return res.ok;
}

serve(async (req) => {
  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) return new Response("missing RESEND_API_KEY", { status: 500 });

    const body = await req.json().catch(() => ({}));
    const lead = (body.record ?? body) as Record<string, unknown>;
    if (!lead || (!lead.email && !lead.phone)) return new Response("no lead", { status: 200 });

    // Notify Amanda. Never block on the autoresponder.
    await sendEmail(apiKey, ADMIN_EMAIL,
      `New lead: ${esc(lead.first_name)} ${esc(lead.last_name)} (${esc(lead.source)})`,
      notifyHtml(lead));

    // Autoresponder to the applicant (only if they gave an email).
    if (lead.email) {
      await sendEmail(apiKey, String(lead.email),
        "We got your application — Premier Dental Academy of Longview",
        autoresponderHtml(String(lead.first_name ?? "")));
    }
    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error("[lead-notify] threw:", e);
    return new Response("error", { status: 200 }); // never retry-storm the pipeline
  }
});
