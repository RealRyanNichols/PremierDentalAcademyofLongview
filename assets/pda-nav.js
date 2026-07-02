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
<nav aria-label="Primary" class="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
    <a href="/" class="flex items-center gap-2 font-bold text-slate-900 shrink-0">
      <img src="/assets/logo-mark.png" alt="Premier Dental Academy of Longview" width="36" height="36" class="w-9 h-9 rounded-lg shrink-0" />
      <span class="text-base sm:text-lg hidden sm:inline">Premier Dental Academy</span>
    </a>
    <div class="hidden md:flex items-center gap-5 lg:gap-7 text-sm font-medium text-slate-700">
      <a href="/#programs" data-nav-link class="hover:text-teal-700">Programs</a>
      <a href="/calendar"  data-nav-link class="hover:text-teal-700">Calendar</a>
      <div class="pda-dd relative">
        <button type="button" data-dd-btn aria-expanded="false" aria-haspopup="true" class="inline-flex items-center gap-1 hover:text-teal-700">Free tools <span class="text-[10px] leading-none" aria-hidden="true">▼</span></button>
        <div data-dd-menu hidden role="menu" class="absolute left-0 top-9 bg-white border border-slate-200 rounded-xl shadow-lg py-2 w-60 z-50 text-slate-700">
          <a href="/tools/funding-finder" class="block px-4 py-2 hover:bg-slate-50">Get it paid for</a>
          <a href="/tools/take-home-pay" class="block px-4 py-2 hover:bg-slate-50">Take-home pay</a>
          <a href="/tools/schedule-planner" class="block px-4 py-2 hover:bg-slate-50">Fit school into my life</a>
          <a href="/tools/interview-prep" class="block px-4 py-2 hover:bg-slate-50">Interview prep</a>
          <a href="/tools/career-paths" class="block px-4 py-2 hover:bg-slate-50">Career paths</a>
          <a href="/tools/resource-hub" class="block px-4 py-2 hover:bg-slate-50">Life resources</a>
          <a href="/tools/study-plan" class="block px-4 py-2 hover:bg-slate-50">Study plan</a>
          <a href="/tools/is-it-for-me" class="block px-4 py-2 hover:bg-slate-50">Is this for me?</a>
          <a href="/tools/first-30-days" class="block px-4 py-2 hover:bg-slate-50">First 30 days</a>
          <a href="/tools/family-talk" class="block px-4 py-2 hover:bg-slate-50">Talk to family</a>
          <a href="/tools/savings-starter" class="block px-4 py-2 hover:bg-slate-50">Savings starter</a>
          <a href="/tools/practice-exam"      class="block px-4 py-2 hover:bg-slate-50">Practice exam</a>
          <a href="/skills-lab"               class="block px-4 py-2 hover:bg-slate-50">Skills Lab</a>
          <a href="/tools/flashcards"         class="block px-4 py-2 hover:bg-slate-50">RDA flashcards</a>
          <a href="/study-guide"              class="block px-4 py-2 hover:bg-slate-50">Exam study guide</a>
          <a href="/tools/how-to-chart"       class="block px-4 py-2 hover:bg-slate-50">How to chart</a>
          <a href="/tools/resume-builder"     class="block px-4 py-2 hover:bg-slate-50">Resume builder</a>
          <a href="/skills-lab/instruments"   class="block px-4 py-2 hover:bg-slate-50">Instrument library</a>
          <a href="/skills-lab/abbreviations" class="block px-4 py-2 hover:bg-slate-50">Charting abbreviations</a>
        </div>
      </div>
      <a href="/employers" data-nav-link class="hover:text-teal-700">For offices</a>
      <div class="pda-dd relative">
        <button type="button" data-dd-btn aria-expanded="false" aria-haspopup="true" class="inline-flex items-center gap-1 hover:text-teal-700">About <span class="text-[10px] leading-none" aria-hidden="true">▼</span></button>
        <div data-dd-menu hidden role="menu" class="absolute left-0 top-9 bg-white border border-slate-200 rounded-xl shadow-lg py-2 w-56 z-50 text-slate-700">
          <a href="/about"     class="block px-4 py-2 hover:bg-slate-50">About Amanda</a>
          <a href="/graduates" class="block px-4 py-2 hover:bg-slate-50">Our graduates</a>
          <a href="/sponsor-a-student" class="block px-4 py-2 hover:bg-slate-50">Sponsor a student</a>
          <a href="/salary"    class="block px-4 py-2 hover:bg-slate-50">Salary calculator</a>
          <a href="/blog"      class="block px-4 py-2 hover:bg-slate-50">Blog</a>
          <a href="/contact"   class="block px-4 py-2 hover:bg-slate-50">Contact</a>
          <a href="/teach"     class="block px-4 py-2 hover:bg-slate-50 text-amber-600 font-semibold">Teach with us →</a>
        </div>
      </div>
    </div>
    <div class="flex items-center gap-3 shrink-0">
      <a id="pda-nav-auth"  href="/login"     data-nav-link class="hidden md:inline-flex text-sm font-medium text-slate-700 hover:text-teal-700">Sign in</a>
      <a id="pda-nav-dash"  href="/dashboard" data-nav-link class="hidden text-sm font-semibold text-teal-700 hover:text-teal-900 md:inline-flex">Dashboard</a>
      <a href="/enroll" id="pda-nav-enroll" data-event="enroll_click" class="hidden sm:inline-flex bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-sm">Enroll →</a>
      <button id="pda-nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" class="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-700 hover:bg-slate-100">
        <svg id="pda-nav-icon-open"  xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
        <svg id="pda-nav-icon-close" hidden xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
      </button>
    </div>
  </div>
