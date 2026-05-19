/* Vercel Speed Insights integration for PDA
 * Injects Speed Insights tracking script to measure Web Vitals (CLS, FID, LCP, etc.)
 * Implementation follows official Vercel Speed Insights documentation:
 * https://vercel.com/docs/speed-insights/quickstart
 */
(function() {
  'use strict';
  
  // Initialize Speed Insights tracking queue (official implementation)
  window.si = window.si || function () { 
    (window.siq = window.siq || []).push(arguments); 
  };
  
  // Inject the Speed Insights script from Vercel's CDN
  var script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/speed-insights/script.js';
  
  // Add error handling
  script.onerror = function() {
    console.warn('[Speed Insights] Failed to load tracking script');
  };
  
  // Insert before other scripts for early initialization
  var firstScript = document.getElementsByTagName('script')[0];
  if (firstScript && firstScript.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }
})();
