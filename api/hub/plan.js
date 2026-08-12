// Office Hub — server-rendered 30/60/90 plan result (the free generator).
//
// This is the no-JS path: the static form on /tools/onboarding-plan-generator
// submits GET here and this function returns the COMPLETE result as plain
// semantic HTML (no client JS required to read it — the "Loading…" shell
// pattern is the explicit anti-goal). With JS enabled the tool page renders
// the same plan inline from the same shared module and never hits this URL.
//
// No secrets required to render. The analytics write is best-effort and the
// page renders fine when the hub tables don't exist yet (pre-migration).

import crypto from 'node:crypto';
import { sb } from '../_common.mjs';
import { buildPlan, queryToInputs, dateForDay, ROLES, EXPERIENCE_LEVELS, PRACTICE_TYPES, FOCUS_AREAS } from '../../assets/hub/plan-builder.mjs';
import { CONTACT, HUB_SLUG } from '../../assets/hub/hub-config.mjs';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const KIND_LABEL = { task: 'Task', skill: 'Skill to sign off', quiz: 'Knowledge check', sop_read: 'Read the office way', checkin: 'Check-in' };

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.status(405).send('Method not allowed'); return; }

  // req.query values can be arrays (repeated ?focus= params) — rebuild faithfully.
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query || {})) {
    for (const one of Array.isArray(v) ? v : [v]) params.append(k, one);
  }
  const inputs = queryToInputs(params.toString());
  const plan = buildPlan(inputs);
  const start = /^\d{4}-\d{2}-\d{2}$/.test(req.query.start || '') ? req.query.start : null;
  const saved = req.query.saved === '1';
  const leadErr = typeof req.query.err === 'string' ? req.query.err.slice(0, 120) : '';

  // Best-effort analytics (server-side so no-JS visits still count). Never
  // blocks or breaks the render — the table may not exist pre-migration.
  try {
    await sb('hub_analytics_events', {
      method: 'POST',
      prefer: 'resolution=ignore-duplicates,return=minimal',
      query: { on_conflict: 'idempotency_key' },
      body: [{
        event_name: 'generator_completed',
        idempotency_key: `gen:${crypto.randomUUID()}`,
        props: {
          role: plan.inputs.role, experience: plan.inputs.experience,
          practice: plan.inputs.practiceType, focus_count: plan.inputs.focusAreas.length,
          rendered: 'server',
        },
      }],
    });
  } catch { /* analytics must never break the page */ }

  const qs = new URLSearchParams(params);
  qs.delete('saved'); qs.delete('err');

  const phaseHtml = plan.phases.map((ph) => `
    <section class="phase">
      <h2>${esc(ph.title)}</h2>
      <ol>
        ${ph.items.map((it) => `
        <li>
          <span class="day">Day ${it.day}${start ? ` · ${esc(dateForDay(start, it.day))}` : ''}</span>
          <strong>${esc(it.title)}</strong>
          <span class="kind">${esc(KIND_LABEL[it.kind] || 'Task')}</span>
          <p>${esc(it.detail)}</p>
        </li>`).join('')}
      </ol>
    </section>`).join('');

  const hidden = [
    `<input type="hidden" name="role_interest" value="${esc(plan.inputs.role)}">`,
    `<input type="hidden" name="plan_query" value="${esc(qs.toString())}">`,
    `<input type="hidden" name="consent_text_version" value="hub-lead-v1-2026-08">`,
  ].join('\n');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your 30/60/90-Day Onboarding Plan | Premier Dental Academy of Longview</title>