</nav>`;

  const MENU_HTML = `
<div id="pda-mobile-menu" hidden class="fixed inset-x-0 top-16 bottom-0 z-50 bg-white overflow-y-auto md:hidden">
  <div class="px-5 py-4 flex flex-col">
    <a href="/#programs" data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base font-medium text-slate-900">Programs</a>
    <a href="/calendar"  data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base font-medium text-slate-900">Calendar</a>
    <a href="/employers" data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base font-medium text-slate-900">For offices</a>

    <p class="text-[11px] uppercase tracking-widest text-slate-400 font-semibold px-1 mt-5 mb-1">Free tools</p>
    <a href="/tools/funding-finder" data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Get it paid for</a>
    <a href="/tools/take-home-pay" data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Take-home pay</a>
    <a href="/tools/schedule-planner" data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Fit school into my life</a>
    <a href="/tools/interview-prep" data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Interview prep</a>
    <a href="/tools/career-paths" data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Career paths</a>
    <a href="/tools/resource-hub" data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Life resources</a>
    <a href="/tools/study-plan" data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Study plan</a>
    <a href="/tools/is-it-for-me" data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Is this for me?</a>
    <a href="/tools/first-30-days" data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">First 30 days</a>
    <a href="/tools/family-talk" data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Talk to family</a>
    <a href="/tools/savings-starter" data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Savings starter</a>
    <a href="/tools/practice-exam"      data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Practice exam</a>
    <a href="/skills-lab"               data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Skills Lab</a>
    <a href="/tools/flashcards"         data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">RDA flashcards</a>
    <a href="/study-guide"              data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Exam study guide</a>
    <a href="/tools/how-to-chart"       data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">How to chart</a>
    <a href="/tools/resume-builder"     data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Resume builder</a>
    <a href="/skills-lab/instruments"   data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Instrument library</a>
    <a href="/skills-lab/abbreviations" data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Charting abbreviations</a>

    <p class="text-[11px] uppercase tracking-widest text-slate-400 font-semibold px-1 mt-5 mb-1">About PDA</p>
    <a href="/about"     data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">About Amanda</a>
    <a href="/graduates" data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Our graduates</a>
    <a href="/sponsor-a-student" data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Sponsor a student</a>
    <a href="/salary"    data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Salary calculator</a>
    <a href="/blog"      data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Blog</a>
    <a href="/contact"   data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Contact</a>
    <a href="/teach"     data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Teach with us</a>

    <div class="mt-6 pt-4 border-t border-slate-200">
      <a id="pda-mobile-dash" href="/dashboard" data-nav-link class="hidden mb-2 py-2 px-1 text-base font-semibold text-teal-700">My dashboard →</a>
      <a href="/enroll" id="pda-mobile-enroll" data-event="enroll_click" class="block bg-amber-500 hover:bg-amber-600 text-white text-center text-base font-semibold px-6 py-3 rounded-full shadow">Enroll →</a>
      <div class="flex items-center justify-between mt-3 px-1">
        <a id="pda-mobile-auth" href="/login" data-nav-link class="text-sm font-medium text-slate-600 hover:text-teal-700">Sign in</a>
        <a href="tel:+19039136444" class="text-sm text-slate-500">📞 (903) 913-6444</a>
      </div>
    </div>
  </div>
