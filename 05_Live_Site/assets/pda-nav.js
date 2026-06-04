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
  <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
    <a href="/" class="flex items-center gap-2 font-bold text-slate-900 shrink-0">
      <span class="inline-block w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-700 text-white font-extrabold text-base grid place-items-center">P</span>
      <span class="text-base sm:text-lg hidden sm:inline">Premier Dental Academy</span>
    </a>
    <div class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
      <a href="/#programs" data-nav-link class="hover:text-teal-700">Programs</a>
      <a href="/calendar"  data-nav-link class="hover:text-teal-700">Calendar</a>
      <a href="/feed"      data-nav-link class="hover:text-teal-700">Feed</a>
      <a href="/salary"    data-nav-link class="hover:text-teal-700">Salary</a>
      <a href="/about"     data-nav-link class="hover:text-teal-700">About</a>
      <div class="relative">
        <button id="pda-more-btn" type="button" aria-expanded="false" class="inline-flex items-center gap-1 hover:text-teal-700">Resources <span class="text-[10px] leading-none">▼</span></button>
        <div id="pda-more-menu" hidden class="absolute right-0 top-9 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 w-60 z-50 text-slate-700">
          <a href="/tools/practice-exam" class="block px-4 py-2 hover:bg-slate-50 font-semibold text-teal-700">📝 Free practice exam</a>
          <a href="/tools/flashcards"    class="block px-4 py-2 hover:bg-slate-50">RDA flashcards</a>
          <a href="/tools/how-to-chart"  class="block px-4 py-2 hover:bg-slate-50">How to chart (tutorial)</a>
          <div class="border-t border-slate-100 my-1"></div>
          <a href="/apply"           class="block px-4 py-2 hover:bg-slate-50 font-semibold">📅 Book a campus tour</a>
          <a href="/contact"         class="block px-4 py-2 hover:bg-slate-50">Contact</a>
          <a href="/graduates"       class="block px-4 py-2 hover:bg-slate-50">Our graduates</a>
          <a href="/hiring-partners" class="block px-4 py-2 hover:bg-slate-50">For dental offices</a>
        </div>
      </div>
      <a href="/teach" data-nav-link class="text-amber-600 hover:text-amber-700 font-semibold">Teach</a>
    </div>
    <div class="flex items-center gap-3 shrink-0">
      <a id="pda-nav-auth"  href="/login"     data-nav-link class="hidden md:inline-flex text-sm font-medium text-slate-700 hover:text-teal-700">Sign in</a>
      <a id="pda-nav-dash"  href="/dashboard" data-nav-link class="hidden text-sm font-medium text-teal-700 hover:text-teal-900 md:inline-flex">Dashboard</a>
      <a href="/enroll" id="pda-nav-enroll" class="hidden sm:inline-flex bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm">Enroll →</a>
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
    <a href="/#programs" data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base font-semibold text-slate-900">Programs</a>
    <a href="/calendar"  data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base font-semibold text-slate-900">Calendar</a>
    <a href="/feed"      data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base font-semibold text-slate-900">Feed</a>
    <a href="/salary"    data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base font-semibold text-slate-900">Salary</a>
    <a href="/about"     data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base font-semibold text-slate-900">About</a>
    <a href="/contact"   data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base font-semibold text-slate-900">Contact</a>

    <p class="text-[11px] uppercase tracking-widest text-slate-400 font-semibold px-1 mb-1 mt-4">Free study tools</p>
    <a href="/tools/practice-exam" data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base font-semibold text-teal-700">📝 Free practice exam</a>
    <a href="/tools/flashcards"    data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">RDA flashcards</a>
    <a href="/tools/how-to-chart"  data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">How to chart</a>

    <p class="text-[11px] uppercase tracking-widest text-slate-400 font-semibold px-1 mb-1 mt-4">More</p>
    <a href="/apply"     data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base font-semibold text-slate-900">📅 Book a campus tour</a>
    <a href="/graduates" data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Our graduates</a>
    <a href="/hiring-partners" data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">For dental offices</a>
    <a href="/teach"     data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base font-semibold text-amber-600">Teach with us →</a>
    <a id="pda-mobile-auth"  href="/login"     data-nav-link class="block py-2.5 px-1 border-b border-slate-100 text-base text-slate-700">Sign in</a>
    <a id="pda-mobile-dash"  href="/dashboard" data-nav-link class="hidden py-2.5 px-1 border-b border-slate-100 text-base text-teal-700 font-semibold">Go to my dashboard →</a>

    <a href="/enroll" id="pda-mobile-enroll" class="mt-5 block bg-amber-500 hover:bg-amber-600 text-white text-center text-lg font-semibold px-6 py-3.5 rounded-lg shadow">Enroll →</a>
    <a href="tel:+19039136444" class="mt-3 mb-2 block text-center text-sm text-slate-500">or call (903) 913-6444</a>
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
        '<a href="tel:+19039136444" style="flex:1" class="inline-flex items-center justify-center gap-1.5 border border-teal-600 text-teal-700 font-semibold rounded-lg py-2.5 text-sm">📞 Call</a>' +
        '<a href="/apply" style="flex:1.4;box-shadow:0 2px 8px rgba(245,158,11,.35)" class="inline-flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg py-2.5 text-sm">Apply now →</a>';
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

    // Desktop "Resources" dropdown wiring.
    const moreBtn = document.getElementById('pda-more-btn');
    const moreMenu = document.getElementById('pda-more-menu');
    if (moreBtn && moreMenu) {
      const closeMore = () => { moreMenu.hidden = true; moreBtn.setAttribute('aria-expanded', 'false'); };
      moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = moreMenu.hidden;
        moreMenu.hidden = !willOpen;
        moreBtn.setAttribute('aria-expanded', String(willOpen));
      });
      document.addEventListener('click', (e) => {
        if (!moreMenu.hidden && !moreMenu.contains(e.target) && e.target !== moreBtn) closeMore();
      });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMore(); });
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
      let paid = false;
      try {
        const { data: prof } = await sb.from('profiles')
          .select('program, is_admin').eq('id', session.user.id).maybeSingle();
        paid = !!(prof && (prof.is_admin || (prof.program && prof.program !== 'preview')));
      } catch (e) {}

      if (paid) {
        document.querySelectorAll('#pda-more-menu a[href="/tools/practice-exam"], #pda-mobile-menu a[href="/tools/practice-exam"]')
          .forEach(a => { a.textContent = '📝 Practice exam'; });
        document.querySelectorAll('#pda-mobile-menu p')
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
        const heroExam = document.getElementById('hero-cta-exam');
        if (heroExam) heroExam.innerHTML = '📝 Practice exam';
      }
    }
    // Try now; if the supabase global isn't there yet, wait a tick.
    if (window.supabase?.createClient) wireAuth();
    else setTimeout(wireAuth, 400);

    injectSpecialOfferBar();
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
  // Auto-hides at the June 3 2026 5pm CT deadline and respects a dismiss.
  function injectSpecialOfferBar() {
    const DEADLINE_MS = Date.parse('2026-06-03T17:00:00-05:00');
    if (!isFinite(DEADLINE_MS) || Date.now() >= DEADLINE_MS) return;
    const path = location.pathname.toLowerCase().replace(/\/$/, '');
    // Don't show on pages that already lead with the offer or where a sticky
    // bar would be in the way.
    if (/^\/(admin|login|logout|enroll-success|special-offer|enroll)/.test(path)) return;
    try { if (localStorage.getItem('pda.offer.dismissed.v1') === '1') return; } catch (e) {}

    const HREF = '/enroll?plan=in-person&cohort=695198a9-a2e1-4274-815c-a776fa7f582d&special=summer2026';
    const bar = document.createElement('div');
    bar.id = 'pda-offer-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Limited-time enrollment offer');
    bar.style.cssText = [
      'position:fixed', 'left:0', 'right:0', 'bottom:0', 'z-index:9998',
      'background:#001a3d', 'color:#fff',
      'box-shadow:0 -8px 24px -4px rgba(0,26,61,0.35)',
      'padding:10px 14px', 'font:600 13px/1.3 Inter,system-ui,sans-serif',
    ].join(';');
    bar.innerHTML =
      '<div style="max-width:1100px;margin:0 auto;display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;text-align:center">' +
      '<span style="color:#fbbf24">🔥 SPECIAL</span>' +
      '<span><b style="color:#fbbf24">$1,500</b> pay-in-full · June 22 or July 7 in-person</span>' +
      '<span style="color:#fbbf24">·</span>' +
      '<span>ends in <b class="pda-offer-cd" style="color:#fbbf24">—</b></span>' +
      '<a href="' + HREF + '" style="background:#fbbf24;color:#001a3d;padding:6px 14px;border-radius:8px;font-weight:800;text-decoration:none;white-space:nowrap">Claim →</a>' +
      '<button type="button" aria-label="Dismiss" class="pda-offer-x" style="background:transparent;color:#94a3b8;border:0;padding:4px 8px;font-size:18px;cursor:pointer;line-height:1">×</button>' +
      '</div>';
    document.body.appendChild(bar);

    // Don't let the bar hide page content — push the body up by the bar's height.
    function pad() { document.body.style.paddingBottom = (bar.offsetHeight + 4) + 'px'; }
    pad();
    window.addEventListener('resize', pad);

    function tick() {
      const ms = DEADLINE_MS - Date.now();
      if (ms <= 0) { bar.remove(); document.body.style.paddingBottom = ''; return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      const el = bar.querySelector('.pda-offer-cd');
      if (el) el.textContent = h > 24
        ? Math.floor(h / 24) + 'd ' + (h % 24) + 'h ' + m + 'm'
        : (h > 0 ? h + 'h ' : '') + m + 'm ' + s + 's';
    }
    tick();
    const id = setInterval(tick, 1000);

    bar.querySelector('.pda-offer-x').addEventListener('click', () => {
      bar.remove();
      document.body.style.paddingBottom = '';
      clearInterval(id);
      try { localStorage.setItem('pda.offer.dismissed.v1', '1'); } catch (e) {}
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
