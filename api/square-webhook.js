// POST /api/square-webhook — Square payment + invoice events -> welcome email + portal
// enrollment. Runs in pda-api on the DigitalOcean droplet.
//
// Droplet port of the Supabase function square-webhook v6 (Sep 28, 2026). What it does is
// unchanged: on a COMPLETED payment or a PAID invoice it sends the one-time welcome email,
// turns on the student's portal access, creates the enrollment, records the purchase, marks
// the lead enrolled, and opens an admin task when it can't find the student.
//
// Changes from v6 (each one fixes something seen in the live data or the porting checklist):
//  1. Config comes from the droplet's env file, not the app_secrets table. A missing signature
//     key answers 503 (Square retries) instead of v6's 200 (the event was silently dropped).
//  2. Signatures are compared in constant time, against the exact bytes Square sent.
//  3. The payment/invoice is re-read from Square before anything happens. Square's own test
//     events use sample ids that don't exist, so they are ignored instead of creating tasks.
//  4. Website product purchases (Study Pack, Exam Pro, Career Vault, exam-prep course) and
//     service payment links are NOT tuition. v6 treated every payment as an in-person
//     enrollment, so a $19 buyer would get the in-person welcome, a class enrollment and
//     "enrolled" status. Those purchases are recorded by their own checkout.
//  5. Events for the same payment are handled one at a time, and a purchase row carries the
//     Square payment id in external_payment_id (unique), so bursts of payment.updated can't
//     create duplicate purchases, enrollments or admin tasks (v6 made some of each).
//  6. Kajabi grants are gone (Kajabi was retired Aug 16, 2026). The welcome is sent in-process.
//  7. The response carries no email address or personal details.
import { sb } from './_common.mjs';
import { sq, squareToken, WEBHOOK_URL, rawBodyCandidates, verifySignature, header } from './_square.mjs';
import { sendWelcome } from './_welcome.mjs';

const EVENT_TTL_MS = 24 * 3600 * 1000;
const DONE_TTL_MS = 6 * 3600 * 1000;
const seenEvents = new Map();   // event_id -> time: Square re-deliveries of the same event
const doneObjects = new Map();  // payment/invoice id -> time: fully handled, later updates are no-ops
const locks = new Map();        // key -> promise chain: one event at a time per payment / student

function remember(map, key, ttl) {
  const now = Date.now();
  map.set(key, now);
  if (map.size > 5000) for (const [k, t] of map) if (now - t > ttl) map.delete(k);
}
function seen(map, key, ttl) {
  const t = map.get(key);
  return t != null && Date.now() - t < ttl;
}
async function withLock(key, fn) {
  const prev = locks.get(key) || Promise.resolve();
  let release;
  const mine = new Promise((r) => { release = r; });
  const chain = prev.then(() => mine);
  locks.set(key, chain);
  await prev.catch(() => {});
  try { return await fn(); } finally {
    release();
    if (locks.get(key) === chain) locks.delete(key);
  }
}

const lower = (v) => String(v || '').toLowerCase().trim();
const first = (rows) => (Array.isArray(rows) && rows.length ? rows[0] : null);
const isDuplicate = (e) => e && (e.status === 409 || (e.detail && e.detail.code === '23505'));
const money = (c) => '$' + (Number(c || 0) / 100).toFixed(2);

