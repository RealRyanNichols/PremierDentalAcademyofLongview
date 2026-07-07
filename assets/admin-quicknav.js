/* PDA admin quick-nav — consistent escape hatch on every admin page.
 * Injects a floating "☰ Admin" pill (bottom-right) that expands to link
 * every admin page, so no page can strand you. Idempotent; no deps.
 * Full nav unification is tracked for the site-wide rebuild — this is the
 * guaranteed-consistent layer in the meantime. */
(function () {
  'use strict';
  if (window.__pdaAdminQuickNav) return;
  window.__pdaAdminQuickNav = true;

  var LINKS = [
    ['🏠', 'Admin Home', '/admin'],
    ['📥', 'Leads', '/admin/leads'],
    ['🎓', 'Students', '/admin/students'],
    ['📈', 'Progress', '/admin/progress'],
    ['🧑‍🏫', 'Instructors', '/admin/instructors'],
    ['💬', 'Chat', '/admin/chat'],
    ['📝', 'Feedback', '/admin/feedback'],
    ['🧠', 'Brain', '/admin/brain']
  ];

  function build() {
    var here = location.pathname.replace(/\/$/, '') || '/admin';
    var wrap = document.createElement('div');
    wrap.id = 'pda-quicknav';
    wrap.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:99999;font-family:Inter,system-ui,sans-serif;';

    var menu = document.createElement('div');
    menu.style.cssText = 'display:none;flex-direction:column;gap:2px;background:#12313b;border-radius:14px;padding:10px;margin-bottom:8px;box-shadow:0 12px 30px rgba(0,0,0,.35);min-width:190px;';
    LINKS.forEach(function (l) {
      var a = document.createElement('a');
      a.href = l[2];
      a.textContent = l[0] + '  ' + l[1];
      var active = here === l[2];
      a.style.cssText = 'display:block;padding:9px 12px;border-radius:9px;text-decoration:none;font-size:14px;font-weight:600;color:' +
        (active ? '#12313b;background:#f0c580;' : '#e9f0ef;') + ';';
      if (!active) {
        a.onmouseenter = function () { a.style.background = 'rgba(255,255,255,.12)'; };
        a.onmouseleave = function () { a.style.background = 'transparent'; };
      }
      menu.appendChild(a);
    });

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Admin menu');
    btn.textContent = '☰ Admin';
    btn.style.cssText = 'display:block;margin-left:auto;background:#12313b;color:#fff;border:none;border-radius:999px;padding:12px 20px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.3);';
    btn.onclick = function () {
      var open = menu.style.display === 'flex';
      menu.style.display = open ? 'none' : 'flex';
      btn.textContent = open ? '☰ Admin' : '✕ Close';
    };

    wrap.appendChild(menu);
    wrap.appendChild(btn);
    document.body.appendChild(wrap);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