</div>`;

  function init() {
    // Redesign style layer (additive: pill CTAs + soft shadow) — loads on every page.
    if (!document.getElementById('pda-redesign-css')) { var __rc = document.createElement('link'); __rc.id = 'pda-redesign-css'; __rc.rel = 'stylesheet'; __rc.href = '/assets/pda-redesign.css'; document.head.appendChild(__rc); }
    // Ensure the business-facts source of truth is loaded (footer + other scripts read it).
    if (!window.PDA_FACTS) { var __sf = document.createElement('script'); __sf.src = '/assets/site-facts.js'; document.head.appendChild(__sf); }
    // Load the analytics layer so every [data-event] element is tracked site-wide (safe no-op without a provider).
    if (!window.PDA || !window.PDA.track) { var __an = document.createElement('script'); __an.src = '/assets/pda-analytics.js'; document.head.appendChild(__an); }
    // PWA: link the web app manifest + brand theme-color once, site-wide (guarded so a page may still ship its own).
    if (!document.querySelector('link[rel="manifest"]')) { var __mf = document.createElement('link'); __mf.rel = 'manifest'; __mf.href = '/site.webmanifest'; document.head.appendChild(__mf); }
    if (!document.querySelector('meta[name="theme-color"]')) { var __tc = document.createElement('meta'); __tc.name = 'theme-color'; __tc.content = '#0f766e'; document.head.appendChild(__tc); }
    // Premium motion layer (aurora heroes, CTA sheen, gentle Enroll glow) — site-wide,
    // CSS-only, auto-disabled for reduced-motion users. Guarded so it loads once.
    if (!document.querySelector('link[data-pda-polish]')) { var __pl = document.createElement('link'); __pl.rel = 'stylesheet'; __pl.href = '/assets/pda-polish.css'; __pl.setAttribute('data-pda-polish', ''); document.head.appendChild(__pl); }
    if (!document.querySelector('script[data-pda-polish-js]')) { var __pj = document.createElement('script'); __pj.src = '/assets/pda-polish.js'; __pj.defer = true; __pj.setAttribute('data-pda-polish-js', ''); document.head.appendChild(__pj); }
    // Remove any pre-existing inline mobile menus from before this script existed.
    document.querySelectorAll('#mobile-menu, #pda-mobile-menu').forEach(el => el.remove());

    // Replace the first <nav>, or prepend a fresh one if the page has none.
    const existingNav = document.querySelector('nav');

    // Opt-out: a page that ships its own auth-aware nav (e.g. /dashboard's student
    // bar with the avatar menu + sign-out) marks it with data-pda-keep. Analytics
    // and site-facts already loaded above, so render the shared footer for
    // consistency, then bail before injecting the PROSPECT chrome (marketing nav,
    // mobile menu, Call/Apply bar, urgency bar, exit-intent) — none of which
    // belongs on a logged-in app page.
    if (existingNav && existingNav.hasAttribute('data-pda-keep')) {
      renderFooter();
      return;
    }

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

    // Unified footer (replaces any per-page footer) — reads window.PDA_FACTS.
    renderFooter();

    // ── Sticky mobile Call / Apply bar ──────────────────────────────
    // High-intent local-search visitors arrive on a phone; keep "Call" and
    // "Apply" one tap away at all times. Mobile only; sits above the Ask
    // Premier chat bubble; hidden for enrolled students (see wireAuth).
    if (!document.getElementById('pda-cta-bar')) {
      const css = document.createElement('style');
      css.textContent =
        '@media (max-width:767px){' +
        'body.pda-cta-on{padding-bottom:4.5rem}' +
        'body.pda-cta-on .ap-launcher{bottom:84px!important}' +
        '}';
      document.head.appendChild(css);

      const bar = document.createElement('div');
      bar.id = 'pda-cta-bar';
      bar.className = 'md:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-3 py-2 flex items-center gap-2';
      bar.style.boxShadow = '0 -4px 16px rgba(15,23,42,.08)';
      bar.innerHTML =
        '<a href="tel:+19039136444" data-event="call_click" style="flex:1" class="inline-flex items-center justify-center gap-1.5 border border-teal-600 text-teal-700 font-semibold rounded-lg py-2.5 text-sm">📞 Call</a>' +
        '<a href="/apply" data-event="apply_click" style="flex:1.4;box-shadow:0 2px 8px rgba(245,158,11,.35)" class="inline-flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-full py-2.5 text-sm">Apply now →</a>';
      document.body.appendChild(bar);
      document.body.classList.add('pda-cta-on');
    }

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

    // Desktop dropdown wiring — supports multiple .pda-dd menus (Free tools, About).
    const dropdowns = Array.from(document.querySelectorAll('.pda-dd'));
    const closeAllDropdowns = () => dropdowns.forEach((dd) => {
      const m = dd.querySelector('[data-dd-menu]'); const b = dd.querySelector('[data-dd-btn]');
      if (m) m.hidden = true; if (b) b.setAttribute('aria-expanded', 'false');
    });
    dropdowns.forEach((dd) => {
      const btn = dd.querySelector('[data-dd-btn]');
      const menu = dd.querySelector('[data-dd-menu]');
      if (!btn || !menu) return;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = menu.hidden;
        closeAllDropdowns();
        menu.hidden = !willOpen;
        btn.setAttribute('aria-expanded', String(willOpen));
      });
    });
    if (dropdowns.length) {
      document.addEventListener('click', (e) => {
        if (!dropdowns.some((dd) => dd.contains(e.target))) closeAllDropdowns();
      });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllDropdowns(); });
    }

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
    async function wireAuth() {
      if (!window.supabase?.createClient) return;
      const SUPABASE_URL = 'https://lmbsuwslsycukynzpzik.supabase.co';
      const SUPABASE_KEY = 'sb_publishable_vzuQZbkmj-UsYZVs5Zqw9w_c8PiOfbh';
      let sb;
      try { sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); } catch (e) { return; }

      let session = null;
      try { ({ data: { session } } = await sb.auth.getSession()); } catch (e) { return; }
      if (!session) return;

      const desktopAuth = document.getElementById('pda-nav-auth');
      const desktopDash = document.getElementById('pda-nav-dash');
      const mobileAuth  = document.getElementById('pda-mobile-auth');
      const mobileDash  = document.getElementById('pda-mobile-dash');
      if (!desktopAuth || !mobileAuth) return;

      // Signed in: Sign in → Sign out, reveal Dashboard link.
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

      // Homepage hero: a signed-in visitor already has an account, so drop the
      // "Try free preview" framing and point them straight into their trainer.
      const heroTrainer = document.getElementById('hero-cta-trainer');
      if (heroTrainer) heroTrainer.innerHTML = '▶ Open my trainer';

      // Enrolled/paid students shouldn't be pitched the FREE preview / FREE
      // practice exam / Enroll — those are prospect CTAs. Free signups
      // (program 'preview') still see them.
      let paid = false, isAdmin = (session.user?.app_metadata?.is_admin === true);
      try {
        const { data: prof } = await sb.from('profiles')
          .select('program, is_admin').eq('id', session.user.id).maybeSingle();
        if (prof?.is_admin === true) isAdmin = true;
        paid = !!(prof && (prof.is_admin || (prof.program && prof.program !== 'preview')));
      } catch (e) {}

      // Owner/admin: surface a prominent Admin link in the nav on every page,
      // and point the existing Dashboard link at the admin dashboard too.
      // One admin entry point: the existing Dashboard link becomes "Admin".
      if (isAdmin) {
        if (desktopDash) { desktopDash.href = '/admin'; desktopDash.textContent = 'Admin'; }
        if (mobileDash)  { mobileDash.href = '/admin'; mobileDash.textContent = 'Admin dashboard →'; }
      }

      if (paid) {
        document.querySelectorAll('#pda-more-menu p, #pda-mobile-menu p')
          .forEach(p => { if (/free study tools/i.test(p.textContent)) p.textContent = 'Study tools'; });
        // Inline display:none beats the Tailwind "hidden sm:inline-flex" class.
        ['pda-nav-enroll', 'pda-mobile-enroll'].forEach(id => {
          const el = document.getElementById(id); if (el) el.style.display = 'none';
        });
        // Enrolled students don't need the prospect Call/Apply bar.
        const ctaBar = document.getElementById('pda-cta-bar');
        if (ctaBar) ctaBar.style.display = 'none';
        document.body.classList.remove('pda-cta-on');

        // Homepage hero: swap the prospect CTAs for student ones.
        const heroEnroll = document.getElementById('hero-cta-enroll');
        if (heroEnroll) { heroEnroll.innerHTML = 'My dashboard →'; heroEnroll.href = '/dashboard'; }
      }
    }
    // Try now; if the supabase global isn't there yet, wait a tick.
    if (window.supabase?.createClient) wireAuth();
    else setTimeout(wireAuth, 400);

    // The $1,500 special has ended.
    injectUrgencyBar();
    armExitIntent();
  }

  // ───────────── Exit-intent email capture ─────────────
  // When a visitor looks like they're about to bounce, offer the free
  // practice exam in exchange for an email. Captures into public.subscribers
  // (which has a public INSERT policy). Skips pages where it would interrupt
  // an active transaction or where the visitor is already enrolled.
  function armExitIntent() {
    const path = location.pathname.toLowerCase().replace(/\/$/, '');
    if (/^\/(admin|login|logout|dashboard|enroll|enroll-success|tools\/practice-exam|special-offer)/.test(path)) return;
    try { if (localStorage.getItem('pda.exit.shown.v1') === '1') return; } catch (e) {}

    let shown = false;
    let scrolledDown = false;
    let lastY = window.scrollY;

    function maybeShow(trigger) {
      if (shown) return;
      shown = true;
      try { localStorage.setItem('pda.exit.shown.v1', '1'); } catch (e) {}
      showModal(trigger);
    }

    // Desktop: mouse heading to URL bar / tab close.
    function onMouseOut(e) {
      if (!e.relatedTarget && e.clientY < 5) maybeShow('mouseleave');
    }
    // Mobile: scrolled past 40% then sharply scrolled back up → likely bouncing.
    function onScroll() {
      const y = window.scrollY;
      const max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
      if (y / max > 0.4) scrolledDown = true;
      if (scrolledDown && y < lastY - 80 && y < 200) maybeShow('mobile-bounce');
      lastY = y;
    }

    document.addEventListener('mouseout', onMouseOut);
    window.addEventListener('scroll', onScroll, { passive: true });
    // Tab-blur on desktop is also a bounce signal but noisy; skipping for now.

    function showModal(trigger) {
      const overlay = document.createElement('div');
      overlay.id = 'pda-exit-modal';
      overlay.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:99999',
        'background:rgba(15,23,42,0.65)',
        'display:flex', 'align-items:center', 'justify-content:center',
        'padding:16px', 'animation:pdaFade 0.2s ease-out',
        'font:400 14px/1.45 Inter,system-ui,sans-serif',
      ].join(';');
      overlay.innerHTML =
        '<style>@keyframes pdaFade{from{opacity:0}to{opacity:1}}' +
        '@keyframes pdaPop{from{transform:scale(0.96);opacity:0}to{transform:scale(1);opacity:1}}</style>' +
        '<div role="dialog" aria-labelledby="pda-exit-title" style="background:#fff;border-radius:18px;max-width:440px;width:100%;padding:28px 24px 22px;box-shadow:0 25px 50px -12px rgba(15,23,42,0.5);animation:pdaPop 0.25s ease-out;text-align:center;position:relative">' +
          '<button aria-label="Close" id="pda-exit-x" style="position:absolute;top:8px;right:10px;background:transparent;border:0;color:#94a3b8;font-size:22px;cursor:pointer;line-height:1">×</button>' +
          '<div style="font-size:38px;line-height:1">📝</div>' +
          '<h2 id="pda-exit-title" style="font-family:Fraunces,serif;font-size:22px;font-weight:800;color:#0f172a;margin:8px 0 4px">Wait — try the free practice exam first.</h2>' +
          '<p style="color:#475569;margin:0 0 18px;font-size:14px">Texas RDA exam-style questions with instant explanations. Email it to me so I can find it later.</p>' +
          '<form id="pda-exit-form" style="display:flex;flex-direction:column;gap:8px">' +
            '<input id="pda-exit-email" type="email" required placeholder="you@email.com" autocomplete="email" style="width:100%;padding:11px 14px;border:1.5px solid #cbd5e1;border-radius:10px;font-size:15px;outline:none;font-family:inherit" />' +
            '<button type="submit" id="pda-exit-submit" style="background:#0d9488;color:#fff;border:0;padding:12px 18px;border-radius:10px;font-weight:800;font-size:15px;cursor:pointer;font-family:inherit">Send me the practice exam →</button>' +
          '</form>' +
          '<div id="pda-exit-msg" style="font-size:12px;color:#0f766e;margin-top:8px;min-height:16px"></div>' +
          '<button id="pda-exit-skip" style="margin-top:10px;background:transparent;border:0;color:#94a3b8;font-size:12px;cursor:pointer;text-decoration:underline">No thanks</button>' +
        '</div>';
      document.body.appendChild(overlay);

      const close = () => { overlay.remove(); document.removeEventListener('mouseout', onMouseOut); window.removeEventListener('scroll', onScroll); };
      overlay.querySelector('#pda-exit-x').addEventListener('click', close);
      overlay.querySelector('#pda-exit-skip').addEventListener('click', close);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); }, { once: true });

      overlay.querySelector('#pda-exit-form').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const email = overlay.querySelector('#pda-exit-email').value.trim();
        if (!email) return;
        const btn = overlay.querySelector('#pda-exit-submit');
        const msg = overlay.querySelector('#pda-exit-msg');
        btn.disabled = true; btn.textContent = 'Sending…';
        try {
          await fetch('https://lmbsuwslsycukynzpzik.supabase.co/rest/v1/subscribers', {
            method: 'POST',
            headers: {
              'apikey': 'sb_publishable_vzuQZbkmj-UsYZVs5Zqw9w_c8PiOfbh',
              'Authorization': 'Bearer sb_publishable_vzuQZbkmj-UsYZVs5Zqw9w_c8PiOfbh',
              'Content-Type': 'application/json',
              'Prefer': 'resolution=ignore-duplicates',
            },
            body: JSON.stringify({ email, source: 'exit-intent', tags: ['exit-intent', trigger] }),
          });
        } catch (e) {}
        msg.textContent = '✓ Got it — opening the practice exam now.';
        setTimeout(() => { location.href = '/tools/practice-exam'; }, 900);
      });
    }
  }

  // ───────────── Site-wide $1,500 special bar ─────────────
  // Sticky bottom strip with a live countdown that follows visitors on every
  // page (except the offer/checkout/admin pages where it would duplicate).
  // Uses a self-rolling weekly deadline and respects a dismiss.
  // Site-wide urgency bar for the soonest upcoming class — funnels last-minute
  // signups to /night-class. Only shows when a class starts within ~10 days,
  // and pulls real seat counts (no fabricated numbers).
  function injectUrgencyBar() {
    var path = location.pathname.toLowerCase().replace(/\/$/, '');
    // Homepage already leads with its own amber "Next cohort starts… / N days
    // left" banner — don't stack a second cohort countdown on top of it.
    if (path === '' || path === '/index.html') return;
    if (/^\/(admin|login|logout|enroll|enroll-success|night-class)/.test(path)) return;
    try { if (sessionStorage.getItem('pda.urgency.x') === '1') return; } catch (e) {}
    var URL_BASE = 'https://lmbsuwslsycukynzpzik.supabase.co/rest/v1';
    var KEY = 'sb_publishable_vzuQZbkmj-UsYZVs5Zqw9w_c8PiOfbh';
    fetch(URL_BASE + '/cohorts?select=name,start_date,capacity,enrolled_count,delivery_mode,status&status=eq.upcoming&order=start_date.asc&limit=8', {
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY }
    }).then(function (r) { return r.ok ? r.json() : []; }).then(function (rows) {
      if (!rows || !rows.length) return;
      var inperson = rows.filter(function (c) { return (c.delivery_mode || '').indexOf('person') > -1 || /night|in.person/i.test(c.name || ''); });
      var c = inperson[0] || rows[0];
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var d = new Date(c.start_date + 'T00:00:00');
      var days = Math.round((d - today) / 86400000);
      if (days < 0 || days > 10) return; // only when genuinely soon
      var left = Math.max(0, (c.capacity || 0) - (c.enrolled_count || 0));
      var when = days <= 0 ? 'starts tonight' : days === 1 ? 'starts tomorrow'
        : 'starts ' + d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      var seat = (left > 0 && left <= 6) ? ' · only ' + left + ' seat' + (left === 1 ? '' : 's') + ' left' : '';
      var bar = document.createElement('div');
      bar.id = 'pda-urgency-bar';
      bar.style.cssText = 'background:#001a3d;color:#fff;font:600 13px/1.3 Inter,system-ui,sans-serif;padding:8px 12px;text-align:center';
      bar.innerHTML = '<div style="max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap">' +
        '<span><b style="color:#fbbf24">RDA class ' + when + '</b>' + seat + '</span>' +
        '<a href="/night-class" style="background:#fbbf24;color:#001a3d;padding:4px 12px;border-radius:8px;font-weight:800;text-decoration:none;white-space:nowrap">Reserve a seat →</a>' +
        '<a href="tel:+19039136444" style="color:#fff;text-decoration:underline;white-space:nowrap">or call (903) 913-6444</a>' +
        '<button type="button" aria-label="Dismiss" id="pda-urgency-x" style="background:transparent;color:#94a3b8;border:0;font-size:16px;cursor:pointer;line-height:1">×</button>' +
        '</div>';
      document.body.insertBefore(bar, document.body.firstChild);
      var x = document.getElementById('pda-urgency-x');
      if (x) x.addEventListener('click', function () { bar.remove(); try { sessionStorage.setItem('pda.urgency.x', '1'); } catch (e) {} });
    }).catch(function () {});
  }

  // (Removed: the dormant "$1,500 pay-in-full" special offer bar. It was never
  // invoked and advertised an ended special, so it's been deleted.)

  // ───────────── Shared site footer ─────────────
  // One consistent footer for every public marketing page. Reads business facts
  // from window.PDA_FACTS when present; the literals below are only a fallback so
  // the footer is always correct even if site-facts.js hasn't loaded yet.
  function footerHTML() {
    var F = (typeof window !== 'undefined' && window.PDA_FACTS) ? window.PDA_FACTS : {};
    var name   = F.academyName || 'Premier Dental Academy of Longview';
    var addr   = (F.address && F.address.full) || '2800 Gilmer Rd, Suite 106, Longview, TX 75604';
    var phoneD = (F.phone && F.phone.display) || '(903) 913-6444';
    var phoneH = (F.phone && F.phone.href) || 'tel:+19039136444';
    var email  = F.email || 'hello@premierdentalacademyoflongview.com';
    var year   = new Date().getFullYear();
    return `