// Non-tuition payments. The website checkout notes every product sale "<product> — website";
// Exam Pro's signed-in checkout notes "Exam Pro (one-time $29) …"; the RDA program itself
// (enroll + online program) always starts "PDA RDA Program". Service payment links (state
// board prep, tutoring, workshops) are recognized by what was sold.
const SERVICE_WORDS = /\b(state board prep|tutoring|workshop|mock interview|interview prep|cheat sheets?|practice exam|screen-share|mounting session)\b/i;
export function isNonTuition(note, orderText = '') {
  const n = String(note || '').trim();
  if (/^PDA RDA Program/i.test(n)) return false;
  if (/^Exam Pro \(one-time/i.test(n)) return true;
  if (/ — website$/.test(n)) return true;
  return SERVICE_WORDS.test(n) || SERVICE_WORDS.test(String(orderText || ''));
}

async function customerOf(customerId) {
  const empty = { note: '', email: '', first: '', last: '', phone: '' };
  if (!customerId) return empty;
  try {
    const c = (await sq('/customers/' + encodeURIComponent(customerId))).customer || {};
    return { note: c.note || '', email: lower(c.email_address), first: c.given_name || '', last: c.family_name || '', phone: c.phone_number || '' };
  } catch { return empty; }
}

async function orderText(orderId) {
  if (!orderId) return '';
  try {
    const o = (await sq('/orders/' + encodeURIComponent(orderId))).order || {};
    return (o.line_items || []).map((li) => [li.name, li.note, li.variation_name].filter(Boolean).join(' ')).join(' ');
  } catch { return ''; }
}

async function openTaskOnce(title, notes, ref) {
  try {
    const existing = await sb('admin_tasks', { query: { status: 'eq.open', notes: `ilike.*${ref}*`, select: 'id', limit: '1' } });
    if (first(existing)) return false;
  } catch { /* if the check fails, still flag it */ }
  await sb('admin_tasks', { method: 'POST', prefer: 'return=minimal', body: { title, notes: notes + '\nSquare ref: ' + ref, priority: 1, status: 'open' } });
  return true;
}

async function autoEnroll({ email, first: fn, last: ln, isOnline, cohortId, className, amountCents, type, payId, path, customerId }) {
  const prof = first(await sb('profiles', {
    query: { email: 'eq.' + email, select: 'id,program,portal_status,online_program,first_name,last_name', limit: '1' },
  }));
  if (!prof) {
    const flagged = await openTaskOnce(
      'Paid student has NO website account — create + enroll manually',
      'Email: ' + email + '\nName: ' + (`${fn} ${ln}`.trim() || 'unknown') + '\nPath: ' + path + '\nAmount: ' + money(amountCents) + '\nEvent: ' + type + '\nSquare customer: ' + (customerId || 'unknown') + '\nCreate the account in Admin → Students, then enroll the student.',
      payId,
    );
    return { ok: false, reason: 'no_profile', flagged };
  }
  const updates = {};
  if (!prof.program || prof.program === 'preview') updates.program = isOnline ? 'career_track' : 'foundation';
  if (isOnline && !prof.online_program) updates.online_program = true;
  if ((prof.portal_status || 'active') !== 'active') updates.portal_status = 'active';
  if (Object.keys(updates).length) {
    updates.enrolled_at = new Date().toISOString();
    await sb('profiles', { method: 'PATCH', query: { id: 'eq.' + prof.id }, prefer: 'return=minimal', body: updates });
  }
  let enrollmentCreated = false;
  const en = await sb('enrollments', { query: { student_id: 'eq.' + prof.id, select: 'id', limit: '1' } });
  if (!first(en)) {
    await sb('enrollments', {
      method: 'POST',
      prefer: 'return=minimal',
      body: {
        student_id: prof.id,
        cohort_id: cohortId,
        status: 'active',
        delivery: isOnline ? 'online' : 'in_person',
        source: 'square_webhook_auto',
        student_name: (`${fn || prof.first_name || ''} ${ln || prof.last_name || ''}`).trim() || email,
        enrolled_at: new Date().toISOString(),
        notes: 'AUTO-ENROLLED by the droplet square-webhook on ' + type + ' (' + money(amountCents) + (className ? ', cohort ' + className : '') + '). Verify the plan/terms in Square; arranged-price details live there.',
      },
    });
    enrollmentCreated = true;
  }
  let purchaseRecorded = false;
  if (payId && amountCents > 0) {
    const existing = await sb('purchases', { query: { or: `(square_payment_id.eq."${payId}",external_payment_id.eq."${payId}")`, select: 'id', limit: '1' } });
    if (!first(existing)) {
      try {
        await sb('purchases', {
          method: 'POST',
          prefer: 'return=minimal',
          body: {
            student_id: prof.id,
            product_key: isOnline ? 'online_program' : 'in_person_program',
            product_label: 'PDA RDA Program — ' + (isOnline ? 'Online' : 'In-Person'),
            amount_cents: amountCents,
            payment_type: type.startsWith('invoice') ? 'subscription' : 'one_time',
            square_payment_id: payId,
            external_payment_id: payId,
            status: 'completed',
            source: 'square_webhook',
            contact_email: email,
          },
        });
        purchaseRecorded = true;
      } catch (e) {
        if (!isDuplicate(e)) throw e;
      }
    }
  }
  await sb('leads', {
    method: 'PATCH',
    query: { email: 'eq.' + email, pipeline_stage: 'neq.enrolled' },
    prefer: 'return=minimal',
    body: { pipeline_stage: 'enrolled', status: 'converted' },
  });
  return { ok: true, updates: Object.keys(updates), enrollmentCreated, purchaseRecorded };
}

export async function processEvent(evt) {
  const type = String((evt && evt.type) || '');
  const obj = (evt && evt.data && evt.data.object) || {};
  const kind = type.startsWith('payment') ? 'payment' : type.startsWith('invoice') ? 'invoice' : '';
  if (!kind) return { ok: true, type, ignored: 'event type' };
  const id = kind === 'payment' ? obj.payment && obj.payment.id : obj.invoice && obj.invoice.id;
  if (!id) return { ok: true, type, ignored: 'no object id' };
  if (seen(doneObjects, id, DONE_TTL_MS)) return { ok: true, type, ignored: 'already handled' };

  return withLock(id, async () => {
    if (seen(doneObjects, id, DONE_TTL_MS)) return { ok: true, type, ignored: 'already handled' };

    // Re-read the object from Square: current status, and real (not sample) data.
    let fresh;
    try {
      fresh = kind === 'payment'
        ? (await sq('/payments/' + encodeURIComponent(id))).payment
        : (await sq('/invoices/' + encodeURIComponent(id))).invoice;
    } catch (e) {
      if (e.status === 404) return { ok: true, type, ignored: 'not found in Square (test event)' };
      throw e;
    }
    fresh = fresh || {};

    let email = '', amountCents = 0, displayCents = 0, customerId = '', orderId = '', titleBlob = '';
    if (kind === 'payment') {
      if (String(fresh.status || '').toUpperCase() !== 'COMPLETED') return { ok: true, type, ignored: 'payment not completed' };
      email = lower(fresh.buyer_email_address);
      amountCents = displayCents = (fresh.amount_money && fresh.amount_money.amount) || 0;
      customerId = fresh.customer_id || '';
      orderId = fresh.order_id || '';
      titleBlob = String(fresh.note || '');
    } else {
      const st = String(fresh.status || '').toUpperCase();
      if (st !== 'PAID' && type !== 'invoice.payment_made') return { ok: true, type, ignored: 'invoice not paid' };
      email = lower(fresh.primary_recipient && fresh.primary_recipient.email_address);
      customerId = (fresh.primary_recipient && fresh.primary_recipient.customer_id) || fresh.customer_id || '';
      orderId = fresh.order_id || '';
      titleBlob = [fresh.title, fresh.description].filter(Boolean).join(' ');
      // Display only: invoice installments are recorded from their payment events.
      displayCents = (fresh.payment_requests || []).reduce((s, pr) => s + ((pr.total_completed_amount_money && pr.total_completed_amount_money.amount) || 0), 0);
    }

    let lineItems = '';
    if (!/^PDA RDA Program/i.test(titleBlob.trim())) lineItems = await orderText(orderId);
    if (isNonTuition(titleBlob, lineItems)) {
      remember(doneObjects, id, DONE_TTL_MS);
      try {
        await sb('communications', { method: 'POST', prefer: 'return=minimal', body: { contact_email: email || null, channel: 'note', direction: 'inbound', body: '[SQUARE WEBHOOK droplet] ' + type + ' ' + money(displayCents) + ' → not tuition (product or service purchase); no enrollment or welcome.', source: 'square_webhook', metadata: { square_ref: id, amount_cents: displayCents } } });
      } catch { /* logging is best effort */ }
      return { ok: true, type, ignored: 'not tuition' };
    }

    const cust = await customerOf(customerId);
    if (!email && cust.email) email = cust.email;

    let alreadyWelcomed = false;
    if (email) alreadyWelcomed = !!first(await sb('welcome_log', { query: { email: 'eq.' + email, select: 'email', limit: '1' } }));

    // Class from the Square customer note ("Cohort: <name>", written by /api/enroll).
    let firstName = '', lastName = '', phone = '', path = '', className = '', startDate = '', cohortId = null;
    const m = (cust.note || '').match(/Cohort:\s*(.+)/i);
    const cohortName = m ? m[1].trim() : '';
    if (cohortName) {
      const co = first(await sb('cohorts', { query: { name: 'eq.' + cohortName, select: 'id,name,start_date,delivery_mode', limit: '1' } }));
      if (co) {
        cohortId = co.id; className = co.name; startDate = co.start_date || '';
        path = String(co.delivery_mode || '').toLowerCase() === 'online' ? 'online' : 'in-person';
      }
    }
    if (email) {
      const lead = first(await sb('leads', { query: { email: 'eq.' + email, select: 'first_name,last_name,phone,path_preference', order: 'created_at.desc', limit: '1' } }));
      if (lead) {
        firstName = lead.first_name || ''; lastName = lead.last_name || ''; phone = lead.phone || '';
        if (!path) path = lead.path_preference || '';
      }
    }
    if (!firstName && cust.first) firstName = cust.first;
    if (!lastName && cust.last) lastName = cust.last;
    if (!phone && cust.phone) phone = cust.phone;
    // What was actually sold beats guessing from the amount.
    if (!path && !lineItems) lineItems = await orderText(orderId);
    const blob = titleBlob + ' ' + lineItems;
    if (!path && /online/i.test(blob)) path = 'online';
    if (!path && /in.?person/i.test(blob)) path = 'in-person';
    if (!path) path = amountCents === 39700 || amountCents === 99700 ? 'online' : 'in-person';
    const isOnline = String(path).toLowerCase().includes('online');

    return withLock('student:' + (email || id), async () => {
      // 1) Welcome email, once per student.
      let welcome = 'skipped';
      if (email && !alreadyWelcomed) {
        try {
          const w = await sendWelcome({ email, first_name: firstName, last_name: lastName, phone, path, class_name: className || '', start_date: startDate || '' });
          welcome = w.deduped ? 'deduped' : w.ok ? 'sent' : 'failed';
        } catch { welcome = 'failed'; }
      } else if (alreadyWelcomed) {
        welcome = 'deduped';
      }

      // 2) Portal enrollment (idempotent).
      let enroll = { skipped: true };
      if (email) {
        enroll = await autoEnroll({ email, first: firstName, last: lastName, isOnline, cohortId, className, amountCents, type, payId: id, path, customerId });
      } else {
        const flagged = await openTaskOnce(
          'Square payment with NO email — student may be missing account/welcome',
          'Event: ' + type + '\nAmount: ' + money(displayCents) + '\nSquare customer: ' + (customerId || 'unknown') + (cohortName ? '\nCohort note: ' + cohortName : '') + '\nAdd the student manually from Admin → Students.',
          id,
        );
        enroll = { ok: false, reason: 'no_email', flagged };
      }

      try {
        await sb('communications', {
          method: 'POST',
          prefer: 'return=minimal',
          body: {
            contact_email: email || null,
            contact_name: `${firstName} ${lastName}`.trim() || email || null,
            channel: 'note',
            direction: 'inbound',
            body: '[SQUARE WEBHOOK droplet] ' + type + ' -> welcome ' + welcome + ' · portal ' + (enroll.ok ? 'auto-enrolled/verified' : (enroll.reason || 'skip')) + ' (' + (isOnline ? 'online' : 'in-person') + (startDate ? ', starts ' + startDate : '') + ')',
            source: 'square_webhook',
            metadata: { square_ref: id, welcome, enroll, cohort: cohortName || null, start_date: startDate || null, amount_cents: displayCents },
          },
        });
      } catch { /* logging is best effort */ }

      if (welcome !== 'failed') remember(doneObjects, id, DONE_TTL_MS);
      return { ok: true, type, path: isOnline ? 'online' : 'in-person', welcome, enrolled: !!enroll.ok, flagged: !!enroll.flagged };
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(200).json({ ok: true, service: 'square-webhook', configured: !!process.env.SQUARE_WEBHOOK_SIGNATURE_KEY });
    return;
  }
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  const url = process.env.SQUARE_WEBHOOK_URL || WEBHOOK_URL;
  if (!key) { res.status(503).json({ ok: false, reason: 'webhook not configured' }); return; }

  const candidates = await rawBodyCandidates(req);
  const match = verifySignature({ key, url, signature: header(req, 'x-square-hmacsha256-signature'), candidates });
  if (!match) { res.status(401).json({ ok: false, reason: 'bad signature' }); return; }

  let evt;
  try { evt = JSON.parse(match.raw); } catch { res.status(400).json({ ok: false, reason: 'bad json' }); return; }

  // Signed check from ops/square (pda-square self-test): proves the key and the raw body path.
  if (evt && evt.type === 'pda.self_test') {
    res.status(200).json({ ok: true, verified: true, selfTest: true, rawSource: match.source, squareToken: !!squareToken() });
    return;
  }
  if (!squareToken()) { res.status(503).json({ ok: false, reason: 'square token missing' }); return; }

  const eventId = String((evt && evt.event_id) || '');
  if (eventId && seen(seenEvents, eventId, EVENT_TTL_MS)) { res.status(200).json({ ok: true, ignored: 'duplicate delivery' }); return; }

  try {
    const result = await processEvent(evt);
    if (eventId) remember(seenEvents, eventId, EVENT_TTL_MS);
    res.status(200).json(result);
  } catch (e) {
    // Square retries non-2xx answers; every step above is safe to repeat.
    console.error('[square-webhook] processing failed:', e && (e.status || e.code || 'error'));
    res.status(500).json({ ok: false, reason: 'processing failed, will retry' });
  }
}
