// Shared nav for every PDA page. Inject by including:
//   <script src="/assets/pda-nav.js"></script>
// The script finds the first existing <nav> and replaces it, so each page can
// keep a minimal fallback nav for no-JS / pre-hydration display. It also wires
// up the hamburger menu so mobile / collapsed-desktop works everywhere.
(function () {
  const NAV_HTML = `
<nav class="bg-white border-b border-slate-200 sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2 font-bold text-slate-900">
      <span class="inline-block w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-700 text-white font-extrabold text-base grid place-items-center">P</span>
      <span class="text-base sm:text-lg">Premier Dental Academy</span>
    </a>
    <div class="hidden md:flex items-center gap-7 text-sm font-medium text-slate-700">
      <a href="/"          data-nav-link class="hover:text-teal-700">Home</a>
      <a href="/calendar"  data-nav-link class="hover:text-teal-700">Calendar</a>
      <a href="/graduates" data-nav-link class="hover:text-teal-700">Graduates</a>
      <a href="/salary"    data-nav-link class="hover:text-teal-700">Salary</a>
      <a href="/about"     data-nav-link class="hover:text-teal-700">About</a>
      <a href="/contact"   data-nav-link class="hover:text-teal-700">Contact</a>
    </div>
    <div class="flex items-center gap-2">
      <a href="/enroll" class="hidden sm:inline-flex bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm">Enroll →</a>
      <button id="pda-nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" class="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-700 hover:bg-slate-100">
        <svg id="pda-nav-icon-open"  xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
        <svg id="pda-nav-icon-close" class="hidden" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
      </button>
    </div>
  </div>
</nav>`;

  const MENU_HTML = `
<div id="pda-mobile-menu" hidden class="fixed inset-x-0 top-16 bottom-0 z-50 bg-white overflow-y-auto md:hidden">
  <div class="px-6 py-6 flex flex-col">
    <a href="/"          data-nav-link class="block py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">Home</a>
    <a href="/calendar"  data-nav-link class="block py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">Calendar</a>
    <a href="/graduates" data-nav-link class="block py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">Graduates</a>
    <a href="/salary"    data-nav-link class="block py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">Salary</a>
    <a href="/about"     data-nav-link class="block py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">About</a>
    <a href="/contact"   data-nav-link class="block py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">Contact</a>
    <a href="/apply"     data-nav-link class="block py-4 border-b border-slate-100 text-base text-slate-600">Workforce / Veterans</a>
    <a href="/blog"      data-nav-link class="block py-4 border-b border-slate-100 text-base text-slate-600">Blog</a>
    <a href="/login"     data-nav-link class="block py-4 border-b border-slate-100 text-base text-slate-600">Sign in</a>
    <a href="/enroll" class="mt-6 block bg-amber-500 hover:bg-amber-600 text-white text-center text-lg font-semibold px-6 py-4 rounded-lg shadow">Enroll →</a>
    <a href="tel:+19039136444" class="mt-3 block text-center text-sm text-slate-500">or call (903) 913-6444</a>
  </div>
</div>`;

  function init() {
    // Remove any pre-existing inline mobile menus (e.g. /index's prior fix).
    const existingMenu = document.getElementById('mobile-menu') || document.getElementById('pda-mobile-menu');
    if (existingMenu) existingMenu.remove();

    // Replace the first <nav>, or prepend if none.
    const existingNav = document.querySelector('nav');
    const navWrap = document.createElement('div');
    navWrap.innerHTML = NAV_HTML.trim();
    const newNav = navWrap.firstElementChild;
    if (existingNav) existingNav.replaceWith(newNav);
    else document.body.prepend(newNav);

    const menuWrap = document.createElement('div');
    menuWrap.innerHTML = MENU_HTML.trim();
    const newMenu = menuWrap.firstElementChild;
    newNav.after(newMenu);

    // Highlight current page
    const path = location.pathname.replace(/\/$/, '') || '/';
    document.querySelectorAll('[data-nav-link]').forEach(a => {
      const href = a.getAttribute('href').replace(/\/$/, '') || '/';
      if (href === path) {
        a.classList.add('text-teal-700');
        a.classList.remove('text-slate-900', 'text-slate-700', 'text-slate-600');
        a.setAttribute('aria-current', 'page');
      }
    });

    // Hamburger wiring
    const btn   = document.getElementById('pda-nav-toggle');
    const panel = document.getElementById('pda-mobile-menu');
    const iOpen = document.getElementById('pda-nav-icon-open');
    const iClose= document.getElementById('pda-nav-icon-close');
    if (!btn || !panel) return;
    const setOpen = (open) => {
      panel.hidden = !open;
      iOpen.classList.toggle('hidden',  open);
      iClose.classList.toggle('hidden', !open);
      btn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    };
    btn.addEventListener('click', () => setOpen(panel.hidden));
    panel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    window.addEventListener('resize', () => { if (window.innerWidth >= 768) setOpen(false); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
