// Standalone $29 "Exam Pro" purchase.
//
// Charges $29 via Square, then flips profiles.exam_pro = true for the
// signed-in caller. UNLAUNCHED until tested: no public "Buy" button links here
// yet — the test page at /tools/exam-pro.html drives it manually.
//
// SAFETY (mirrors api/enroll.js):
//  (1) Caller MUST be a signed-in Supabase user (verify_jwt). We grant Pro to
//      that exact user id — never trust a client-supplied id.
//  (2) If the user is already Pro/enrolled/admin, we short-circuit and DO NOT
//      charge.
//  (3) Idempotency key is derived from user id + card nonce, so a re-submit
//      dedupes at Square and can't double-charge.
//  (4) Once the card is charged we NEVER return an error: if the entitlement
//      write fails we return ok=true with a `warning` so the buyer never sees
//      "failed" and pays again. Amanda grants Pro manually in that rare case.
//
// Reads SQUARE_ACCESS_TOKEN from the public.app_secrets table (same pattern
// as kajabi-my-courses / quo-*). SUPABASE_URL / SERVICE_ROLE_KEY / ANON_KEY
// are provided automatically by the platform.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const LOCATION_ID = "2P2ZE3FJNEYTV";
const SQUARE_BASE = "https://connect.squareup.com/v2";
const PRICE_CENTS = 2900;

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "content-type": "application/json" } });

async function idemKey(userId: string, sourceId: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`exam-pro::${userId}::${sourceId}`));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 45);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // (1) Identify the caller from their Supabase JWT. No user → no charge.
  const authHeader = req.headers.get("authorization") || "";
  const sbAuth = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = await sbAuth.auth.getUser();
  if (!user) return json({ error: "Please sign in before purchasing." }, 401);

  const sb = createClient(SUPABASE_URL, SERVICE_KEY);

  // (2) Already entitled? Don't charge.
  const { data: prof } = await sb
    .from("profiles")
    .select("exam_pro, program, is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (prof && (prof.exam_pro === true || prof.is_admin === true || (prof.program && prof.program !== "preview"))) {
    return json({ ok: true, alreadyPro: true, message: "You already have Exam Pro — no charge made." });
  }

  const { sourceId } = await req.json().catch(() => ({} as { sourceId?: string }));
  if (!sourceId) return json({ error: "Missing card details." }, 400);

  // Read the Square token from the same app_secrets table other functions use
  // (kajabi-my-courses, quo-*, etc.). Keeps creds out of Vercel/Edge env vars
  // and lets ops rotate them with a single SQL update.
  const { data: secretRow } = await sb
    .from("app_secrets")
    .select("value")
    .eq("key", "SQUARE_ACCESS_TOKEN")
    .maybeSingle();
  const SQUARE_ACCESS_TOKEN = secretRow?.value || "";
  if (!SQUARE_ACCESS_TOKEN) return json({ error: "Payments are not configured yet. No charge was made." }, 500);

  // (3) Charge $29. Deterministic idempotency key dedupes re-submits.
  const ik = await idemKey(user.id, sourceId);
  let payment: any;
  try {
    const res = await fetch(`${SQUARE_BASE}/payments`, {
      method: "POST",
      headers: {
        "Square-Version": "2025-04-16",
        "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idempotency_key: ik,
        source_id: sourceId,
        amount_money: { amount: PRICE_CENTS, currency: "USD" },
        location_id: LOCATION_ID,
        autocomplete: true,
        buyer_email_address: user.email || undefined,
        note: `Exam Pro (one-time $29) — ${user.email || user.id}`,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.errors?.[0]?.detail || data?.errors?.[0]?.code || `Square ${res.status}`;
      throw new Error(msg);
    }
    payment = data.payment;
  } catch (err) {
    console.error("[buy-exam-pro] charge failed:", err);
    return json({ error: (err as Error).message || "Your card was declined. No charge was made." }, 402);
  }

  // (4) CHARGED. Never return an error past this point.
  let warning: string | null = null;
  let granted = false;
  try {
    const { data: upd } = await sb.from("profiles").update({ exam_pro: true }).eq("id", user.id).select("id");
    granted = !!(upd && upd.length);
    if (!granted) {
      const { error: insErr } = await sb.from("profiles").insert({ id: user.id, email: user.email, exam_pro: true });
      granted = !insErr;
    }
  } catch (e) {
    console.error("[buy-exam-pro] entitlement write failed:", e);
  }
  if (!granted) {
    warning = "Your payment went through, but we couldn't unlock Pro automatically. Amanda has been notified and will enable it within 1 business day.";
  }

  try {
    await sb.from("communications").insert({
      contact_email: user.email,
      contact_name: user.email,
      channel: "system",
      direction: "inbound",
      body: `[AUTO] Exam Pro purchased ($29). Payment ${payment.id}. Granted: ${granted}${warning ? " — " + warning : ""}`,
      source: "square",
      metadata: { payment_id: payment.id, receipt_url: payment.receipt_url || null, user_id: user.id },
    });
  } catch (_) { /* logging is best-effort */ }

  return json({ ok: true, granted, paymentId: payment.id, receiptUrl: payment.receipt_url || null, warning });
});
