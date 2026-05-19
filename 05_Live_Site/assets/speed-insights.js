/**
 * Vercel Speed Insights Loader
 * Dynamically imports and initializes Speed Insights tracking
 * Documentation: https://vercel.com/docs/speed-insights/quickstart
 */
(async function() {
  try {
    const { injectSpeedInsights } = await import('./speed-insights.mjs');
    injectSpeedInsights();
  } catch (error) {
    console.error('Failed to load Speed Insights:', error);
  }
})();
