/*!
 * PDA lead submit — ONE path for every lead form on the site. Never fails silently.
 *
 * Why: every form used to insert straight into Supabase and show "success" even when
 * the insert failed (the lead was only stashed in the visitor's own browser). A
 * Facebook click that fills a form and vanishes is the most expensive failure we have.
 *
 * What submit() does, in order, stopping at the first success:
 *   1. POST /api/lead (same-origin serverless function; validates, de-duplicates,
 *      inserts into public.leads — the DB trigger emails Amanda — and if the insert
 *      fails it emails the lead to hello@ directly so it is never lost).
 *   2. Direct insert into public.leads over REST with the public anon key (the path
 *      the forms used before; the public INSERT policy allows it).
 *   3. Nothing worked: the lead is stashed locally, retried on the next page load
 *      (flushPending, idempotent via submission_id) AND the page shows an honest error
 *      with call / text / email links and the visitor's answers still in the form.
 *
 * Attribution: the lead carries first-touch + last-touch UTMs, click ids, referrer and
 * landing page in leads.utm (jsonb) and leads.landing_page, plus a readable
 * "Attribution: …" line appended to message so /admin/leads shows it today.
 *
 * Usage (typical form):
 *   PDALead.bindForm(form, {
 *     event: 'application_submit',            // PDA.track name (fires with saved:true/false)
 *     build: function (fd) { return { first_name:…, email:…, phone:…, interest_path:…, message:…, source:'apply.html' }; },
 *     button: submitBtn, successEl: successDiv, // or redirect: '/thank-you'
 *     honeypot: 'company'                        // default; filled → pretend success, save nothing
 *   });
 *
 * Or manually: const r = await PDALead.submit(lead); if (!r.ok) PDALead.showError(container, r.row);
 */