<meta name="description" content="A free, printable 30/60/90-day onboarding plan for your dental office new hire, built from your practice type and focus areas.">
<link rel="canonical" href="${esc(CONTACT.site)}/tools/onboarding-plan-generator">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon.png">
<style>
  :root { color-scheme: light; }
  body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; color: #0f172a; margin: 0; background: #f8fafc; }
  .wrap { max-width: 780px; margin: 0 auto; padding: 24px 20px 64px; }
  header.top { border-bottom: 1px solid #e2e8f0; background: #fff; }
  header.top .wrap { padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; }
  header.top a { color: #0f172a; text-decoration: none; font-weight: 600; }
  h1 { font-size: 1.7rem; line-height: 1.25; margin: 24px 0 6px; }
  .meta { color: #475569; margin: 0 0 4px; }
  .notes { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px 16px; margin: 18px 0; }
  .notes p { margin: 6px 0; }
  .phase { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin: 18px 0; }
  .phase h2 { font-size: 1.15rem; margin: 0 0 10px; color: #1d4ed8; }
  .phase ol { margin: 0; padding-left: 18px; }
  .phase li { margin: 12px 0; }
  .phase .day { display: inline-block; font-size: .8rem; font-weight: 700; color: #1d4ed8; background: #dbeafe; border-radius: 999px; padding: 1px 9px; margin-right: 8px; }
  .phase .kind { display: inline-block; font-size: .75rem; color: #64748b; border: 1px solid #e2e8f0; border-radius: 999px; padding: 0 8px; margin-left: 6px; }
  .phase p { margin: 4px 0 0; color: #334155; }
  .actions { display: flex; gap: 12px; flex-wrap: wrap; margin: 18px 0; }
  .btn { display: inline-block; background: #1d4ed8; color: #fff; border: 0; border-radius: 8px; padding: 10px 18px; font-weight: 600; text-decoration: none; cursor: pointer; font-size: 1rem; }
  .btn.secondary { background: #fff; color: #1d4ed8; border: 1px solid #bfdbfe; }
  .email-box { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin: 24px 0; }
  .email-box label { display: block; font-weight: 600; margin: 10px 0 4px; }
  .email-box input[type=text], .email-box input[type=email] { width: 100%; box-sizing: border-box; padding: 9px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; }
  .email-box .consent { display: flex; gap: 8px; align-items: flex-start; margin: 12px 0; font-size: .92rem; color: #334155; }
  .ok { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; border-radius: 10px; padding: 10px 14px; margin: 14px 0; }
  .err { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; border-radius: 10px; padding: 10px 14px; margin: 14px 0; }
  .hp { position: absolute; left: -5000px; }
  footer { color: #64748b; font-size: .88rem; border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 16px; }
  @media print {
    header.top, .actions, .email-box, .backlink { display: none; }
    body { background: #fff; } .phase { border: 1px solid #cbd5e1; break-inside: avoid; }
  }
</style>
</head>
<body>
<header class="top"><div class="wrap">
  <a href="/office-hub">Premier Dental Academy of Longview — onboarding hub for dental offices</a>
  <a class="backlink" href="/tools/onboarding-plan-generator">← Change answers</a>
</div></header>
<main class="wrap">
  <h1>Your 30/60/90-day onboarding plan</h1>
  <p class="meta">${esc(plan.labels.role)} · ${esc(plan.labels.practiceType)} · ${esc(plan.labels.experience)}${plan.labels.focusAreas.length ? ' · Focus: ' + esc(plan.labels.focusAreas.join(', ')) : ''}</p>
  ${start ? `<p class="meta">First day: ${esc(start)}</p>` : ''}
  <div class="notes">${plan.notes.map((n) => `<p>${esc(n)}</p>`).join('')}</div>
  <div class="actions">
    <button class="btn secondary" type="button" onclick="window.print()">Print this plan</button>
    <a class="btn" href="/office-hub">Track it week by week — see the hub</a>
  </div>
  ${phaseHtml}
  <div class="email-box" id="email">
    <h2>Email me this plan</h2>
    ${saved ? '<p class="ok">Saved — check your inbox shortly. (If email sending is not yet enabled, our team follows up by hand.)</p>' : ''}
    ${leadErr ? `<p class="err">${esc(leadErr)}</p>` : ''}
    <form method="POST" action="/api/hub/lead">
      ${hidden}
      <div class="hp" aria-hidden="true"><label>Company<input type="text" name="company" tabindex="-1" autocomplete="off"></label></div>
      <label for="lead-name">Your name (optional)</label>
      <input id="lead-name" type="text" name="name" autocomplete="name">
      <label for="lead-email">Email</label>
      <input id="lead-email" type="email" name="email" required autocomplete="email">
      <div class="consent">
        <input id="lead-consent" type="checkbox" name="marketing_consent" value="true">
        <label for="lead-consent">Also send me occasional practical hiring &amp; training tips from Premier Dental Academy of Longview. Optional — the plan email works without this box.</label>
      </div>
      <button class="btn" type="submit">Email my plan</button>
    </form>
  </div>
  <footer>
    <p>${esc(plan.disclaimer)}</p>
    <p>Built by ${esc(CONTACT.name)} · ${esc(CONTACT.address)} · <a href="${esc(CONTACT.phoneHref)}">${esc(CONTACT.phoneDisplay)}</a> · <a href="mailto:${esc(CONTACT.email)}">${esc(CONTACT.email)}</a></p>
    <p><a href="/${esc(HUB_SLUG)}">About the onboarding hub</a> · <a href="/${esc(HUB_SLUG)}/tutorials">Tutorials</a></p>
  </footer>
</main>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.status(200).send(html);
}
