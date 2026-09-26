// square-webhook v6 (2026-08-30): on a COMPLETED Square payment / PAID invoice ->
//   (1) send welcome (enroll-welcome, deduped via welcome_log)
//   (2) grant Kajabi offers for the student's path
//   (3) NEW — AUTO-ENROLL on the website portal: flip profiles.program, create the
//       enrollments row, record the purchase, mark the lead enrolled. Idempotent,
//       so installment re-charges and event re-fires are safe.
// Why v6: Square-side payments (invoices/subscriptions/arranged deals) previously
// sent the welcome but NEVER activated the website account — students paid and
// still hit the "enroll" wall (cases: two students, late Aug 2026).
// Also fixes: online/in-person path detection for arranged amounts (reads the
// Square order/invoice line-item names instead of guessing from amount), and the
// welcome-dedupe early-return that skipped enrollment for already-welcomed students.
// Rollback: redeploy square-webhook v5 (copy saved in the project:
// claude/square-webhook-v5-ROLLBACK.ts).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FN_BASE = SUPABASE_URL + "/functions/v1";
const SQUARE_BASE = "https://connect.squareup.com/v2";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const KAJABI_TOKEN_URL = "https://api.kajabi.com/v1/oauth/token";
const KAJABI_API = "https://api.kajabi.com/v1";
// Offer IDs to grant per path (verified via Kajabi API)
const OFFERS_IN_PERSON = ["2150981058", "2150926742"]; // PDA RDA Full Access + PDA Students
const OFFERS_ONLINE = ["2151013475"]; // Online Dental Assistant Program (Online Only)

