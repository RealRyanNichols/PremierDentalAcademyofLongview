// Labor Day 2026 — end-to-end checks of the /api/enroll handler with Square mocked.
// Run: node scripts/check-enroll-promo.mjs   (exit 1 on any failure)
//
// Proves, by driving the real handler and inspecting the exact Square /payments
// request it makes:
//   1. Sept 14 or Sept 29 + payment plan inside the window  → charges $100, plan $3,100,
//      balance $3,000, and every 1..12 (13) installment split totals exactly $3,000.00.
//   2. November cohort + payment plan inside the window     → still $500 down / $3,500.
//   3. Pay in full (any cohort, inside the window)          → still $3,000.
//   4. Sept cohort + plan at 2026-09-08T00:00:01-05:00      → $500 again (offer expired).
//   Plus: online untouched ($997), a forged client `special` flag is ignored, and the
//   promo is tagged on the payment note and the balance order.
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
process.env.SQUARE_ACCESS_TOKEN = "test-token-not-real";

// ── Square mock: records every request, answers with the minimum the handler needs.
let calls = [];
globalThis.fetch = async (url, opts = {}) => {
  const path = String(url).replace("https://connect.squareup.com/v2", "");
  const body = opts.body ? JSON.parse(opts.body) : null;
  calls.push({ path, method: opts.method, body });
  const ok = (json) => ({ ok: true, status: 200, json: async () => json });
  if (path === "/customers") return ok({ customer: { id: "CUST_TEST" } });
  if (path === "/cards") return ok({ card: { id: "ccof:TEST" } });
  if (path === "/payments") return ok({ payment: { id: "PAY_TEST", receipt_url: "https://squareup.com/receipt/preview/PAY_TEST" } });
  if (path === "/orders") return ok({ order: { id: "ORDER_TEST" } });
  if (path === "/invoices") return ok({ invoice: { id: "INV_TEST", version: 1 } });
  if (path.startsWith("/invoices/") && path.endsWith("/publish")) return ok({ invoice: { id: "INV_TEST", version: 2 } });
  return { ok: false, status: 404, json: async () => ({ errors: [{ detail: "unmocked " + path }] }) };
};

const { default: handler } = await import(join(root, "api/enroll.js"));

const SEP14 = "a808608c-df03-40de-822e-f587c7e64395";
const SEP29 = "69d28988-f34c-49f4-a7bf-f99333f87585";
const NOV9 = "063e97c8-4fbe-453d-b336-94d0b03840a4";
const IN_WINDOW = Date.parse("2026-09-07T20:15:00-05:00");   // Mon Sep 7, 8:15 PM CT
const LAST_SEC = Date.parse("2026-09-07T23:59:59-05:00");
const EXPIRED = Date.parse("2026-09-08T00:00:01-05:00");
const realNow = Date.now;

let fails = 0;
const ok = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };

async function run(body, now) {
  Date.now = () => now;
  calls = [];
  let status = 0, out = null;
  const req = { method: "POST", body };
  const res = { status(s) { status = s; return this; }, json(o) { out = o; return this; } };
  await handler(req, res);
  Date.now = realNow;
  const pay = calls.find((c) => c.path === "/payments")?.body;
  const order = calls.find((c) => c.path === "/orders")?.body;
  return { status, out, pay, order };
}
const base = (over) => ({
  plan: "in-person", cadence: "weekly", count: 12, firstPaymentDate: "2026-09-18",
  sourceId: "cnon:test-nonce-" + Math.random().toString(36).slice(2),
  email: "qa@example.invalid", name: "QA Tester", phone: "9035550100",
  cohortName: "September 14, 2026 — In-Person (MWF)", cohortId: SEP14,
  special: null, payInFull: false, ...over,
});

console.log("Labor Day 2026 — /api/enroll behaviour with Square mocked");

