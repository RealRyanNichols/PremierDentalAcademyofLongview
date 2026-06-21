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
     student       -> { name, gradDate }
     attempts      -> QuizAttempt[]                 (most recent last)
     competencies  -> { [skillId]: { status, date, reflection, note } }
   Backed by: skills_lab_progress (db/migrations/20260621_skills_lab_progress.sql).
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

  function getStudent() { return get('student', { name: '', gradDate: '' }); }
  function setStudent(s) { set('student', s); }

  function getAttempts() { return get('attempts', []); }
  function saveAttempt(attempt) {
    var a = getAttempts();
    a.push(attempt);
    set('attempts', a);
    return a;
  }

  function getCompetencies() { return get('competencies', {}); }
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

  window.SL_STORE = {
    PREFIX: PREFIX,
    get: get, set: set,
    getStudent: getStudent, setStudent: setStudent,
    getAttempts: getAttempts, saveAttempt: saveAttempt,
    getCompetencies: getCompetencies, statusOf: statusOf, setCompetency: setCompetency
  };
})();
