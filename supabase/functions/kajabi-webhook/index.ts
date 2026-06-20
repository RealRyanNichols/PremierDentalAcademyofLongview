// Kajabi webhook receiver — Kajabi purchase → instant website portal access.
// =============================================================================
// Flow on a successful purchase / offer-granted event:
//   1. Verify the request (HMAC signature if Kajabi sends one, else the shared
//      ?secret= token — both supported so the live automation keeps working).
//   2. Idempotent upsert: dedupe on external_payment_id so a re-delivered
//      webhook can't create duplicate purchases or re-grant twice.
//   3. Create/confirm the Supabase auth user + profile, and GRANT PORTAL ACCESS
//      by stamping program (online→career_track, in-person→foundation),
//      enrolled_at, kajabi_id, portal_status='active'.
//   4. Email the buyer their back-end portal link + instructions (Resend) so the
//      Kajabi buyer knows about the website portal and the extra tools there.
//
// Failed-payment events branch off to failed_payments + an urgent admin task.
//
// SECRETS (public.app_secrets):
//   KAJABI_WEBHOOK_SECRET  shared token (?secret=) AND HMAC key. Falls back to
//                          the legacy literal below if the row isn't set yet.
//   RESEND_API_KEY         transactional email
// Platform-provided: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_FROM_ENV = Deno.env.get("RESEND_API_KEY");
const SITE_URL = "https://premierdentalacademyoflongview.com";
const KAJABI_LIBRARY = "https://premierdentalacademyoflongview.mykajabi.com/library";
const FROM = "Amanda at Premier Dental Academy <hello@premierdentalacademyoflongview.com>";

// Legacy fallback so the currently-configured ?secret= URL keeps working until
// the KAJABI_WEBHOOK_SECRET row is set. Prefer the app_secrets value.
const LEGACY_SECRET = "pda-kajabi-webhook-2026";

const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });
const esc = (x: unknown) =>
  String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

// Constant-time-ish compare.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function hmac(secret: string, raw: string): Promise<{ hex: string; b64: string }> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  const bytes = new Uint8Array(sigBuf);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const b64 = btoa(String.fromCharCode(...bytes));
  return { hex, b64 };
}

