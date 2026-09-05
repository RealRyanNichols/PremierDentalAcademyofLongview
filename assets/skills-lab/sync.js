/* ============================================================================
   SKILLS LAB · CROSS-DEVICE SYNC
   ----------------------------------------------------------------------------
   Skills Lab progress (student profile, attempts, competency passport) lives in
   localStorage (keys prefixed "pda_skillslab_") for instant, offline-friendly
   reads — see store.js. This module adds a write-through to Supabase so a
   SIGNED-IN student's progress follows them to any device:

     • On load, if there's a session, it fetches the student's
       `skills_lab_progress` row and MERGES it with whatever is in localStorage
       (union of attempts by id, most-advanced competency status) — so opening
       a second device never loses progress in either direction.
     • It then writes the merged state back to BOTH localStorage and Supabase.
     • Thereafter, any write to a "pda_skillslab_" localStorage key schedules a
       debounced upsert of the full state. It catches every store write by
       wrapping localStorage.setItem, so no store code had to change.
     • The row's `verified` column (instructor sign-off, written by teachers
       through the verify_skill RPC) is READ here and mirrored to localStorage
       for the UI. It is NEVER included in the upsert — the database trigger
       would discard it anyway, and students must not be able to write it.

   Design rules:
     • localStorage stays the source of truth the UI reads synchronously.
     • Signed-out / preview visitors are unaffected (no session → no network).
     • Every Supabase call is best-effort and swallowed — sync can never break
       the tool or block the page.

   Backing table (db/migrations/20260621_skills_lab_progress.sql +
   20260905_instructor_visibility_and_skills_verification.sql):
     skills_lab_progress(student_id PK, student jsonb, attempts jsonb,
                         competencies jsonb, verified jsonb, updated_at)
   ============================================================================ */
