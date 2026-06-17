/* PDA shared auth shim
 * Exposes window.PDA with Supabase client and helper methods.
 * If the Supabase library isn't available (e.g. offline preview),
 * falls back to anonymous mode where data persists to localStorage.
 */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://lmbsuwslsycukynzpzik.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_vzuQZbkmj-UsYZVs5Zqw9w_c8PiOfbh';

  let sb = null;
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true },
      });
    } catch (e) {
      console.warn('[PDA] Supabase init failed:', e.message);
    }
  }

  async function getSession() {
    if (!sb) return null;
    try {
      const { data } = await sb.auth.getSession();
      return data?.session || null;
    } catch (e) {
      return null;
    }
  }

  async function requireAuth(redirect) {
    const session = await getSession();
    if (!session) {
      // Anonymous (demo) mode — don't redirect, just continue.
      // Data will fall back to localStorage.
      console.info('[PDA] Running in anonymous mode (no auth session).');
      return null;
    }
    return session;
  }

  async function getProfile() {
    const session = await getSession();
    if (!session || !sb) {
      return { id: 'demo', first_name: 'Student', last_name: 'Demo', email: 'demo@pda.local' };
    }
    const { data } = await sb
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    return data || { id: session.user.id, first_name: 'Student', last_name: '', email: session.user.email };
  }

  async function signOut() {
    if (sb) await sb.auth.signOut();
    location.href = '/login.html';
  }

  window.PDA = {
    sb,
    getSession,
    requireAuth,
    getProfile,
    signOut,
    SUPABASE_URL,
    SUPABASE_KEY,
  };
})();