(function (root) {
  'use strict';
  if (!root || root.PDALead) return;

  var SUPABASE_URL = 'https://lmbsuwslsycukynzpzik.supabase.co';
  var ANON_KEY = 'sb_publishable_vzuQZbkmj-UsYZVs5Zqw9w_c8PiOfbh'; // public publishable key (safe in client code)
  var API = '/api/lead';
  var PENDING_KEY = 'pda.pendingLeads';
  var TIMEOUT_MS = 12000;
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'ttclid', 'msclkid'];

  function facts() {
    var F = root.PDA_FACTS || {};
    return {
      phone: (F.phone && F.phone.display) || '(903) 913-6444',
      tel: (F.phone && F.phone.href) || 'tel:+19039136444',
      sms: 'sms:+19039136444',
      email: F.email || 'hello@premierdentalacademyoflongview.com'
    };
  }
  function uuid() {
    try { if (root.crypto && root.crypto.randomUUID) return root.crypto.randomUUID(); } catch (e) {}
    return 'sub-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }
  function str(v, max) { v = (v == null ? '' : String(v)).trim(); return max ? v.slice(0, max) : v; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  // ── Attribution ───────────────────────────────────────────────────────────
  function attribution() {
    var a = {};
    try { a = (root.PDA && root.PDA.attribution) ? (root.PDA.attribution() || {}) : (JSON.parse(localStorage.getItem('pda.utm') || '{}') || {}); } catch (e) { a = {}; }
    // Current URL wins for last touch (the analytics layer may not have run yet).
    try { var p = new URLSearchParams(location.search); UTM_KEYS.forEach(function (k) { var v = p.get(k); if (v) a[k] = str(v, 200); }); } catch (e) {}
    try { if (!a.referrer) a.referrer = str(document.referrer, 200); } catch (e) {}
    try { a.page = location.pathname; } catch (e) {}
    try { if (!a.first_touch) { var f = JSON.parse(localStorage.getItem('pda.utm_first') || 'null'); if (f && typeof f === 'object') a.first_touch = f; } } catch (e) {}
    return a;
  }
  // Human-readable line for the admin inbox (message column), e.g.
  // "Attribution: utm_source=facebook, utm_campaign=fb_apply, landing=/apply, first: utm_campaign=fb_moms"
  function attributionText(a) {
    a = a || attribution();
    var parts = [];
    UTM_KEYS.forEach(function (k) { if (a[k]) parts.push(k + '=' + a[k]); });
    if (a.referrer) parts.push('referrer=' + a.referrer);
    if (a.landing_path) parts.push('landing=' + a.landing_path);
    if (a.page && a.page !== a.landing_path) parts.push('page=' + a.page);
    var f = a.first_touch;
    if (f && typeof f === 'object') {
      var fp = [];
      UTM_KEYS.forEach(function (k) { if (f[k]) fp.push(k + '=' + f[k]); });
      if (f.landing_path) fp.push('landing=' + f.landing_path);
      if (f.referrer) fp.push('referrer=' + f.referrer);
      if (fp.length) parts.push('first: ' + fp.join(' '));
    }
    return parts.length ? 'Attribution: ' + parts.join(', ') : '';
  }

  // ── Row shaping ───────────────────────────────────────────────────────────
  function normalize(lead) {
    lead = lead || {};
    var a = attribution();
    var attrLine = attributionText(a);
    var message = str(lead.message, 4000);
    if (attrLine && message.indexOf('Attribution:') === -1) message = message ? (message + ' · ' + attrLine) : attrLine;
    var row = {
      first_name: str(lead.first_name, 120) || null,
      last_name: str(lead.last_name, 120) || null,
      email: str(lead.email, 200).toLowerCase() || null,
      phone: str(lead.phone, 40) || null,
      interest_path: str(lead.interest_path, 200) || null,
      message: message || null,
      source: str(lead.source, 120) || 'website',
      utm: Object.assign({}, a, { submission_id: (lead.utm && lead.utm.submission_id) || uuid() }),
      landing_page: str((a.first_touch && a.first_touch.landing_path) || a.landing_path || location.pathname, 300) || null
    };
    // Optional columns some callers set (blog tools, chatbot).
    ['pipeline_stage', 'status', 'last_contact_at', 'preferred_language', 'pay_intent', 'pay_when', 'path_preference', 'ready_timeline'].forEach(function (k) {
      if (lead[k] != null && lead[k] !== '') row[k] = str(lead[k], 200);
    });
    return row;
  }

  // ── Transports ────────────────────────────────────────────────────────────
  function fetchWithTimeout(url, opts, ms) {
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var t = ctrl ? setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, ms || TIMEOUT_MS) : null;
    opts = opts || {};
    if (ctrl) opts.signal = ctrl.signal;
    return fetch(url, opts).then(function (r) { if (t) clearTimeout(t); return r; }, function (e) { if (t) clearTimeout(t); throw e; });
  }
  function viaApi(row) {
    return fetchWithTimeout(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead: row, submission_id: row.utm.submission_id })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok || !j || j.ok !== true) throw new Error('api ' + r.status + ' ' + ((j && (j.error || j.message)) || ''));
        var via = j.via || 'api';
        return { via: via, persisted: j.persisted === true || (j.persisted == null && (via === 'db' || via === 'duplicate')), delivery: j.delivery || (via === 'email' ? 'email' : 'database') };
      });
    });
  }
  function viaRest(row) {
    return fetchWithTimeout(SUPABASE_URL + '/rest/v1/leads', {
      method: 'POST',
      headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(row)
    }).then(function (r) { if (!r.ok) throw new Error('rest ' + r.status); return 'db-direct'; });
  }

  // ── Local safety net ──────────────────────────────────────────────────────
  function readPending() { try { var p = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); return Array.isArray(p) ? p : []; } catch (e) { return []; } }
  function writePending(list) { try { localStorage.setItem(PENDING_KEY, JSON.stringify(list.slice(-20))); } catch (e) {} }
  function stash(row) {
    var list = readPending();
    list.push(Object.assign({}, row, { created_at: new Date().toISOString() }));
    writePending(list);
  }
  var flushing = false;
  function flushPending() {
    if (flushing) return Promise.resolve();
    var list = readPending();
    if (!list.length) return Promise.resolve();
    flushing = true;
    var keep = [];
    var chain = Promise.resolve();
    list.slice(0, 5).forEach(function (row) {
      chain = chain.then(function () {
        // Old stashes (pre-module) have no utm.submission_id; give them one so a retry can't double-store.
        if (!row.utm || typeof row.utm !== 'object') row.utm = {};
        if (!row.utm.submission_id) row.utm.submission_id = uuid();
        delete row.created_at;
        return viaApi(row).catch(function () { return viaRest(row); }).then(function () {}, function () { keep.push(row); });
      });
    });
    return chain.then(function () {
      writePending(keep.concat(list.slice(5)));
      flushing = false;
    });
  }

  // ── Public submit ─────────────────────────────────────────────────────────
  function submit(lead, opts) {
    opts = opts || {};
    var row = normalize(lead);
    var errors = [];
    return viaApi(row).then(function (result) { return { ok: true, via: result.via, persisted: result.persisted, delivery: result.delivery, row: row }; }, function (e) {
      errors.push('api: ' + (e && e.message));
      return viaRest(row).then(function (via) { return { ok: true, via: via, persisted: true, delivery: 'database', row: row }; }, function (e2) {
        errors.push('rest: ' + (e2 && e2.message));
        stash(row);
        try { console.error('[pda-lead] lead NOT saved — shown to visitor as an error', errors); } catch (e3) {}
        try { if (root.PDA && root.PDA.track) root.PDA.track('lead_submit_failed', { source: row.source }); } catch (e4) {}
        return { ok: false, errors: errors, row: row };
      });
    });
  }

  // ── Honest error UI ───────────────────────────────────────────────────────
  function mailtoFor(row) {
    var f = facts();
    var body = 'Hi Amanda, my form on the website did not go through. Here is my info:\n\n' +
      'Name: ' + ((row.first_name || '') + ' ' + (row.last_name || '')).trim() + '\n' +
      (row.phone ? 'Phone: ' + row.phone + '\n' : '') +
      (row.email ? 'Email: ' + row.email + '\n' : '') +
      (row.interest_path ? 'Interested in: ' + row.interest_path + '\n' : '') +
      (row.message ? '\n' + row.message.replace(/ · Attribution:.*$/, '') + '\n' : '');
    return 'mailto:' + f.email + '?subject=' + encodeURIComponent('Website form (did not send) — ' + ((row.first_name || '') + ' ' + (row.last_name || '')).trim()) + '&body=' + encodeURIComponent(body);
  }
  function errorHtml(row) {
    var f = facts();
    return '<strong>We couldn\'t send that just now.</strong> Your answers are still here — please try again in a moment, ' +
      'or reach us directly: <a href="' + f.tel + '" style="font-weight:700;text-decoration:underline">call ' + esc(f.phone) + '</a>, ' +
      '<a href="' + f.sms + '" style="font-weight:700;text-decoration:underline">text us</a>, or ' +
      '<a href="' + mailtoFor(row || {}) + '" style="font-weight:700;text-decoration:underline">email your info</a>. We\'ll get right back to you.';
  }
  function showError(el, row) {
    if (!el) return;
    el.innerHTML = errorHtml(row);
    el.hidden = false;
    el.classList.remove('hidden');
    el.setAttribute('role', 'alert');
    try { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
  }
  function ensureErrorEl(form, button) {
    var el = form.querySelector('.pda-lead-error');
    if (el) return el;
    el = document.createElement('p');
    el.className = 'pda-lead-error';
    el.style.cssText = 'margin-top:12px;padding:12px 14px;border:1px solid #fecdd3;background:#fff1f2;color:#9f1239;border-radius:12px;font-size:14px;line-height:1.5';
    el.hidden = true;
    if (button && button.parentNode === form) form.insertBefore(el, button.nextSibling);
    else form.appendChild(el);
    return el;
  }

  // ── Form binder ───────────────────────────────────────────────────────────
  function bindForm(form, cfg) {
    if (!form || form.__pdaLeadBound) return;
    form.__pdaLeadBound = true;
    cfg = cfg || {};
    var button = cfg.button || form.querySelector('button[type="submit"], [type="submit"]');
    var idleLabel = button ? button.textContent : '';
    var honeypot = cfg.honeypot === false ? null : (cfg.honeypot || 'company');
    function succeed(result) {
      // Keep saved=true's existing receipt/notification semantics; databaseSaved
      // is the explicit persistence signal. Email-only success must not retry.
      try { if (cfg.event && root.PDA && root.PDA.track) root.PDA.track(cfg.event, Object.assign({ saved: true, via: result.via, databaseSaved: result.persisted === true, delivery: result.delivery || 'none' }, cfg.eventProps || {})); } catch (e) {}
      if (typeof cfg.onSuccess === 'function') { try { cfg.onSuccess(result); } catch (e) {} }
      if (cfg.redirect) { location.href = cfg.redirect; return; }
      if (cfg.successEl) { form.classList.add('hidden'); form.hidden = true; cfg.successEl.classList.remove('hidden'); cfg.successEl.hidden = false; }
      try { if (cfg.scrollTop !== false && cfg.successEl) root.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      if (honeypot && str(fd.get(honeypot))) { succeed({ ok: true, via: 'honeypot', row: {} }); return; } // bot: pretend success, save nothing
      var lead = null;
      try { lead = cfg.build ? cfg.build(fd, form) : null; } catch (err) { lead = null; }
      if (!lead) return; // the page's own validation decided not to submit
      var errEl = cfg.errorEl || ensureErrorEl(form, button);
      errEl.hidden = true; errEl.classList.add('hidden');
      if (button) { button.disabled = true; button.textContent = cfg.busyLabel || 'Sending…'; }
      submit(lead).then(function (result) {
        if (result.ok) { succeed(result); return; }
        try { if (cfg.event && root.PDA && root.PDA.track) root.PDA.track(cfg.event, Object.assign({ saved: false }, cfg.eventProps || {})); } catch (e2) {}
        if (button) { button.disabled = false; button.textContent = idleLabel; }
        showError(errEl, result.row);
        if (typeof cfg.onError === 'function') { try { cfg.onError(result); } catch (e3) {} }
      });
    });
  }

  root.PDALead = { submit: submit, bindForm: bindForm, attribution: attribution, attributionText: attributionText, flushPending: flushPending, errorHtml: errorHtml, showError: showError, normalize: normalize };

  // Retry anything an earlier visit could not send (idempotent server-side).
  function later() { setTimeout(function () { flushPending().catch(function () {}); }, 2500); }
  if (document.readyState !== 'loading') later(); else document.addEventListener('DOMContentLoaded', later);
})(typeof window !== 'undefined' ? window : null);
