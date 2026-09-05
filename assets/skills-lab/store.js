/* ============================================================================
   SKILLS LAB · STORE (the single seam to swap for a real backend)
   ----------------------------------------------------------------------------
   All student reads/writes go through window.SL_STORE. localStorage is the
   synchronous, offline-friendly source of truth the UI reads.

   Cross-device sync is layered on top by assets/skills-lab/sync.js (loaded on
   every Skills Lab page): for a SIGNED-IN student it merges this localStorage
   state with their `skills_lab_progress` row in Supabase and writes through on
   every change. It hooks localStorage.setItem, so this store needs no changes —
   keep writing to localStorage and sync.js handles the backend.

   localStorage shape (keys prefixed "pda_skillslab_"):
     student       -> { name }
     attempts      -> Attempt[]                     (most recent last)
                      { id, kind:'quiz'|'scenario'|'tray'|'shift', date,
                        category, score, correct, total, byCategory,
                        missed?, anticipation?, avgSec?, remediation?, summary? }
     competencies  -> { [skillId]: { status, date, reflection, note } }
                      status is SELF-REPORTED: not_started | practicing | completed
     verified      -> READ-ONLY MIRROR of skills_lab_progress.verified
                      { [skillId]: { by_name, at, note } } — written only by
                      sync.js from the database (teachers set it via the
                      verify_skill RPC). Students cannot write it; anything this
                      page writes to the key is ignored by the server.
   Backed by: skills_lab_progress (db/migrations/20260621_skills_lab_progress.sql
   + 20260905_instructor_visibility_and_skills_verification.sql).
   ============================================================================ */
(function () {
  'use strict';
  var PREFIX = 'pda_skillslab_';

  function get(key, fallback) {
    try { var raw = localStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { console.warn('SL_STORE.get failed:', key, e); return fallback; }
  }
  function set(key, val) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); }
    catch (e) { console.warn('SL_STORE.set failed:', key, e); }
  }

  /* ---- ids ----
     Every attempt needs a STABLE id: sync.js merges local + remote attempts by
     id, so an id-less attempt would be dropped the moment two devices merge. */
  function newId() {
    try { if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID(); } catch (e) {}
    return 'a_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
  }
  // Deterministic id for a legacy (id-less) attempt: the same attempt saved on
  // two devices hashes to the same id, so the merge de-duplicates it.
  function legacyId(a) {
    var s = [a.date, a.category, a.score, a.correct, a.total].map(function (v) { return String(v == null ? '' : v); }).join('|');
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return 'legacy_' + (h >>> 0).toString(36) + '_' + s.length.toString(36);
  }
  function ensureIds(list) {
    var changed = false;
    var out = (Array.isArray(list) ? list : []).filter(function (a) { return a && typeof a === 'object'; }).map(function (a) {
      if (a.id == null || a.id === '') { changed = true; a.id = legacyId(a); }
      return a;
    });
    return { list: out, changed: changed };
  }

  function getStudent() { var s = get('student', { name: '' }); return s && typeof s === 'object' ? s : { name: '' }; }
  function setStudent(s) { set('student', s); }

  function getAttempts() {
    var r = ensureIds(get('attempts', []));
    return r.list;
  }
  function saveAttempt(attempt) {
    var a = getAttempts();
    if (attempt && (attempt.id == null || attempt.id === '')) attempt.id = newId();
    if (attempt && !attempt.date) attempt.date = new Date().toISOString();
    a.push(attempt);
    set('attempts', a);
    return a;
  }
  // Replace an attempt with the same id (used by activities that re-grade in
  // place, e.g. checking a tray several times in one sitting), else append.
  function upsertAttempt(attempt) {
    var a = getAttempts();
    if (attempt && (attempt.id == null || attempt.id === '')) attempt.id = newId();
    if (attempt && !attempt.date) attempt.date = new Date().toISOString();
    var hit = -1;
    for (var i = 0; i < a.length; i++) { if (a[i].id === attempt.id) { hit = i; break; } }
    if (hit >= 0) a[hit] = attempt; else a.push(attempt);
    set('attempts', a);
    return a;
  }

  function getCompetencies() { var c = get('competencies', {}); return c && typeof c === 'object' ? c : {}; }
  function statusOf(id) { var c = getCompetencies()[id]; return c ? c.status : 'not_started'; }
  function setCompetency(id, status, patch) {
    var all = getCompetencies();
    var cur = all[id] || { status: 'not_started', date: null, reflection: '', note: '' };
    cur.status = status;
    cur.date = new Date().toISOString();
    if (patch) { Object.keys(patch).forEach(function (k) { cur[k] = patch[k]; }); }
    all[id] = cur;
    set('competencies', all);
    return all;
  }
  // Only ever move a skill FORWARD (not_started → practicing → completed); a
  // low score never demotes a skill the student already completed.
  var RANK = { not_started: 0, practicing: 1, completed: 2, verified: 2 };
  function upgradeCompetency(id, status, patch) {
    var cur = statusOf(id);
    if ((RANK[status] || 0) <= (RANK[cur] || 0)) return false;
    setCompetency(id, status, patch);
    return true;
  }

  /* ---- instructor verification (read-only mirror) ---- */
  function getVerified() {
    var v = get('verified', {});
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  }
  function isVerified(id) { return !!getVerified()[id]; }

  // One-time migration: give legacy id-less attempts stable ids so nothing is
  // lost when sync.js merges with the student's saved row.
  (function migrate() {
    try {
      var raw = get('attempts', null);
      if (!Array.isArray(raw)) return;
      var r = ensureIds(raw);
      if (r.changed || r.list.length !== raw.length) set('attempts', r.list);
    } catch (e) { /* never block the page */ }
  })();

  window.SL_STORE = {
    PREFIX: PREFIX,
    get: get, set: set,
    newId: newId, legacyId: legacyId,
    getStudent: getStudent, setStudent: setStudent,
    getAttempts: getAttempts, saveAttempt: saveAttempt, upsertAttempt: upsertAttempt,
    getCompetencies: getCompetencies, statusOf: statusOf, setCompetency: setCompetency, upgradeCompetency: upgradeCompetency,
    getVerified: getVerified, isVerified: isVerified
  };
})();
