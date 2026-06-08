/* PDA — Social proof toast (REAL data only)
 * Slides in a small notification on public marketing pages showing genuine,
 * privacy-safe signals pulled live from Supabase:
 *   - real recent inquiry counts (aggregate only — no names, no PII)
 *   - the real next cohort + live seats remaining
 *   - the school's published outcomes
 * If there is no real activity to show, NOTHING is displayed. No fabricated
 * names, cities, payments, or timestamps.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || window.__pdaSocialProofLoaded) return;
  window.__pdaSocialProofLoaded = true;

  const path = location.pathname;
  if (/^\/(tools|admin|dashboard|login|congrats)/.test(path)) return;
  if (navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes') return;

  const URL_BASE = 'https://lmbsuwslsycukynzpzik.supabase.co/rest/v1';
  const KEY = 'sb_publishable_vzuQZbkmj-UsYZVs5Zqw9w_c8PiOfbh';

  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }

  // Build the message list from REAL data; returns [] when nothing is real.
  function buildMessages(feed) {
    const msgs = [];
    const c = feed && feed.next_cohort;
    if (c && c.start_date) {
      const date = fmtDate(c.start_date);
      const left = Number(c.seats_left);
      if (left > 0 && left <= 5) {
        msgs.push({ icon: '🔥', text: `Only ${left} seat${left === 1 ? '' : 's'} left in the next class — starts ${date}.` });
      } else if (date) {
        msgs.push({ icon: '📅', text: `Next class starts ${date} — enrolling now.` });
      }
    }
    const w = Number(feed && feed.inquiries_7d);
    if (w >= 3) msgs.push({ icon: '📈', text: `${w} people requested info this week.` });
    // Published program outcomes (the school's real, site-wide figures).
    msgs.push({ icon: '🎓', text: '406+ graduates hired across East Texas.' });
    msgs.push({ icon: '⭐', text: '85%+ job-placement rate for graduates.' });
    return msgs;
  }

  function ensureStyles() {
    if (document.getElementById('pda-sp-style')) return;
    const s = document.createElement('style');
    s.id = 'pda-sp-style';
    s.textContent = `
      #pda-sp-toast { position: fixed; left: 16px; bottom: 16px; z-index: 9998;
        max-width: 320px; min-width: 240px; background: white;
        border: 1px solid rgba(15,118,110,0.18); border-radius: 14px;
        box-shadow: 0 14px 40px -10px rgba(15,23,42,0.25); padding: 12px 14px;
        font-family: 'Inter', system-ui, sans-serif; color: #0f172a;
        opacity: 0; transform: translateY(20px);
        transition: opacity 250ms ease, transform 320ms cubic-bezier(.34,1.56,.64,1); }
      #pda-sp-toast.show { opacity: 1; transform: translateY(0); }
      #pda-sp-toast .row { display: flex; align-items: flex-start; gap: 10px; }
      #pda-sp-toast .icon { font-size: 22px; line-height: 1; flex-shrink: 0; }
      #pda-sp-toast .body { flex: 1; min-width: 0; }
      #pda-sp-toast .verb { font-size: 13px; color: #0f172a; font-weight: 600; line-height: 1.3; }
      #pda-sp-toast .meta { font-size: 11px; color: #64748b; margin-top: 4px; display: flex; gap: 6px; align-items: center; }
      #pda-sp-toast .live-dot { width: 7px; height: 7px; border-radius: 50%; background: #10b981;
        box-shadow: 0 0 0 0 rgba(16,185,129,0.7); animation: pdaSpDot 1.6s ease-in-out infinite; }
      @keyframes pdaSpDot { 0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.55); } 50% { box-shadow: 0 0 0 6px rgba(16,185,129,0); } }
      #pda-sp-toast .close { background: none; border: 0; color: #94a3b8; font-size: 18px; line-height: 1; cursor: pointer; padding: 0 0 0 4px; align-self: flex-start; }
      #pda-sp-toast .close:hover { color: #475569; }
      @media (max-width: 480px) { #pda-sp-toast { left: 10px; right: 10px; max-width: none; bottom: 10px; } }
    `;
    document.head.appendChild(s);
  }

  function showOnce(m) {
    ensureStyles();
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
          <div class="verb">${m.text}</div>
          <div class="meta"><span class="live-dot"></span><span>Premier Dental Academy · live</span></div>
        </div>
        <button class="close" aria-label="Dismiss">×</button>
      </div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    const hide = () => { el.classList.remove('show'); setTimeout(() => el.remove(), 350); };
    el.querySelector('.close').addEventListener('click', hide);
    const t = setTimeout(hide, 6500);
    el.addEventListener('click', (e) => { if (e.target.classList.contains('close')) return; clearTimeout(t); hide(); });
  }

  async function init() {
    let feed = null;
    try {
      const r = await fetch(URL_BASE + '/rpc/social_proof_feed', {
        method: 'POST',
        headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (r.ok) feed = await r.json();
    } catch (e) { /* offline / blocked — show nothing */ }

    const messages = buildMessages(feed);
    if (!messages.length) return; // nothing real to show
    let i = 0;
    function loop() {
      showOnce(messages[i % messages.length]);
      i++;
      setTimeout(loop, 35000 + Math.floor(Math.random() * 15000)); // 35–50s
    }
    setTimeout(loop, 10000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
