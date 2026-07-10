// buy-product v2 (deployed 2026-07-10; v1 captured from production 2026-07-07).
// This file is the deployed source of truth — if you change it, redeploy via
// Supabase MCP/CLI.
//
// buy-product: one checkout engine for every item in public.products.
// Charges via Square -> creates/loads the member's Supabase account -> unlocks the
// website entitlement -> auto-grants the matching Kajabi offer(s) (the sync) ->
// emails access (magic link + download/Kajabi/course link). Guest checkout (no
// pre-login): the buyer pays with their own card token, so verify_jwt is off.
// Idempotent at Square.
// Reads SQUARE_ACCESS_TOKEN + RESEND_API_KEY + Kajabi creds from public.app_secrets.
//
// v2 additions (ALL post-charge + best-effort — the never-error-after-charge rule holds):
//  - If the entitlement matches a website course (courses.entitlement_flag), the
//    access email links straight to /learn?c=<slug> instead of the generic member area.
//  - Purchase automations: upserts the buyer into public.subscribers, adds the
//    "buyer_<entitlement_flag>" tag, and runs the public.automations rules for the
//    purchase + tag_added triggers (subscribe/unsubscribe sequences, cascade tags).
//    This replicates the Kajabi buyer automations natively.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = "https://premierdentalacademyoflongview.com";
const KAJABI_LIBRARY = "https://premierdentalacademyoflongview.mykajabi.com/library";
const LOCATION_ID = "2P2ZE3FJNEYTV";
const SQUARE_BASE = "https://connect.squareup.com/v2";
const KAJABI_TOKEN_URL = "https://api.kajabi.com/v1/oauth/token";
const KAJABI_API = "https://api.kajabi.com/v1";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const FROM = "Amanda at Premier Dental Academy <hello@premierdentalacademyoflongview.com>";

const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, x-client-info, apikey, content-type", "access-control-allow-methods": "POST, OPTIONS" };
const J = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "content-type": "application/json" } });
const esc = (x: unknown) => String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

async function idemKey(productKey: string, email: string, sourceId: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`buy::${productKey}::${email}::${sourceId}`));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 45);
}

async function grantKajabiOffers(cfg: Record<string,string>, email: string, name: string, offerIds: string[]) {
  const cid = cfg["KAJABI_CLIENT_ID"]; const csec = cfg["KAJABI_CLIENT_SECRET"]; const site = cfg["KAJABI_SITE_ID"];
  if (!cid || !csec || !site || !offerIds.length) return { skipped: true };
  try {
    const tr = await fetch(KAJABI_TOKEN_URL, { method: "POST", headers: { "content-type": "application/json", "User-Agent": UA }, body: JSON.stringify({ grant_type: "client_credentials", client_id: cid, client_secret: csec }) });
    const tj = await tr.json(); const token = tj.access_token;
    if (!token) return { ok: false, step: "oauth" };
    const H = { Authorization: "Bearer " + token, "User-Agent": UA };
    const fu = KAJABI_API + "/contacts?filter[site_id]=" + encodeURIComponent(site) + "&filter[email_contains]=" + encodeURIComponent(email) + "&page[size]=20";
    const fr = await fetch(fu, { headers: { ...H, Accept: "application/json" } });
    const fj = await fr.json();
    let contactId: string | null = ((fj.data || []).find((c: any) => String(c.attributes?.email || "").toLowerCase() === email) || {}).id || null;
    if (!contactId) {
      const cr = await fetch(KAJABI_API + "/contacts", { method: "POST", headers: { ...H, "Content-Type": "application/vnd.api+json", Accept: "application/vnd.api+json" }, body: JSON.stringify({ data: { type: "contacts", attributes: { name: name || email, email }, relationships: { site: { data: { type: "sites", id: String(site) } } } } }) });
      const cj = await cr.json(); contactId = cj.data?.id || null;
      if (!contactId) return { ok: false, step: "create_contact" };
    }
    const gr = await fetch(KAJABI_API + "/contacts/" + contactId + "/relationships/offers", { method: "POST", headers: { ...H, "Content-Type": "application/vnd.api+json", Accept: "application/vnd.api+json" }, body: JSON.stringify({ data: offerIds.map((id) => ({ type: "offers", id })), meta: { send_customer_welcome_email: false } }) });
    return { ok: gr.ok, status: gr.status, offers: offerIds };
  } catch (e) { return { ok: false, error: String(e) }; }
}

