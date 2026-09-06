// Analytics config (PUBLIC IDs only — these are safe to ship client-side).
// Loaded site-wide by pda-nav.js BEFORE pda-analytics.js. Do NOT put secrets here.
// GA4 property: premierdentalacademyoflongview.com (account: Premier Dental Academy of Longview,
// owner hello@premierdentalacademyoflongview.com). Set up 2026-07-22.
window.PDA_ANALYTICS_CONFIG = {
  ga4Id: "G-XWTZL5JZ6C",
  // The live pixel (same id pda-nav.js initialises). Was "" — which silently gated
  // EVERY PDA.track() custom event (incl. purchase) off Meta. Filled 2026-09-06.
  metaPixelId: "1290830552877730",
  tiktokPixelId: "",
  debug: false
};

// GA4 bootstrap — loads gtag.js once and configures the property.
// pda-analytics.js then forwards every PDA.track()/data-event to GA4 automatically.
(function () {
  var ID = window.PDA_ANALYTICS_CONFIG.ga4Id;
  if (!ID || window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", ID, { anonymize_ip: true });
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + ID;
  document.head.appendChild(s);
})();
