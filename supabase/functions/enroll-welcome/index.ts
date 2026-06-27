// enroll-welcome — sends a student their enrollment WELCOME email (chosen start
// date + school supply list) via Resend. Mirrors lead-notify's secret-gated,
// fail-safe pattern. Intended to be called fire-and-forget from api/enroll.js
// AFTER a successful Square charge (see docs/enroll-welcome-runbook.md), so it can
// never affect the buyer's checkout result.
//
// Auth: requires ?secret=<ENROLL_WELCOME_SECRET> (from public.app_secrets), same
// shape as LEAD_NOTIFY_SECRET. verify_jwt is off (called server-side).
// Secrets (public.app_secrets): RESEND_API_KEY, ENROLL_WELCOME_SECRET.
// Platform-provided: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
//
// Expected JSON body:
//   { name, email, plan ("in-person"|"online"), startDate ("YYYY-MM-DD" | ""),
//     cohortName?, receiptUrl? }
// Online enrollments have no class start date — the email adapts.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_FROM_ENV = Deno.env.get("RESEND_API_KEY");
const FROM = "Amanda at Premier Dental Academy <hello@premierdentalacademyoflongview.com>";
const ADMIN_EMAIL = "hello@premierdentalacademyoflongview.com";

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

function prettyDate(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
  } catch (_e) { return iso; }
}

// School supply list. PLACEHOLDER until Amanda confirms — see runbook.
// [VERIFY: Amanda — supply list]. Keep items real; do not invent specifics.
const SUPPLY_LIST: string[] = [
  "A notebook + pens (or a tablet) for notes",
  "Closed-toe, non-slip shoes for clinic days",
  "Your photo ID for check-in on day one",
  "A water bottle and a snack for the evening sessions",
];

function welcomeHtml(opts: {
  firstName: string; plan: string; startDate: string; cohortName: string;
}): string {
  const fn = esc(opts.firstName) || "there";
  const isOnline = opts.plan === "online";
  const niceDate = prettyDate(opts.startDate);
  const startBlock = isOnline
    ? `<div style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;padding:16px 18px;margin:0 0 18px">
         <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#0e7490;font-weight:700">Your program</div>
         <div style="font-size:18px;font-weight:800;color:#155e75;margin-top:2px">Online — start any day, at your pace</div>
         <div style="font-size:13px;color:#475569;margin-top:4px">Log in any time and begin module 1 whenever you're ready.</div>
       </div>`
    : `<div style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;padding:16px 18px;margin:0 0 18px">
         <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#0e7490;font-weight:700">Your start date</div>
         <div style="font-size:20px;font-weight:800;color:#155e75;margin-top:2px">${niceDate || "We'll confirm your exact date by phone"}</div>
         ${opts.cohortName ? `<div style="font-size:13px;color:#475569;margin-top:4px">${esc(opts.cohortName)}</div>` : ""}
         <div style="font-size:13px;color:#475569;margin-top:6px">📍 2800 Gilmer Rd, Suite 106, Longview, TX 75604</div>
       </div>`;

  const supplyItems = SUPPLY_LIST.map(
    (s) => `<li style="margin:0 0 6px">${esc(s)}</li>`
  ).join("");

  return `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a">
  <div style="text-align:center;padding:24px 24px 8px">
    <img src="https://www.premierdentalacademyoflongview.com/assets/logo-mark.png" alt="Premier Dental Academy of Longview" width="48" height="48" style="border-radius:10px" />
  </div>
  <div style="border:1px solid #e2e8f0;border-radius:14px;padding:28px 26px;margin:8px">
    <h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 12px">You're in, ${fn}! 🎉</h1>
    <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 18px">Welcome to Premier Dental Academy of Longview. I'm Amanda — I'm so glad you're here. Here's everything you need to get started.</p>
    ${startBlock}
    <h2 style="font-size:16px;margin:0 0 8px;color:#0f172a">What to bring</h2>
    <ul style="font-size:14px;line-height:1.6;color:#334155;margin:0 0 18px;padding-left:20px">${supplyItems}</ul>
    <h2 style="font-size:16px;margin:0 0 8px;color:#0f172a">Next steps</h2>
    <ol style="font-size:14px;line-height:1.6;color:#334155;margin:0 0 18px;padding-left:20px">
      <li style="margin:0 0 6px">Set up your student account so you can reach your trainers and lessons.</li>
      <li style="margin:0 0 6px">Explore the free <a href="https://www.premierdentalacademyoflongview.com/tools/practice-pro" style="color:#0d9488;font-weight:600">Practice Pro</a> &amp; <a href="https://www.premierdentalacademyoflongview.com/skills-lab" style="color:#0d9488;font-weight:600">Skills Lab</a> before day one.</li>
      <li style="margin:0 0 6px">Watch for a text from us — we'll confirm details and answer any questions.</li>
    </ol>
    <div style="text-align:center;margin:6px 0 18px">
      <a href="https://www.premierdentalacademyoflongview.com/dashboard" style="display:inline-block;background:#f59e0b;color:#fff;font-weight:700;text-decoration:none;padding:13px 24px;border-radius:999px;margin:4px">Open your student hub →</a>
    </div>
    <p style="font-size:14px;line-height:1.6;color:#475569;margin:0">Questions? Call or text me any time at <a href="tel:+19039136444" style="color:#0d9488;font-weight:700">(903) 913-6444</a>.</p>
    <p style="font-size:13px;color:#94a3b8;margin:18px 0 0">Premier Dental Academy of Longview · 2800 Gilmer Rd, Suite 106, Longview, TX 75604</p>
  </div>
</div>`;
}

async function sendEmail(apiKey: string, to: string, subject: string, html: string, bcc?: string): Promise<boolean> {
  const payload: Record<string, unknown> = { from: FROM, to, subject, html };
  if (bcc) payload.bcc = bcc;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey, "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) console.error("[enroll-welcome] Resend error", r.status, await r.text());
  return r.ok;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: rows } = await sb.from("app_secrets").select("key,value").in("key", ["RESEND_API_KEY", "ENROLL_WELCOME_SECRET"]);
    const cfg: Record<string, string> = {};
    (rows || []).forEach((r: { key: string; value: string }) => (cfg[r.key] = r.value));

    const SECRET = cfg["ENROLL_WELCOME_SECRET"] || "";
    const provided = url.searchParams.get("secret") || req.headers.get("x-enroll-secret") || "";
    if (!SECRET || !safeEqual(provided, SECRET)) return json({ error: "unauthorized" }, 401);

    const apiKey = cfg["RESEND_API_KEY"] || RESEND_FROM_ENV || "";
    if (!apiKey) return json({ error: "missing RESEND_API_KEY" }, 200);

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const email = String(body.email || "").trim();
    if (!email) return json({ skipped: "no email" }, 200);

    const name = String(body.name || "").trim();
    const firstName = name.split(/\s+/)[0] || "";
    const plan = String(body.plan || "").toLowerCase().includes("online") ? "online" : "in-person";
    const startDate = String(body.startDate || "");
    const cohortName = String(body.cohortName || "");

    const sent = await sendEmail(
      apiKey, email,
      "Welcome to Premier Dental Academy — you're enrolled! 🎉",
      welcomeHtml({ firstName, plan, startDate, cohortName }),
      ADMIN_EMAIL, // bcc Amanda so she has a copy of every welcome
    );
    return json({ ok: true, sent }, 200);
  } catch (e) {
    console.error("[enroll-welcome] threw:", e);
    return json({ error: "caught" }, 200); // never retry-storm
  }
});
