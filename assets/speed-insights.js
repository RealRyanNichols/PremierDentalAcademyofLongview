/* Vercel Speed Insights initialization
 * This script loads and initializes Vercel Speed Insights for performance monitoring.
 * See: https://vercel.com/docs/speed-insights/quickstart
 */
(function() {
  'use strict';
  
  // Initialize Speed Insights queue
  window.si = window.si || function () { 
    (window.siq = window.siq || []).push(arguments); 
  };
  
  // Load the Speed Insights script from Vercel's CDN
  // The script will be served from /_vercel/speed-insights/script.js after deployment
  const script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/speed-insights/script.js';
  
  // Append to head or body
  const target = document.head || document.body;
  if (target) {
    target.appendChild(script);
  }
})();
