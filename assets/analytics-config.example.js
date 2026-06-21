// Analytics config (PUBLIC IDs only — these are safe to ship client-side).
// To enable pixels: copy this file to assets/analytics-config.js, fill the IDs,
// and include it before assets/pda-analytics.js. With no config, analytics is a
// safe no-op (console.debug only). Do NOT put secret/API keys here.
window.PDA_ANALYTICS_CONFIG = {
  ga4Id: "",          // e.g. "G-XXXXXXXXXX"
  metaPixelId: "",    // e.g. "1234567890"
  tiktokPixelId: "",  // e.g. "CXXXXXXXXXXXXXXXXX"
  debug: false        // true → log every event to the console
};
