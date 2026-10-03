/* PDA — site navigation (single source of truth)
 *
 * Loaded on every public page. It makes the header behave the same
 * everywhere:
 *
 *  1. Desktop link cluster — rebuilt from PRIMARY + RESOURCES below, with
 *     the current page highlighted. Shown from the `lg` breakpoint so the
 *     row never overflows on tablets; below that the hamburger takes over.
 *  2. "Sign in" ↔ "⌂ Dashboard" — swapped from the stored auth session so
 *     a signed-in student is never shown "Sign in".
 *  3. Hamburger + slide-down drawer — injected on every page that has a
 *     <nav>, including the focused pages (apply, enroll, contact, blog
 *     posts) that only had a "Back to home" link before.
 *
 * Modes (set data-pda-nav on the <nav>):
 *   (default) "site"   — public marketing page, full treatment above.
 *   "portal"           — signed-in area (dashboard). Keeps the page's own
 *                        links, no marketing CTAs, adds Sign out to drawer.
 *   "none"             — leave the nav alone.
 *
 * To change the menu on the whole site, edit PRIMARY / RESOURCES here.
 * Safe to load more than once.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || window.__pdaNavLoaded) return;
  window.__pdaNavLoaded = true;

  // ── Menu definition ─────────────────────────────────────────────
  // Top-level items, in order. `{ menu: 'resources' }` is where the
  // Resources dropdown sits.
  const PRIMARY = [
    { href: '/#programs',  label: 'Programs' },
    { href: '/classes',    label: 'Classes' },
    { href: '/calendar',   label: 'Calendar' },
    { href: '/graduates',  label: 'Graduates' },
    { menu: 'resources' },
    { href: '/about',      label: 'About' },
    { href: '/contact',    label: 'Contact' },
  ];
  // Everything else people look for, grouped under "Resources".
  const RESOURCES = [
    { href: '/blog',               label: 'Blog',                    match: /^\/blog(\/|$)/ },
    { href: '/salary',             label: 'Salary calculator' },
    { href: '/guide',              label: 'Free guide' },
    { href: '/directory',          label: 'Dental office directory', match: /^\/directory(\/|$)/ },
    { href: '/career-archives',    label: 'Career archives' },
    { href: '/hiring-partners',    label: 'For dental offices' },
    { href: '/tools/practice-pro', label: 'Trainer demo' },
  ];
  // Shown in the drawer instead of Sign in / Apply when a session exists.
  const SIGNED_IN_LINKS = [
    { href: '/dashboard',          label: '⌂ Dashboard' },
    { href: '/tools/practice-pro', label: 'Practice Pro' },
    { href: '/tools/chairside',    label: 'ChairSide' },
  ];

  const ICON_MENU = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
  const ICON_CHEVRON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

  const LINK_BASE   = 'hover:text-teal-700';
  const LINK_ACTIVE = 'text-teal-700 font-semibold';

  // Clean-URL path for the current page (/about.html -> /about).
  const path = location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');

  function isActive(link) {
    if (!link || !link.href) return false;
    if (link.match) return link.match.test(path);
    const href = link.href.split('#')[0];
    if (!href || href === '/') return false;
    return path === href || path === href + '/';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Signed-in check for *display only* (which label to show). Real
  // authorization happens on the dashboard / admin pages and in the
  // database. supabase-js keeps the session in localStorage under
  // sb-<project>-auth-token; a refresh token means the SDK will restore it.
  function hasSession() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!/^sb-.+-auth-token$/.test(k)) continue;
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const obj = JSON.parse(raw);
        const s = obj && obj.currentSession ? obj.currentSession : obj;
        if (!s || typeof s !== 'object') continue;
        if (s.refresh_token) return true;
        if (s.access_token && (!s.expires_at || s.expires_at * 1000 > Date.now())) return true;
      }
    } catch (e) { /* storage blocked or unreadable — show Sign in */ }
    return false;
  }

  // ── Renderers ───────────────────────────────────────────────────
  function desktopLinksHtml() {
    const resActive = RESOURCES.some(isActive);
    return PRIMARY.map(l => {
      if (l.menu === 'resources') {
        return `<div class="relative" data-pda-dropdown>
          <button type="button" aria-haspopup="true" aria-expanded="false" class="inline-flex items-center gap-1 ${resActive ? LINK_ACTIVE : LINK_BASE}">Resources ${ICON_CHEVRON}</button>
          <div class="hidden absolute left-0 top-full mt-3 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50" role="menu" aria-label="Resources">
            ${RESOURCES.map(r => `<a role="menuitem" href="${esc(r.href)}" class="block px-4 py-2 text-sm ${isActive(r) ? 'text-teal-700 font-semibold bg-teal-50' : 'text-slate-700 hover:bg-slate-50'}">${esc(r.label)}</a>`).join('')}
          </div>
        </div>`;
      }
      const active = isActive(l);
      return `<a href="${esc(l.href)}" class="${active ? LINK_ACTIVE : LINK_BASE}"${active ? ' aria-current="page"' : ''}>${esc(l.label)}</a>`;
    }).join('');
  }

  function drawerItem(l) {
    return `<a href="${esc(l.href)}" class="px-3 py-2.5 rounded hover:bg-slate-50 ${isActive(l) ? 'text-teal-700 font-semibold' : 'text-slate-700'}">${esc(l.label)}</a>`;
  }

  function drawerHtml(mode, signedIn, pageLinks) {
    if (mode === 'portal') {
      const hasSignOut = !!document.getElementById('signout-btn');
      return `<div class="px-4 py-3 grid gap-1 text-sm font-medium">
        ${pageLinks.map(drawerItem).join('')}
        <div class="border-t border-slate-100 mt-1 pt-2 grid gap-1">
          <a href="/" class="px-3 py-2.5 rounded hover:bg-slate-50 text-slate-700">Public site</a>
          ${hasSignOut ? '<button type="button" data-pda-signout class="text-left px-3 py-2.5 rounded hover:bg-rose-50 text-rose-600">Sign out</button>' : ''}
        </div>
      </div>`;
    }
    const account = signedIn
      ? SIGNED_IN_LINKS.map(drawerItem).join('')
      : `<a href="/login" class="px-3 py-2.5 rounded hover:bg-slate-50 text-slate-700">Sign in</a>
         <a href="/apply" class="px-3 py-2.5 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-center">Apply now →</a>`;
    return `<div class="px-4 py-3 grid gap-1 text-sm font-medium">
      ${PRIMARY.filter(l => l.href).map(drawerItem).join('')}
      <div class="mt-2 px-3 text-[11px] uppercase tracking-widest text-slate-400 font-semibold">Resources</div>
      ${RESOURCES.map(drawerItem).join('')}
      <div class="border-t border-slate-100 mt-1 pt-2 grid gap-1">${account}</div>
    </div>`;
  }

  // ── Behaviour ───────────────────────────────────────────────────
  function wireDropdown(cluster) {
    const dd = cluster.querySelector('[data-pda-dropdown]');
    if (!dd) return;
    const btn = dd.querySelector('button');
    const panel = dd.querySelector('[role="menu"]');
    let openedBy = null; // 'hover' | 'click' | null
    const set = (open, by) => {
      panel.classList.toggle('hidden', !open);
      btn.setAttribute('aria-expanded', String(open));
      openedBy = open ? (by || openedBy) : null;
    };
    // Click: open if closed; if it was opened by hovering, the click keeps it
    // open (so a mouse user's hover-then-click doesn't slam it shut); a second
    // click closes it.
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !panel.classList.contains('hidden');
      if (isOpen && openedBy === 'click') set(false);
      else set(true, 'click');
    });
    // Hover-to-open only on devices that really hover (not touch tablets).
    if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
      let t;
      dd.addEventListener('mouseenter', () => { clearTimeout(t); if (panel.classList.contains('hidden')) set(true, 'hover'); });
      dd.addEventListener('mouseleave', () => { t = setTimeout(() => set(false), 150); });
    }
    document.addEventListener('click', (e) => { if (!dd.contains(e.target)) set(false); });
    dd.addEventListener('keydown', (e) => { if (e.key === 'Escape') { set(false); btn.focus(); } });
    // Keyboard users: close when focus leaves the dropdown entirely.
    dd.addEventListener('focusout', (e) => { if (!dd.contains(e.relatedTarget)) set(false); });
  }

  function inject() {
    const nav = document.querySelector('nav');
    if (!nav) return;
    const mode = nav.getAttribute('data-pda-nav') || 'site';
    if (mode === 'none') return;

    // The row is the flex container that holds the logo link.
    const logo = nav.querySelector('a[href="/"]');
    const row = logo ? logo.parentElement : nav.firstElementChild;
    if (!row) return;

    let cluster = row.querySelector('.hidden.md\\:flex, .hidden.lg\\:flex');
    const pageLinks = cluster
      ? Array.from(cluster.querySelectorAll('a')).map(a => ({ href: a.getAttribute('href'), label: a.textContent.trim() }))
      : [];

    if (mode === 'site') {
      if (!cluster) {
        cluster = document.createElement('div');
        (logo || row.firstElementChild).insertAdjacentElement('afterend', cluster);
      }
      cluster.className = 'hidden lg:flex items-center gap-5 text-sm font-medium text-slate-700';
      cluster.innerHTML = desktopLinksHtml();
      wireDropdown(cluster);
    } else if (cluster) {
      // Portal: keep the page's links, just move the breakpoint up so the
      // row never overflows on tablets.
      cluster.className = cluster.className.replace(/\bmd:flex\b/, 'lg:flex');
    }

    // Right-side group. Pages with a bare "Enroll →" or "← Back" link get
    // it wrapped so Sign in + hamburger can sit beside it.
    const anchor = cluster || logo;
    let group = row.lastElementChild;
    if (!group || group === anchor || group === logo || group.tagName === 'A') {
      const wrap = document.createElement('div');
      const trailing = [];
      let n = anchor ? anchor.nextElementSibling : null;
      while (n) { trailing.push(n); n = n.nextElementSibling; }
      row.appendChild(wrap);
      trailing.forEach(el => wrap.appendChild(el));
      group = wrap;
    }
    group.classList.add('flex', 'items-center', 'gap-2');

    const signedIn = hasSession();

    if (mode === 'site') {
      let acct = document.getElementById('nav-account');
      if (!acct) {
        acct = document.createElement('a');
        acct.id = 'nav-account';
        acct.className = 'hidden sm:inline-block text-sm font-medium text-slate-600 hover:text-slate-900 px-2 py-1.5';
        group.insertBefore(acct, group.firstChild);
      }
      if (signedIn) {
        acct.textContent = '⌂ Dashboard';
        acct.href = '/dashboard';
        acct.classList.add('text-teal-700', 'font-semibold');
      } else {
        acct.textContent = 'Sign in';
        acct.href = '/login';
        acct.classList.remove('text-teal-700', 'font-semibold');
      }
    }

    // Hamburger (reuse the page's own button if it has one).
    let btn = document.getElementById('mobile-menu-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'mobile-menu-btn';
      btn.type = 'button';
      btn.innerHTML = ICON_MENU;
      group.appendChild(btn);
    }
    btn.className = 'lg:hidden ml-1 text-slate-700 hover:bg-slate-100 rounded p-2';
    btn.setAttribute('aria-label', 'Open menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'mobile-menu');

    // Drawer (reuse the page's own container if it has one).
    let drawer = document.getElementById('mobile-menu');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'mobile-menu';
      nav.appendChild(drawer);
    }
    drawer.className = 'hidden lg:hidden border-t border-slate-200 bg-white';
    drawer.innerHTML = drawerHtml(mode, signedIn, pageLinks);

    const close = () => { drawer.classList.add('hidden'); btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', () => {
      const open = drawer.classList.toggle('hidden') === false;
      btn.setAttribute('aria-expanded', String(open));
    });
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    const so = drawer.querySelector('[data-pda-signout]');
    if (so) so.addEventListener('click', () => { close(); const b = document.getElementById('signout-btn'); if (b) b.click(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
