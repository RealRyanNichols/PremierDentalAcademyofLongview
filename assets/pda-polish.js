/* Premier Dental Academy — premium micro-interactions (progressive enhancement).
   Loaded site-wide via pda-nav.js. SAFE BY DESIGN: the real value always lives
   in the element's text, so if this script never runs (or IntersectionObserver
   is unsupported, or the user prefers reduced motion) the correct number is
   already on screen — nothing is ever hidden. */
(function () {
  'use strict';

  // Animate one [data-count] element from 0 up to the number already in its text,
  // preserving any prefix ($, ~) and suffix (%, +, k, –44k, etc.).
  function animateCount(el) {
    var raw = (el.textContent || '').trim();
    var m = raw.match(/^(\D*)([\d,]+(?:\.\d+)?)(.*)$/s);
    if (!m) return;                       // no leading number → leave it alone
    var prefix = m[1], numStr = m[2].replace(/,/g, ''), suffix = m[3];
    var target = parseFloat(numStr);
    if (!isFinite(target)) return;
    var hasComma = m[2].indexOf(',') > -1;
    var decimals = (numStr.split('.')[1] || '').length;
    var fmt = function (v) {
      var s = v.toFixed(decimals);
      if (hasComma) s = Number(s).toLocaleString('en-US');
      return prefix + s + suffix;
    };
    var dur = 1100, startTs = null;
    function step(ts) {
      if (!startTs) startTs = ts;
      var p = Math.min((ts - startTs) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = raw;          // restore the exact original string
    }
    requestAnimationFrame(step);
  }

  function init() {
    var els = [].slice.call(document.querySelectorAll('[data-count]'));
    if (!els.length) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return; // leave real numbers as-is
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { io.unobserve(e.target); animateCount(e.target); }
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* Scroll-progress bar — a thin teal→cyan→amber line at the very top that fills
   as the visitor reads. Pure progressive enhancement: fixed-position, pointer-
   events:none, zero layout impact, and harmless if it never runs. */
(function () {
  'use strict';
  if (typeof window === 'undefined' || window.__pdaProgress) return;
  window.__pdaProgress = true;
  function start() {
    var bar = document.createElement('div');
    bar.setAttribute('aria-hidden', 'true');
    bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;width:0;z-index:9999;' +
      'pointer-events:none;border-radius:0 3px 3px 0;' +
      'background:linear-gradient(90deg,#0d9488,#22d3ee 55%,#f59e0b);' +
      'box-shadow:0 0 12px rgba(13,148,136,.55);transition:width .12s ease-out;';
    document.body.appendChild(bar);
    var ticking = false;
    function update() {
      var st = window.scrollY || document.documentElement.scrollTop || 0;
      var h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      bar.style.width = (h > 0 ? Math.min(100, (st / h) * 100) : 0).toFixed(2) + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
