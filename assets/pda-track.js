/* PDA site analytics — first-party, cookie-free, zero-config.
 * Logs pageviews + key CTA clicks into the existing Supabase `page_visits`
 * table (anon INSERT-only; admins read it in the dashboard).
 *
 * Event naming (page column):
 *   pv:<path>              e.g. "pv:/salary"            — one per pageview
 *   click:enroll|<path>    enroll link clicked on <path>
 *   click:apply|<path>     apply link
 *   click:tour|<path>      tour link
 *   click:call|<path>      tel: tap
 *   click:email|<path>     mailto: tap
 *   click:funding|<path>   funding-finder link
 *   click:tool:<name>|<path>  a /tools/* link
 *   click:blog|<path>      a blog-article link
 *   click:share|<path>     share button/link
 *
 * visitor_hash is a random first-party id in localStorage (`pda_vid`) — the
 * same key the funnel + homepage already use, so journeys stitch together.
 * Admin pages are excluded so staff activity doesn't pollute the numbers.
 */
(function () {
  'use strict';
  if (window.__pdaTrack) return;
  window.__pdaTrack = true;

  var path = location.pathname.replace(/\/$/, '') || '/';
  if (path.indexOf('/admin') === 0) return; // don't count staff

  var URL_ = 'https://lmbsuwslsycukynzpzik.supabase.co/rest/v1/page_visits';
  var KEY = 'sb_publishable_vzuQZbkmj-UsYZVs5Zqw9w_c8PiOfbh';

  function vid() {
    try {
      var h = localStorage.getItem('pda_vid');
      if (!h) {
        h = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem('pda_vid', h);
      }
      return h;
    } catch (e) { return 'v_anon'; }
  }

  function log(page) {
    try {
      var body = JSON.stringify({ page: page.slice(0, 250), visitor_hash: vid() });
      if (navigator.sendBeacon) {
        var blob = new Blob([body], { type: 'application/json' });
        // sendBeacon can't set headers, so use fetch keepalive instead:
        fetch(URL_ + '?apikey=' + KEY, {
          method: 'POST', keepalive: true,
          headers: { 'Content-Type': 'application/json', 'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Prefer': 'return=minimal' },
          body: body
        }).catch(function () {});
      } else {
        fetch(URL_, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Prefer': 'return=minimal' },
          body: body
        }).catch(function () {});
      }
    } catch (e) { /* analytics must never break the page */ }
  }

  // ── Pageview ──
  log('pv:' + path);

  // ── CTA / navigation clicks (event delegation, capture phase) ──
  function classify(a) {
    var href = (a.getAttribute('href') || '').toLowerCase();
    if (!href) return null;
    if (href.indexOf('/enroll') !== -1) return 'click:enroll';
    if (href.indexOf('/apply') !== -1) return 'click:apply';
    if (href.indexOf('/tour') !== -1 && href.indexOf('/tools') === -1) return 'click:tour';
    if (href.indexOf('tel:') === 0) return 'click:call';
    if (href.indexOf('mailto:') === 0) return 'click:email';
    if (href.indexOf('funding-finder') !== -1) return 'click:funding';
    if (href.indexOf('/tools/') !== -1) {
      var m = href.match(/\/tools\/([a-z0-9-]+)/);
      return 'click:tool:' + (m ? m[1] : 'unknown');
    }
    if (href.indexOf('/blog/') !== -1) return 'click:blog';
    if (href.indexOf('share') !== -1 || (a.className || '').toLowerCase().indexOf('share') !== -1) return 'click:share';
    return null;
  }

  document.addEventListener('click', function (e) {
    var el = e.target;
    while (el && el !== document.body) {
      if (el.tagName === 'A') {
        var kind = classify(el);
        if (kind) log(kind + '|' + path);
        return;
      }
      el = el.parentElement;
    }
  }, true);
})();
