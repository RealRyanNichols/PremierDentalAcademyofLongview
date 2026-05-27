// Shared nav for every PDA page.
// Include with:  <script src="/assets/pda-nav.js" defer></script>
//
// What it does:
//   1. Replaces the first <nav> on the page with a single canonical nav,
//      so every page (desktop + mobile) shows the same menu.
//   2. Injects the mobile menu OUTSIDE the <nav> element — fixes the
//      iOS Safari "position:fixed inside position:sticky" bug that
//      was making the hamburger animate to an X but never reveal anything.
//   3. Highlights the current page in the menu.
//   4. Wires the hamburger: open / close, body-scroll-lock, link click
//      auto-closes, viewport resize auto-closes back to desktop layout.
(function () {
  const NAV_HTML = `
<nav class="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2 font-bold text-slate-900">
      <span class="inline-block w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-700 text-white font-extrabold text-base grid place-items-center">P</span>
      <span class="text-base sm:text-lg">Premier Dental Academy</span>
    </a>
    <div class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
      <a href="/#programs" data-nav-link class="hover:text-teal-700">Programs</a>
      <a href="/calendar"  data-nav-link class="hover:text-teal-700">Calendar</a>
      <a href="/salary"    data-nav-link class="hover:text-teal-700">Salary</a>
      <a href="/about"     data-nav-link class="hover:text-teal-700">About</a>
      <a href="/contact"   data-nav-link class="hover:text-teal-700">Contact</a>
      <a href="/teach"     data-nav-link class="text-amber-600 hover:text-amber-700 font-semibold">Teach</a>
    </div>
    <div class="flex items-center gap-3">
      <a id="pda-nav-auth"  href="/login"  data-nav-link class="hidden md:inline-flex text-sm font-medium text-slate-700 hover:text-teal-700">Sign in</a>
      <a id="pda-nav-dash"  href="/dashboard" data-nav-link class="hidden text-sm font-medium text-teal-700 hover:text-teal-900 md:inline-flex">Dashboard</a>
      <a href="/enroll" class="hidden sm:inline-flex bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm">Enroll →</a>
      <button id="pda-nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" class="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-700 hover:bg-slate-100">
        <svg id="pda-nav-icon-open"  xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
        <svg id="pda-nav-icon-close" hidden xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
      </button>
    </div>
  </div>
</nav>`;

  const MENU_HTML = `
<div id="pda-mobile-menu" hidden class="fixed inset-x-0 top-16 bottom-0 z-50 bg-white overflow-y-auto md:hidden">
  <div class="px-6 py-6 flex flex-col">
    <a href="/#programs" data-nav-link class="block py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">Programs</a>
    <a href="/calendar"  data-nav-link class="block py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">Calendar</a>
    <a href="/salary"    data-nav-link class="block py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">Salary</a>
    <a href="/about"     data-nav-link class="block py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">About</a>
    <a href="/contact"   data-nav-link class="block py-4 border-b border-slate-100 text-lg font-semibold text-slate-900">Contact</a>
    <a href="/tools/practice-exam" data-nav-link class="block py-4 border-b border-slate-100 text-base font-semibold text-teal-700">Free RDA practice exam →</a>
    <a href="/graduates" data-nav-link class="block py-4 border-b border-slate-100 text-base text-slate-700">Our graduates</a>
    <a href="/hiring-partners" data-nav-link class="block py-4 border-b border-slate-100 text-base text-slate-700">For dental offices</a>
    <a href="/teach"     data-nav-link class="block py-4 border-b border-slate-100 text-base font-semibold text-amber-600">Teach with us →</a>
    <a href="/blog"      data-nav-link class="block py-4 border-b border-slate-100 text-base text-slate-700">Blog</a>
    <a href="/apply"     data-nav-link class="block py-4 border-b border-slate-100 text-base text-slate-700">Workforce / Veterans</a>
    <a id="pda-mobile-auth"  href="/login"     data-nav-link class="block py-4 border-b border-slate-100 text-base text-slate-700">Sign in</a>
    <a id="pda-mobile-dash"  href="/dashboard" data-nav-link class="hidden py-4 border-b border-slate-100 text-base text-teal-700 font-semibold">Go to my dashboard →</a>
    <a href="/enroll"    class="mt-6 block bg-amber-500 hover:bg-amber-600 text-white text-center text-lg font-semibold px-6 py-4 rounded-lg shadow">Enroll →</a>
    <a href="tel:+19039136444" class="mt-3 block text-center text-sm text-slate-500">or call (903) 913-6444</a>
  </div>
</div>`;

  function init() {
    // Remove any pre-existing inline mobile menus from before this script existed.
    document.querySelectorAll('#mobile-menu, #pda-mobile-menu').forEach(el => el.remove());

    // Replace the first <nav>, or prepend a fresh one if the page has none.
    const existingNav = document.querySelector('nav');
    const navWrap = document.createElement('div');
    navWrap.innerHTML = NAV_HTML.trim();
    const newNav = navWrap.firstElementChild;
    if (existingNav) existingNav.replaceWith(newNav);
    else document.body.prepend(newNav);

    // Mount the mobile menu OUTSIDE the nav so position:fixed isn't trapped
    // inside a position:sticky ancestor (the iOS Safari rendering bug).
    const menuWrap = document.createElement('div');
    menuWrap.innerHTML = MENU_HTML.trim();
    const newMenu = menuWrap.firstElementChild;
    newNav.after(newMenu);

    // Highlight current page on both desktop links and mobile menu items.
    const path = (location.pathname.replace(/\/$/, '') || '/').toLowerCase();
    document.querySelectorAll('[data-nav-link]').forEach(a => {
      const hrefPath = (a.getAttribute('href') || '').split('#')[0].replace(/\/$/, '') || '/';
      if (hrefPath.toLowerCase() === path) {
        a.classList.add('text-teal-700');
        a.classList.remove('text-slate-900', 'text-slate-700', 'text-slate-600');
        a.setAttribute('aria-current', 'page');
      }
    });

    // Hamburger wiring.
    const btn   = document.getElementById('pda-nav-toggle');
    const panel = document.getElementById('pda-mobile-menu');
    const iOpen = document.getElementById('pda-nav-icon-open');
    const iClose = document.getElementById('pda-nav-icon-close');
    if (!btn || !panel) return;

    const setOpen = (open) => {
      panel.hidden = !open;
      if (iOpen)  iOpen.hidden  = open;
      if (iClose) iClose.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    };

    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      setOpen(panel.hidden);
    });
    panel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    window.addEventListener('resize', () => { if (window.innerWidth >= 768) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

    // Auth-aware nav: flip "Sign in" → "Sign out" + show dashboard link when signed in.
    // Uses the Supabase publishable key (safe in client). Runs async; no harm if the
    // SDK hasn't loaded yet — re-checks once on the next "supabase-ready" event.
    function wireAuth() {
      if (!window.supabase?.createClient) return;
      const SUPABASE_URL = 'https://lmbsuwslsycukynzpzik.supabase.co';
      const SUPABASE_KEY = 'sb_publishable_vzuQZbkmj-UsYZVs5Zqw9w_c8PiOfbh';
      let sb;
      try { sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); } catch (e) { return; }

      sb.auth.getSession().then(({ data }) => {
        const signedIn = !!data?.session;
        const desktopAuth  = document.getElementById('pda-nav-auth');
        const desktopDash  = document.getElementById('pda-nav-dash');
        const mobileAuth   = document.getElementById('pda-mobile-auth');
        const mobileDash   = document.getElementById('pda-mobile-dash');
        if (!desktopAuth || !mobileAuth) return;

        if (signedIn) {
          desktopAuth.textContent = 'Sign out';
          desktopAuth.href = '/logout';
          desktopAuth.classList.remove('text-slate-700');
          desktopAuth.classList.add('text-rose-700', 'hover:text-rose-900');
          desktopDash?.classList.remove('hidden');

          mobileAuth.textContent = 'Sign out';
          mobileAuth.href = '/logout';
          mobileAuth.classList.remove('text-slate-700');
          mobileAuth.classList.add('text-rose-700', 'font-semibold');
          mobileDash?.classList.remove('hidden');
          mobileDash?.classList.add('block');
        }
      }).catch(() => {});
    }
    // Try now; if the supabase global isn't there yet, wait a tick.
    if (window.supabase?.createClient) wireAuth();
    else setTimeout(wireAuth, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
