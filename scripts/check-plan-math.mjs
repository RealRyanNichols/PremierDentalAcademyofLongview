// check:plan-math — the payment engine's installment math must total EXACTLY the
// published plan: $500 down + $3,000 balance = $3,500 for every allowed split
// (1–13 payments, weekly or monthly), and pay-in-full must be exactly $3,000.
// Numbers come from assets/site-facts.js; the schedule comes from the real
// buildScheduleV2 in api/enroll.js (the function Square invoices are built from).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
process.env.SQUARE_ACCESS_TOKEN ||= 'test-token-not-real';
(0, eval)(readFileSync(join(root, 'assets/site-facts.js'), 'utf8'));
const F = globalThis.PDA_FACTS;
const { buildScheduleV2 } = await import(join(root, 'api/enroll.js'));

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.error('✗ ' + msg); } };
const ip = F.pricing.inPerson;

ok(ip.totalCents === 300000, `pay in full must be $3,000 (got ${ip.totalCents})`);
ok(ip.downCents === 50000, `down payment must be $500 (got ${ip.downCents})`);
ok(ip.balanceCents === 300000, `balance must be $3,000 (got ${ip.balanceCents})`);
ok(ip.planTotalCents === 350000, `plan total must be $3,500 (got ${ip.planTotalCents})`);
ok(ip.downCents + ip.balanceCents === ip.planTotalCents, 'down + balance ≠ plan total');

const FRIDAY = '2026-10-02'; // a Friday
let checked = 0;
for (const cadence of ['weekly', 'monthly']) {
  for (let n = 1; n <= 13; n++) {
    const s = buildScheduleV2({ balanceCents: ip.balanceCents, cadence, count: n, firstPaymentDate: FRIDAY });
    const sum = s.amounts.reduce((a, b) => a + b, 0);
    ok(s.count === n, `${cadence} ${n}: count ${s.count}`);
    ok(sum === ip.balanceCents, `${cadence} ${n}: installments total ${sum}, expected ${ip.balanceCents}`);
    ok(sum + ip.downCents === ip.planTotalCents, `${cadence} ${n}: down + installments ≠ $3,500`);
    ok(s.amounts.every((a) => Number.isInteger(a) && a > 0), `${cadence} ${n}: a non-positive or fractional installment`);
    ok(Math.max(...s.amounts) - Math.min(...s.amounts) <= n, `${cadence} ${n}: installments differ by more than rounding`);
    ok(s.dates.length === n && new Date(s.dates[0] + 'T12:00:00Z').getUTCDay() === 5, `${cadence} ${n}: first due date is not a Friday`);
    if (cadence === 'weekly') {
      for (let i = 1; i < n; i++) ok((Date.parse(s.dates[i]) - Date.parse(s.dates[i - 1])) === 7 * 86400000, `weekly ${n}: dates not 7 days apart at ${i}`);
    } else {
      for (let i = 1; i < n; i++) ok(s.dates[i].slice(8) === s.dates[0].slice(8), `monthly ${n}: day-of-month drifts at ${i}`);
    }
    checked++;
  }
}
let threw = false;
try { buildScheduleV2({ balanceCents: ip.balanceCents, cadence: 'weekly', count: 14, firstPaymentDate: FRIDAY }); } catch { threw = true; }
ok(threw, '14 installments must be rejected (Square cap is 13)');

console.log(fails === 0
  ? `✓ plan math: ${checked} splits total exactly ${ip.planTotalDisplay} ($500 down + $3,000); pay in full ${ip.totalDisplay}`
  : `✗ plan math: ${fails} failure(s)`);
process.exit(fails ? 1 : 0);
