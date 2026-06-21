/* ============================================================================
   SKILLS LAB · CROSS-DEVICE SYNC
   ----------------------------------------------------------------------------
   Skills Lab progress (student profile, quiz attempts, competency passport)
   lives in localStorage (keys prefixed "pda_skillslab_") for instant, offline-
   friendly reads — see store.js and the inline store in skills-lab/index.html.
   This module adds a write-through to Supabase so a SIGNED-IN student's progress
   follows them to any device:

     • On load, if there's a session, it fetches the student's
       `skills_lab_progress` row and MERGES it with whatever is in localStorage
       (union of quiz attempts, most-advanced competency status) — so opening a
       second device never loses progress in either direction.
     • It then writes the merged state back to BOTH localStorage and Supabase.
     • Thereafter, any write to a "pda_skillslab_" localStorage key schedules a
       debounced upsert of the full state. It catches BOTH store implementations
       by wrapping localStorage.setItem, so no store code had to change.

   Design rules:
     • localStorage stays the source of truth the UI reads synchronously.
     • Signed-out / preview visitors are unaffected (no session → no network).
     • Every Supabase call is best-effort and swallowed — sync can never break
       the tool or block the page.

   Backing table (db/migrations/20260621_skills_lab_progress.sql):
     skills_lab_progress(student_id PK, student jsonb, attempts jsonb,
                         competencies jsonb, updated_at) with student-owned RLS.
   ============================================================================ */
(function () {
  'use strict';

  var PREFIX = 'pda_skillslab_';
  var SUPABASE_URL = 'https://lmbsuwslsycukynzpzik.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_vzuQZbkmj-UsYZVs5Zqw9w_c8PiOfbh';
  var TABLE = 'skills_lab_progress';
  var DEBOUNCE_MS = 1500;

  // Keep the genuine setItem so hydration writes don't recursively schedule a sync.
  var _setItem = window.localStorage && window.localStorage.setItem.bind(window.localStorage);

  var sb = null;
  var userId = null;
  var saveTimer = null;
  var ready = false;

  function readLocal(key, fallback) {
    try { var raw = localStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function writeLocalRaw(key, val) {
    try { _setItem(PREFIX + key, JSON.stringify(val)); } catch (e) {}
  }
  function currentState() {
    return {
      student: readLocal('student', { name: '', gradDate: '' }),
      attempts: readLocal('attempts', []),
      competencies: readLocal('competencies', {}),
    };
  }

  // ── merge helpers (never lose progress) ──────────────────────────────────
  var RANK = { not_started: 0, practicing: 1, completed: 2, verified: 3 };

  function mergeStudent(local, remote) {
    local = local || {}; remote = remote || {};
    return {
      name: local.name || remote.name || '',
      gradDate: local.gradDate || remote.gradDate || '',
    };
  }
  function mergeAttempts(local, remote) {
    var byId = {};
    (Array.isArray(remote) ? remote : []).forEach(function (a) { if (a && a.id != null) byId[a.id] = a; });
    (Array.isArray(local) ? local : []).forEach(function (a) { if (a && a.id != null) byId[a.id] = a; });
    var all = Object.keys(byId).map(function (k) { return byId[k]; });
    all.sort(function (x, y) { return String(x.date || '').localeCompare(String(y.date || '')); }); // oldest→newest
    return all;
  }
  function mergeCompetencies(local, remote) {
    local = local || {}; remote = remote || {};
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

  async function upsert(state) {
    if (!sb || !userId) return;
    try {
      await sb.from(TABLE).upsert({
        student_id: userId,
        student: state.student,
        attempts: state.attempts,
        competencies: state.competencies,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id' });
    } catch (e) { /* best-effort */ }
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
    if (!_setItem || localStorage.setItem.__plsWrapped) return;
    var wrapped = function (k, v) {
      _setItem(k, v);
      try { if (typeof k === 'string' && k.indexOf(PREFIX) === 0) scheduleUpsert(); } catch (e) {}
    };
    wrapped.__plsWrapped = true;
    try { localStorage.setItem = wrapped; } catch (e) {}
  }

  async function hydrate() {
    try {
      var session = (await sb.auth.getSession()).data.session;
      if (!session || !session.user) return;          // signed out → local-only
      userId = session.user.id;

      var remote = null;
      try {
        remote = (await sb.from(TABLE).select('student, attempts, competencies')
          .eq('student_id', userId).maybeSingle()).data;
      } catch (e) { remote = null; }

      var local = currentState();
      var merged = {
        student: mergeStudent(local.student, remote && remote.student),
        attempts: mergeAttempts(local.attempts, remote && remote.attempts),
        competencies: mergeCompetencies(local.competencies, remote && remote.competencies),
      };

      // Write the merged result to localStorage (raw, so we don't loop), then
      // push it back so both sides converge.
      writeLocalRaw('student', merged.student);
      writeLocalRaw('attempts', merged.attempts);
      writeLocalRaw('competencies', merged.competencies);
      await upsert(merged);

      ready = true;
      try { window.dispatchEvent(new CustomEvent('sl-sync:hydrated', { detail: merged })); } catch (e) {}
    } catch (e) { /* stay local-only on any failure */ }
  }

  function init() {
    if (!window.supabase || !window.supabase.createClient) return;
    try { sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); } catch (e) { return; }
    installWriteThrough();   // catch writes even before the session resolves
    hydrate();               // the final hydrate upsert captures any early writes
  }

  // Self-bootstrap: ensure the Supabase SDK is present, then init. Pages that
  // already load the SDK skip the injection.
  function ensureSDK(cb) {
    if (window.supabase && window.supabase.createClient) return cb();
    var existing = document.querySelector('script[data-pda-supabase]');
    if (existing) { existing.addEventListener('load', cb); existing.addEventListener('error', function () {}); return; }
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.setAttribute('data-pda-supabase', '1');
    s.onload = cb;
    s.onerror = function () { /* offline / blocked → local-only */ };
    document.head.appendChild(s);
  }

  window.SL_SYNC = {
    flush: function () { if (saveTimer) clearTimeout(saveTimer); return upsert(currentState()); },
    isReady: function () { return ready; },
  };

  ensureSDK(init);
})();
