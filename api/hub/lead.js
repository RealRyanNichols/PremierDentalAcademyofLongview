// Office Hub — generator lead capture (email-me-this-plan).
//
// Accepts the no-JS form POST from the server-rendered plan page (urlencoded)
// and JSON from the enhanced tool page. Validates server-side, inserts into
// hub_generator_leads with the service-role key (the table has NO client
// policies), and redirects form posts back to the plan (POST→redirect→GET).
//
// EMAIL SENDING IS GATED OFF: HUB_EMAIL_ENABLED defaults to false, campaigns
// never send, and enabling it is a separate Amanda approval (Deliverable-7 §6).
// Marketing consent is separate from the plan email and requires a recorded
// consent text version (DB check constraint enforces it too).

import crypto from 'node:crypto';
import { sb, resendSend, json } from '../_common.mjs';
import { queryToInputs, buildPlan } from '../../assets/hub/plan-builder.mjs';
import { CONTACT } from '../../assets/hub/hub-config.mjs';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const CONSENT_VERSION = 'hub-lead-v1-2026-08';

function wantsHtml(req) {
  const ct = String(req.headers['content-type'] || '');
  return ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data');
}
function redirectBack(res, planQuery, extra) {
  const q = new URLSearchParams(planQuery || '');
  for (const [k, v] of Object.entries(extra)) q.set(k, v);
  res.statusCode = 303;
  res.setHeader('Location', `/api/hub/plan?${q.toString()}#email`);
  res.end();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { json(res, 405, { ok: false, error: 'POST only' }); return; }
  const b = req.body || {};
  const asHtml = wantsHtml(req);
  const planQuery = typeof b.plan_query === 'string' ? b.plan_query.slice(0, 500) : '';
  const fail = (msg) => asHtml
    ? redirectBack(res, planQuery, { err: msg })
    : json(res, 400, { ok: false, error: msg });

  // Honeypot: bots fill "company"; pretend success, store nothing.
  if (typeof b.company === 'string' && b.company.trim() !== '') {
    return asHtml ? redirectBack(res, planQuery, { saved: '1' }) : json(res, 200, { ok: true });
  }

  const email = String(b.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return fail('Please enter a valid email address.');
  const name = String(b.name || '').trim().slice(0, 120) || null;
  const consent = b.marketing_consent === true || b.marketing_consent === 'true' || b.marketing_consent === 'on';
  const consentVersion = String(b.consent_text_version || '').trim() || CONSENT_VERSION;

  const inputs = queryToInputs(planQuery);
  const plan = buildPlan(inputs);

  // UTM/source attribution: first-touch params ride along in plan_query.
  const q = new URLSearchParams(planQuery);
  const source = {};
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'partner']) {
    if (q.get(k)) source[k] = q.get(k).slice(0, 200);
  }
  if (req.headers.referer) source.referrer = String(req.headers.referer).slice(0, 300);
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  if (ip) source.ip_hash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 24);

  try {
    // Rate limit: max 5 lead submissions per IP per hour (DB-based counter).
    if (source.ip_hash) {
      const since = new Date(Date.now() - 3600_000).toISOString();
      const recent = await sb('hub_generator_leads', {
        query: {
          select: 'id',
          'source->>ip_hash': `eq.${source.ip_hash}`,
          created_at: `gte.${since}`,
          limit: '6',
        },
      });
      if (Array.isArray(recent) && recent.length >= 5) {
        return asHtml
          ? redirectBack(res, planQuery, { err: 'Too many requests — please try again in an hour.' })
          : json(res, 429, { ok: false, error: 'rate_limited' });
      }
    }

    await sb('hub_generator_leads', {
      method: 'POST',
      prefer: 'return=minimal',
      body: [{
        email, name,
        role_interest: plan.inputs.role,
        inputs: plan.inputs,
        marketing_consent: consent,
        consent_text_version: consent ? consentVersion : null,
        source,
      }],
    });
  } catch (e) {
    // Table missing (pre-migration) or DB unavailable: fail politely, never 500 raw.
    return fail('Saving is not available yet — print the plan, or call us and we will help.');
  }

  // Plan email — written but OFF by default. Enabling is a separate approval.
  if (process.env.HUB_EMAIL_ENABLED === 'true') {
    try {
      const link = `${CONTACT.site}/api/hub/plan?${planQuery}`;
      await resendSend({
        to: email,
        subject: 'Your 30/60/90-day onboarding plan',
        html: `<p>Hi${name ? ' ' + name.split(' ')[0] : ''},</p>
<p>Here is the onboarding plan you built: <a href="${link}">open your plan</a>. Print it, or bring it into our onboarding hub to track it week by week.</p>
<p>${CONTACT.name} · ${CONTACT.address} · ${CONTACT.phoneDisplay}</p>`,
      });
    } catch { /* the lead is stored; email failure is non-fatal */ }
  }

  return asHtml ? redirectBack(res, planQuery, { saved: '1' }) : json(res, 200, { ok: true });
}
