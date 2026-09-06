// Labor Day 2026 offer — money + timezone + expiry assertions.
// Run: node scripts/check-labor-day.mjs   (exit 1 on any failure)
//
// What it proves:
//   1. Offer math: $100 + $3,000 = $3,100, and every 2..13-installment split of the
//      $3,000 balance totals EXACTLY $3,000.00 using the live algorithm in
//      api/enroll.js (per = floor(balance/count), last payment absorbs the remainder).
//   2. Timezone: the offer is live at 2026-09-07T23:59:00-05:00 and expired at
//      2026-09-08T00:00:01-05:00; the end constant equals Date.parse('2026-09-08T04:59:59Z').
//   3. Expired state: with the clock past the deadline, offerIsLive() is false, and the
//      landing page + both banners contain no code path that renders a $100 CTA
//      without offerIsLive() (static check).
//   4. Copy safety: no forbidden claims on the promo surfaces.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
(0, eval)(readFileSync(join(root, "assets/site-facts.js"), "utf8"));
const F = globalThis.PDA_FACTS;
const O = F.laborDay2026;

let fails = 0;
const ok = (cond, msg) => { if (cond) console.log("  ✓ " + msg); else { console.error("  ✗ " + msg); fails++; } };

console.log("Labor Day 2026 offer checks");

// ── 1. Money
ok(O.depositCents === 10000, "deposit is $100 (10000 cents)");
ok(O.balanceCents === 300000, "balance is $3,000 (300000 cents)");
ok(O.planTotalCents === 310000, "plan total is $3,100 (310000 cents)");
ok(O.depositCents + O.balanceCents === O.planTotalCents, "10000 + 300000 === 310000");
ok(O.depositDisplay === "$100" && O.balanceDisplay === "$3,000" && O.planTotalDisplay === "$3,100", "display strings match the cents");
ok(F.pricing.inPerson.planTotalCents - O.planTotalCents === 40000, "promo is exactly $400 under the $3,500 plan");
ok(F.pricing.inPerson.balance * 100 === O.balanceCents, "promo balance equals the published $3,000 balance (installment tables unchanged)");

// Live algorithm from api/enroll.js buildScheduleV2 (client cap is 13, server MAX_INSTALLMENTS).
const MAX_INSTALLMENTS = Number((readFileSync(join(root, "api/enroll.js"), "utf8").match(/const MAX_INSTALLMENTS\s*=\s*(\d+)/) || [])[1] || 13);
function split(balanceCents, n) {
  const per = Math.floor(balanceCents / n);
  const amounts = Array(n).fill(per);
  amounts[n - 1] = balanceCents - per * (n - 1);
  return amounts;
}
let driftFree = true;
for (let n = 1; n <= Math.max(13, MAX_INSTALLMENTS); n++) {
  const a = split(O.balanceCents, n);
  const total = a.reduce((x, y) => x + y, 0);
  if (total !== O.balanceCents || a.some((v) => !Number.isInteger(v) || v <= 0)) { driftFree = false; console.error(`    drift at ${n} payments: total ${total}`); }
  if (O.depositCents + total !== O.planTotalCents) { driftFree = false; console.error(`    ${n} payments + deposit ≠ $3,100`); }
}
ok(driftFree, `every 1..${Math.max(13, MAX_INSTALLMENTS)}-payment split of the $3,000 balance totals exactly $3,000.00 and $3,100 with the deposit`);

// ── 2. Timezone
const END = Date.parse("2026-09-08T04:59:59Z");
ok(Date.parse(O.endsAtISO) === END, "endsAtISO === Date.parse('2026-09-08T04:59:59Z')");
ok(F.offerIsLive(O, Date.parse("2026-09-07T23:59:00-05:00")), "live at 2026-09-07T23:59:00-05:00 (11:59 PM CT Monday)");
ok(F.offerIsLive(O, Date.parse("2026-09-07T23:59:59-05:00")), "live at the final second");
ok(!F.offerIsLive(O, Date.parse("2026-09-08T00:00:01-05:00")), "expired at 2026-09-08T00:00:01-05:00");
ok(!F.offerIsLive(O, Date.parse("2026-09-08T04:59:59Z") + 1), "expired one millisecond after the end constant");
ok(!F.offerIsLive(O, Date.parse("2026-09-05T23:59:59-05:00")), "not live before Sunday Sep 6 (America/Chicago)");
ok(!F.offerIsLive(Object.assign({}, O, { active: false }), Date.parse("2026-09-07T12:00:00-05:00")), "active:false kills it even inside the window");
// A visitor whose clock claims a different zone cannot extend the deadline:
// the instant is absolute, so "Sep 7 11:59 PM" in Hawaii (UTC-10) is already past.
ok(!F.offerIsLive(O, Date.parse("2026-09-07T23:59:00-10:00")), "a UTC-10 visitor's 11:59 PM Monday is already expired (absolute instant)");

