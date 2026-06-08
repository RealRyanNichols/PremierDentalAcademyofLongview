/* PDA — flexible video section.
 *
 * Add or change videos by editing the VIDEOS list below. Every common
 * source is supported, so videos can be added "any way possible":
 *
 *   { type:'youtube', id:'dQw4w9WgXcQ',  title:'...' }   // YouTube (or Unlisted)
 *   { type:'vimeo',   id:'123456789',     title:'...' }   // Vimeo
 *   { type:'drive',   id:'<drive file id>', title:'...' } // Google Drive file
 *        ^ the Drive file must be shared "Anyone with the link can view"
 *   { type:'mp4',     src:'/assets/videos/clip.mp4', poster:'/assets/x.jpg', title:'...' }
 *
 * A page can also override the list by setting window.PDA_VIDEOS = [...] before
 * this script runs. The section renders into #pda-video-grid and hides itself
 * if there are no videos.
 */
(function () {
  'use strict';

  var VIDEOS = [
    { type: 'drive', id: '1VfFurV4vRM0LEaaOP8Jo3KxND855sL2v', title: 'A message from Premier Dental Academy' },
    { type: 'drive', id: '1qFRyl8MC5qhBfLS1XaUOVxKGm1qqF0w2', title: 'Inside Premier Dental Academy' }
  ];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function frame(v) {
    var base = 'class="absolute inset-0 w-full h-full" loading="lazy" frameborder="0"';
    var t = esc(v.title || 'Premier Dental Academy video');
    if (v.type === 'youtube') {
      return '<iframe ' + base + ' src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.id) +
        '" title="' + t + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
    }
    if (v.type === 'vimeo') {
      return '<iframe ' + base + ' src="https://player.vimeo.com/video/' + encodeURIComponent(v.id) +
        '" title="' + t + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
    }
    if (v.type === 'drive') {
      return '<iframe ' + base + ' src="https://drive.google.com/file/d/' + encodeURIComponent(v.id) +
        '/preview" title="' + t + '" allow="autoplay" allowfullscreen></iframe>';
    }
    if (v.type === 'mp4') {
      return '<video ' + base + ' controls preload="metadata"' + (v.poster ? ' poster="' + esc(v.poster) + '"' : '') +
        '><source src="' + esc(v.src) + '" type="video/mp4" />Your browser does not support video.</video>';
    }
    return '';
  }

  function render() {
    var grid = document.getElementById('pda-video-grid');
    if (!grid) return;
    var section = document.getElementById('pda-videos-section');
    var list = (window.PDA_VIDEOS && window.PDA_VIDEOS.length) ? window.PDA_VIDEOS : VIDEOS;
    list = list.filter(function (v) { return v && v.type && (v.id || v.src); });
    if (!list.length) { if (section) section.style.display = 'none'; return; }
    grid.innerHTML = list.map(function (v) {
      return '<figure class="rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-slate-900">'
        + '<div class="relative w-full" style="aspect-ratio:16/9">' + frame(v) + '</div>'
        + (v.title ? '<figcaption class="px-4 py-3 text-sm font-semibold text-slate-700 bg-white">' + esc(v.title) + '</figcaption>' : '')
        + '</figure>';
    }).join('');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
