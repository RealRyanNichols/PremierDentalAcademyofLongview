/* PDA — ONE shared admin header for every /admin page.
 * ------------------------------------------------------------------
 * Include on every admin page:  <script defer src="/assets/admin-nav.js"></script>
 *
 * Replaces the page's own top <nav> (or prepends one if the page has none)
 * with an identical dark header: brand, every admin section, active-page
 * highlighting, #user-label and #signout preserved so existing page JS keeps
 * working. Links wrap on desktop; on phones a Menu button opens every section.
 *
 * This is the real fix for "every admin page has different buttons".
 * It replaces the old floating admin-quicknav pill.
 */
(function () {
  'use strict';
  if (window.__pdaAdminNav) return;
  window.__pdaAdminNav = true;

  // [path, emoji, plain-English label, group]
  var LINKS = [
    ['/admin',             '🏠', 'Home',                  'Daily'],
    ['/admin/kpi',         '📈', 'Business numbers',      'Daily'],
    ['/admin/leads',       '📥', 'Leads',                 'Daily'],
    ['/admin/questions',   '🙋', 'Student questions',     'Daily'],
    ['/admin/students',    '🎓', 'Enrolled students',     'People'],
    ['/admin/cohorts',     '🗓️', 'Class dates & seats',   'People'],
    ['/admin/progress',    '📊', 'Student progress',      'People'],
    ['/admin/paperwork',   '📋', 'Signed forms',          'People'],
    ['/admin/instructors', '👩‍🏫', 'Instructor applicants', 'People'],
    ['/admin/courses',     '📚', 'Lesson editor',         'Teaching'],
    ['/admin/approvals',   '✅', 'Course approvals',      'Teaching'],
    ['/admin/reports',     '🛠️', 'Lesson problems',       'Teaching'],
    ['/admin/feedback',    '💬', 'Student ratings',       'Teaching'],
    ['/admin/emails',      '📧', 'Email campaigns',       'Marketing'],
    ['/admin/chat',        '🗨️', 'Website chatbot',       'Marketing'],
    ['/admin/brain',       '🧠', 'Free tool sign-ups',    'Marketing'],
  ];
  var GROUPS = ['Daily', 'People', 'Teaching', 'Marketing'];
  // Pages that admit an instructor-only account (profiles.is_instructor without is_admin).
  // Every other admin page — and its queue-count badge query — is admin-only.
  var INSTRUCTOR_PATHS = ['/admin/progress', '/admin/questions', '/admin/students'];
  var INSTRUCTOR_HOME = '/admin/progress';

  // Public Supabase project URL + publishable key (same values every admin page
  // already ships in client code). Only used for the queue-count badges.
  var SB_URL = 'https://lmbsuwslsycukynzpzik.supabase.co';
  var SB_KEY = 'sb_publishable_vzuQZbkmj-UsYZVs5Zqw9w_c8PiOfbh';

  var navEl = null;
  var badgeTotal = 0;

  function currentPath() {
    var p = location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
    return p === '' ? '/' : p;
  }

  function groupHeading(name, extra) {
    return '<span data-pda-group-heading="' + name + '" class="' + extra + ' text-[10px] uppercase tracking-wide font-bold text-slate-500 select-none">' + name + '</span>';
  }

  function badgeSpan(path) {
    return '<span data-pda-badge="' + path + '" class="hidden"></span>';
  }

  function build() {
    // Keep the admin top clean: hide any leftover/duplicate page nav and tighten
    // the top spacing so the controls/options sit right under the menu.
    if (!document.getElementById('pda-admin-nav-css')) {
      var css = document.createElement('style');
      css.id = 'pda-admin-nav-css';
      css.textContent =
        'body > nav:not([data-pda-admin-nav]){display:none !important}' +
        'nav[data-pda-admin-nav] ~ main{padding-top:1rem !important}';
      document.head.appendChild(css);
    }
    var here = currentPath();
    var nav = document.createElement('nav');
    navEl = nav;
    nav.setAttribute('data-pda-admin-nav', '');
    nav.className = 'bg-slate-900 text-white sticky top-0 z-50';

    // Desktop: four group headings, each followed by its links, wrapping freely.
    var desktopLinks = GROUPS.map(function (g) {
      return groupHeading(g, 'shrink-0 pl-2 pr-1') +
        LINKS.filter(function (l) { return l[3] === g; }).map(function (l) {
          var active = here === l[0];
          return '<a href="' + l[0] + '" data-pda-link="' + l[0] + '" data-pda-group="' + l[3] + '" class="shrink-0 whitespace-nowrap inline-flex items-center text-sm font-semibold px-2.5 py-1.5 rounded-lg ' +
            (active ? 'bg-teal-600 text-white' : 'text-slate-300 hover:text-white hover:bg-white/10') + '">' +
            l[1] + ' ' + l[2] + badgeSpan(l[0]) + '</a>';
        }).join('');
    }).join('');

    // Mobile: a 2-column grid of every link under the same four headings.
    var mobileLinks = GROUPS.map(function (g) {
      return groupHeading(g, 'col-span-2 pt-2 px-2') +
        LINKS.filter(function (l) { return l[3] === g; }).map(function (l) {
          var active = here === l[0];
          return '<a href="' + l[0] + '" data-pda-link="' + l[0] + '" data-pda-group="' + l[3] + '" class="min-h-[44px] min-w-0 flex items-center gap-1.5 px-3 rounded-lg text-sm font-semibold ' +
            (active ? 'bg-teal-600 text-white' : 'text-slate-200 hover:text-white hover:bg-white/10') + '">' +
            '<span class="shrink-0">' + l[1] + '</span><span class="truncate">' + l[2] + '</span>' + badgeSpan(l[0]) + '</a>';
        }).join('');
    }).join('');

    nav.innerHTML =
      '<div class="max-w-7xl mx-auto px-3 sm:px-6 min-h-14 flex flex-wrap items-center gap-3 py-2">' +
        '<a href="/admin" data-pda-brand class="flex items-center gap-2 font-bold shrink-0">' +
          '<span class="w-7 h-7 rounded bg-gradient-to-br from-teal-500 to-cyan-600 text-white grid place-items-center font-extrabold">P</span>' +
          '<span class="hidden sm:inline">PDA Admin</span>' +
        '</a>' +
        '<div class="hidden sm:flex flex-wrap items-center gap-1 flex-1 min-w-0">' +
          desktopLinks +
        '</div>' +
        '<button id="pda-admin-menu-btn" type="button" aria-expanded="false" aria-controls="pda-admin-menu" ' +
          'class="sm:hidden relative ml-auto min-h-[40px] inline-flex items-center gap-1 px-3 rounded-lg text-sm font-semibold text-slate-200 bg-white/10 hover:bg-white/20">' +
          'Menu <span aria-hidden="true">&#9662;</span>' +
          '<span data-pda-menu-dot class="hidden"></span>' +
        '</button>' +
        '<div class="flex items-center gap-3 text-sm shrink-0">' +
          '<span id="user-label" class="text-slate-400 hidden md:inline"></span>' +
          '<a href="/dashboard" class="text-slate-300 hover:text-white hidden sm:inline" title="Student dashboard">🎒</a>' +
          '<button id="signout" class="text-slate-300 hover:text-white min-h-[40px]">Sign out</button>' +
        '</div>' +
      '</div>' +
      '<div id="pda-admin-menu" class="hidden sm:hidden border-t border-white/10 px-3 pb-3 max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain">' +
        '<div class="grid grid-cols-2 gap-1">' + mobileLinks + '</div>' +
      '</div>';

    // Mobile menu toggle (closed by default; toggled via the hidden class only).
    var menuBtn = nav.querySelector('#pda-admin-menu-btn');
    var menuPanel = nav.querySelector('#pda-admin-menu');
    if (menuBtn && menuPanel) {
      menuBtn.addEventListener('click', function () {
        var open = menuPanel.classList.contains('hidden');
        if (open) menuPanel.classList.remove('hidden'); else menuPanel.classList.add('hidden');
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        syncMenuDot();
      });
    }

    // Replace the page's own top nav so every admin page gets the same header.
    var old = document.querySelector('body > nav');
    if (old) {
      // Carry over anything the page already stamped into #user-label.
      var oldLabel = old.querySelector('#user-label');
      if (oldLabel && oldLabel.textContent) nav.querySelector('#user-label').textContent = oldLabel.textContent;
      old.replaceWith(nav);
    } else {
      document.body.prepend(nav);
    }

    // Default signout works even if the page's own JS never wires it.
    var so = nav.querySelector('#signout');
    if (so && !so.onclick) so.onclick = function () { location.href = '/logout?then=home'; };

    // Queue-count badges: run after the page's own Supabase client initialises.
    setTimeout(paintBadges, 0);
  }

  // Rose dot on the Menu button when the panel is closed and any queue is non-zero.
  function syncMenuDot() {
    if (!navEl) return;
    var dot = navEl.querySelector('[data-pda-menu-dot]');
    var panel = navEl.querySelector('#pda-admin-menu');
    if (!dot || !panel) return;
    var closed = panel.classList.contains('hidden');
    dot.className = (closed && badgeTotal > 0)
      ? 'absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900'
      : 'hidden';
  }

  // Paint one count onto every badge for that path (desktop row + mobile grid).
  function setBadge(path, n) {
    var els = document.querySelectorAll('[data-pda-badge="' + path + '"]');
    Array.prototype.forEach.call(els, function (el) {
      if (n > 0) {
        el.textContent = String(n);
        el.className = n >= 10
          ? 'ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[11px] font-bold leading-none bg-rose-600 text-white'
          : 'ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[11px] font-bold leading-none bg-amber-400 text-slate-900';
      } else {
        el.textContent = '';
        el.className = 'hidden';
      }
    });
  }

  // Instructor-only account: keep just the pages that admit instructors (desktop row
  // AND mobile panel), drop any group heading left with no links, and send the brand
  // link to the gradebook instead of the admin-only hub. Admins never reach this.
  function applyInstructorNav() {
    if (!navEl) return;
    var links = navEl.querySelectorAll('a[data-pda-link]');
    Array.prototype.forEach.call(links, function (a) {
      if (INSTRUCTOR_PATHS.indexOf(a.getAttribute('data-pda-link')) === -1 && a.parentNode) a.parentNode.removeChild(a);
    });
    var heads = navEl.querySelectorAll('[data-pda-group-heading]');
    Array.prototype.forEach.call(heads, function (h) {
      var g = h.getAttribute('data-pda-group-heading');
      var left = h.parentNode ? h.parentNode.querySelectorAll('a[data-pda-group="' + g + '"]').length : 0;
      if (!left && h.parentNode) h.parentNode.removeChild(h);
    });
    var brand = navEl.querySelector('a[data-pda-brand]');
    if (brand) brand.setAttribute('href', INSTRUCTOR_HOME);
  }

  // Who is signed in: { admin, instructor } from the own profile row (+ the JWT admin
  // claim). Resolves null when unknown so the caller keeps the default (admin) menu —
  // every page still enforces its own gate.
  function readRole(sb) {
    return sb.auth.getSession().then(function (res) {
      var s = res && res.data ? res.data.session : null;
      if (!s || !s.user) return null;
      var claim = !!(s.user.app_metadata && s.user.app_metadata.is_admin === true);
      return sb.from('profiles').select('is_admin,is_instructor').eq('id', s.user.id).maybeSingle().then(function (q) {
        var p = (q && q.data) || {};
        return { admin: claim || p.is_admin === true, instructor: p.is_instructor === true };
      });
    }).catch(function () { return null; });
  }

  // Live queue counts. RLS scopes every count to the signed-in admin; a failed
  // or blocked count simply leaves that badge hidden and never breaks the nav.
  function paintBadges() {
    try {
      if (!window.supabase || typeof window.supabase.createClient !== 'function') return;
      if (typeof Promise === 'undefined' || typeof Promise.allSettled !== 'function') return;
      // Read-only counts: reuse the stored session but skip the page client's
      // refresh timer and URL-callback detection (no duplicated auth work).
      var sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } });
      var QUEUES = [
        ['/admin/questions', function () { return sb.from('student_questions').select('id', { count: 'exact', head: true }).is('answer', null); }],
        ['/admin/approvals', function () { return sb.from('content_drafts').select('id', { count: 'exact', head: true }).eq('status', 'pending'); }],
        ['/admin/reports',   function () { return sb.from('lesson_reports').select('id', { count: 'exact', head: true }).eq('status', 'new'); }],
        ['/admin/leads',     function () { return sb.from('leads').select('id', { count: 'exact', head: true }).is('last_contact_at', null); }],
      ];
      readRole(sb).then(function (role) {
        var queues = QUEUES;
        if (role && role.instructor && !role.admin) {
          try { applyInstructorNav(); } catch (e) { /* never break the nav */ }
          // Hidden links' tables are admin-only (would 401) — only count what's still in the menu.
          queues = QUEUES.filter(function (q) { return INSTRUCTOR_PATHS.indexOf(q[0]) !== -1; });
        }
        return Promise.allSettled(queues.map(function (q) {
          try { return Promise.resolve(q[1]()); } catch (e) { return Promise.reject(e); }
        })).then(function (results) {
          var total = 0;
          results.forEach(function (r, i) {
            if (r.status !== 'fulfilled' || !r.value || r.value.error) return;
            var n = Number(r.value.count) || 0;
            if (n < 0) n = 0;
            total += n;
            try { setBadge(queues[i][0], n); } catch (e) { /* never break the nav */ }
          });
          badgeTotal = total;
          syncMenuDot();
        });
      }).catch(function () { /* never break the nav */ });
    } catch (e) { /* never break the nav */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
