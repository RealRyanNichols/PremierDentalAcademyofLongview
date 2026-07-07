/*!
 * PDA analytics + lead attribution — safe, provider-agnostic, never throws.
 *
 * - Auto-fires `page_view` and any element with `data-event="..."` on click.
 * - Captures UTM params to localStorage and exposes them for form payloads.
 * - Sends to whatever provider is configured (Vercel Web Analytics if present,
 *   plus GA4 / Meta Pixel / TikTok when their public IDs are set in
 *   window.PDA_ANALYTICS_CONFIG — see assets/analytics-config.example.js).
 * - With no provider configured it is a no-op (console.debug only). Never crashes.
 *
 * API: window.PDA.track(name, props) · window.PDA.identifyLead(traits) ·
 *      window.PDA.attribution()  (returns {utm_*, referrer, landing_path})
 */
(function () {
  var CFG = (typeof window !== "undefined" && window.PDA_ANALYTICS_CONFIG) || {};
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

  // Named conversion events that map to the Meta STANDARD "Lead" event (used for
  // ad optimization + retargeting/lookalike audiences). The pixel is loaded
  // site-wide by pda-nav.js, so this fires whenever a lead form reports success.
  var LEAD_EVENTS = {
    application_submit: 1, waitlist_submit: 1, tour_submit: 1, study_guide_submit: 1,
    practice_exam_lead_submit: 1, employer_request_submit: 1, night_class_lead: 1,
    ask_premier_lead_submit: 1, lead_submit: 1,
  };

  function safe(fn) { try { return fn(); } catch (e) { /* analytics must never break the page */ } }

  function captureUTM() {
    safe(function () {
      var p = new URLSearchParams(location.search), got = {};
      UTM_KEYS.forEach(function (k) { var v = p.get(k); if (v) got[k] = v; });
      if (Object.keys(got).length) {
        got._ts = Date.now();
        if (!got.referrer) got.referrer = document.referrer || "";
        localStorage.setItem("pda.utm", JSON.stringify(got));
      }
    });
  }

  function attribution() {
    var a = {};
    safe(function () { a = JSON.parse(localStorage.getItem("pda.utm") || "{}"); });
    safe(function () { if (!a.referrer) a.referrer = document.referrer || ""; });
    safe(function () { a.landing_path = location.pathname; });
    return a;
  }

  function hasProvider() {
    return !!(window.va || window.gtag || window.fbq || window.ttq);
  }

  function track(name, props) {
    if (!name) return;
    var data = {};
    safe(function () { Object.assign(data, props || {}); });
    safe(function () { if (window.va) window.va("event", { name: name, data: data }); });           // Vercel
    safe(function () { if (window.gtag && CFG.ga4Id) window.gtag("event", name, data); });          // GA4
    safe(function () { if (window.fbq && CFG.metaPixelId) window.fbq("trackCustom", name, data); }); // Meta (custom)
    safe(function () { if (window.ttq && CFG.tiktokPixelId) window.ttq.track(name, data); });        // TikTok
    // Meta STANDARD event mapping — the pixel is loaded site-wide (pda-nav.js),
    // so gate on fbq itself, not the optional PDA_ANALYTICS_CONFIG.metaPixelId.
    // Purchase is intentionally NOT mapped here (each product/enroll path fires
    // its own Purchase — mapping it centrally would double-count).
    safe(function () {
      if (window.fbq && LEAD_EVENTS[name]) {
        window.fbq("track", "Lead", { content_name: name, value: data.value, currency: data.currency || "USD" });
      }
    });
    if (CFG.debug || !hasProvider()) safe(function () { console.debug("[pda-analytics]", name, data); });
  }

  function identifyLead(traits) {
    safe(function () { if (window.gtag) window.gtag("set", "user_properties", traits || {}); });
  }

  // Delegate clicks on anything with data-event (capture phase so it fires before navigation).
  safe(function () {
    document.addEventListener("click", function (e) {
      var el = e.target && e.target.closest && e.target.closest("[data-event]");
      if (!el) return;
      track(el.getAttribute("data-event"), {
        href: el.getAttribute("href") || undefined,
        text: (el.textContent || "").trim().slice(0, 80)
      });
    }, true);
  });

  function pageView() { track("page_view", { path: location.pathname }); }

  // Public API
  window.PDA = window.PDA || {};
  window.PDA.track = track;
  window.PDA.identifyLead = identifyLead;
  window.PDA.attribution = attribution;

  captureUTM();
  if (document.readyState !== "loading") pageView();
  else document.addEventListener("DOMContentLoaded", pageView);
})();