// 1. Sept cohorts + plan, inside the window → $100
for (const [label, id, name] of [["Sept 14", SEP14, "September 14, 2026 — In-Person (MWF)"], ["Sept 29", SEP29, "September 29, 2026 — In-Person (T/Th)"]]) {
  const r = await run(base({ cohortId: id, cohortName: name }), IN_WINDOW);
  ok(r.status === 200 && r.out?.ok === true, `${label} plan: handler ok`);
  ok(r.pay?.amount_money?.amount === 10000, `${label} plan: Square is charged exactly $100 (got ${r.pay?.amount_money?.amount})`);
  ok(r.out?.downCents === 10000 && r.out?.totalCents === 310000 && r.out?.remainingCents === 300000, `${label} plan: response says $100 today / $3,100 total / $3,000 balance`);
  ok(r.out?.offer === "laborday2026" && r.out?.depositCents === 10000 && r.out?.planTotalCents === 310000, `${label} plan: promo recorded on the response`);
  ok(/laborday2026/.test(r.pay?.note || ""), `${label} plan: promo tag on the Square payment note`);
  ok(/offer: laborday2026/.test(r.order?.order?.line_items?.[0]?.note || ""), `${label} plan: promo tag on the balance order`);
  ok(r.order?.order?.line_items?.[0]?.base_price_money?.amount === 300000, `${label} plan: balance order is exactly $3,000`);
  ok(r.pay?.buyer_email_address === "qa@example.invalid" && /Cohort: /.test(calls.find((c) => c.path === "/customers")?.body?.note || ""), `${label} plan: customer note still carries the class (webhook assigns it correctly)`);
}
// Every installment count: schedule totals exactly $3,000 and $3,100 with the deposit
let drift = false;
for (let n = 1; n <= 13; n++) {
  for (const cadence of ["weekly", "monthly"]) {
    const r = await run(base({ count: n, cadence }), IN_WINDOW);
    const reqs = r.order ? calls.find((c) => c.path === "/invoices")?.body?.invoice?.payment_requests || [] : [];
    const total = reqs.reduce((a, x) => a + (x.fixed_amount_requested_money?.amount || 0), 0);
    if (total !== 300000 || reqs.length !== n || r.pay?.amount_money?.amount + total !== 310000) { drift = true; console.error(`    drift: ${cadence} x${n} total ${total} count ${reqs.length}`); }
  }
}
ok(!drift, "every 1..13 weekly/monthly schedule totals exactly $3,000.00, and $3,100 with the $100 deposit");

// 2. November cohort + plan, inside the window → $500
{
  const r = await run(base({ cohortId: NOV9, cohortName: "November 9, 2026 — In-Person (MWF)" }), IN_WINDOW);
  ok(r.pay?.amount_money?.amount === 50000 && r.out?.totalCents === 350000 && r.out?.offer === null, `November plan inside the window: still $500 down / $3,500 (got ${r.pay?.amount_money?.amount})`);
}
// 3. Pay in full → $3,000 regardless
{
  const r = await run(base({ payInFull: true }), IN_WINDOW);
  ok(r.pay?.amount_money?.amount === 300000 && r.out?.totalCents === 300000 && r.out?.offer === null, `Pay in full on Sept 14 inside the window: still $3,000 (got ${r.pay?.amount_money?.amount})`);
}
// 4. Expired → $500
{
  const r = await run(base(), EXPIRED);
  ok(r.pay?.amount_money?.amount === 50000 && r.out?.totalCents === 350000 && r.out?.offer === null, `Sept 14 plan at 2026-09-08T00:00:01-05:00: back to $500 / $3,500 (got ${r.pay?.amount_money?.amount})`);
  const r2 = await run(base(), LAST_SEC);
  ok(r2.pay?.amount_money?.amount === 10000, "Sept 14 plan at 2026-09-07T23:59:59-05:00 (last second): still $100");
  const r3 = await run(base(), Date.parse("2026-09-05T23:59:59-05:00"));
  ok(r3.pay?.amount_money?.amount === 50000, "Sept 14 plan before the window opened: $500");
}
// Extras: forged client flag, online untouched, missing cohortId
{
  const r = await run(base({ cohortId: NOV9, special: "laborday2026" }), IN_WINDOW);
  ok(r.pay?.amount_money?.amount === 50000, "a forged client `special` flag on a November cohort is ignored ($500)");
  const r2 = await run(base({ cohortId: null, cohortName: null }), IN_WINDOW);
  ok(r2.pay?.amount_money?.amount === 50000, "no cohortId submitted: $500 (never $100 without a September class)");
  const r3 = await run({ plan: "online", sourceId: "cnon:online-test", email: "qa@example.invalid", name: "QA Tester" }, IN_WINDOW);
  ok(r3.pay?.amount_money?.amount === 99700 && r3.out?.offer === null, "online is untouched ($997)");
}

console.log(fails ? `✗ ${fails} check(s) failed` : "✓ all /api/enroll Labor Day checks passed");
process.exit(fails ? 1 : 0);
