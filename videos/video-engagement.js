/* Native Amanda video engagement; uses PDA's existing GA4/Meta adapter. */
(function () {
  'use strict';
  if (window.__pdaVideoEngagement) return;
  window.__pdaVideoEngagement = true;
  function send(name, id, placement, extra) {
    if (!/^[0-9]{2}-[a-z0-9-]+$/.test(id || '')) return;
    var props = { video_id: id, placement: String(placement || 'videos').slice(0, 40) };
    Object.keys(extra || {}).forEach(function (k) { props[k] = extra[k]; });
    try { if (window.PDA && typeof window.PDA.track === 'function') window.PDA.track(name, props); } catch (e) {}
  }
  function watchedPercent(video) {
    var duration = video.duration, seconds = 0;
    if (!Number.isFinite(duration) || duration <= 0) return 0;
    try { for (var i = 0; i < video.played.length; i++) seconds += video.played.end(i) - video.played.start(i); } catch (e) {}
    return Math.min(100, seconds / duration * 100);
  }
  function bind() {
    document.querySelectorAll('video[data-pda-video-id]').forEach(function (video) {
      if (video.dataset.pdaVideoBound) return;
      video.dataset.pdaVideoBound = '1';
      var id = video.dataset.pdaVideoId, place = video.dataset.pdaVideoPlacement || 'videos';
      var started = false, completed = false, milestones = {};
      video.addEventListener('play', function () {
        if (!started) { started = true; send('video_start', id, place); }
        document.querySelectorAll('video[data-pda-video-id]').forEach(function (other) { if (other !== video && !other.paused) other.pause(); });
      });
      video.addEventListener('timeupdate', function () {
        if (!started) return;
        var percent = watchedPercent(video);
        [25, 50, 75].forEach(function (threshold) {
          if (percent >= threshold && !milestones[threshold]) {
            milestones[threshold] = true;
            send('video_progress', id, place, { percent: threshold });
          }
        });
      });
      video.addEventListener('ended', function () {
        if (!completed && watchedPercent(video) >= 90) { completed = true; send('video_complete', id, place, { percent: 100 }); }
      });
      video.addEventListener('error', function () { send('video_error', id, place, { error_code: video.error ? video.error.code : 0 }); });
    });
  }
  document.addEventListener('click', function (event) {
    var el = event.target && event.target.closest && event.target.closest('[data-pda-video-cta]');
    if (!el) return;
    send('video_cta_click', el.dataset.pdaVideoId, el.dataset.pdaVideoPlacement || 'videos', { action: String(el.dataset.pdaVideoCta || 'watch').slice(0, 32) });
  }, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
