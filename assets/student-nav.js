/* PDA — ONE shared student-portal header.
 * ------------------------------------------------------------------
 * Include on every signed-in student surface (dashboard, portal, skills-lab):
 *   <script defer src="/assets/student-nav.js"></script>
 *
 * Renders an identical top bar with the same buttons everywhere: Dashboard,
 * Skills Lab, Tools, My courses, Ask teacher, and the account menu. On the
 * dashboard it REPLACES the page's own <nav> (the page JS null-guards for
 * exactly this); on other pages it slots in above the page's own header.
 * Mobile: the link row scrolls horizontally — nothing disappears.
 */
(function () {
  'use strict';
  if (window.__pdaStudentNav) return;
  window.__pdaStudentNav = true;

  var LINKS = [
    ['/dashboard',                '🎒', 'Dashboard'],
    ['/skills-lab',               '🦷', 'Skills Lab'],
    ['/tools',                    '🧰', 'Tools'],
    ['/learn',                    '🎓', 'My courses'],
    ['/dashboard#ask-teacher',    '💬', 'Ask teacher'],
  ];

  function currentPath() {
    var p = location.pathname.replace(/\.html$/, '').replace(/\/$/, '').replace(/\/index$/, '');
    return p === '' ? '/' : p;
  }

  function build() {
    var here = currentPath();
    var nav = document.createElement('nav');
    nav.setAttribute('data-pda-keep', '');
    nav.setAttribute('data-pda-student-nav', '');
    nav.className = 'bg-white border-b border-slate-200';
    nav.innerHTML =
      '<div class="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center gap-3">' +
        '<a href="/dashboard" class="flex items-center gap-2 font-bold shrink-0">' +
          '<img src="/assets/logo-mark.png" alt="Premier Dental Academy" width="32" height="32" class="w-8 h-8 rounded-lg" />' +
          '<span class="hidden md:inline">Premier Dental Academy</span>' +
        '</a>' +
        '<div class="flex items-center gap-1 overflow-x-auto flex-1 min-w-0 py-2" style="scrollbar-width:none">' +
          LINKS.map(function (l) {
            var base = l[0].split('#')[0];
            var active = here === base && l[0].indexOf('#') === -1;
            return '<a href="' + l[0] + '" class="shrink-0 whitespace-nowrap text-sm font-semibold px-2.5 py-1.5 rounded-lg ' +
              (active ? 'bg-teal-700 text-white' : 'text-slate-700 hover:text-teal-700 hover:bg-teal-50') + '">' +
              l[1] + ' ' + l[2] + '</a>';
          }).join('') +
        '</div>' +
        '<div class="flex items-center gap-3 text-sm shrink-0">' +
          '<span id="user-label" class="text-slate-500 hidden lg:inline"></span>' +
          '<div class="relative" id="user-menu">' +
            '<button id="avatar-btn" class="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-bold grid place-items-center hover:ring-2 hover:ring-teal-300">?</button>' +
            '<div id="avatar-dropdown" class="hidden absolute right-0 top-12 bg-white border border-slate-200 rounded-lg shadow-lg w-52 py-1 z-50">' +
              '<div class="px-3 py-2 border-b border-slate-100">' +
                '<div id="dd-name" class="font-semibold text-sm">—</div>' +
                '<div id="dd-email" class="text-xs text-slate-500">—</div>' +
              '</div>' +
              '<a href="/dashboard#account" class="block px-3 py-2 text-sm hover:bg-slate-50">⚙ Account settings</a>' +
              '<a id="admin-link" href="/admin" class="hidden px-3 py-2 text-sm hover:bg-slate-50">🛠 Admin dashboard</a>' +
              '<a href="/contact" class="block px-3 py-2 text-sm hover:bg-slate-50">💬 Get help</a>' +
              '<button id="signout-btn" class="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">Sign out</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var old = document.querySelector('body > nav:not([data-pda-student-nav])');
    if (old && old.hasAttribute('data-pda-keep')) old.replaceWith(nav);
    else document.body.prepend(nav);

    // Self-wire the dropdown + signout so the bar works on every page, even
    // where the page's own JS never touches it. (Dashboard re-wires the same
    // ids after auth — that simply overwrites these with identical behavior.)
    var btn = nav.querySelector('#avatar-btn');
    var dd = nav.querySelector('#avatar-dropdown');
    if (btn && dd) {
      btn.addEventListener('click', function (e) { e.stopPropagation(); dd.classList.toggle('hidden'); });
      document.addEventListener('click', function () { dd.classList.add('hidden'); });
    }
    var so = nav.querySelector('#signout-btn');
    if (so) so.addEventListener('click', function () { location.href = '/logout?then=home'; });

    // Best-effort identity: stamp initials/name if a Supabase session exists.
    (async function () {
      try {
        if (!window.supabase || !window.supabase.createClient) return;
        var sb = window.supabase.createClient('https://lmbsuwslsycukynzpzik.supabase.co', 'sb_publishable_vzuQZbkmj-UsYZVs5Zqw9w_c8PiOfbh');
        var session = (await sb.auth.getSession()).data.session;
        if (!session) return;
        var email = session.user.email || '';
        var meta = session.user.user_metadata || {};
        var first = meta.first_name || '';
        if (btn) btn.textContent = ((first[0] || email[0] || '?') + '').toUpperCase();
        var lbl = nav.querySelector('#user-label'); if (lbl && !lbl.textContent) lbl.textContent = first || email;
        var nm = nav.querySelector('#dd-name'); if (nm && nm.textContent === '—') nm.textContent = first || email.split('@')[0];
        var em = nav.querySelector('#dd-email'); if (em && em.textContent === '—') em.textContent = email;
        if (session.user.app_metadata && session.user.app_metadata.is_admin === true) {
          var al = nav.querySelector('#admin-link'); if (al) al.classList.remove('hidden');
        }
      } catch (e) { /* identity chip is optional */ }
    })();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
