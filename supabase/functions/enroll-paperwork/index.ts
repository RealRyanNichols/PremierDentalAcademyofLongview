// enroll-paperwork: Day-One electronic enrollment paperwork (/paperwork page).
// A brand-new student fills the form on her phone in class; this function:
//   1) validates + honeypot-guards the submission
//   2) creates (or finds) her Supabase account and stamps the profile
//      (name, phone, program='in_person', cohort, enrolled_at)
//   3) stores the signed paperwork in public.enrollment_forms (admin-only
//      reads at /admin/paperwork)
//   4) fires the existing enroll-welcome function (branded welcome email +
//      supply-list PDF + magic sign-in link + notifies hello@)
//   5) tells the page what to do next for payment (cash recorded for Amanda /
//      card-plan students get sent to the /enroll checkout)
// Public (students have no account yet) — protected by validation, honeypot,
// and the fact that it only ever creates accounts + paperwork rows.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, x-client-info, apikey, content-type", "access-control-allow-methods": "POST, OPTIONS" };
const J = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "content-type": "application/json" } });

const PAYMENT_CHOICES = new Set(["cash_paid_full", "cash_deposit_plan", "card_plan", "card_full", "wioa", "other"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return J({ error: "Method not allowed" }, 405);
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  const b = await req.json().catch(() => ({}));
  if (String(b.website || "").trim()) return J({ ok: true }); // honeypot — pretend success

  const first = String(b.first_name || "").trim().slice(0, 80);
  const last = String(b.last_name || "").trim().slice(0, 80);
  const email = String(b.email || "").toLowerCase().trim().slice(0, 200);
  const phone = String(b.phone || "").trim().slice(0, 40);
  const signature = String(b.signature || "").trim().slice(0, 160);
  const paymentChoice = String(b.payment_choice || "").trim();
  if (!first || !last) return J({ error: "Please enter your first and last name." }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return J({ error: "Please enter a valid email — it becomes your student login." }, 400);
  if (!phone) return J({ error: "Please enter your phone number." }, 400);
  if (b.agreed_terms !== true) return J({ error: "Please read and agree to the enrollment terms." }, 400);
  if (!signature) return J({ error: "Please type your full legal name as your signature." }, 400);
  if (!PAYMENT_CHOICES.has(paymentChoice)) return J({ error: "Please pick how you're handling tuition." }, 400);

  const cohortName = String(b.cohort_name || "").trim().slice(0, 120) || null;
  const startDate = /^\d{4}-\d{2}-\d{2}$/.test(String(b.start_date || "")) ? String(b.start_date) : null;
  const dob = /^\d{4}-\d{2}-\d{2}$/.test(String(b.dob || "")) ? String(b.dob) : null;

  // ── Account: find or create; stamp the profile as an enrolled in-person student ──
  const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  let user = list?.users?.find((u: { email?: string }) => (u.email || "").toLowerCase() === email);
  let createdAccount = false;
  if (!user) {
    const { data: created, error: cErr } = await sb.auth.admin.createUser({
      email, email_confirm: true,
      user_metadata: { first_name: first, last_name: last, phone, source: "day-one-paperwork" },
    });
    if (cErr || !created?.user) return J({ error: "Couldn't create your student account — flag Amanda and she'll sort it. Nothing was lost." }, 500);
    user = created.user;
    createdAccount = true;
  }

  const profilePatch: Record<string, unknown> = {
    first_name: first, last_name: last, phone,
    program: "in_person",
    enrolled_at: new Date().toISOString(),
  };
  if (cohortName) profilePatch.cohort = cohortName;
  const { data: upd } = await sb.from("profiles").update(profilePatch).eq("id", user.id).select("id");
  if (!upd || !upd.length) {
    await sb.from("profiles").insert({ id: user.id, email, ...profilePatch }).then(() => {}, () => {});
  }

  // ── Store the signed paperwork ──
  const { data: formRow, error: fErr } = await sb.from("enrollment_forms").insert({
    student_id: user.id,
    first_name: first, last_name: last, email, phone,
    dob, address: String(b.address || "").slice(0, 400) || null,
    emergency_name: String(b.emergency_name || "").slice(0, 120) || null,
    emergency_phone: String(b.emergency_phone || "").slice(0, 40) || null,
    cohort_name: cohortName, start_date: startDate,
    payment_choice: paymentChoice,
    payment_notes: String(b.payment_notes || "").slice(0, 500) || null,
    agreed_terms: true,
    signature,
    user_agent: (req.headers.get("user-agent") || "").slice(0, 300),
    extra: b.extra && typeof b.extra === "object" ? b.extra : null,
  }).select("id").single();
  if (fErr) return J({ error: "Couldn't save your paperwork — show this screen to Amanda: " + fErr.message }, 500);

  // ── Welcome email (existing engine: branded welcome + supply list + magic link + admin notify) ──
  let welcome: unknown = { sent: false };
  try {
    const { data: secretRow } = await sb.from("app_secrets").select("value").eq("key", "ENROLL_WELCOME_SECRET").maybeSingle();
    if (secretRow?.value) {
      const wr = await fetch(SUPABASE_URL + "/functions/v1/enroll-welcome", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          secret: secretRow.value, email, first_name: first, last_name: last, phone,
          path: "in-person", class_name: cohortName || "In-Person (Longview campus)", start_date: startDate,
        }),
      });
      welcome = { sent: wr.ok, status: wr.status };
    }
  } catch (e) { welcome = { sent: false, error: String(e) }; }

  // ── Paper trail for the office ──
  const PAY_LABEL: Record<string, string> = {
    cash_paid_full: "PAID IN FULL — CASH (log it in Square)",
    cash_deposit_plan: "Cash deposit + payment plan (set the plan up in Square)",
    card_plan: "Card — $500 down + plan (sent to /enroll checkout)",
    card_full: "Card — $3,000 pay in full (sent to /enroll checkout)",
    wioa: "WIOA / Workforce Solutions funding",
    other: "Other — see notes",
  };
  await sb.from("communications").insert({
    contact_email: email, contact_name: first + " " + last, channel: "note", direction: "inbound",
    body: "[DAY-ONE PAPERWORK] " + first + " " + last + " signed enrollment paperwork" +
      (cohortName ? " for " + cohortName : "") + ". Payment: " + (PAY_LABEL[paymentChoice] || paymentChoice) +
      (b.payment_notes ? " · Notes: " + String(b.payment_notes).slice(0, 300) : "") +
      ". Account " + (createdAccount ? "created" : "already existed") + ". Form id " + formRow.id + ".",
    source: "enroll-paperwork",
    metadata: { form_id: formRow.id, payment_choice: paymentChoice, cohort: cohortName },
  }).then(() => {}, () => {});

  // Tell the page what happens next.
  const needsCheckout = paymentChoice === "card_plan" || paymentChoice === "card_full";
  return J({
    ok: true,
    createdAccount,
    formId: formRow.id,
    welcome,
    next: needsCheckout
      ? { action: "checkout", url: "/enroll?plan=in-person&paymode=" + (paymentChoice === "card_full" ? "full" : "plan") }
      : { action: "done" },
  });
});