<footer class="bg-slate-900 text-slate-300 mt-16">
  <div class="max-w-7xl mx-auto px-6 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 text-sm">
    <div>
      <div class="flex items-center gap-2 text-white font-bold">
        <img src="/assets/logo-mark.png" alt="" width="32" height="32" class="w-8 h-8 rounded-lg" />
        <span>Premier Dental Academy</span>
      </div>
      <p class="mt-3 leading-relaxed text-slate-400">${name}<br>${addr}</p>
      <p class="mt-3"><a href="${phoneH}" class="text-teal-300 hover:text-teal-200 font-semibold">${phoneD}</a></p>
      <p><a href="mailto:${email}" class="text-teal-300 hover:text-teal-200 break-all">${email}</a></p>
    </div>
    <nav aria-label="Programs" class="space-y-2">
      <p class="text-white font-semibold">Programs</p>
      <a href="/enroll?plan=in-person" class="block hover:text-white">In-person (Longview)</a>
      <a href="/enroll?plan=online" class="block hover:text-white">Online</a>
      <a href="/calendar" class="block hover:text-white">Class calendar</a>
      <a href="/apply" class="block hover:text-white">Apply free</a>
      <a href="/tour" class="block hover:text-white">Schedule a tour</a>
      <a href="/waitlist" class="block hover:text-white">Join the waitlist</a>
      <a href="/salary" class="block hover:text-white">Salary calculator</a>
      <a href="/study-pack" class="block hover:text-white">Study Pack — $19</a>
      <a href="/exam-prep-course" class="block hover:text-white">Exam-Prep Course — $97</a>
    </nav>
    <nav aria-label="Free trainers" class="space-y-2">
      <p class="text-white font-semibold">Free trainers</p>
      <a href="/tools/funding-finder" class="block hover:text-white">Get it paid for</a>
      <a href="/tools/take-home-pay" class="block hover:text-white">Take-home pay</a>
      <a href="/tools/schedule-planner" class="block hover:text-white">Fit it into my life</a>
      <a href="/tools/interview-prep" class="block hover:text-white">Interview prep</a>
      <a href="/tools/career-paths" class="block hover:text-white">Career paths</a>
      <a href="/tools/resource-hub" class="block hover:text-white">Life resources</a>
      <a href="/tools/study-plan" class="block hover:text-white">Study plan</a>
      <a href="/tools/is-it-for-me" class="block hover:text-white">Is this for me?</a>
      <a href="/tools/practice-exam" class="block hover:text-white">Practice exam</a>
      <a href="/skills-lab" class="block hover:text-white">Skills Lab</a>
      <a href="/tools/practice-pro" class="block hover:text-white">Practice Pro</a>
      <a href="/tools/chairside" class="block hover:text-white">ChairSide</a>
      <a href="/tools/flashcards" class="block hover:text-white">Flashcards</a>
      <a href="/study-guide" class="block hover:text-white">Study guide</a>
    </nav>
    <nav aria-label="More" class="space-y-2">
      <p class="text-white font-semibold">More</p>
      <a href="/employers" class="block hover:text-white">For dental offices</a>
      <a href="/sponsor-a-student" class="block hover:text-white">Sponsor a student</a>
      <a href="/graduates" class="block hover:text-white">Our graduates</a>
      <a href="/about" class="block hover:text-white">About Amanda</a>
      <a href="/contact" class="block hover:text-white">Contact</a>
      <a href="/blog" class="block hover:text-white">Blog</a>
    </nav>
  </div>
  <div class="border-t border-slate-800">
    <div class="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs text-slate-400">
      <p>© ${year} ${name}. All rights reserved.</p>
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
        <a href="/privacy" class="hover:text-white">Privacy</a>
        <a href="/terms" class="hover:text-white">Terms</a>
        <span class="text-slate-500">Trainers use fictional data only. No real PHI.</span>
      </div>
    </div>
  </div>
