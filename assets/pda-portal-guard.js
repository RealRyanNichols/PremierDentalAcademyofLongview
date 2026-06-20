/* PDA Portal Guard — gate a page to ENROLLED members only.
 * ---------------------------------------------------------
 * Usage on any member-only page:
 *
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="/assets/pda-portal-guard.js"></script>
 *   <script>
 *     PDAPortal.requireEnrolled().then(access => {
 *       // access = { enrolled, program, portal_status, is_admin, email }
 *       document.body.classList.add('pda-ready');
 *     });
 *   </script>
 *
 * "Enrolled" is decided server-side by the my_portal_access() RPC (a real
 * program, or staff/admin, AND portal_status='active'). The client can't spoof
 * it. Not signed in → /login. Signed in but not enrolled → /enroll.
 *
 * NOTE: this is opt-in per page. It does NOT change the public preview trainers,
 * which intentionally let prospects try the tools logged-out.
 */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://lmbsuwslsycukynzpzik.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_vzuQZbkmj-UsYZVs5Zqw9w_c8PiOfbh';

  function client() {
    if (window.PDA && window.PDA.sb) return window.PDA.sb;
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true },
      });
    }
    return null;
  }

  function go(path) { location.href = path; }

  async function getAccess() {
    const sb = client();
    if (!sb) return { ok: false, reason: 'no-supabase' };

    let { data: sessData } = await sb.auth.getSession();
    let session = sessData && sessData.session;
    // getSession() can hand back an expired token; refresh once before trusting it.
    if (session) {
      const nearExpiry = !session.expires_at || (session.expires_at * 1000 < Date.now() + 60000);
      if (nearExpiry) { try { const r = await sb.auth.refreshSession(); if (r && r.data && r.data.session) session = r.data.session; } catch (e) {} }
    }
    if (!session) return { ok: false, reason: 'no-session' };

    // Server-side truth.
    let enrolled = false, program = null, portal_status = 'active', is_admin = false;
    try {
      const { data } = await sb.rpc('my_portal_access');
      const row = Array.isArray(data) ? data[0] : data;
      if (row) { enrolled = !!row.enrolled; program = row.program; portal_status = row.portal_status; is_admin = !!row.is_admin; }
    } catch (e) {
      // RPC missing / network — fall back to the JWT admin claim + a profile read.
      is_admin = !!(session.user && session.user.app_metadata && session.user.app_metadata.is_admin);
      try {
        const { data: p } = await sb.from('profiles').select('program,portal_status,is_admin').eq('id', session.user.id).maybeSingle();
        if (p) {
          is_admin = is_admin || p.is_admin === true;
          program = p.program;
          portal_status = p.portal_status || 'active';
          enrolled = (is_admin || (p.program && p.program !== 'preview')) && portal_status === 'active';
        }
      } catch (_) {}
    }
    return { ok: true, enrolled, program, portal_status, is_admin, email: session.user.email, session };
  }

  // Resolve only if enrolled; otherwise redirect. `opts.onDenied` can override.
  async function requireEnrolled(opts) {
    opts = opts || {};
    const a = await getAccess();
    if (!a.ok || !a.session) { go(opts.loginPath || '/login'); return new Promise(function () {}); }
    if (!a.enrolled) {
      if (typeof opts.onDenied === 'function') { opts.onDenied(a); return new Promise(function () {}); }
      if (a.portal_status === 'suspended') { go(opts.suspendedPath || '/dashboard'); return new Promise(function () {}); }
      go(opts.enrollPath || '/enroll'); return new Promise(function () {});
    }
    return a;
  }

  window.PDAPortal = { requireEnrolled, getAccess, SUPABASE_URL, SUPABASE_KEY };
})();