(function () {
  'use strict';

  var PREFIX = 'pda_skillslab_';
  var SUPABASE_URL = 'https://lmbsuwslsycukynzpzik.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_vzuQZbkmj-UsYZVs5Zqw9w_c8PiOfbh';
  var TABLE = 'skills_lab_progress';
  var DEBOUNCE_MS = 1500;

  // Keep the genuine setItem so hydration writes don't recursively schedule a sync.
  var _setItem = null;
  try { _setItem = window.localStorage && window.localStorage.setItem.bind(window.localStorage); } catch (e) { _setItem = null; }

  var sb = null;
  var userId = null;
  var saveTimer = null;
  var ready = false;
  var status = 'idle';   // idle | local | syncing | synced | error

  function readLocal(key, fallback) {
    try { var raw = localStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function writeLocalRaw(key, val) {
    try { if (_setItem) _setItem(PREFIX + key, JSON.stringify(val)); } catch (e) {}
  }
  function currentState() {
    return {
      student: readLocal('student', { name: '' }),
      attempts: readLocal('attempts', []),
      competencies: readLocal('competencies', {}),
    };
  }

  // Same deterministic id as store.js so a legacy (id-less) attempt saved on
  // two devices collapses to one row instead of being dropped.
  function legacyId(a) {
    if (window.SL_STORE && typeof window.SL_STORE.legacyId === 'function') return window.SL_STORE.legacyId(a);
    var s = [a.date, a.category, a.score, a.correct, a.total].map(function (v) { return String(v == null ? '' : v); }).join('|');
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return 'legacy_' + (h >>> 0).toString(36) + '_' + s.length.toString(36);
  }

  // ── merge helpers (never lose progress) ──────────────────────────────────
  var RANK = { not_started: 0, practicing: 1, completed: 2, verified: 2 };

  function mergeStudent(local, remote) {
    local = local || {}; remote = remote || {};
    return { name: local.name || remote.name || '' };
  }
  function mergeAttempts(local, remote) {
    var byId = {};
    function take(list) {
      (Array.isArray(list) ? list : []).forEach(function (a) {
        if (!a || typeof a !== 'object') return;
        if (a.id == null || a.id === '') a.id = legacyId(a);
        byId[a.id] = a;
      });
    }
    take(remote);
    take(local);   // local wins on the same id (it is the copy this device just wrote)
    var all = Object.keys(byId).map(function (k) { return byId[k]; });
    all.sort(function (x, y) { return String(x.date || '').localeCompare(String(y.date || '')); }); // oldest→newest
    return all;
  }
  function mergeCompetencies(local, remote) {
    local = (local && typeof local === 'object') ? local : {};
    remote = (remote && typeof remote === 'object') ? remote : {};
    var out = {};
    Object.keys(remote).concat(Object.keys(local)).forEach(function (id) {
      if (out[id]) return;
      var l = local[id], r = remote[id];
      if (!l) { out[id] = r; return; }
      if (!r) { out[id] = l; return; }
      var lr = RANK[l.status] || 0, rr = RANK[r.status] || 0;
      if (lr > rr) out[id] = l;
      else if (rr > lr) out[id] = r;
      else out[id] = String(l.date || '') >= String(r.date || '') ? l : r; // tie → later
    });
    return out;
  }

  // NOTE: the payload deliberately has NO `verified` key. Instructor sign-off
  // is owned by staff (verify_skill RPC); a student upsert must never touch it.
  async function upsert(state) {
    if (!sb || !userId) return;
    status = 'syncing';
    try {
      var res = await sb.from(TABLE).upsert({
        student_id: userId,
        student: state.student,
        attempts: state.attempts,
        competencies: state.competencies,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id' });
      status = (res && res.error) ? 'error' : 'synced';
    } catch (e) { status = 'error'; }
  }

  function scheduleUpsert() {
    if (!userId) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { upsert(currentState()); }, DEBOUNCE_MS);
  }

  // Wrap localStorage.setItem ONCE so every write to our keys triggers a sync,
  // regardless of which store object made it. The original is always called
  // first, so localStorage behaviour is unchanged for everyone.
  function installWriteThrough() {
    try {
      if (!_setItem || localStorage.setItem.__plsWrapped) return;
      var wrapped = function (k, v) {
        _setItem(k, v);
        try { if (typeof k === 'string' && k.indexOf(PREFIX) === 0 && k !== PREFIX + 'verified') scheduleUpsert(); } catch (e) {}
      };
      wrapped.__plsWrapped = true;
      localStorage.setItem = wrapped;
    } catch (e) {}
  }

  async function hydrate() {
    try {
      var session = (await sb.auth.getSession()).data.session;
      if (!session || !session.user) {
        // Signed out → local-only. Instructor sign-off belongs to an account,
        // so never show a stale copy on a shared device.
        writeLocalRaw('verified', {});
        status = 'local';
        return;
      }
      userId = session.user.id;

      var remote = null, readOk = false;
      try {
        var r = await sb.from(TABLE).select('student, attempts, competencies, verified').eq('student_id', userId).maybeSingle();
        if (r && !r.error) { remote = r.data; readOk = true; }
      } catch (e) { remote = null; }

      var local = currentState();
      var merged = {
        student: mergeStudent(local.student, remote && remote.student),
        attempts: mergeAttempts(local.attempts, remote && remote.attempts),
        competencies: mergeCompetencies(local.competencies, remote && remote.competencies),
      };
      var verified = (remote && remote.verified && typeof remote.verified === 'object' && !Array.isArray(remote.verified)) ? remote.verified : {};

      // Write the merged result to localStorage (raw, so we don't loop), then
      // push it back so both sides converge. `verified` is mirrored only.
      writeLocalRaw('student', merged.student);
      writeLocalRaw('attempts', merged.attempts);
      writeLocalRaw('competencies', merged.competencies);
      if (readOk) writeLocalRaw('verified', verified);
      await upsert(merged);

      ready = true;
      try { window.dispatchEvent(new CustomEvent('sl-sync:hydrated', { detail: { student: merged.student, attempts: merged.attempts, competencies: merged.competencies, verified: verified, readOk: readOk } })); } catch (e) {}
    } catch (e) { status = 'error'; /* stay local-only on any failure */ }
  }

  function init() {
    if (!window.supabase || !window.supabase.createClient) { status = 'local'; return; }
    try { sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); } catch (e) { status = 'local'; return; }
    installWriteThrough();   // catch writes even before the session resolves
    hydrate();               // the final hydrate upsert captures any early writes
  }

  // Self-bootstrap: ensure the Supabase SDK is present, then init. Pages that
  // already load the SDK skip the injection.
  function ensureSDK(cb) {
    if (window.supabase && window.supabase.createClient) return cb();
    var existing = document.querySelector('script[data-pda-supabase]');
    if (existing) { existing.addEventListener('load', cb); existing.addEventListener('error', function () { status = 'local'; }); return; }
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.setAttribute('data-pda-supabase', '1');
    s.onload = cb;
    s.onerror = function () { status = 'local'; /* offline / blocked → local-only */ };
    document.head.appendChild(s);
  }

  window.SL_SYNC = {
    flush: function () { if (saveTimer) clearTimeout(saveTimer); return upsert(currentState()); },
    isReady: function () { return ready; },
    status: function () { return status; },
    userId: function () { return userId; }
  };

  ensureSDK(init);
})();
