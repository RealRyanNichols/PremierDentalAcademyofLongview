/* Public Amanda videos: share the watch page, with ordinary save controls hidden. */
(function () {
  'use strict';
  if (window.__pdaVideoSharing) return;
  window.__pdaVideoSharing = true;
  var ids = ['01-interview-support', '02-come-back-for-practice', '03-unexpected-career', '04-whats-holding-you-back', '05-practical-dental-skills', '06-flexible-learning-support', '07-from-assistant-to-owner', '08-beyond-the-classroom', '09-starting-your-dental-career', '10-meet-amanda-premier-dental'];
  function bind() {
    document.querySelectorAll('video[data-pda-video-id]').forEach(function (video) {
      video.addEventListener('contextmenu', function (event) { event.preventDefault(); });
    });
    document.querySelectorAll('[data-pda-share-id]').forEach(function (group) {
      var id = group.dataset.pdaShareId;
      if (ids.indexOf(id) === -1) return;
      var url = 'https://www.premierdentalacademyoflongview.com/videos/' + id + '/';
      var title = String(group.dataset.pdaShareTitle || 'Amanda at Premier Dental Academy').slice(0, 200);
      var status = group.querySelector('[data-pda-share-status]');
      var fallback = group.querySelector('[data-pda-share-fallback]');
      var field = group.querySelector('[data-pda-share-link]');
      var busy = false;
      function manual() {
        fallback.hidden = false;
        field.value = url;
        field.focus();
        field.select();
        status.textContent = 'Select and copy the video link below.';
      }
      async function copy() {
        try {
          if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') { manual(); return; }
          await navigator.clipboard.writeText(url);
          fallback.hidden = true;
          status.textContent = 'Video link copied.';
        } catch (error) { manual(); }
      }
      group.querySelectorAll('button[data-pda-share-action]').forEach(function (button) {
        button.addEventListener('click', async function () {
          if (busy) return;
          var action = button.dataset.pdaShareAction;
          if (action === 'select') { field.focus(); field.select(); return; }
          busy = true;
          button.disabled = true;
          status.textContent = '';
          try {
            if (action === 'copy') { await copy(); return; }
            if (typeof navigator.share !== 'function') { await copy(); return; }
            try {
              await navigator.share({ title: title, url: url });
              status.textContent = 'Share options opened.';
            } catch (error) {
              if (!error || error.name !== 'AbortError') manual();
            }
          } finally { busy = false; button.disabled = false; }
        });
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
