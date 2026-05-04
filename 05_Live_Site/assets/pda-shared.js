/* PDA shared utilities for the trainer apps.
 * Persistence layer with localStorage fallback, common helpers,
 * SVG icon factory, and toast/dialog primitives.
 */
(function (global) {
  'use strict';

  // ── Persistence (Supabase if signed in, localStorage otherwise) ─
  const Store = {
    async load(app) {
      const session = await (global.PDA?.getSession?.() || Promise.resolve(null));
      const sb = global.PDA?.sb;
      if (sb && session) {
        const { data, error } = await sb
          .from('pp_patients')
          .select('data, updated_at')
          .eq('student_id', session.user.id)
          .eq('app', app)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!error && data?.data) return data.data;
      }
      const local = localStorage.getItem(`pda.${app}.state`);
      return local ? JSON.parse(local) : null;
    },
    async save(app, payload) {
      // Always mirror to localStorage for instant reload.
      localStorage.setItem(`pda.${app}.state`, JSON.stringify(payload));
      const session = await (global.PDA?.getSession?.() || Promise.resolve(null));
      const sb = global.PDA?.sb;
      if (sb && session) {
        // Upsert one row per (student, app)
        await sb.from('pp_patients').upsert(
          {
            student_id: session.user.id,
            app,
            data: payload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'student_id,app' }
        );
      }
    },
    async log(app, action, metadata = {}) {
      const session = await (global.PDA?.getSession?.() || Promise.resolve(null));
      const sb = global.PDA?.sb;
      if (sb && session) {
        await sb.from('pp_practice_log').insert({
          student_id: session.user.id,
          app,
          action,
          metadata,
        });
      }
      // Also keep an in-memory audit log for the session
      global.__pdaAudit = global.__pdaAudit || [];
      global.__pdaAudit.unshift({ at: new Date().toISOString(), action, metadata });
      if (global.__pdaAudit.length > 200) global.__pdaAudit.length = 200;
    },
    audit() { return global.__pdaAudit || []; },
  };

  // ── SVG Icon factory (lucide-style strokes) ──────────────────────
  const ICONS = {
    search: 'M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z',
    plus: 'M12 5v14M5 12h14',
    user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M16 7a4 4 0 11-8 0 4 4 0 018 0z',
    users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M13 7a4 4 0 11-8 0 4 4 0 018 0zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
    calendar: 'M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zM16 2v4M8 2v4',
    file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6',
    chart: 'M3 3v18h18M7 16V9M11 16V5M15 16v-7M19 16v-3',
    clipboard: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
    settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
    bell: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
    check: 'M5 12l5 5L20 7',
    x: 'M18 6L6 18M6 6l12 12',
    chevronDown: 'M6 9l6 6 6-6',
    chevronRight: 'M9 18l6-6-6-6',
    edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z',
    trash: 'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
    print: 'M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z',
    download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
    alert: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
    clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
    home: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10',
    message: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
    phone: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z',
    grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
    list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    dollar: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
    image: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M3 5a2 2 0 012-2h14a2 2 0 012 2v10l-5-5-7 7-3-3z',
    refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
    save: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8',
    command: 'M18 3a3 3 0 00-3 3v12a3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3H6a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3V6a3 3 0 00-3-3 3 3 0 00-3 3 3 3 0 003 3h12a3 3 0 003-3 3 3 0 00-3-3z',
    star: 'M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z',
    info: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 16v-4M12 8h.01',
    book: 'M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z',
    layers: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    play: 'M5 3l14 9-14 9z',
    move: 'M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20',
  };

  function svgIcon(name, opts = {}) {
    const path = ICONS[name];
    if (!path) return '';
    const size = opts.size || 16;
    const cls = opts.class || '';
    const strokeW = opts.strokeWidth || 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round" class="${cls}" aria-hidden="true">${path.split(/(?=[A-Z][a-z])/).map(p => p).join('')}<path d="${path}"/></svg>`;
  }

  // ── Helpers ──────────────────────────────────────────────────────
  const fmt = {
    money: (n) => '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    date: (d) => {
      if (!d) return '—';
      const dt = typeof d === 'string' ? new Date(d) : d;
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },
    dateShort: (d) => {
      if (!d) return '—';
      const dt = typeof d === 'string' ? new Date(d) : d;
      return dt.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
    },
    age: (dob) => {
      if (!dob) return '—';
      const b = new Date(dob);
      const now = new Date('2026-05-04');
      let a = now.getFullYear() - b.getFullYear();
      const m = now.getMonth() - b.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
      return a;
    },
    phone: (p) => p || '—',
  };

  function uid(prefix = 'id') {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function debounce(fn, ms = 250) {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ── Avatar (Dicebear initials) ───────────────────────────────────
  function avatarUrl(seed) {
    const s = encodeURIComponent(seed || 'patient');
    return `https://api.dicebear.com/9.x/initials/svg?seed=${s}&backgroundColor=0f766e,0d9488,0891b2,0e7490,115e59&fontFamily=Inter`;
  }

  // ── Toast ────────────────────────────────────────────────────────
  function toast(msg, opts = {}) {
    let host = document.getElementById('pda-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'pda-toast-host';
      host.className = 'fixed bottom-4 right-4 z-[10000] flex flex-col gap-2 pointer-events-none';
      document.body.appendChild(host);
    }
    const el = document.createElement('div');
    const tone = opts.tone || 'info';
    const toneClass = ({
      info:    'bg-slate-900 text-white border-slate-700',
      success: 'bg-emerald-600 text-white border-emerald-700',
      warn:    'bg-amber-500 text-slate-900 border-amber-600',
      error:   'bg-rose-600 text-white border-rose-700',
    })[tone];
    el.className = `pointer-events-auto px-3 py-2 rounded shadow-lg text-sm border ${toneClass} animate-[slidein_.18s_ease-out]`;
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .25s'; setTimeout(() => el.remove(), 260); }, opts.ms || 2400);
  }

  // ── PDF (lazy-load html2pdf via CDN) ─────────────────────────────
  async function ensureHtml2Pdf() {
    if (global.html2pdf) return global.html2pdf;
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      s.onload = () => res(global.html2pdf);
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  async function exportPDF(html, filename) {
    const html2pdf = await ensureHtml2Pdf();
    const wrap = document.createElement('div');
    wrap.style.padding = '24px';
    wrap.style.fontFamily = 'Inter, system-ui, sans-serif';
    wrap.innerHTML = html;
    document.body.appendChild(wrap);
    try {
      await html2pdf().set({
        margin: [12, 12, 12, 12],
        filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
      }).from(wrap).save();
    } finally {
      wrap.remove();
    }
  }

  // ── Coverage (insurance estimate) ────────────────────────────────
  function patientPortion(line, codes, coverage) {
    const code = codes.find(c => c.code === line.code);
    if (!code) return Number(line.fee) || 0;
    const pct = (coverage[code.cat] != null) ? coverage[code.cat] : 0.8;
    return Math.round((Number(line.fee) || 0) * (1 - pct) * 100) / 100;
  }

  // ── Tooth surface helpers ────────────────────────────────────────
  // Universal numbering 1-32 (perm), A-T (primary)
  const PERM_TEETH = Array.from({ length: 32 }, (_, i) => i + 1);
  const PRIMARY_TEETH = ['A','B','C','D','E','F','G','H','I','J','T','S','R','Q','P','O','N','M','L','K'];
  const SURFACES = ['M','O','D','B','L']; // mesial / occlusal/incisal / distal / buccal-facial / lingual

  // Surface palette
  const SURFACE_COLORS = {
    composite: '#0d9488',
    amalgam:   '#475569',
    caries:    '#ef4444',
    sealant:   '#a3e635',
    crown:     '#fbbf24',
    rct:       '#9333ea',
    missing:   '#1e293b',
    implant:   '#0ea5e9',
    watch:     '#f97316',
    fracture:  '#be185d',
    veneer:    '#22d3ee',
  };

  global.PDA_SHARED = {
    Store, ICONS, svgIcon, fmt, uid, debounce, escapeHtml, avatarUrl,
    toast, exportPDF, ensureHtml2Pdf, patientPortion,
    PERM_TEETH, PRIMARY_TEETH, SURFACES, SURFACE_COLORS,
  };
})(window);
