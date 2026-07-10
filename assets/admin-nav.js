/* PDA — ONE shared admin header for every /admin page.
 * ------------------------------------------------------------------
 * Include on every admin page:  <script defer src="/assets/admin-nav.js"></script>
 *
 * Replaces the page's own top <nav> (or prepends one if the page has none)
 * with an identical dark header: brand, every admin section, active-page
 * highlighting, #user-label and #signout preserved so existing page JS keeps
 * working. On phones the link row scrolls horizontally — nothing disappears.
 *
 * This is the real fix for "every admin page has different buttons".
 * It replaces the old floating admin-quicknav pill.
 */
(function () {
  'use strict';
  if (window.__pdaAdminNav) return;
  window.__pdaAdminNav = true;

  var LINKS = [
    ['/admin',             '🏠', 'Home'],
    ['/admin/kpi',         '📈', 'KPI'],
    ['/admin/leads',       '📥', 'Leads'],
    ['/admin/paperwork',   '📋', 'Paperwork'],
    ['/admin/questions',   '🙋', 'Questions'],
    ['/admin/students',    '🎓', 'Students'],
    ['/admin/courses',     '📚', 'Courses'],
    ['/admin/emails',      '📧', 'Emails'],
    ['/admin/progress',    '📊', 'Progress'],
    ['/admin/instructors', '👩‍🏫', 'Instructors'],
    ['/admin/chat',        '🗨️', 'Chat'],
    ['/admin/feedback',    '💬', 'Feedback'],
    ['/admin/brain',       '🧠', 'Brain'],
  ];

  function currentPath() {
    var p = location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
    return p === '' ? '/' : p;
  }

  function build() {
    var here = currentPath();
    var nav = document.createElement('nav');
    nav.setAttribute('data-pda-admin-nav', '');
    nav.className = 'bg-slate-900 text-white sticky top-0 z-50';
    nav.innerHTML =
      '<div class="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center gap-3">' +
        '<a href="/admin" class="flex items-center gap-2 font-bold shrink-0">' +
          '<span class="w-7 h-7 rounded bg-gradient-to-br from-teal-500 to-cyan-600 text-white grid place-items-center font-extrabold">P</span>' +
          '<span class="hidden sm:inline">PDA Admin</span>' +
        '</a>' +
        '<div class="flex items-center gap-1 overflow-x-auto flex-1 min-w-0 py-2" style="scrollbar-width:none">' +
          LINKS.map(function (l) {
            var active = here === l[0];
            return '<a href="' + l[0] + '" class="shrink-0 whitespace-nowrap text-sm font-semibold px-2.5 py-1.5 rounded-lg ' +
              (active ? 'bg-teal-600 text-white' : 'text-slate-300 hover:text-white hover:bg-white/10') + '">' +
              l[1] + ' ' + l[2] + '</a>';
          }).join('') +
        '</div>' +
        '<div class="flex items-center gap-3 text-sm shrink-0">' +
          '<span id="user-label" class="text-slate-400 hidden md:inline"></span>' +
          '<a href="/dashboard" class="text-slate-300 hover:text-white hidden sm:inline" title="Student dashboard">🎒</a>' +
          '<button id="signout" class="text-slate-300 hover:text-white">Sign out</button>' +
        '</div>' +
      '</div>';

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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
