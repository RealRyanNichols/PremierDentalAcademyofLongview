// Standalone $29 "Exam Pro" purchase.
//
// Charges $29 via Square, then flips profiles.exam_pro = true for the
// signed-in caller. Public buy page: /exam-pro.
//
// SAFETY (mirrors api/enroll.js):
//  (1) Caller MUST be a signed-in Supabase user (verify_jwt). We grant Pro to
//      that exact user id — never trust a client-supplied id.
//  (2) If the user is already Pro/enrolled/admin, we short-circuit and DO NOT
//      charge. Same if a completed exam_pro purchase already exists (covers
//      the paid-but-ungranted warning path).
//  (3) A pending purchases row is written BEFORE the Square charge; a retry after
//      a lost response finds it (guard 2c) and reconciles instead of charging
//      again, so a post-charge DB blip can't cause a double charge. The Square
//      idempotency key (user id + nonce) additionally dedupes exact re-submits.
//  (4) Once the card is charged we NEVER return an error: if the entitlement
//      write fails we return ok=true with a `warning`, record the purchase,
//      and open an urgent admin task so Amanda grants Pro manually.
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

  // (2b) Paid before but the entitlement flip failed (warning path)? The
  // purchases row is the durable receipt — never charge the same buyer twice.
  const { data: prevPurchase } = await sb
    .from("purchases")
    .select("id")
    .eq("student_id", user.id)
    .eq("product_key", "exam_pro")
    .eq("status", "completed")
    .limit(1);
  if (prevPurchase && prevPurchase.length) {
    return json({ ok: true, alreadyPro: true, message: "You already paid for Exam Pro — no new charge was made. If it isn't unlocked yet, text Amanda at (903) 913-6444." });
  }

  // (2c) A prior attempt left a PENDING marker: it charged (or is mid-flight) but
  // never finalized because a post-charge DB write was lost. Do NOT charge again —
  // reconcile the entitlement and flag a Square audit instead of risking a second
  // charge. (A rare abandoned/crashed pre-charge marker with no real charge means a
  // free grant here — acceptable vs. double-charging a paying customer; the audit
  // task lets Amanda catch it.)
  const { data: pendingPrev } = await sb
    .from("purchases")
    .select("id")
    .eq("student_id", user.id)
    .eq("product_key", "exam_pro")
    .eq("status", "pending")
    .limit(1);
  if (pendingPrev && pendingPrev.length) {
    let g = false;
    try { const { data: u2 } = await sb.from("profiles").update({ exam_pro: true }).eq("id", user.id).select("id"); g = !!(u2 && u2.length); } catch (_) { /* best effort */ }
    try {
      await sb.from("admin_tasks").insert({
        title: `Reconcile Exam Pro: ${user.email || user.id} has a pending purchase (payment response was lost). Verify exactly one $29 Square charge; refund any duplicate.`,
        priority: 2,
        status: "open",
        notes: "A pre-charge marker exists with no completed record. The student was granted access to avoid blocking them — confirm one Square charge landed.",
      });
    } catch (_) { /* best effort */ }
    return json({ ok: true, alreadyPro: true, granted: g, message: "Your payment is already being processed — no new charge was made. If Exam Pro isn't unlocked, text Amanda at (903) 913-6444." });
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

  // Pre-charge durable marker. If a post-charge DB write is later lost, this
  // pending row still blocks a retry from charging again (via guard 2c). If we
  // can't even write this, fail CLOSED — never touch the card without a record.
  let pendingId: string | null = null;
  {
    const { data: pend, error: pendErr } = await sb
      .from("purchases")
      .insert({
        student_id: user.id,
        product_key: "exam_pro",
        product_label: "Exam Pro",
        amount_cents: PRICE_CENTS,
        payment_type: "one_time",
        status: "pending",
        contact_email: user.email,
        source: "site",
        metadata: { stage: "pre_charge" },
      })
      .select("id")
      .maybeSingle();
    if (pendErr || !pend) {
      console.error("[buy-exam-pro] pending marker insert failed:", pendErr);
      return json({ error: "We couldn't start checkout. No charge was made — please try again." }, 500);
    }
    pendingId = pend.id;
  }

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
    // No charge landed — clear the pending marker so a legit retry (e.g. a
    // different card) isn't blocked by guard (2c).
    if (pendingId) { try { await sb.from("purchases").delete().eq("id", pendingId); } catch (_) { /* best effort */ } }
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

  // Finalize the pre-charge marker → completed (feeds the KPI revenue tile and
  // the (2b) double-charge guard). If this write is lost, the row stays 'pending'
  // and guard (2c) reconciles on the buyer's next visit — no second charge.
  try {
    if (pendingId) {
      await sb.from("purchases").update({
        status: "completed",
        external_payment_id: payment.id,
        metadata: { receipt_url: payment.receipt_url || null, granted },
      }).eq("id", pendingId);
    }
  } catch (e) {
    console.error("[buy-exam-pro] purchases finalize failed:", e);
  }

  // Make "Amanda has been notified" true: an urgent task shows up on the
  // admin home + KPI cockpit until she flips the flag.
  if (!granted) {
    try {
      await sb.from("admin_tasks").insert({
        title: `Grant Exam Pro: ${user.email || user.id} paid $29 but auto-grant failed (payment ${payment.id})`,
        priority: 1,
        status: "open",
        notes: "Set profiles.exam_pro = true for this student, then close this task.",
      });
    } catch (e) {
      console.error("[buy-exam-pro] admin_tasks insert failed:", e);
    }
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
