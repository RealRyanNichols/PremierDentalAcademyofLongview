// Validates the single source of truth (assets/site-facts.js) so the site fails
// loudly when a required business fact is blank. Wired to `npm test`.
//
// Usage: node scripts/check-facts.mjs   (exit 0 = ok, exit 1 = a required fact is missing)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "assets/site-facts.js"), "utf8");

// The file assigns globalThis.PDA_FACTS when window is undefined (Node). Indirect
// eval runs in global scope so that assignment lands on the real globalThis.
(0, eval)(src);
const F = globalThis.PDA_FACTS;

if (!F) {
  console.error("✗ FAIL: PDA_FACTS is not defined by assets/site-facts.js");
  process.exit(1);
}

const required = [
  ["academyName", F.academyName],
  ["shortName", F.shortName],
  ["founder.name", F.founder && F.founder.name],
  ["founder.title", F.founder && F.founder.title],
  ["address.full", F.address && F.address.full],
  ["phone.display", F.phone && F.phone.display],
  ["phone.href", F.phone && F.phone.href],
  ["email", F.email],
  ["citiesServed", F.citiesServed && F.citiesServed.length],
  ["pricing.inPerson.totalDisplay", F.pricing && F.pricing.inPerson && F.pricing.inPerson.totalDisplay],
  ["pricing.inPerson.downDisplay", F.pricing && F.pricing.inPerson && F.pricing.inPerson.downDisplay],
  ["pricing.online.priceDisplay", F.pricing && F.pricing.online && F.pricing.online.priceDisplay],
  ["paymentPlan.text", F.paymentPlan && F.paymentPlan.text],
  ["transferRefund.online", F.transferRefund && F.transferRefund.online],
  ["transferRefund.inPerson", F.transferRefund && F.transferRefund.inPerson],
  ["programLength.weeks", F.programLength && F.programLength.weeks],
  ["tools", F.tools && F.tools.length],
  ["texasRda.registration", F.texasRda && F.texasRda.registration],
  ["seo.siteUrl", F.seo && F.seo.siteUrl],
  ["seo.defaultDescription", F.seo && F.seo.defaultDescription],
  ["seo.ogImage", F.seo && F.seo.ogImage]
];

const blank = (v) => v === undefined || v === null || v === "" || v === 0;
const missing = required.filter(([, v]) => blank(v)).map(([k]) => k);

// Warnings (do NOT fail the build) for facts that still need owner confirmation.
const warns = [];
if (F.programLength && F.programLength.needsOwnerConfirmation)
  warns.push('programLength: 12 vs 14 weeks — needs owner confirmation');
if (F.placementStat && F.placementStat.verified === false)
  warns.push('placementStat unverified ("' + F.placementStat.display + '")');
if (F.graduateCount && F.graduateCount.verified === false)
  warns.push('graduateCount unverified/inconsistent (' + (F.graduateCount.foundValues || []).join(" vs ") + ")");
if (F.salary && F.salary.verified === false) warns.push("salary figures unverified (need a cited source)");
if (F.cohortSeats && F.cohortSeats.verified === false) warns.push('cohortSeats "' + F.cohortSeats.display + '" unverified');
if (F.employer && F.employer.noPlacementFee && F.employer.noPlacementFee.verified === false)
  warns.push("employer no-placement-fee claim unverified — do not assert");

// ── Dated offers (laborDay2026 etc.) ─────────────────────────────────────────
// Build-side guard: a dated offer must be internally consistent, and it must not
// still be `active` after its own deadline. This is what stops a deploy from ever
// shipping a dead "$100 today" promise on a cached page.
const offerErrors = [];
const offers = { laborDay2026: F.laborDay2026 };
for (const [key, o] of Object.entries(offers)) {
  if (!o) continue;
  const end = Date.parse(o.endsAtISO || "");
  const start = Date.parse(o.startsAtISO || "");
  if (!Number.isFinite(end)) offerErrors.push(`${key}.endsAtISO is not a parseable date`);
  if (!Number.isFinite(start)) offerErrors.push(`${key}.startsAtISO is not a parseable date`);
  if (Number.isFinite(end) && Number.isFinite(start) && start >= end) offerErrors.push(`${key} starts after it ends`);
  if (typeof o.depositCents !== "number" || typeof o.balanceCents !== "number" || typeof o.planTotalCents !== "number")
    offerErrors.push(`${key} money fields must be integer cents`);
  else if (o.depositCents + o.balanceCents !== o.planTotalCents)
    offerErrors.push(`${key}: deposit ${o.depositCents} + balance ${o.balanceCents} ≠ planTotal ${o.planTotalCents}`);
  if (!Array.isArray(o.eligibleCohortIds) || !o.eligibleCohortIds.length) offerErrors.push(`${key}.eligibleCohortIds is empty`);
  if (typeof F.offerIsLive !== "function") offerErrors.push("PDA_FACTS.offerIsLive helper is missing");
  if (o.active === true && Number.isFinite(end) && Date.now() > end)
    offerErrors.push(`${key} is still active:true but ended ${o.endsAtISO} — set active:false before deploying`);
  if (/nonrefundable|non-refundable/i.test(JSON.stringify(o)))
    offerErrors.push(`${key} must never describe the deposit as nonrefundable`);
}

console.log("Premier Dental Academy — business-facts validation");
console.log("  required fields checked: " + required.length);
warns.forEach((w) => console.log("  ⚠ needs owner confirmation: " + w));
if (F.laborDay2026) {
  const live = F.offerIsLive(F.laborDay2026);
  console.log("  laborDay2026: active=" + F.laborDay2026.active + ", live now=" + live + ", ends " + F.laborDay2026.endsAtISO);
}

if (missing.length) {
  console.error("  ✗ MISSING REQUIRED FACTS: " + missing.join(", "));
  process.exit(1);
}
if (offerErrors.length) {
  offerErrors.forEach((e) => console.error("  ✗ OFFER: " + e));
  process.exit(1);
}
console.log("  ✓ all required business facts present");