// ── Purchase automations (post-charge, best-effort). Mirrors api/_automations.mjs. ──
async function ensureSubscriber(sb: any, email: string, firstName: string) {
  const { data: found } = await sb.from("subscribers").select("id,email,tags,status").eq("email", email).maybeSingle();
  if (found) return found;
  const { data: ins } = await sb.from("subscribers").insert({ email, first_name: firstName || null, source: "purchase" }).select("id,email,tags,status").maybeSingle();
  return ins;
}

async function applyRules(sb: any, triggerType: string, triggerValues: (string | null)[], subscriber: any, depth = 0): Promise<void> {
  if (depth > 4 || !subscriber) return;
  const { data: rules } = await sb.from("automations").select("id,name,trigger_value,action_type,action_value,runs").eq("active", true).eq("trigger_type", triggerType);
  const vals = triggerValues.filter(Boolean);
  const matched = (rules || []).filter((r: any) => r.trigger_value == null || vals.includes(r.trigger_value));
  for (const rule of matched) {
    try {
      if (rule.action_type === "add_tag") {
        const tags: string[] = Array.isArray(subscriber.tags) ? subscriber.tags : [];
        if (!tags.includes(rule.action_value)) {
          subscriber.tags = [...tags, rule.action_value];
          await sb.from("subscribers").update({ tags: subscriber.tags }).eq("id", subscriber.id);
          await applyRules(sb, "tag_added", [rule.action_value], subscriber, depth + 1);
        }
      } else if (rule.action_type === "subscribe_sequence") {
        const { data: seq } = await sb.from("email_sequences").select("id,key").eq("key", rule.action_value).maybeSingle();
        if (seq) {
          const { data: existing } = await sb.from("sequence_subscriptions").select("id").eq("sequence_id", seq.id).eq("email", subscriber.email).eq("status", "active").limit(1);
          if (!existing || !existing.length) {
            const { data: first } = await sb.from("sequence_emails").select("delay_days").eq("sequence_id", seq.id).eq("active", true).order("position", { ascending: true }).limit(1);
            const delayDays = first && first[0] ? Number(first[0].delay_days || 0) : 0;
            await sb.from("sequence_subscriptions").insert({ sequence_id: seq.id, subscriber_id: subscriber.id, email: subscriber.email, current_position: 0, status: "active", next_send_at: new Date(Date.now() + delayDays * 86400000).toISOString() });
          }
        }
      } else if (rule.action_type === "unsubscribe_sequence") {
        const { data: seq } = await sb.from("email_sequences").select("id").eq("key", rule.action_value).maybeSingle();
        if (seq) await sb.from("sequence_subscriptions").update({ status: "stopped" }).eq("sequence_id", seq.id).eq("email", subscriber.email).eq("status", "active");
      }
      await sb.from("automations").update({ runs: (rule.runs || 0) + 1 }).eq("id", rule.id);
    } catch (_) { /* each rule is best-effort */ }
  }
}

