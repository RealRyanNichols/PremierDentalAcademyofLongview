/*!
 * Onboarding & Competency Hub — private app shell (every /hub/* page).
 *
 * Classic script (loaded after the supabase-js CDN script). Exposes
 * window.HUB with: auth/session, workspace (org) context + role, the shared
 * top bar + mobile bottom tab bar, accessible modal + toast helpers,
 * fetch-with-retry UI helpers, RPC + analytics wrappers.
 *
 * Every hub page is noindex (meta tag in each head) and role-guarded twice:
 * here in the UI, and by RLS + security-definer RPCs in the database.
 */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://lmbsuwslsycukynzpzik.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_vzuQZbkmj-UsYZVs5Zqw9w_c8PiOfbh';
  // Display name lives in ONE place (assets/hub/hub-config.mjs). Classic
  // scripts can't import ESM, so keep this mirror in sync with hub-config.mjs
  // (scripts/check-hub.mjs verifies parity).
  var HUB_DISPLAY_NAME = 'Onboarding & Competency Hub';

  var sb = null;
  if (window.supabase && window.supabase.createClient) {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }

  var state = { session: null, orgId: null, org: null, membership: null, memberships: [] };

  // ── tiny DOM helpers ──────────────────────────────────────────────────────
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k.indexOf('on') === 0) n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtDate(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) { return String(iso).slice(0, 10); }
  }

  // ── toasts (aria-live polite) ─────────────────────────────────────────────
  var toastRegion = null;
  function toast(msg, kind) {
    if (!toastRegion) {
      toastRegion = el('div', { 'aria-live': 'polite', class: 'fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[70] space-y-2 w-[92%] max-w-md' });
      document.body.appendChild(toastRegion);
    }
    var t = el('div', {
      class: 'rounded-xl px-4 py-3 shadow-lg text-sm font-semibold ' +
        (kind === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'),
      text: msg,
    });
    toastRegion.appendChild(t);
    setTimeout(function () { t.remove(); }, 5000);
  }

  // ── accessible modal (focus trap, Esc closes, never window.confirm) ───────
  function modal(opts) {
    return new Promise(function (resolve) {
      var prevFocus = document.activeElement;
      var overlay = el('div', { class: 'fixed inset-0 bg-slate-900/50 z-[80] flex items-center justify-center p-4' });
      var box = el('div', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'hub-modal-title', class: 'bg-white rounded-2xl max-w-md w-full p-6 shadow-xl' });
      box.innerHTML =
        '<h2 id="hub-modal-title" class="font-bold text-lg">' + esc(opts.title) + '</h2>' +
        '<div class="text-slate-600 mt-2 text-sm">' + (opts.bodyHtml || esc(opts.body || '')) + '</div>' +
        (opts.input ? '<label class="block font-semibold text-sm mt-4" for="hub-modal-input">' + esc(opts.input) + '</label>' +
          '<input id="hub-modal-input" type="text" class="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2">' : '') +
        '<div class="mt-5 flex justify-end gap-3">' +
        '<button type="button" data-act="cancel" class="px-4 py-2 rounded-lg border border-slate-300 font-semibold text-sm">' + esc(opts.cancelLabel || 'Cancel') + '</button>' +
        '<button type="button" data-act="ok" class="px-4 py-2 rounded-lg font-semibold text-sm text-white ' + (opts.danger ? 'bg-red-600 hover:bg-red-500' : 'bg-sky-600 hover:bg-sky-500') + '">' + esc(opts.okLabel || 'Confirm') + '</button>' +
        '</div>';
      overlay.appendChild(box);
      document.body.appendChild(overlay);
      var focusables = $$('button, input', box);
      function close(val) {
        overlay.remove();
        document.removeEventListener('keydown', onKey, true);
        if (prevFocus && prevFocus.focus) prevFocus.focus();
        resolve(val);
      }
      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); close(null); }
        if (e.key === 'Tab') { // trap
          var first = focusables[0], last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      document.addEventListener('keydown', onKey, true);
      box.querySelector('[data-act=cancel]').addEventListener('click', function () { close(null); });
      box.querySelector('[data-act=ok]').addEventListener('click', function () {
        var input = $('#hub-modal-input', box);
        close(input ? input.value : true);
      });
      overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) close(null); });
      (focusables[focusables.length - 1] || box).focus();
      if ($('#hub-modal-input', box)) $('#hub-modal-input', box).focus();
    });
  }

  // ── data helpers ──────────────────────────────────────────────────────────
  function rpc(name, args) {
    return sb.rpc(name, args || {}).then(function (r) {
      if (r.error) throw new Error(r.error.message || 'Request failed');
      return r.data;
    });
  }
  function from(table) { return sb.from(table); }

  // Save-failure / offline handling: run an async op; on failure show a retry
  // banner in `container` (form state stays intact — caller keeps its inputs).
  function withRetry(container, op) {
    return op().catch(function (err) {
      return new Promise(function (resolve, reject) {
        var banner = el('div', { class: 'mt-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3', role: 'alert' });
        var isOffline = !navigator.onLine || /fetch|network/i.test(String(err && err.message));
        banner.innerHTML = '<span>' + (isOffline ? "Couldn't save — you look offline. Your entries are still here." : 'Save failed: ' + esc(err.message)) + '</span>';
        var btn = el('button', { type: 'button', class: 'shrink-0 bg-amber-600 text-white font-semibold rounded-lg px-3 py-1.5', text: 'Retry' });
        banner.appendChild(btn);
        container.appendChild(banner);
        btn.addEventListener('click', function () {
          banner.remove();
          withRetry(container, op).then(resolve, reject);
        });
      });
    });
  }

  var anonId = null;
  try {
    anonId = localStorage.getItem('hub_anon_id') || crypto.randomUUID();
    localStorage.setItem('hub_anon_id', anonId);
  } catch (e) {}
  function track(eventName, props, key) {
    try {
      var headers = { 'Content-Type': 'application/json' };
      if (state.session && state.session.access_token) headers.Authorization = 'Bearer ' + state.session.access_token;
      fetch('/api/hub/events', {
        method: 'POST', headers: headers, keepalive: true,
        body: JSON.stringify({
          event_name: eventName, props: props || {}, org_id: state.orgId, anon_id: anonId,
          idempotency_key: key || (eventName + ':' + (state.orgId || anonId) + ':' + crypto.randomUUID()),
        }),
      }).catch(function () {});
    } catch (e) {}
  }

  // ── shell (top bar + mobile bottom tabs) ──────────────────────────────────
  var NAV = [
    { href: '/hub', label: 'Home', roles: ['owner', 'manager', 'trainer', 'employee'], icon: '🏠' },
    { href: '/hub/sops', label: 'SOPs', roles: ['owner', 'manager', 'trainer', 'employee'], icon: '📋' },
    { href: '/hub/settings', label: 'Settings', roles: ['owner', 'manager'], icon: '⚙️' },
  ];
  function renderShell() {
    var here = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/hub';
    var role = state.membership ? state.membership.role : null;
    var items = NAV.filter(function (i) { return !role || i.roles.indexOf(role) !== -1; });
    var top = $('#hub-topbar');
    if (top) {
      var demoBadge = (state.org && state.org.settings && state.org.settings.demo)
        ? '<span class="text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 rounded-full px-2 py-0.5 shrink-0">Sample data — fictional</span>' : '';
      top.innerHTML =
        '<div class="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">' +
        '<span class="flex items-center gap-2 min-w-0"><a href="/hub" class="font-bold text-slate-900 truncate">' + esc(state.org ? state.org.name : HUB_DISPLAY_NAME) + '</a>' + demoBadge + '</span>' +
        '<div class="hidden min-[780px]:flex items-center gap-1">' +
        items.map(function (i) {
          var active = here === i.href;
          return '<a href="' + i.href + '" class="px-3 py-1.5 rounded-lg text-sm font-semibold ' + (active ? 'bg-sky-100 text-sky-800' : 'text-slate-600 hover:bg-slate-100') + '"' + (active ? ' aria-current="page"' : '') + '>' + esc(i.label) + '</a>';
        }).join('') +
        '<button type="button" id="hub-signout" class="ml-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-100">Sign out</button>' +
        '</div>' +
        '<button type="button" id="hub-signout-m" class="min-[780px]:hidden px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-500">Sign out</button>' +
        '</div>';
      $$('#hub-signout, #hub-signout-m').forEach(function (b) {
        b.addEventListener('click', function () {
          sb.auth.signOut().then(function () { location.href = '/hub/login'; });
        });
      });
    }
    var bottom = $('#hub-bottombar');
    if (bottom) {
      bottom.innerHTML =
        '<div class="grid grid-cols-' + items.length + '">' +
        items.map(function (i) {
          var active = here === i.href;
          return '<a href="' + i.href + '" class="flex flex-col items-center py-2 text-[11px] font-semibold ' + (active ? 'text-sky-700' : 'text-slate-500') + '"' + (active ? ' aria-current="page"' : '') + '>' +
            '<span aria-hidden="true" class="text-lg leading-none">' + i.icon + '</span><span class="mt-0.5">' + esc(i.label) + '</span></a>';
        }).join('') + '</div>';
    }
  }

  // ── screens: loading / error / denied / empty ─────────────────────────────
  function screen(mainSel, html) { var m = $(mainSel || '#hub-main'); if (m) m.innerHTML = html; return m; }
  function skeleton(lines) {
    var rows = '';
    for (var i = 0; i < (lines || 4); i++) rows += '<div class="animate-pulse bg-slate-200 rounded-xl h-16"></div>';
    return '<div class="space-y-3" aria-label="Loading">' + rows + '</div>';
  }
  function denied(msg) {
    return '<div class="bg-white border border-slate-200 rounded-2xl p-8 text-center">' +
      '<h1 class="font-bold text-xl">You don’t have access to this page</h1>' +
      '<p class="text-slate-600 mt-2">' + esc(msg || 'This area is for other roles in your workspace. If that seems wrong, ask your office owner or manager.') + '</p>' +
      '<a href="/hub" class="inline-block mt-5 bg-sky-600 text-white font-semibold px-5 py-2.5 rounded-xl">Back to home</a></div>';
  }
  function errorState(err, retry) {
    var d = el('div', { class: 'bg-white border border-slate-200 rounded-2xl p-8 text-center', role: 'alert' });
    d.innerHTML = '<h2 class="font-bold text-xl">Something didn’t load</h2>' +
      '<p class="text-slate-600 mt-2 text-sm">' + esc((err && err.message) || 'Please try again.') + '</p>';
    var b = el('button', { type: 'button', class: 'mt-5 bg-sky-600 text-white font-semibold px-5 py-2.5 rounded-xl', text: 'Try again' });
    b.addEventListener('click', retry);
    d.appendChild(b);
    return d;
  }

  // ── boot: session → org context → role guard → page init ─────────────────
  // options: { public: bool, roles: ['owner',...], needsOrg: bool (default true) }
  function init(options, pageMain) {
    options = options || {};
    if (!sb) {
      screen(null, '<div class="bg-white border rounded-2xl p-8 text-center">Could not load. Check your connection and refresh.</div>');
      return Promise.resolve(null);
    }
    return sb.auth.getSession().then(function (r) {
      state.session = r.data ? r.data.session : null;
      if (!state.session) {
        if (options.public) { renderShell(); return pageMain ? pageMain(state) : state; }
        var next = encodeURIComponent(location.pathname + location.search);
        location.replace('/hub/login?next=' + next);
        return null;
      }
      if (options.needsOrg === false) { renderShell(); return pageMain ? pageMain(state) : state; }
      return from('hub_org_memberships')
        .select('id, org_id, role, title, status, hub_organizations(id, name, practice_type, plan_tier, settings)')
        .eq('status', 'active')
        .then(function (res) {
          if (res.error) throw new Error(res.error.message);
          state.memberships = (res.data || []).filter(function (m) { return m.profile_id !== null || true; });
          var saved = null;
          try { saved = localStorage.getItem('hub_org'); } catch (e) {}
          var mine = state.memberships.filter(function (m) { return m.hub_organizations; });
          var chosen = mine.find(function (m) { return m.org_id === saved; }) || mine[0];
          if (!chosen) {
            // No workspace: support profiles go to the console; everyone else to setup.
            if (location.pathname.indexOf('/hub/setup') === -1 && location.pathname.indexOf('/hub/support') === -1 && location.pathname.indexOf('/hub/invite') === -1) {
              location.replace('/hub/setup');
              return null;
            }
            renderShell();
            return pageMain ? pageMain(state) : state;
          }
          state.orgId = chosen.org_id;
          state.org = chosen.hub_organizations;
          state.membership = chosen;
          try { localStorage.setItem('hub_org', state.orgId); } catch (e) {}
          renderShell();
          if (options.roles && options.roles.indexOf(chosen.role) === -1) {
            screen(null, denied());
            return state;
          }
          return pageMain ? pageMain(state) : state;
        });
    }).catch(function (err) {
      var m = $('#hub-main');
      if (m) { m.innerHTML = ''; m.appendChild(errorState(err, function () { location.reload(); })); }
      return null;
    });
  }

  window.HUB = {
    sb: function () { return sb; }, state: state,
    $: $, $$: $$, el: el, esc: esc, fmtDate: fmtDate,
    toast: toast, modal: modal, rpc: rpc, from: from, withRetry: withRetry,
    track: track, init: init, screen: screen, skeleton: skeleton,
    denied: denied, errorState: errorState,
    DISPLAY_NAME: HUB_DISPLAY_NAME,
  };
})();
