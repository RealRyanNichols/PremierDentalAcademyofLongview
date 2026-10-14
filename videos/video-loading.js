/* Prepare one visible Amanda player; keep playback under the visitor's control. */
(function () {
  'use strict';
  if (window.__pdaVideoLoading) return;
  window.__pdaVideoLoading = true;

  function prepare(video) {
    if (!video.paused || video.currentTime > 0 || video.getAttribute('preload') !== 'none') return;
    video.setAttribute('preload', 'metadata');
  }

  function bind() {
    var videos = document.querySelectorAll('video[data-pda-video-id]');
    videos.forEach(function (video) {
      video.addEventListener('mouseenter', function () { prepare(video); });
      video.addEventListener('focusin', function () { prepare(video); });
    });
    // Keep the automatic chat prompt off the player; the chat button stays available.
    if (window.IntersectionObserver && document.body) {
      var visible = new Set();
      var visibility = new window.IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        });
        document.body.setAttribute('data-pda-video-in-view', visible.size ? 'true' : 'false');
      }, { threshold: 0.01 });
      videos.forEach(function (video) { visibility.observe(video); });
    }
    var connection = window.navigator && window.navigator.connection;
    if (connection && (connection.saveData || /^(slow-2g|2g)$/.test(connection.effectiveType || ''))) return;
    if (!window.IntersectionObserver) return;
    var prepared = false;
    var observer = new window.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (prepared || !entry.isIntersecting) return;
        prepared = true;
        prepare(entry.target);
        observer.disconnect();
      });
    }, { rootMargin: '150px 0px', threshold: 0.01 });
    videos.forEach(function (video) {
      if (video.getAttribute('preload') === 'none') observer.observe(video);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
