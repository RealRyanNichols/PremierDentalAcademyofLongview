/* PDA — site-wide SEO + analytics snippet
 * Load this on every public page (NOT trainers, NOT admin).
 *
 * Job:
 *  - Inject meta description, canonical, OG, Twitter card if the page
 *    didn't ship one (defensive — page-level tags always win)
 *  - Inject JSON-LD BreadcrumbList based on URL path
 *  - Inject Plausible-style cookieless analytics that respects DNT
 *  - Provide a tiny pda.track(event) helper
 */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  // ── Canonical URL ──────────────────────────────────────────────
  if (!document.querySelector('link[rel="canonical"]')) {
    const canon = document.createElement('link');
    canon.rel = 'canonical';
    canon.href = location.origin + location.pathname;
    document.head.appendChild(canon);
  }

  // ── Defaults if page didn't ship its own meta ─────────────────
  const META = {
    description: "Premier Dental Academy of Longview — East Texas's only RDA training program where you practice on real-grade practice management software before your first day.",
    image: location.origin + '/assets/og-cover.png',
    siteName: 'Premier Dental Academy of Longview',
    twitter: '@PremierDental',
  };

  function ensureMeta(selector, attr, value, attrs = {}) {
    if (document.head.querySelector(selector)) return;
    const m = document.createElement('meta');
    Object.entries({ [attr]: value, ...attrs }).forEach(([k, v]) => m.setAttribute(k, v));
    document.head.appendChild(m);
  }

  ensureMeta('meta[name="description"]', 'name', 'description', { content: META.description });
  ensureMeta('meta[property="og:type"]', 'property', 'og:type', { content: 'website' });
  ensureMeta('meta[property="og:site_name"]', 'property', 'og:site_name', { content: META.siteName });
  ensureMeta('meta[property="og:url"]', 'property', 'og:url', { content: location.origin + location.pathname });
  ensureMeta('meta[property="og:image"]', 'property', 'og:image', { content: META.image });
  ensureMeta('meta[name="twitter:card"]', 'name', 'twitter:card', { content: 'summary_large_image' });
  ensureMeta('meta[name="twitter:image"]', 'name', 'twitter:image', { content: META.image });
  // Defensive title/description fallbacks for OG
  const t = document.title;
  if (t) {
    ensureMeta('meta[property="og:title"]', 'property', 'og:title', { content: t });
    ensureMeta('meta[name="twitter:title"]', 'name', 'twitter:title', { content: t });
  }
  const d = document.querySelector('meta[name="description"]')?.content;
  if (d) {
    ensureMeta('meta[property="og:description"]', 'property', 'og:description', { content: d });
    ensureMeta('meta[name="twitter:description"]', 'name', 'twitter:description', { content: d });
  }

  // ── BreadcrumbList schema (auto from URL path) ─────────────────
  const segs = location.pathname.split('/').filter(Boolean);
  const labelMap = {
    'about': 'About', 'contact': 'Contact', 'apply': 'Apply', 'enroll': 'Enroll',
    'login': 'Sign in', 'dashboard': 'Dashboard', 'privacy': 'Privacy', 'terms': 'Terms',
    'tools': 'Trainers', 'practice-pro': 'Practice Pro', 'chairside': 'ChairSide',
    'thank-you': 'Thank you', 'unsubscribe': 'Unsubscribe', '404': 'Not found',
  };
  if (segs.length > 0) {
    const items = [{ '@type': 'ListItem', position: 1, name: 'Home', item: location.origin + '/' }];
    let acc = '';
    segs.forEach((seg, i) => {
      acc += '/' + seg;
      items.push({
        '@type': 'ListItem',
        position: i + 2,
        name: labelMap[seg] || seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        item: location.origin + acc,
      });
    });
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items });
    document.head.appendChild(ld);
  }

  // ── Organization + LocalBusiness schema (rich results / local SEO) ──
  if (!document.querySelector('script[data-pda-schema="org"]')) {
    const ORG = {
      '@context': 'https://schema.org',
      '@type': ['EducationalOrganization', 'LocalBusiness'],
      '@id': 'https://premierdentalacademyoflongview.com/#org',
      name: 'Premier Dental Academy of Longview',
      alternateName: 'PDA Longview',
      description: META.description,
      url: 'https://premierdentalacademyoflongview.com/',
      logo: 'https://premierdentalacademyoflongview.com/assets/logo-mark.png',
      image: 'https://premierdentalacademyoflongview.com/assets/og-cover.png',
      telephone: '+1-903-913-6444',
      priceRange: '$397–$1,997',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '2800 Gilmer Rd, Suite 106',
        addressLocality: 'Longview',
        addressRegion: 'TX',
        postalCode: '75604',
        addressCountry: 'US',
      },
      areaServed: ['Longview', 'Tyler', 'Marshall', 'Kilgore', 'Henderson', 'Gladewater', 'East Texas'],
    };
    const orgLd = document.createElement('script');
    orgLd.type = 'application/ld+json';
    orgLd.setAttribute('data-pda-schema', 'org');
    orgLd.textContent = JSON.stringify(ORG);
    document.head.appendChild(orgLd);
  }

  // ── AOS resilience ────────────────────────────────────────────
  // Marketing pages animate sections in with AOS, whose CSS hides [data-aos]
  // elements (opacity:0) until its JS runs. If that CDN ever fails (outage,
  // ad-blocker, firewall) the content would be stuck invisible. Safety net:
  // after load, if AOS never initialised, reveal every [data-aos] element so
  // a visitor never lands on a blank page.
  window.addEventListener('load', function () {
    setTimeout(function () {
      if (window.AOS) return;
      document.querySelectorAll('[data-aos]').forEach(function (el) {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    }, 600);
  });

  // ── Analytics (cookieless, DNT-respecting) ────────────────────
  // Placeholder beacon that captures pageviews + custom events.
  // Currently writes to `analytics_events` Supabase table if we set that up.
  // Swap PLAUSIBLE_DOMAIN for the real production domain when ready.
  const PLAUSIBLE_DOMAIN = 'premierdentalacademyoflongview.com';
  if (navigator.doNotTrack !== '1' && navigator.doNotTrack !== 'yes' && !/(localhost|127\.0\.0\.1|192\.168)/.test(location.hostname)) {
    const s = document.createElement('script');
    s.defer = true;
    s.setAttribute('data-domain', PLAUSIBLE_DOMAIN);
    s.src = 'https://plausible.io/js/script.outbound-links.js';
    document.head.appendChild(s);
  }

  // pda.track(event, props) — call from buttons / forms to record events
  window.pda = window.pda || {};
  window.pda.track = function (event, props = {}) {
    if (typeof window.plausible === 'function') {
      try { window.plausible(event, { props }); } catch (e) {}
    }
  };
})();