</footer>`;
  }

  function renderFooter() {
    if (document.getElementById('pda-footer')) return;
    var existing = document.querySelector('footer');
    var wrap = document.createElement('div');
    wrap.innerHTML = footerHTML().trim();
    var el = wrap.firstElementChild;
    el.id = 'pda-footer';
    if (existing) existing.replaceWith(el); else document.body.appendChild(el);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


/* ── Date-aware tuition price tokens ──────────────────────────────────────────
   Any element with data-price="ip-total" | "ip-pif" | "ip-plan" | "ip-down"
   auto-updates at the July 1, 2026 cutover (midnight America/Chicago). Add
   ?pricing=new or ?pricing=old to any URL to preview either set of numbers.
   Lets static price text across the site flip in lockstep with the calculator
   and the Square checkout — no manual edits on July 1. */
(function () {
  try {
    var CUT = Date.parse('2026-07-01T05:00:00Z');
    var ov = new URLSearchParams(location.search).get('pricing');
    var NEW = ov === 'new' ? true : ov === 'old' ? false : (Date.now() >= CUT);
    var M = {
      'ip-total': NEW ? '$3,000' : '$1,997',
      'ip-pif':   NEW ? '$3,000' : '$1,997',
      'ip-plan':  NEW ? '$3,500' : '$1,997',
      'ip-down':  NEW ? '$500'   : '$200'
    };
    function go() {
      document.querySelectorAll('[data-price]').forEach(function (el) {
        var v = M[el.getAttribute('data-price')];
        if (v) el.textContent = v;
      });
    }
    if (document.readyState !== 'loading') go();
    else document.addEventListener('DOMContentLoaded', go);
  } catch (e) { /* never break the page over price display */ }
})();
