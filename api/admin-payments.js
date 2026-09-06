// /api/admin-payments — READ-ONLY Square feed for /admin/payments.
//
// Why this exists: `public.purchases` is only what our webhooks managed to record.
// Real money lives in Square. This endpoint lets the admin page show, side by side,
// what Square actually collected (payments, invoices, subscriptions) and what our
// database knows, so gaps ("in Square but not in our records", "down payment with
// no balance schedule", failed charges) are visible instead of silently wrong.
//
// It never charges, refunds, or writes anything — GET only, Square read scopes only.
// Auth: the caller's Supabase access token must belong to an admin. Admin is proven
// by the `is_admin` JWT app_metadata claim (kept in sync by the DB trigger
// sync_admin_claim) or, when a service-role key is configured, by profiles.is_admin.
// No card data is returned beyond what Square shows on a receipt (brand/last 4 are
// dropped entirely here).
//
// Env (Vercel): SQUARE_ACCESS_TOKEN (already required by api/enroll.js).
// Rollback: delete this file and the /admin/payments page.
import { authUser, bearer, sb } from './_common.mjs';

const SQUARE_BASE = 'https://connect.squareup.com/v2';
const SQUARE_VERSION = '2025-04-16';
const LOCATION_ID = '2P2ZE3FJNEYTV'; // same location api/enroll.js charges against
const MAX_PAGES = 5;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function callerIsAdmin(req) {
  const user = await authUser(bearer(req));
  if (!user?.id) return false;
  if (user.app_metadata?.is_admin === true) return true;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const rows = await sb('profiles', { query: { id: `eq.${user.id}`, select: 'id,is_admin' } });
      return Array.isArray(rows) && rows[0]?.is_admin === true;
    } catch { return false; }
  }
  return false;
}

async function square(path, { method = 'GET', body } = {}) {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const res = await fetch(SQUARE_BASE + path, {
    method,
    headers: { 'Square-Version': SQUARE_VERSION, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.errors?.[0]?.detail || `Square ${method} ${path} ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

function trimPayment(p) {
  return {
    id: p.id,
    created_at: p.created_at,
    amount_cents: p.amount_money?.amount ?? 0,
    currency: p.amount_money?.currency || 'USD',
    status: p.status,
    product: p.application_details?.square_product || null, // ECOMMERCE_API (website), INVOICES, SQUARE_POS…
    buyer_email: (p.buyer_email_address || '').toLowerCase() || null,
    buyer_name: [p.billing_address?.first_name, p.billing_address?.last_name].filter(Boolean).join(' ') || null,
    customer_id: p.customer_id || null,
    order_id: p.order_id || null,
    note: p.note || null,
    receipt_url: p.receipt_url || null,
    error: p.status === 'FAILED' ? (p.card_details?.errors?.[0]?.code || 'DECLINED') : null,
  };
}

function trimInvoice(inv) {
  const reqs = inv.payment_requests || [];
  const total = reqs.reduce((a, r) => a + (r.computed_amount_money?.amount || 0), 0);
  const paid = reqs.reduce((a, r) => a + (r.total_completed_amount_money?.amount || 0), 0);
  const open = reqs.filter((r) => (r.total_completed_amount_money?.amount || 0) < (r.computed_amount_money?.amount || 0));
  return {
    id: inv.id,
    invoice_number: inv.invoice_number || null,
    status: inv.status,
    created_at: inv.created_at,
    customer_id: inv.primary_recipient?.customer_id || null,
    email: (inv.primary_recipient?.email_address || '').toLowerCase() || null,
    title: inv.title || null,
    total_cents: total,
    paid_cents: paid,
    next_due: open[0]?.due_date || null,
    open_count: open.length,
    subscription_id: inv.subscription_id || null,
    public_url: inv.public_url || null,
  };
}

function trimSubscription(s) {
  return {
    id: s.id,
    status: s.status,
    customer_id: s.customer_id || null,
    start_date: s.start_date || null,
    charged_through_date: s.charged_through_date || null,
    canceled_date: s.canceled_date || null,
    plan_variation_id: s.plan_variation_id || null,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'GET only' });
  if (!(await callerIsAdmin(req))) return json(res, 401, { error: 'unauthorized' });
  if (!process.env.SQUARE_ACCESS_TOKEN) return json(res, 200, { configured: false, note: 'SQUARE_ACCESS_TOKEN not set' });

  let days = Number(req.query?.days || 120);
  if (!Number.isFinite(days) || days < 1) days = 120;
  if (days > 400) days = 400;
  const begin = new Date(Date.now() - days * 86400000).toISOString();

  try {
    // 1) Payments (every status — FAILED ones become private action items).
    const payments = [];
    let cursor = null;
    for (let i = 0; i < MAX_PAGES; i++) {
      const qs = new URLSearchParams({ begin_time: begin, sort_order: 'DESC', limit: '100', location_id: LOCATION_ID });
      if (cursor) qs.set('cursor', cursor);
      const d = await square('/payments?' + qs.toString());
      (d.payments || []).forEach((p) => payments.push(trimPayment(p)));
      cursor = d.cursor || null;
      if (!cursor) break;
    }

    // 2) Invoices (balance schedules). Pull recent pages; older ones matter little.
    const invoices = [];
    cursor = null;
    for (let i = 0; i < MAX_PAGES; i++) {
      const body = { query: { filter: { location_ids: [LOCATION_ID] }, sort: { field: 'INVOICE_SORT_DATE', order: 'DESC' } }, limit: 100 };
      if (cursor) body.cursor = cursor;
      const d = await square('/invoices/search', { method: 'POST', body });
      (d.invoices || []).forEach((inv) => invoices.push(trimInvoice(inv)));
      cursor = d.cursor || null;
      if (!cursor) break;
    }

    // 3) Subscriptions (the online plan bills this way).
    const subscriptions = [];
    cursor = null;
    for (let i = 0; i < MAX_PAGES; i++) {
      const body = { query: { filter: { location_ids: [LOCATION_ID] } }, limit: 100 };
      if (cursor) body.cursor = cursor;
      let d = {};
      try { d = await square('/subscriptions/search', { method: 'POST', body }); }
      catch (e) { break; } // subscriptions scope may be missing on the token — not fatal
      (d.subscriptions || []).forEach((s) => subscriptions.push(trimSubscription(s)));
      cursor = d.cursor || null;
      if (!cursor) break;
    }

    // 4) Customers referenced above → email/name/note (the note carries "Cohort: …").
    const ids = [...new Set([...payments, ...invoices, ...subscriptions].map((x) => x.customer_id).filter(Boolean))];
    const customers = {};
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      let d = {};
      try { d = await square('/customers/bulk-retrieve', { method: 'POST', body: { customer_ids: chunk } }); } catch (e) { continue; }
      const resp = d.responses || {};
      Object.keys(resp).forEach((id) => {
        const c = resp[id]?.customer;
        if (!c) return;
        customers[id] = {
          email: (c.email_address || '').toLowerCase() || null,
          name: [c.given_name, c.family_name].filter(Boolean).join(' ') || null,
          phone: c.phone_number || null,
          note: c.note || null,
        };
      });
    }

    return json(res, 200, {
      configured: true,
      fetched_at: new Date().toISOString(),
      window_days: days,
      location_id: LOCATION_ID,
      payments,
      invoices,
      subscriptions,
      customers,
    });
  } catch (err) {
    // Never leak the token or raw Square payloads; the page shows a plain error.
    return json(res, err.status === 401 ? 502 : 500, { error: 'square_error', detail: String(err.message || err).slice(0, 200) });
  }
}