async function runPurchaseAutomations(sb: any, email: string, firstName: string, productKey: string, flag: string | null) {
  const subscriber = await ensureSubscriber(sb, email, firstName);
  if (!subscriber) return;
  // Buyer tag convention: buyer_<entitlement_flag> (matches the seeded tag_added rules),
  // added directly so its cascades fire even without an explicit purchase rule.
  if (flag) {
    const tag = "buyer_" + flag;
    const tags: string[] = Array.isArray(subscriber.tags) ? subscriber.tags : [];
    if (!tags.includes(tag)) {
      subscriber.tags = [...tags, tag];
      await sb.from("subscribers").update({ tags: subscriber.tags }).eq("id", subscriber.id);
      await applyRules(sb, "tag_added", [tag], subscriber, 1);
    }
  }
  // Purchase rules match on either the product key or the entitlement flag.
  await applyRules(sb, "purchase", [productKey, flag], subscriber, 0);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return J({ error: "Method not allowed" }, 405);
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  const body = await req.json().catch(() => ({}));
  const productKey = String(body.product_key || "").trim();
  const sourceId = String(body.sourceId || "").trim();
  const email = String(body.email || "").toLowerCase().trim();
  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  if (!productKey) return J({ error: "Missing product." }, 400);
  if (!email || !name) return J({ error: "Name and email are required." }, 400);
  if (!sourceId) return J({ error: "Missing card details." }, 400);

  const { data: product } = await sb.from("products").select("*").eq("key", productKey).eq("active", true).maybeSingle();
  if (!product) return J({ error: "That product isn't available." }, 404);

  const { data: secretRows } = await sb.from("app_secrets").select("key,value").in("key", ["SQUARE_ACCESS_TOKEN", "RESEND_API_KEY", "KAJABI_CLIENT_ID", "KAJABI_CLIENT_SECRET", "KAJABI_SITE_ID"]);
  const cfg: Record<string, string> = {}; (secretRows || []).forEach((r: any) => cfg[r.key] = r.value);
  const SQUARE_ACCESS_TOKEN = cfg["SQUARE_ACCESS_TOKEN"] || "";
  const RESEND_API_KEY = cfg["RESEND_API_KEY"] || "";
  if (!SQUARE_ACCESS_TOKEN) return J({ error: "Payments are not configured yet. No charge was made." }, 500);

  const [first, ...restName] = name.split(/\s+/); const last = restName.join(" ");

  // Find or create the member account so the purchase lands in their membership office.
  const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  let user = list?.users?.find((u: any) => (u.email || "").toLowerCase() === email);
  if (!user) {
    const { data: created } = await sb.auth.admin.createUser({ email, email_confirm: true, user_metadata: { first_name: first, last_name: last, phone, source: "buy-product" } });
    user = created?.user || undefined;
  }
  const flag = product.entitlement_flag as string | null;

  // Already owns this entitlement? Don't charge again.
  if (user && flag) {
    const { data: prof } = await sb.from("profiles").select(flag + ",is_admin").eq("id", user.id).maybeSingle();
    if (prof && ((prof as any)[flag] === true || (prof as any).is_admin === true)) {
      return J({ ok: true, alreadyOwned: true, product: product.name, message: "You already own this — no charge made." });
    }
  }

  // Charge via Square. Deterministic idempotency key dedupes re-submits.
  const ik = await idemKey(productKey, email, sourceId);
  let payment: any;
  try {
    const res = await fetch(`${SQUARE_BASE}/payments`, {
      method: "POST",
      headers: { "Square-Version": "2025-04-16", Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ idempotency_key: ik, source_id: sourceId, amount_money: { amount: product.price_cents, currency: "USD" }, location_id: LOCATION_ID, autocomplete: true, buyer_email_address: email, note: `${product.name} — website` }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { const msg = data?.errors?.[0]?.detail || data?.errors?.[0]?.code || `Square ${res.status}`; throw new Error(msg); }
    payment = data.payment;
  } catch (err) {
    return J({ error: (err as Error).message || "Your card was declined. No charge was made." }, 402);
  }

  // CHARGED. Never return an error past this point.
  let warning: string | null = null;
  let granted = false;
  if (user && flag) {
    try {
      const patch: Record<string, unknown> = {}; patch[flag] = true;
      const { data: upd } = await sb.from("profiles").update(patch).eq("id", user.id).select("id");
      granted = !!(upd && upd.length);
      if (!granted) { const ins: Record<string, unknown> = { id: user.id, email }; ins[flag] = true; const { error: insErr } = await sb.from("profiles").insert(ins); granted = !insErr; }
    } catch (_) { /* fall through to warning */ }
    if (!granted) warning = "Your payment went through, but we couldn't auto-unlock it. Amanda has been notified and will enable it within 1 business day.";
  }

  // Kajabi sync: grant the configured offers for this product.
  const offerIds: string[] = Array.isArray(product.kajabi_offer_ids) ? product.kajabi_offer_ids : [];
  let kajabi: unknown = null;
  if (offerIds.length) kajabi = await grantKajabiOffers(cfg, email, name, offerIds);

  // Website course for this entitlement? Access email should land there.
  let learnUrl: string | null = null;
  if (flag) {
    try {
      const { data: course } = await sb.from("courses").select("slug").eq("entitlement_flag", flag).eq("active", true).order("sort").limit(1).maybeSingle();
      if (course?.slug) learnUrl = SITE_URL + "/learn?c=" + course.slug;
    } catch (_) { /* fall back to member-area link */ }
  }

  // Purchase automations (buyer tag + sequences) — never blocks the purchase.
  try { await runPurchaseAutomations(sb, email, first, productKey, flag); } catch (_) {}

  // Optional signed download (private bucket) for downloadable products.
  let downloadUrl: string | null = null;
  if (product.storage_path) {
    const sp = String(product.storage_path);
    const slash = sp.indexOf("/"); const bucket = sp.slice(0, slash); const path = sp.slice(slash + 1);
    const { data: signed } = await sb.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 7);
    downloadUrl = signed?.signedUrl || null;
  }

  // Record the purchase (the membership office reads this).
  try {
    await sb.from("purchases").insert({ student_id: user?.id || null, product_key: productKey, product_label: product.name, amount_cents: product.price_cents, payment_type: "one_time", square_payment_id: payment.id, external_payment_id: payment.id, contact_email: email, source: "website", status: "completed", metadata: { receipt_url: payment.receipt_url || null, kajabi, granted, delivery: product.delivery } });
  } catch (_) { /* ledger is best-effort */ }

  // Magic-link sign-in to the membership office.
  let magicLink = SITE_URL + "/login";
  try { const { data: link } = await sb.auth.admin.generateLink({ type: "magiclink", email, options: { redirectTo: SITE_URL + "/dashboard" } }); magicLink = link?.properties?.action_link || magicLink; } catch (_) {}

  // Access email.
  const accessLine = learnUrl
    ? '<p style="font-size:14px;color:#1f3a63;margin:0 0 10px;">Your course lives right on our website — sign in with this same email any time.</p><a href="' + learnUrl + '" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">Start learning →</a>'
    : product.delivery === "kajabi"
    ? '<p style="font-size:14px;color:#1f3a63;margin:0 0 10px;">Your course is in Kajabi — open it any time with this same email.</p><a href="' + KAJABI_LIBRARY + '" style="display:inline-block;background:#2b4a7a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">Open my course →</a>'
    : downloadUrl
    ? '<a href="' + downloadUrl + '" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">Download now →</a><p style="font-size:12px;color:#64748b;margin:8px 0 0;">It’s also saved in your member area.</p>'
    : '<a href="' + magicLink + '" style="display:inline-block;background:#16294a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">Open my member area →</a>';
  const html = '<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#f4f7fb;margin:0;padding:0;color:#16294a;"><div style="max-width:560px;margin:0 auto;padding:32px 24px;"><div style="text-align:center;padding:18px;background:#16294a;border-radius:14px 14px 0 0;"><h1 style="color:#fff;font-family:Georgia,serif;font-size:22px;margin:0;">Premier Dental Academy of Longview</h1></div><div style="background:#fff;padding:32px 28px;border-radius:0 0 14px 14px;border:1px solid #e6edf6;border-top:0;"><h2 style="font-family:Georgia,serif;color:#16294a;font-size:26px;margin:0 0 12px;">You’re in! 🎉</h2><p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Thank you for your purchase of <strong>' + esc(product.name) + '</strong>.</p><div style="background:#f4f7fb;border-radius:10px;padding:18px;margin-bottom:14px;border-left:4px solid #c9a961;">' + accessLine + '</div><p style="font-size:14px;line-height:1.6;margin:18px 0 0;color:#475569;">Questions? Text Amanda at <strong>(903) 913-6444</strong>.</p></div></div></body></html>';
  let emailed = false;
  if (RESEND_API_KEY) { try { const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + RESEND_API_KEY, "content-type": "application/json" }, body: JSON.stringify({ from: FROM, to: [email], subject: "Your " + product.name + " is ready 🎉", html }) }); emailed = r.ok; } catch (_) {} }

  try { await sb.from("communications").insert({ contact_email: email, contact_name: name, channel: "email", direction: "outbound", body: "[AUTO] Purchased " + product.name + " ($" + (product.price_cents/100).toFixed(2) + "). Granted: " + granted + ". Email " + (emailed?"sent":"not sent") + ".", source: "buy-product", metadata: { payment_id: payment.id, product: productKey, kajabi } }); } catch (_) {}

  return J({ ok: true, product: product.name, granted, kajabi, downloadUrl, learnUrl, receiptUrl: payment.receipt_url || null, magicLink, emailed, warning });
});
