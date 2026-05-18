/* PDA — universal mobile nav patch
 * Drop into any marketing page. Finds the first <nav> with a
 * `hidden md:flex` link cluster and (a) adds a hamburger button to
 * the right side, (b) clones the links into a slide-down drawer
 * that appears below the nav on mobile, (c) wires toggle behaviour.
 *
 * Safe to load multiple times. Idempotent — won't double-inject if
 * a hamburger already exists or the page already has its own.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || window.__pdaNavLoaded) return;
  window.__pdaNavLoaded = true;

  function inject() {
    // Skip if any page already has a mobile-menu-btn (homepage does)
    if (document.getElementById('mobile-menu-btn')) return;

    // Find the first nav with desktop-only link cluster
    const nav = document.querySelector('nav');
    if (!nav) return;
    const desktopLinks = nav.querySelector('.hidden.md\\:flex');
    if (!desktopLinks) return;

    // Find the inner container row (so we can append the hamburger to it)
    const row = desktopLinks.parentElement;
    if (!row) return;

    // Build the hamburger button
    const btn = document.createElement('button');
    btn.id = 'mobile-menu-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Open menu');
    btn.className = 'md:hidden ml-1 text-slate-700 hover:bg-slate-100 rounded p-2';
    btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';

    // Append: prefer at end of the row, after any existing right-side actions
    // If the row has a right-side action group (any child after desktopLinks), put it inside that group
    const allChildren = Array.from(row.children);
    const lastChild = allChildren[allChildren.length - 1];
    if (lastChild && lastChild !== desktopLinks && lastChild.tagName !== 'A') {
      // it's a wrapper div like "flex items-center gap-2" with the Enroll button — append inside it
      lastChild.appendChild(btn);
    } else {
      row.appendChild(btn);
    }

    // Build the mobile drawer (clone the desktop links + add common end-CTAs)
    const drawer = document.createElement('div');
    drawer.id = 'mobile-menu';
    drawer.className = 'hidden md:hidden border-t border-slate-200 bg-white';
    const linksHtml = Array.from(desktopLinks.querySelectorAll('a')).map(a => {
      const text = a.textContent.trim();
      return `<a href="${a.getAttribute('href')}" class="px-3 py-2.5 rounded hover:bg-slate-50 text-slate-700">${text}</a>`;
    }).join('');

    drawer.innerHTML = `
      <div class="px-4 py-3 grid gap-1 text-sm font-medium">
        ${linksHtml}
        <div class="border-t border-slate-100 mt-1 pt-2 grid gap-1">
          <a href="/login" class="px-3 py-2.5 rounded hover:bg-slate-50 text-slate-700">Sign in</a>
          <a href="/tools/practice-pro" class="px-3 py-2.5 rounded hover:bg-slate-50 text-teal-700 font-semibold">🔓 Try the free trainer</a>
          <a href="/apply" class="px-3 py-2.5 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-center">Apply now →</a>
        </div>
      </div>
    `;
    nav.appendChild(drawer);

    // Toggle behaviour
    btn.addEventListener('click', () => {
      const open = drawer.classList.toggle('hidden');
      btn.setAttribute('aria-expanded', String(!open));
    });
    drawer.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => drawer.classList.add('hidden'))
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