// Online tracks map to career_track; in-person RDA to foundation (matches the
// dashboard's program labels). Heuristic on title/amount, overridable by payload.
function deriveProgram(title: string, amountCents: number, explicit?: string): "foundation" | "career_track" {
  if (explicit === "foundation" || explicit === "career_track") return explicit;
  const t = (title || "").toLowerCase();
  if (/in.?person|on.?campus|longview campus/.test(t)) return "foundation";
  if (/online|virtual|self.?paced|remote/.test(t)) return "career_track";
  // $1,997 in-person vs $397/$997 online — anything four-figures is in-person.
  return amountCents >= 100000 ? "foundation" : "career_track";
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  // Read config first (shared secret + Resend key).
  const { data: secretRows } = await sb.from("app_secrets").select("key,value")
    .in("key", ["KAJABI_WEBHOOK_SECRET", "RESEND_API_KEY"]);
  const cfg: Record<string, string> = {};
  (secretRows || []).forEach((r: any) => (cfg[r.key] = r.value));
  const SHARED_SECRET = cfg["KAJABI_WEBHOOK_SECRET"] || LEGACY_SECRET;
  const RESEND_API_KEY = cfg["RESEND_API_KEY"] || RESEND_FROM_ENV || "";

  // Read the raw body ONCE so we can both HMAC-verify it and parse it.
  const raw = await req.text();

  // ── Verify the request ──
  // (a) HMAC signature, if Kajabi sent one. Accept common header names + the
  //     "sha256=" prefix, and either hex or base64 encoding.
  // (b) Otherwise the shared ?secret= token (legacy live setup).
  const sigHeader = (
    req.headers.get("x-kajabi-signature") ||
    req.headers.get("x-webhook-signature") ||
    req.headers.get("x-signature") || ""
  ).trim().replace(/^sha256=/i, "");
  let authed = false;
  let authMethod = "none";
  if (sigHeader) {
    const { hex, b64 } = await hmac(SHARED_SECRET, raw);
    if (safeEqual(sigHeader, hex) || safeEqual(sigHeader, b64)) { authed = true; authMethod = "hmac"; }
  }
  if (!authed && url.searchParams.get("secret") && safeEqual(url.searchParams.get("secret")!, SHARED_SECRET)) {
    authed = true; authMethod = "shared_token";
  }
  if (!authed) return json({ error: "forbidden" }, 403);

  let body: any = {};
  try { body = JSON.parse(raw); } catch { /* ignore */ }

  const event = (body.event || body.event_name || body.type || "unknown").toLowerCase();
  const payload = body.payload || body.data || body;
  const isFailed = event.includes("failed") || event.includes("declin") ||
    (payload.status && (String(payload.status).toLowerCase().includes("fail") || String(payload.status).toLowerCase().includes("declin")));

  const person = payload.person || payload.member || payload.contact || payload.user || payload;
  const email: string = (person.email || payload.email || "").toLowerCase().trim();
  const firstName: string = person.first_name || person.firstName || (person.name || "").split(" ")[0] || "";
  const lastName: string = person.last_name || person.lastName || (person.name || "").split(" ").slice(1).join(" ") || "";
  const phone: string = person.phone || person.phone_number || "";
  const product: string = payload.offer?.title || payload.product?.title || payload.offer_title || "Kajabi enrollment";
  const amountCents: number = payload.amount_cents || (payload.amount ? Math.round(parseFloat(payload.amount) * 100) : 0) || 0;
  const paymentId: string = String(payload.id || payload.payment_id || payload.transaction_id || "");
  const kajabiId: string = String(payload.offer?.id || payload.product?.id || person.id || payload.member_id || "");
  const failureReason: string = payload.failure_reason || payload.error_message || payload.decline_reason || "unknown";

  if (!email) return json({ ok: false, reason: "no email in payload", event, auth: authMethod }, 200);

  // ── Failed payment ──
  if (isFailed) {
    await sb.from("failed_payments").insert({
      contact_email: email, contact_name: `${firstName} ${lastName}`.trim() || null, contact_phone: phone || null,
      amount_cents: amountCents, product_label: product, failure_reason: failureReason,
      external_payment_id: paymentId || null, source: "kajabi", triage_status: "new", metadata: payload,
    });
    await sb.from("admin_tasks").insert({
      title: `Failed payment: ${email} (${product})`,
      notes: `Amount: $${(amountCents / 100).toFixed(2)}\nReason: ${failureReason}\nFollow up to recover the sale or move to lost.`,
      priority: 1, status: "open",
    });
    return json({ ok: true, event, action: "logged_failed_payment", email, auth: authMethod });
  }

  const isPurchase = event.includes("payment") || event.includes("purchase") || event.includes("offer") || event === "unknown";

  // ── Idempotency: a re-delivered purchase webhook must not re-grant. ──
  if (isPurchase && paymentId) {
    const { data: existing } = await sb.from("purchases").select("id,student_id")
      .eq("external_payment_id", paymentId).maybeSingle();
    if (existing) {
      return json({ ok: true, event, deduped: true, external_payment_id: paymentId, auth: authMethod });
    }
  }

  // ── Find or create the auth user ──
  const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  let user = list?.users?.find((u: any) => (u.email || "").toLowerCase() === email);
  let isNewUser = false;
  if (!user) {
    const { data: created, error: err } = await sb.auth.admin.createUser({
      email, email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName, phone, source: "kajabi" },
    });
    if (err) return json({ error: err.message, event }, 500);
    user = created.user; isNewUser = true;
  }

  // ── GRANT PORTAL ACCESS: stamp program + enrollment on the profile. ──
  const program = deriveProgram(product, amountCents, payload.program);
  const isInPerson = program === "foundation";
  const profilePatch: Record<string, unknown> = {
    id: user!.id, email, portal_status: "active", program,
  };
  if (firstName) profilePatch.first_name = firstName;
  if (lastName) profilePatch.last_name = lastName;
  if (phone) profilePatch.phone = phone;
  if (kajabiId) profilePatch.kajabi_id = kajabiId;
  profilePatch.enrolled_at = new Date().toISOString();
  await sb.from("profiles").upsert(profilePatch, { onConflict: "id" });

  // ── Record the purchase (unique index on external_payment_id backs the dedupe). ──
  if (isPurchase) {
    await sb.from("purchases").insert({
      student_id: user!.id,
      product_key: "kajabi_" + (kajabiId || "unknown"),
      product_label: product, amount_cents: amountCents,
      payment_type: "one_time", external_payment_id: paymentId || null,
      contact_email: email, source: "kajabi", status: "completed", metadata: payload,
    });
    // Reconcile any earlier failed payment now that money landed.
    await sb.from("failed_payments")
      .update({ triage_status: "reconciled", triage_notes: "Auto-reconciled: a successful Kajabi payment came in for this email." })
      .eq("contact_email", email).eq("triage_status", "new");
  }

  // ── Buyer's portal access link (magic link → dashboard). ──
  const { data: linkData } = await sb.auth.admin.generateLink({
    type: "magiclink", email, options: { redirectTo: `${SITE_URL}/dashboard` },
  });
  const magicLink = linkData?.properties?.action_link || `${SITE_URL}/login`;

  // ── Email the buyer their back-end portal link + instructions. ──
  const greeting = firstName ? esc(firstName) : "there";
  const html =
    '<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#f4f7fb;margin:0;padding:0;color:#16294a;">' +
    '<div style="max-width:560px;margin:0 auto;padding:32px 24px;">' +
    '<div style="text-align:center;padding:18px;background:#16294a;border-radius:14px 14px 0 0;"><h1 style="color:#fff;font-family:Georgia,serif;font-size:24px;margin:0;">Premier Dental Academy of Longview</h1></div>' +
    '<div style="background:#fff;padding:32px 28px;border-radius:0 0 14px 14px;border:1px solid #e6edf6;border-top:0;">' +
    '<h2 style="font-family:Georgia,serif;color:#16294a;font-size:28px;margin:0 0 16px;">You\'re in, ' + greeting + '! 🎉</h2>' +
    '<p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Your <strong>' + esc(product) + '</strong> purchase is confirmed. Besides your course in Kajabi, you now have access to our <strong>student back-end portal</strong> on the website — that\'s where the hands-on practice software lives.</p>' +
    '<div style="background:#f4f7fb;border-radius:10px;padding:18px;margin-bottom:14px;border-left:4px solid #c9a961;">' +
    '<h3 style="margin:0 0 6px;font-size:16px;color:#16294a;">🖥️ Your PDA Student Portal (on the website)</h3>' +
    '<p style="margin:0 0 10px;font-size:14px;color:#1f3a63;">PDA Practice Pro &amp; ChairSide (practice-management trainers), the mock state-board exam, flashcards, and resources — tools that can\'t live in Kajabi.</p>' +
    '<a href="' + magicLink + '" style="display:inline-block;background:#16294a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">Open my Student Portal →</a>' +
    '<p style="margin:10px 0 0;font-size:12px;color:#64748b;">This one-tap link signs you in. After that, sign in any time at ' + SITE_URL + '/login with this email.</p>' +
    '</div>' +
    '<div style="background:#f4f7fb;border-radius:10px;padding:18px;margin-bottom:14px;border-left:4px solid #2b4a7a;">' +
    '<h3 style="margin:0 0 6px;font-size:16px;color:#16294a;">📚 Your Course in Kajabi</h3>' +
    '<p style="margin:0 0 10px;font-size:14px;color:#1f3a63;">Your video lessons, quizzes, and curriculum. Use this same email.</p>' +
    '<a href="' + KAJABI_LIBRARY + '" style="display:inline-block;background:#2b4a7a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">Open my Kajabi courses →</a>' +
    '</div>' +
    '<p style="font-size:15px;line-height:1.6;margin:24px 0 8px;">Save my number: <strong>(903) 913-6444</strong>. Text me anytime — lost, stuck, or excited. That\'s what I\'m here for.</p>' +
    '<p style="font-size:15px;line-height:1.6;margin:24px 0 0;">Talk soon,</p>' +
    '<p style="font-size:18px;line-height:1.4;margin:4px 0 0;font-family:Georgia,serif;color:#16294a;"><strong>Amanda Williams</strong></p>' +
    '<p style="font-size:13px;line-height:1.4;margin:2px 0 0;color:#1f3a63;">Founder + Lead Instructor, PDA</p>' +
    '</div>' +
    '<div style="text-align:center;padding:18px;font-size:12px;color:#1f3a63;">Premier Dental Academy of Longview · Longview, Texas<br/><a href="mailto:hello@premierdentalacademyoflongview.com" style="color:#2b4a7a;">hello@premierdentalacademyoflongview.com</a></div>' +
    '</div></body></html>';

  let emailResult: any = { sent: false, reason: "no_resend_key" };
  if (RESEND_API_KEY) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + RESEND_API_KEY, "content-type": "application/json" },
        body: JSON.stringify({ from: FROM, to: [email], subject: "Your PDA portal access is ready 🎉", html }),
      });
      const jr = await r.json().catch(() => ({}));
      emailResult = { sent: r.ok, id: jr?.id || null, status: r.status };
    } catch (e) {
      emailResult = { sent: false, error: String(e) };
    }
  }

  // ── Log the grant + send to the comms timeline. ──
  await sb.from("communications").insert({
    contact_name: `${firstName} ${lastName}`.trim() || email, contact_email: email, contact_phone: phone || null,
    channel: "email", direction: "outbound",
    body: `[AUTO] Kajabi ${event} → portal access granted (${program}). Product: ${product}. Amount: $${(amountCents / 100).toFixed(2)}. Access email ${emailResult.sent ? "sent ✓" : "NOT sent ✗"}.`,
    source: "kajabi-webhook", related_student_id: user!.id,
    metadata: { event, payment_id: paymentId, program, magic_link: magicLink, email_result: emailResult, auth: authMethod },
  });

  return json({
    ok: true, event, auth: authMethod, user_id: user!.id, email,
    is_new_user: isNewUser, program, in_person: isInPerson,
    portal_access: "granted", email_sent: emailResult.sent,
  });
});
