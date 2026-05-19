/* PDA — Social proof toast
 * A small notification slides in from the bottom-left every 30–45 seconds
 * showing recent activity ("Someone in Tyler just reserved a seat", etc.)
 * to communicate that this is a live, in-demand program.
 *
 * No real names, no PII — first initial + East Texas city only.
 * Loads on every public marketing page (NOT trainers, NOT admin, NOT
 * dashboard, NOT login).
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || window.__pdaSocialProofLoaded) return;
  window.__pdaSocialProofLoaded = true;

  // Skip on private / interactive surfaces
  const path = location.pathname;
  if (/^\/(tools|admin|dashboard|login|congrats)/.test(path)) return;
  // Skip when user has set Do Not Track
  if (navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes') return;

  const CITIES = [
    'Longview', 'Tyler', 'Marshall', 'Kilgore', 'Henderson',
    'Gladewater', 'Hallsville', 'White Oak', 'Carthage',
    'Jacksonville', 'Mt. Pleasant', 'Mineola', 'Lindale',
    'Big Sandy', 'Diana', 'Pine Tree',
  ];

  const INITIALS = [
    'J.', 'A.', 'M.', 'B.', 'R.', 'D.', 'S.', 'K.', 'T.', 'L.',
    'C.', 'P.', 'E.', 'N.', 'H.', 'V.', 'Y.', 'O.',
  ];

  const TEMPLATES = [
    { icon: '💵', verb: 'just paid the $200 deposit' },
    { icon: '🎓', verb: 'reserved an In-Person seat' },
    { icon: '💻', verb: 'started Online enrollment' },
    { icon: '📞', verb: 'requested a call back' },
    { icon: '📝', verb: 'submitted an application' },
    { icon: '📅', verb: 'booked a campus tour' },
    { icon: '✉️', verb: 'sent Amanda a message' },
    { icon: '🔥', verb: 'is checking the calendar right now' },
    { icon: '👀', verb: 'is reading the salary guide' },
    { icon: '🦷', verb: 'opened the Practice Pro trainer' },
    { icon: '📥', verb: 'subscribed for class updates' },
  ];

  const minutes = () => 1 + Math.floor(Math.random() * 14); // 1–14
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function buildMessage() {
    const t = pick(TEMPLATES);
    const initial = pick(INITIALS);
    const city = pick(CITIES);
    return {
      icon: t.icon,
      headline: `${initial} from ${city}`,
      verb: t.verb,
      timeAgo: `${minutes()} min ago`,
    };
  }

  // Inject styles once
  function ensureStyles() {
    if (document.getElementById('pda-sp-style')) return;
    const s = document.createElement('style');
    s.id = 'pda-sp-style';
    s.textContent = `
      #pda-sp-toast {
        position: fixed; left: 16px; bottom: 16px; z-index: 9998;
        max-width: 320px; min-width: 240px;
        background: white;
        border: 1px solid rgba(15, 118, 110, 0.18);
        border-radius: 14px;
        box-shadow: 0 14px 40px -10px rgba(15, 23, 42, 0.25);
        padding: 12px 14px 12px 14px;
        font-family: 'Inter', system-ui, sans-serif;
        color: #0f172a;
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 250ms ease, transform 320ms cubic-bezier(.34,1.56,.64,1);
        pointer-events: auto;
      }
      #pda-sp-toast.show { opacity: 1; transform: translateY(0); }
      #pda-sp-toast .row { display: flex; align-items: flex-start; gap: 10px; }
      #pda-sp-toast .icon { font-size: 22px; line-height: 1; flex-shrink: 0; }
      #pda-sp-toast .body { flex: 1; min-width: 0; }
      #pda-sp-toast .head { font-weight: 700; font-size: 13px; color: #0f172a; line-height: 1.25; }
      #pda-sp-toast .verb { font-size: 13px; color: #334155; margin-top: 2px; line-height: 1.3; }
      #pda-sp-toast .meta { font-size: 11px; color: #64748b; margin-top: 4px; display: flex; gap: 6px; align-items: center; }
      #pda-sp-toast .live-dot {
        width: 7px; height: 7px; border-radius: 50%; background: #10b981;
        box-shadow: 0 0 0 0 rgba(16,185,129,0.7);
        animation: pdaSpDot 1.6s ease-in-out infinite;
      }
      @keyframes pdaSpDot {
        0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.55); }
        50%      { box-shadow: 0 0 0 6px rgba(16,185,129,0);    }
      }
      #pda-sp-toast .close {
        background: none; border: 0; color: #94a3b8; font-size: 18px; line-height: 1;
        cursor: pointer; padding: 0 0 0 4px; align-self: flex-start;
      }
      #pda-sp-toast .close:hover { color: #475569; }
      @media (max-width: 480px) {
        #pda-sp-toast { left: 10px; right: 10px; max-width: none; bottom: 10px; }
      }
    `;
    document.head.appendChild(s);
  }

  function showOnce() {
    const m = buildMessage();
    ensureStyles();

    // Remove any previous toast still in the DOM
    const old = document.getElementById('pda-sp-toast');
    if (old) old.remove();

    const el = document.createElement('div');
    el.id = 'pda-sp-toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = `
      <div class="row">
        <div class="icon">${m.icon}</div>
        <div class="body">
          <div class="head">${m.headline}</div>
          <div class="verb">${m.verb}</div>
          <div class="meta"><span class="live-dot"></span><span>${m.timeAgo}</span></div>
        </div>
        <button class="close" aria-label="Dismiss">×</button>
      </div>`;
    document.body.appendChild(el);

    // Animate in
    requestAnimationFrame(() => el.classList.add('show'));

    // Dismiss handlers
    const hide = () => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 350);
    };
    el.querySelector('.close').addEventListener('click', hide);

    // Auto-hide after 6 seconds
    const t = setTimeout(hide, 6000);
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('close')) return;
      clearTimeout(t);
      hide();
    });
  }

  function loop() {
    showOnce();
    const next = 30000 + Math.floor(Math.random() * 15000); // 30–45s
    setTimeout(loop, next);
  }

  // First popup after ~10 seconds so the user lands first
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(loop, 10000));
  } else {
    setTimeout(loop, 10000);
  }
})();
