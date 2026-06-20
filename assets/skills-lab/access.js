/* PDA shared access gate (load BEFORE the inline page scripts that use it).
 *
 * Decides whether the current visitor is an enrolled STUDENT (full access)
 * or a prospect (PREVIEW). Enrolled = admin, OR enrolled_at is set, OR the
 * profile has a real (non-'preview') program. Free 'preview' signups and
 * signed-out visitors get the preview, so the tools double as a conversion
 * teaser while paid students keep full access.
 *
 * This is the single source of truth for "is this person paid?" so every
 * tool gates the same way. Uses the same refresh-and-retry pattern the admin
 * pages use, so a stale access token doesn't wrongly demote a real student.
 *
 *   window.PDA_ACCESS.get().then(function (access) {  // 'student' | 'preview'
 *     ...
 *   });
 */
(function () {
  'use strict';
  var SUPABASE_URL = 'https://lmbsuwslsycukynzpzik.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_vzuQZbkmj-UsYZVs5Zqw9w_c8PiOfbh';
  var cached = null, pending = null;

  function isEnrolled(profile, session) {
    if (!session) return false;
    // Admin claim in the JWT survives a DB-read failure.
    if (session.user && session.user.app_metadata && session.user.app_metadata.is_admin === true) return true;
    if (!profile) return false;
    if (profile.is_admin === true) return true;
    if (profile.enrolled_at) return true;
    var p = (profile.program || '').toLowerCase();
    return !!(p && p !== 'preview');
  }

  function resolve() {
    if (cached) return Promise.resolve(cached);
    if (pending) return pending;
    pending = (async function () {
      var access = 'preview';
      try {
        if (window.supabase && window.supabase.createClient) {
          var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
          var session = (await sb.auth.getSession()).data.session;
          if (session) {
            var cols = 'is_admin, program, enrolled_at';
            var prof = (await sb.from('profiles').select(cols).eq('id', session.user.id).maybeSingle()).data;
            if (!prof) {
              try { await sb.auth.refreshSession(); } catch (e) {}
              prof = (await sb.from('profiles').select(cols).eq('id', session.user.id).maybeSingle()).data;
            }
            access = isEnrolled(prof, session) ? 'student' : 'preview';
          }
        }
      } catch (e) { /* default to preview on any failure */ }
      cached = access;
      return access;
    })();
    return pending;
  }

  window.PDA_ACCESS = {
    get: resolve,
    cached: function () { return cached; }
  };
})();