// ── 3. Expired-state code paths (static)
const page = readFileSync(join(root, "labor-day.html"), "utf8");
const nav = readFileSync(join(root, "assets/pda-nav.js"), "utf8");
const home = readFileSync(join(root, "index.html"), "utf8");
ok(/function isLive\(\)[\s\S]*offerIsLive/.test(page), "labor-day.html gates on PDA_FACTS.offerIsLive");
ok(/function renderCards[\s\S]*if \(!isLive\(\)\) return;/.test(page), "labor-day.html never renders a class card when expired");
ok(/if \(!OFFER \|\| !isLive\(\)\) \{ showEnded\(\); \}/.test(page), "labor-day.html boots straight into the ended panel when expired");
ok(/id="ended" hidden/.test(page) && /href="\/enroll"/.test(page), "ended panel exists and points at /enroll");
ok(/offerIsLive\(O\)\) return false;/.test(nav) && /if \(!F\.offerIsLive\(O\)\) return;/.test(nav), "pda-nav promo bar checks the clock before AND after the network call");
ok(/deposit_link_url && !full/.test(nav), "pda-nav promo bar requires a real deposit link on a non-full class");
ok(/id="laborday-bar" hidden/.test(home) && /F\.offerIsLive\(O\) && !dismissed/.test(home) && /payable && F\.offerIsLive\(O\)/.test(home), "homepage bar is hidden by default and double-checks live + deposit link");
ok(/prefers-reduced-motion: reduce/.test(page) && /prefers-reduced-motion: reduce/.test(nav) && /prefers-reduced-motion: reduce/.test(home.slice(0, 20000)), "pulse/shimmer is disabled for prefers-reduced-motion on all three surfaces");

// ── 4. Copy safety on the promo surfaces
// Visible copy only: scripts, comments and tags stripped, whitespace collapsed, so a
// sentence split across an inline <span> still compares as one string.
const visible = page.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const forbidden = [
  [/non-?refundable/i, "the word nonrefundable"],
  [/\b(12|14|twelve|fourteen)[- ]weeks?\b/i, "a program length"],
  [/\bonly \d+ seats?\b|\bseats? left\b/i, "a seat count"],
  [/\b(85%|406\+|400\+|placement rate|guaranteed|lowest|the only|the best)\b/i, "an unverified or superlative claim"],
  [/\bS5316\b|TWC (license|#)/i, "a TWC license number"],
  [/\$1,997|\$200 down|\$1,497/i, "retired pricing"],
  [/\bAlexis\b|\bEmelia\b/i, "another instructor's name"],
  [/—/, "an em dash in published copy"],
];
for (const [re, why] of forbidden) ok(!re.test(visible), `labor-day.html visible copy has no ${why}`);
for (const must of [
  "$100 reserves your seat, and every dollar of it goes toward your tuition.",
  "Labor Day offer: reserve your seat in our September 14 or September 29 in person class with $100 today instead of the usual $500 down.",
  "On the Labor Day offer your tuition is $3,100 on a payment plan: $100 today and a $3,000 balance, billed automatically on the schedule you choose. That is $400 less than our regular payment plan price.",
  "Offer ends Monday, September 7 at midnight.",
  "Your $100 is credited toward your tuition. It is not an extra fee and it is not added on top.",
  "If you change your mind, you may cancel and receive a full refund of everything you have paid, up until midnight on Thursday, September 10, 2026.",
  "You may also cancel within your first three scheduled class days and receive a refund of everything you have paid, less $100.",
  "2800 Gilmer Rd, Suite 106, Longview, TX 75604",
]) ok(visible.includes(must), "approved copy present: " + must.slice(0, 60) + (must.length > 60 ? "…" : ""));

console.log(fails ? `✗ ${fails} check(s) failed` : "✓ all Labor Day offer checks passed");
process.exit(fails ? 1 : 0);
