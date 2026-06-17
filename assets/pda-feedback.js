/* PDA — live student feedback widget.
 * Mounts into #pda-feedback-mount on the dashboard (signed-in students only).
 * Shows a rotating weekly "pulse" question (emoji rating + optional comment)
 * plus an always-available "suggest an improvement" box. Responses go to the
 * public.student_feedback table; the school reads them live at /admin/feedback.
 */
(function () {
  'use strict';
  var mount = document.getElementById('pda-feedback-mount');
  if (!mount || !window.supabase) return;

  var SUPABASE_URL = 'https://lmbsuwslsycukynzpzik.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_vzuQZbkmj-UsYZVs5Zqw9w_c8PiOfbh';
  var sb;
  try { sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); } catch (e) { return; }

  var PROMPTS = [
    "How's your PDA experience this week?",
    "How confident do you feel about the Texas RDA exam right now?",
    "How helpful were the practice trainers this week?",
    "How supported do you feel by your instructors?",
    "How's the pace of the program feeling?",
    "How likely are you to recommend PDA to a friend?"
  ];
  function weekNum() { var d = new Date(); var j = new Date(d.getFullYear(), 0, 1); return Math.ceil((((d - j) / 86400000) + j.getDay() + 1) / 7); }
  function weekKey() { return new Date().getFullYear() + '-W' + weekNum(); }
  var prompt = PROMPTS[weekNum() % PROMPTS.length];
  var EMOJI = [['1', '😣'], ['2', '😕'], ['3', '😐'], ['4', '🙂'], ['5', '😍']];
  var rating = 0;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  (async function () {
    var session;
    try { session = (await sb.auth.getSession()).data.session; } catch (e) { return; }
    if (!session) return; // students only
    var doneKey = 'pda.feedback.' + weekKey();
    var pulsed = false;
    try { pulsed = !!localStorage.getItem(doneKey); } catch (e) {}
    render(pulsed);

    function render(thanks) {
      mount.innerHTML =
        '<section class="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">'
        + '<div class="flex items-center gap-2 mb-1"><span class="text-lg">💬</span>'
        + '<h2 class="display text-xl font-bold">Your voice builds PDA</h2>'
        + '<span class="ml-auto text-[10px] uppercase tracking-widest text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full">~30 sec</span></div>'
        + (thanks
          ? '<p class="text-sm text-slate-600">Thanks for your pulse this week! 🙌 Got more to say? Use the box below anytime.</p>'
          : '<p class="text-sm text-slate-700 mb-3">' + esc(prompt) + '</p>'
            + '<div id="fb-rate" class="flex gap-2 mb-3">' + EMOJI.map(function (e) { return '<button type="button" data-r="' + e[0] + '" class="w-11 h-11 rounded-xl border border-slate-200 text-xl hover:border-teal-500 hover:bg-teal-50">' + e[1] + '</button>'; }).join('') + '</div>'
            + '<textarea id="fb-comment" rows="2" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-teal-600" placeholder="Anything you want us to know? (optional)"></textarea>'
            + '<button id="fb-submit" class="mt-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm px-4 py-2 rounded-lg disabled:opacity-50" disabled>Send pulse</button>')
        + '<div class="mt-4 pt-3 border-t border-slate-100">'
        + '<button id="fb-suggest-toggle" class="text-sm font-semibold text-teal-700 hover:text-teal-900">💡 Suggest an improvement or request a feature</button>'
        + '<div id="fb-suggest-box" class="hidden mt-2"><textarea id="fb-suggestion" rows="2" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-teal-600" placeholder="What would make PDA better for you?"></textarea>'
        + '<button id="fb-suggest-submit" class="mt-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm px-4 py-2 rounded-lg">Send suggestion</button></div></div>'
        + '<div id="fb-msg" class="text-sm text-emerald-700 font-semibold mt-2 hidden">✓ Sent — thank you!</div>'
        + '</section>';

      if (!thanks) {
        var rateWrap = document.getElementById('fb-rate');
        rateWrap.addEventListener('click', function (e) {
          var b = e.target.closest('[data-r]'); if (!b) return;
          rating = +b.getAttribute('data-r');
          Array.prototype.forEach.call(rateWrap.children, function (c) {
            var on = c === b;
            c.classList.toggle('border-teal-600', on); c.classList.toggle('bg-teal-50', on);
            c.classList.toggle('ring-2', on); c.classList.toggle('ring-teal-500', on);
          });
          document.getElementById('fb-submit').disabled = false;
        });
        document.getElementById('fb-submit').addEventListener('click', async function () {
          this.disabled = true; this.textContent = 'Sending…';
          var comment = document.getElementById('fb-comment').value.trim();
          try { await sb.from('student_feedback').insert({ student_id: session.user.id, kind: 'pulse', prompt: prompt, rating: rating, comment: comment || null, page: 'dashboard' }); } catch (e) {}
          try { localStorage.setItem(doneKey, '1'); } catch (e) {}
          render(true);
        });
      }

      document.getElementById('fb-suggest-toggle').addEventListener('click', function () {
        document.getElementById('fb-suggest-box').classList.toggle('hidden');
      });
      document.getElementById('fb-suggest-submit').addEventListener('click', async function () {
        var v = document.getElementById('fb-suggestion').value.trim(); if (!v) return;
        this.disabled = true; this.textContent = 'Sending…';
        try { await sb.from('student_feedback').insert({ student_id: session.user.id, kind: 'suggestion', comment: v, page: 'dashboard' }); } catch (e) {}
        document.getElementById('fb-suggestion').value = '';
        document.getElementById('fb-suggest-box').classList.add('hidden');
        var msg = document.getElementById('fb-msg'); msg.classList.remove('hidden');
        setTimeout(function () { msg.classList.add('hidden'); }, 2500);
        this.disabled = false; this.textContent = 'Send suggestion';
      });
    }
  })();
})();