async function hmacB64(key: string, msg: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

// Full customer lookup: note (cohort), email, and name — all used as fallbacks
// when the payment/invoice object doesn't carry them (phone + terminal sales).
async function getCustomer(token: string, customerId: string): Promise<{ note: string; email: string; first: string; last: string; phone: string }> {
  const empty = { note: "", email: "", first: "", last: "", phone: "" };
  if (!token || !customerId) return empty;
  try {
    const r = await fetch(SQUARE_BASE + "/customers/" + customerId, { headers: { "Square-Version": "2025-04-16", Authorization: "Bearer " + token } });
    const j = await r.json().catch(() => ({}));
    const c = j?.customer || {};
    return {
      note: c.note || "",
      email: String(c.email_address || "").toLowerCase(),
      first: c.given_name || "",
      last: c.family_name || "",
      phone: c.phone_number || ""
    };
  } catch (_) { return empty; }
}

// NEW v6: read the Square order's line-item/title text so arranged-price payments
// (any amount) still classify online vs in-person from what was actually sold.
async function getOrderText(token: string, orderId: string): Promise<string> {
  if (!token || !orderId) return "";
  try {
    const r = await fetch(SQUARE_BASE + "/orders/" + orderId, { headers: { "Square-Version": "2025-04-16", Authorization: "Bearer " + token } });
    const j = await r.json().catch(() => ({}));
    const o = j?.order || {};
    const items = (o.line_items || []).map((li: any) => [li.name, li.note, li.variation_name].filter(Boolean).join(" "));
    return items.join(" ");
  } catch (_) { return ""; }
}

async function grantKajabiOffers(cfg: Record<string,string>, email: string, name: string, isOnline: boolean) {
  const cid = cfg["KAJABI_CLIENT_ID"]; const csec = cfg["KAJABI_CLIENT_SECRET"]; const site = cfg["KAJABI_SITE_ID"];
  if (!cid || !csec || !site) return { skipped: true, reason: "kajabi creds missing" };
  try {
    const tr = await fetch(KAJABI_TOKEN_URL, { method: "POST", headers: { "content-type": "application/json", "User-Agent": UA }, body: JSON.stringify({ grant_type: "client_credentials", client_id: cid, client_secret: csec }) });
    const tj = await tr.json();
    const token = tj.access_token;
    if (!token) return { ok: false, step: "oauth", detail: tj };
    const H = { Authorization: "Bearer " + token, "User-Agent": UA };
    const fu = KAJABI_API + "/contacts?filter[site_id]=" + encodeURIComponent(site) + "&filter[email_contains]=" + encodeURIComponent(email) + "&page[size]=20";
    const fr = await fetch(fu, { headers: { ...H, Accept: "application/json" } });
    const fj = await fr.json();
    let contactId: string | null = ((fj.data || []).find((c: any) => String(c.attributes?.email || "").toLowerCase() === email) || {}).id || null;
    if (!contactId) {
      const cr = await fetch(KAJABI_API + "/contacts", { method: "POST", headers: { ...H, "Content-Type": "application/vnd.api+json", Accept: "application/vnd.api+json" }, body: JSON.stringify({ data: { type: "contacts", attributes: { name: name || email, email }, relationships: { site: { data: { type: "sites", id: String(site) } } } } }) });
      const cj = await cr.json();
      contactId = cj.data?.id || null;
      if (!contactId) return { ok: false, step: "create_contact", detail: cj };
    }
    const offerIds = isOnline ? OFFERS_ONLINE : OFFERS_IN_PERSON;
    const gr = await fetch(KAJABI_API + "/contacts/" + contactId + "/relationships/offers", { method: "POST", headers: { ...H, "Content-Type": "application/vnd.api+json", Accept: "application/vnd.api+json" }, body: JSON.stringify({ data: offerIds.map((id) => ({ type: "offers", id })), meta: { send_customer_welcome_email: false } }) });
    return { ok: gr.ok, status: gr.status, contactId, offers: offerIds };
  } catch (e) { return { ok: false, error: String(e) }; }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const raw = await req.text();

  const { data: rows } = await sb.from("app_secrets").select("key,value").in("key", ["SQUARE_WEBHOOK_SIGNATURE_KEY", "SQUARE_WEBHOOK_URL", "ENROLL_WELCOME_SECRET", "SQUARE_ACCESS_TOKEN", "KAJABI_CLIENT_ID", "KAJABI_CLIENT_SECRET", "KAJABI_SITE_ID"]);
  const cfg: Record<string, string> = {}; (rows || []).forEach((r: any) => cfg[r.key] = r.value);
  const sigKey = cfg["SQUARE_WEBHOOK_SIGNATURE_KEY"]; const notifyUrl = cfg["SQUARE_WEBHOOK_URL"]; const enrollSecret = cfg["ENROLL_WELCOME_SECRET"]; const sqToken = cfg["SQUARE_ACCESS_TOKEN"];
  if (!sigKey || !notifyUrl) return new Response(JSON.stringify({ ok: false, reason: "webhook not configured" }), { status: 200, headers: { "content-type": "application/json" } });

  const sig = req.headers.get("x-square-hmacsha256-signature") || "";
  const expected = await hmacB64(sigKey, notifyUrl + raw);
  if (sig !== expected) return new Response("bad signature", { status: 401 });

  let evt: any = {}; try { evt = JSON.parse(raw); } catch (_) {}
  const type: string = evt?.type || "";
  const obj: any = evt?.data?.object || {};
  let email = ""; let amountCents = 0; let customerId = ""; let orderId = ""; let titleBlob = "";
  if (type.startsWith("payment")) {
    const p = obj.payment || {};
    if (String(p.status || "").toUpperCase() !== "COMPLETED") return new Response("ignored", { status: 200 });
    email = String(p.buyer_email_address || "").toLowerCase();
    amountCents = p.amount_money?.amount || 0;
    customerId = p.customer_id || "";
    orderId = p.order_id || "";
    titleBlob = String(p.note || "");
  } else if (type.startsWith("invoice")) {
    const inv = obj.invoice || {};
    const st = String(inv.status || "").toUpperCase();
    if (st !== "PAID" && type !== "invoice.payment_made") return new Response("ignored", { status: 200 });
    email = String(inv.primary_recipient?.email_address || "").toLowerCase();
    customerId = inv.primary_recipient?.customer_id || inv.customer_id || "";
    orderId = inv.order_id || "";
    titleBlob = [inv.title, inv.description].filter(Boolean).join(" ");
  } else {
    return new Response("ignored", { status: 200 });
  }

  // FALLBACK (phone / virtual-terminal payments): the payment object often has
  // no buyer email — pull it (and the name) from the Square customer record.
  const cust = customerId ? await getCustomer(sqToken, customerId) : { note: "", email: "", first: "", last: "", phone: "" };
  if (!email && cust.email) email = cust.email;

  // v6: welcome dedupe no longer short-circuits the whole handler — a student who
  // was welcomed but never enrolled (a student's case) must still get enrolled below.
  let alreadyWelcomed = false;
  if (email) {
    const { data: already } = await sb.from("welcome_log").select("email").eq("email", email).maybeSingle();
    alreadyWelcomed = !!already;
  }

  // Resolve the student's cohort from the Square customer note ("Cohort: <name>") -> path + start date.
  let first = "", last = "", phone = "", path = "", className = "", startDate = "";
  let cohortId: string | null = null;
  const m = (cust.note || "").match(/Cohort:\s*(.+)/i);
  const cohortName = m ? m[1].trim() : "";
  if (cohortName) {
    const { data: co } = await sb.from("cohorts").select("id,name,start_date,delivery_mode").eq("name", cohortName).maybeSingle();
    if (co) { cohortId = co.id; className = co.name; startDate = co.start_date || ""; path = (String(co.delivery_mode || "").toLowerCase() === "online") ? "online" : "in-person"; }
  }
  // Names/phone from the most recent matching lead; Square customer record as fallback.
  if (email) {
    const { data: lead } = await sb.from("leads").select("first_name,last_name,phone,path_preference").eq("email", email).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (lead) { first = lead.first_name || ""; last = lead.last_name || ""; phone = lead.phone || ""; if (!path) path = lead.path_preference || ""; }
  }
  if (!first && cust.first) first = cust.first;
  if (!last && cust.last) last = cust.last;
  if (!phone && cust.phone) phone = cust.phone;
  // v6 path detection: what was actually SOLD beats amount guessing. Order/invoice
  // line-item names carry "Online" for the online program (incl. arranged-price
  // subscriptions where the amount is $100/$97 and matches nothing standard).
  if (!path && orderId) {
    const orderText = await getOrderText(sqToken, orderId);
    if (orderText) titleBlob += " " + orderText;
  }
  if (!path && /online/i.test(titleBlob)) path = "online";
  if (!path && /in.?person/i.test(titleBlob)) path = "in-person";
  if (!path) path = (amountCents === 39700 || amountCents === 99700) ? "online" : "in-person";
  const isOnline = String(path).toLowerCase().includes("online");

  // 1) Welcome email (deduped + supply list + start date) via enroll-welcome.
  let welcome: any = null; let welcomed = false;
  if (email && enrollSecret && !alreadyWelcomed) {
    try {
      const r = await fetch(FN_BASE + "/enroll-welcome", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ secret: enrollSecret, email, first_name: first, last_name: last, phone, path, class_name: className || undefined, start_date: startDate || undefined }) });
      welcome = await r.json().catch(() => ({ status: r.status }));
      welcomed = !!(welcome && welcome.ok && !welcome.deduped);
    } catch (e) { welcome = { error: String(e) }; }
  } else if (alreadyWelcomed) {
    welcome = { deduped: true };
  }

  // 2) Grant Kajabi offers for this path -- only on the first (non-deduped) welcome.
  let grant: any = null;
  if (email && welcomed) grant = await grantKajabiOffers(cfg, email, (first + " " + last).trim(), isOnline);

  // 3) v6 AUTO-ENROLL on the website portal — idempotent; never blocks the welcome flow.
  let autoEnroll: any = { skipped: true };
  if (email) {
    try {
      const { data: prof } = await sb.from("profiles").select("id,program,portal_status,online_program,first_name,last_name").eq("email", email).maybeSingle();
      if (prof) {
        const updates: Record<string, unknown> = {};
        if (!prof.program || prof.program === "preview") updates.program = isOnline ? "career_track" : "foundation";
        if (isOnline && !prof.online_program) updates.online_program = true;
        if ((prof.portal_status || "active") !== "active") updates.portal_status = "active";
        if (Object.keys(updates).length) {
          updates.enrolled_at = new Date().toISOString();
          await sb.from("profiles").update(updates).eq("id", prof.id);
        }
        const { data: en } = await sb.from("enrollments").select("id").eq("student_id", prof.id).limit(1);
        let enrollmentCreated = false;
        if (!en || !en.length) {
          await sb.from("enrollments").insert({
            student_id: prof.id,
            cohort_id: cohortId,
            status: "active",
            delivery: isOnline ? "online" : "in_person",
            source: "square_webhook_auto",
            student_name: ((first || prof.first_name || "") + " " + (last || prof.last_name || "")).trim() || email,
            enrolled_at: new Date().toISOString(),
            notes: "AUTO-ENROLLED by square-webhook v6 on " + type + " ($" + (amountCents / 100).toFixed(2) + (className ? ", cohort " + className : "") + "). Verify the plan/terms in Square; arranged-price details live there."
          });
          enrollmentCreated = true;
        }
        const payId = obj?.payment?.id || obj?.invoice?.id || null;
        let purchaseRecorded = false;
        if (payId && amountCents > 0) {
          const { data: existing } = await sb.from("purchases").select("id").eq("square_payment_id", payId).maybeSingle();
          if (!existing) {
            await sb.from("purchases").insert({
              student_id: prof.id,
              product_key: isOnline ? "online_program" : "in_person_program",
              product_label: "PDA RDA Program — " + (isOnline ? "Online" : "In-Person"),
              amount_cents: amountCents,
              payment_type: type.startsWith("invoice") ? "subscription" : "one_time",
              square_payment_id: payId,
              status: "completed",
              source: "square_webhook",
              contact_email: email
            });
            purchaseRecorded = true;
          }
        }
        await sb.from("leads").update({ pipeline_stage: "enrolled", status: "converted" }).eq("email", email).neq("pipeline_stage", "enrolled");
        autoEnroll = { ok: true, profile: prof.id, updates: Object.keys(updates), enrollmentCreated, purchaseRecorded };
      } else {
        // No website account yet — loud flag, human finishes account creation.
        await sb.from("admin_tasks").insert({
          title: "Paid student has NO website account — create + enroll manually",
          notes: "Email: " + email + "\nName: " + ((first + " " + last).trim() || "unknown") + "\nPath: " + path + "\nAmount: $" + (amountCents / 100).toFixed(2) + "\nEvent: " + type + "\nSquare customer: " + (customerId || "unknown") + "\nCreate the account in Admin → Students, then re-run or enroll manually.",
          priority: 1, status: "open"
        });
        autoEnroll = { ok: false, reason: "no_profile", flagged: true };
      }
    } catch (e) { autoEnroll = { ok: false, error: String(e) }; }
  }

  // Loud flag when we STILL couldn't find an email — creates an admin task instead of failing silently.
  if (!email) {
    await sb.from("admin_tasks").insert({
      title: "Square payment with NO email — student may be missing account/welcome",
      notes: "Event: " + type + "\nAmount: $" + (amountCents / 100).toFixed(2) + "\nSquare customer: " + (customerId || "unknown") + (cohortName ? "\nCohort note: " + cohortName : "") + "\nAdd the student manually from Admin → Students.",
      priority: 1, status: "open"
    });
  }

  await sb.from("communications").insert({ contact_email: email || null, contact_name: (first + " " + last).trim() || email || null, channel: "note", direction: "inbound", body: "[SQUARE WEBHOOK v6] " + type + " -> welcome " + (welcomed ? "sent" : "(deduped/none)") + " · kajabi " + (grant ? "grant" : "skip") + " · portal " + (autoEnroll?.ok ? "auto-enrolled/verified" : (autoEnroll?.reason || "skip")) + " (" + (isOnline ? "online" : "in-person") + (startDate ? ", starts " + startDate : "") + ")", source: "square_webhook", metadata: { welcome, grant, autoEnroll, cohort: cohortName || null, start_date: startDate || null, amount_cents: amountCents } });

  return new Response(JSON.stringify({ ok: true, type, email, path, start_date: startDate || null, welcome, grant, autoEnroll }), { status: 200, headers: { "content-type": "application/json" } });
});
