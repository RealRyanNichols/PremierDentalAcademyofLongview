/* PDA Engage — drop-in blog lead-capture forms + interactive tools.
 * ------------------------------------------------------------------
 * Include once per page:  <script src="/assets/pda-engage.js" defer></script>
 * (Requires the Supabase JS CDN on the page; degrades gracefully without it.)
 *
 * LEAD FORM  — writes to public.leads (shows in /admin/leads):
 *   <div data-pda-lead
 *        data-topic="Radiology certification"
 *        data-heading="Have a question? Ask Amanda."
 *        data-sub="She answers personally — usually same day."
 *        data-cta="Send my question"></div>
 *
 * TOOLS  — write inputs+outputs to public.brain_events ("Brain – PDA"),
 *          are shareable, and capture a lead when the visitor saves results:
 *   <div data-pda-tool="paycalc"></div>   (Dental-assistant pay-raise / ROI)
 *   <div data-pda-tool="budget"></div>    (Can I afford a career change?)
 *   <div data-pda-tool="quiz"></div>      (Is dental assisting right for me?)
 */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://lmbsuwslsycukynzpzik.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_vzuQZbkmj-UsYZVs5Zqw9w_c8PiOfbh';
  var SITE = 'https://www.premierdentalacademyoflongview.com';

  // Real, published PDA figures (keep in sync with /salary + /enroll). No hype.
  var RDA_HR_LOW = 18, RDA_HR_HIGH = 25, RDA_HR_MID = 21;
  var TUITION_INPERSON = 3000, TUITION_ONLINE = 397;
  var PLAN_MONTHLY = 640, PLAN_WEEKLY = 160, MIN_DOWN = 200;

  var sb = null;
  try { if (window.supabase && window.supabase.createClient) sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); } catch (e) {}

  function sid() {
    try {
      var k = 'pda.sid', v = localStorage.getItem(k);
      if (!v) { v = 'sid-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); localStorage.setItem(k, v); }
      return v;
    } catch (e) { return 'sid-anon'; }
  }
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); };
  var money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
  var num = function (v) { var n = parseFloat(String(v).replace(/[^0-9.]/g, '')); return isFinite(n) ? n : 0; };

  // ── Data sinks ──────────────────────────────────────────────────
  function logBrain(tool, inputs, outputs, contact, sharedTo) {
    if (!sb) return Promise.resolve();
    var row = {
      tool: tool, page: location.pathname, session_id: sid(),
      inputs: inputs || {}, outputs: outputs || {},
      contact_name: (contact && contact.name) || null,
      contact_email: (contact && contact.email) || null,
      contact_phone: (contact && contact.phone) || null,
      shared_to: sharedTo || null, source: 'blog'
    };
    return sb.from('brain_events').insert(row).then(function () {}, function () {});
  }
  function submitLead(d) {
    if (!sb) return Promise.resolve();
    var parts = String(d.name || '').trim().split(/\s+/);
    var row = {
      first_name: parts[0] || '', last_name: parts.slice(1).join(' ') || null,
      email: d.email || null, phone: d.phone || null,
      message: (d.message || '') + (d.context ? ('\n\n[' + d.context + ']') : ''),
      interest_path: d.topic || null, source: d.source || 'blog',
      pipeline_stage: 'new', status: 'new', last_contact_at: new Date().toISOString()
    };
    return sb.from('leads').insert(row).then(function () {}, function () {});
  }

  // ── Sharing ─────────────────────────────────────────────────────
  function shareRow(getText, getUrl, onShare) {
    var url = getUrl || (location.href);
    function fire(kind, fn) { try { onShare && onShare(kind); } catch (e) {} fn(); }
    var btn = 'display:inline-flex;align-items:center;gap:4px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;font-weight:600;font-size:12px;padding:6px 10px;border-radius:8px;cursor:pointer;text-decoration:none';
    var wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-top:12px';
    wrap.innerHTML =
      '<button type="button" data-s="native" style="' + btn + '">📤 Share</button>' +
      '<button type="button" data-s="sms" style="' + btn + '">💬 Text it</button>' +
      '<button type="button" data-s="fb" style="' + btn + '">Facebook</button>' +
      '<button type="button" data-s="x" style="' + btn + '">X</button>' +
      '<button type="button" data-s="copy" style="' + btn + '">🔗 Copy</button>';
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('[data-s]'); if (!b) return;
      var text = getText(), u = (typeof url === 'function') ? url() : url;
      var s = b.dataset.s;
      if (s === 'native') {
        if (navigator.share) fire('web-share', function () { navigator.share({ title: 'Premier Dental Academy', text: text, url: u }).catch(function () {}); });
        else fire('copy', function () { copy(text + ' ' + u); flash(b, 'Copied!'); });
      } else if (s === 'sms') {
        fire('sms', function () { location.href = 'sms:?&body=' + encodeURIComponent(text + ' ' + u); });
      } else if (s === 'fb') {
        fire('facebook', function () { open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(u), '_blank'); });
      } else if (s === 'x') {
        fire('x', function () { open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(u), '_blank'); });
      } else if (s === 'copy') {
        fire('copy', function () { copy(text + ' ' + u); flash(b, 'Copied!'); });
      }
    });
    return wrap;
  }
  function copy(t) { try { navigator.clipboard.writeText(t); } catch (e) {} }
  function flash(b, msg) { var o = b.textContent; b.textContent = msg; setTimeout(function () { b.textContent = o; }, 1400); }

  // ── Shared UI bits ──────────────────────────────────────────────
  var CARD = 'border:1px solid #99f6e4;background:linear-gradient(135deg,#f0fdfa,#ecfeff);border-radius:16px;padding:20px;margin:28px 0';
  var H = 'font-family:Fraunces,Georgia,serif;font-weight:700;color:#0f172a;font-size:20px;margin:0 0 4px';
  var SUB = 'color:#475569;font-size:14px;margin:0 0 14px';
  var INP = 'width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:15px;margin-top:4px';
  var LBL = 'display:block;font-size:13px;font-weight:600;color:#334155;margin-top:10px';
  var BTN = 'background:#0d9488;color:#fff;font-weight:700;border:0;border-radius:8px;padding:11px 18px;font-size:15px;cursor:pointer;margin-top:14px';
  var CTA = 'display:inline-block;background:#f59e0b;color:#0f172a;font-weight:700;text-decoration:none;border-radius:8px;padding:10px 18px;margin-top:6px';

  function resultBox() { var d = document.createElement('div'); d.style.cssText = 'background:#fff;border:1px solid #5eead4;border-radius:12px;padding:16px;margin-top:16px'; d.hidden = true; return d; }

  // Mini "save my results / get cohort dates" capture used inside tools.
  function saveResults(host, tool, getInputs, getOutputs, ctaHref, ctaLabel) {
    var box = document.createElement('div');
    box.style.cssText = 'border-top:1px dashed #cbd5e1;margin-top:14px;padding-top:14px';
    box.innerHTML =
      '<div style="font-weight:600;font-size:14px;color:#0f172a">📩 Email my results + free East-Texas cohort dates</div>' +
      '<input data-f="name" placeholder="First name" style="' + INP + '">' +
      '<input data-f="email" type="email" placeholder="Email" style="' + INP + '">' +
      '<input data-f="phone" type="tel" placeholder="Mobile (optional)" style="' + INP + '">' +
      '<button type="button" data-f="go" style="' + BTN + '">Send my results →</button>' +
      '<a href="' + (ctaHref || '/enroll') + '" style="' + CTA + ';margin-left:8px">' + (ctaLabel || 'See programs →') + '</a>' +
      '<div data-f="msg" style="font-size:13px;margin-top:10px"></div>';
    box.querySelector('[data-f="go"]').addEventListener('click', function () {
      var name = box.querySelector('[data-f="name"]').value.trim();
      var email = box.querySelector('[data-f="email"]').value.trim();
      var phone = box.querySelector('[data-f="phone"]').value.trim();
      var msgEl = box.querySelector('[data-f="msg"]');
      if (!email && !phone) { msgEl.style.color = '#b91c1c'; msgEl.textContent = 'Add an email or mobile so we can send it.'; return; }
      var contact = { name: name, email: email, phone: phone };
      Promise.all([
        logBrain(tool, getInputs(), getOutputs(), contact, null),
        submitLead({ name: name, email: email, phone: phone, topic: tool + ' tool', source: 'tool:' + tool,
          message: 'Used the ' + tool + ' tool and asked for their results.', context: 'tool ' + tool + ' on ' + location.pathname })
      ]).then(function () {
        msgEl.style.color = '#047857';
        msgEl.textContent = '✓ Sent! Amanda will follow up personally. Check your email/text.';
      });
    });
    host.appendChild(box);
  }

  // ── TOOL: pay-raise / career ROI ────────────────────────────────
  function toolPaycalc(host) {
    host.innerHTML =
      '<div style="' + CARD + '">' +
      '<div style="' + H + '">💰 Dental Assistant Pay-Raise Calculator</div>' +
      '<div style="' + SUB + '">See what becoming a Registered Dental Assistant could add to your income — and how fast training pays for itself. Estimates use real East-Texas RDA pay ranges.</div>' +
      '<label style="' + LBL + '">What do you make now?</label>' +
      '<div style="display:flex;gap:8px"><input data-f="amt" inputmode="decimal" placeholder="e.g. 13" style="' + INP + '"><select data-f="per" style="' + INP + ';max-width:130px"><option value="hr">per hour</option><option value="yr">per year</option></select></div>' +
      '<button type="button" data-f="go" style="' + BTN + '">Calculate my raise →</button>' +
      '</div>';
    var card = host.firstChild;
    var out = resultBox(); card.appendChild(out);
    var lastIn = {}, lastOut = {};
    card.querySelector('[data-f="go"]').addEventListener('click', function () {
      var amt = num(card.querySelector('[data-f="amt"]').value);
      var per = card.querySelector('[data-f="per"]').value;
      if (amt <= 0) { out.hidden = false; out.innerHTML = 'Enter what you earn now to see the difference.'; return; }
      var curHr = per === 'yr' ? amt / 2080 : amt;
      var curYr = curHr * 2080;
      var rdaLowYr = RDA_HR_LOW * 2080, rdaHighYr = RDA_HR_HIGH * 2080, rdaMidYr = RDA_HR_MID * 2080;
      var gain = Math.max(0, rdaMidYr - curYr);
      var weeklyGain = gain / 52;
      var payback = weeklyGain > 0 ? Math.ceil(TUITION_INPERSON / weeklyGain) : null;
      lastIn = { current_amount: amt, per: per, current_annual: Math.round(curYr) };
      lastOut = { rda_range_yr: [rdaLowYr, rdaHighYr], est_annual_gain: Math.round(gain), payback_weeks: payback };
      out.hidden = false;
      out.innerHTML =
        '<div style="font-size:15px;color:#0f172a">As a Registered Dental Assistant in East Texas you could earn about <strong>' + money(rdaLowYr) + '–' + money(rdaHighYr) + '/yr</strong> (' + RDA_HR_LOW + '–' + RDA_HR_HIGH + '/hr).</div>' +
        (gain > 0
          ? '<div style="font-size:15px;color:#0f172a;margin-top:8px">That\'s roughly <strong style="color:#0d9488">' + money(gain) + ' more a year</strong> than you make now' + (payback ? ', so PDA tuition could pay for itself in about <strong>' + payback + ' weeks</strong> of working.' : '.') + '</div>'
          : '<div style="font-size:15px;color:#0f172a;margin-top:8px">You\'re already in that range — an RDA credential can add stability, raises, and a clear path to front-office or expanded-function roles.</div>') +
        '<div style="font-size:12px;color:#64748b;margin-top:8px">Estimates only — actual pay varies by office, experience, and certifications.</div>';
      logBrain('paycalc', lastIn, lastOut, null, null);
      var sr = shareRow(function () { return 'I just found out becoming a Registered Dental Assistant could mean about ' + money(gain) + ' more a year. Premier Dental Academy of Longview:'; }, SITE, function (k) { logBrain('paycalc', lastIn, lastOut, null, k); });
      out.appendChild(sr);
      saveResults(out, 'paycalc', function () { return lastIn; }, function () { return lastOut; }, '/enroll', 'See tuition + plans →');
    });
  }

  // ── TOOL: career-change budget ──────────────────────────────────
  function toolBudget(host) {
    host.innerHTML =
      '<div style="' + CARD + '">' +
      '<div style="' + H + '">🧮 Can I Afford a Career Change?</div>' +
      '<div style="' + SUB + '">A quick, judgment-free budget snapshot — see your monthly breathing room and how PDA\'s payment plan could fit.</div>' +
      '<label style="' + LBL + '">Monthly take-home income</label><input data-f="inc" inputmode="decimal" placeholder="e.g. 2400" style="' + INP + '">' +
      '<label style="' + LBL + '">Monthly bills + expenses</label><input data-f="exp" inputmode="decimal" placeholder="e.g. 1950" style="' + INP + '">' +
      '<button type="button" data-f="go" style="' + BTN + '">Show my snapshot →</button>' +
      '</div>';
    var card = host.firstChild; var out = resultBox(); card.appendChild(out);
    var lastIn = {}, lastOut = {};
    card.querySelector('[data-f="go"]').addEventListener('click', function () {
      var inc = num(card.querySelector('[data-f="inc"]').value);
      var exp = num(card.querySelector('[data-f="exp"]').value);
      if (inc <= 0) { out.hidden = false; out.innerHTML = 'Enter your monthly income to see your snapshot.'; return; }
      var left = inc - exp;
      var fitsMonthly = left >= PLAN_MONTHLY, fitsWeekly = left >= PLAN_WEEKLY * 4;
      var verdict, color;
      if (left >= PLAN_MONTHLY) { verdict = 'You have room for the in-person plan (about ' + money(PLAN_MONTHLY) + '/mo).'; color = '#047857'; }
      else if (left >= PLAN_WEEKLY * 4) { verdict = 'A weekly plan (~' + money(PLAN_WEEKLY) + '/wk) could fit, or the Online program at ' + money(TUITION_ONLINE) + ' total.'; color = '#b45309'; }
      else if (left > 0) { verdict = 'It\'s tight — the Online program (' + money(TUITION_ONLINE) + ', start any day) is the budget-friendly path, and you can start with ' + money(MIN_DOWN) + ' down.'; color = '#b45309'; }
      else { verdict = 'Your expenses are at or above income right now. Let\'s talk options — Online is ' + money(TUITION_ONLINE) + ' and we work with students individually.'; color = '#b91c1c'; }
      lastIn = { monthly_income: inc, monthly_expenses: exp };
      lastOut = { monthly_leftover: left, fits_monthly_plan: fitsMonthly, fits_weekly_plan: fitsWeekly };
      out.hidden = false;
      out.innerHTML =
        '<div style="font-size:15px;color:#0f172a">Your monthly breathing room: <strong style="color:' + color + '">' + money(left) + '</strong></div>' +
        '<div style="font-size:15px;color:#0f172a;margin-top:8px">' + verdict + '</div>' +
        '<div style="font-size:12px;color:#64748b;margin-top:8px">Plans start at ' + money(MIN_DOWN) + ' down. This is a rough guide, not financial advice.</div>';
      logBrain('budget', lastIn, lastOut, null, null);
      out.appendChild(shareRow(function () { return 'I just mapped out whether I can afford to train for a new career. Premier Dental Academy of Longview makes it work:'; }, SITE + '/enroll', function (k) { logBrain('budget', lastIn, lastOut, null, k); }));
      saveResults(out, 'budget', function () { return lastIn; }, function () { return lastOut; }, '/enroll', 'See payment plans →');
    });
  }

  // ── TOOL: readiness quiz ────────────────────────────────────────
  var QQ = [
    ['I like work that keeps me on my feet and busy.', 'pace'],
    ['I\'m comfortable around people and can put nervous folks at ease.', 'people'],
    ['I want a healthcare career without years of school or big debt.', 'fast'],
    ['I\'m detail-oriented and careful with my hands.', 'detail'],
    ['I want to start working in months, not years.', 'urgency']
  ];
  function toolQuiz(host) {
    var rows = QQ.map(function (q, i) {
      return '<div style="margin-top:10px"><div style="font-size:14px;color:#0f172a;font-weight:500">' + (i + 1) + '. ' + esc(q[0]) + '</div>' +
        '<div style="display:flex;gap:6px;margin-top:6px">' +
        [['Yes', 2], ['Kind of', 1], ['Not really', 0]].map(function (o) {
          return '<button type="button" data-q="' + i + '" data-v="' + o[1] + '" style="flex:1;border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:8px;font-size:13px;font-weight:600;cursor:pointer">' + o[0] + '</button>';
        }).join('') + '</div></div>';
    }).join('');
    host.innerHTML =
      '<div style="' + CARD + '">' +
      '<div style="' + H + '">✅ Is Dental Assisting Right for You?</div>' +
      '<div style="' + SUB + '">Five quick questions. No email needed to see your result.</div>' + rows +
      '<button type="button" data-f="go" style="' + BTN + '">See my result →</button></div>';
    var card = host.firstChild; var out = resultBox(); card.appendChild(out);
    var answers = {};
    card.addEventListener('click', function (e) {
      var b = e.target.closest('[data-q]'); if (!b) return;
      answers[b.dataset.q] = parseInt(b.dataset.v, 10);
      Array.prototype.forEach.call(card.querySelectorAll('[data-q="' + b.dataset.q + '"]'), function (x) { x.style.background = '#fff'; x.style.borderColor = '#cbd5e1'; });
      b.style.background = '#ccfbf1'; b.style.borderColor = '#0d9488';
    });
    card.querySelector('[data-f="go"]').addEventListener('click', function () {
      var keys = Object.keys(answers);
      if (keys.length < QQ.length) { out.hidden = false; out.innerHTML = 'Answer all five to see your result.'; return; }
      var score = keys.reduce(function (a, k) { return a + answers[k]; }, 0); // 0..10
      var tier, msg;
      if (score >= 8) { tier = 'Strong fit'; msg = 'You\'ve got the instincts this career rewards. The next step is real training and reps.'; }
      else if (score >= 5) { tier = 'Good fit'; msg = 'You\'re a solid candidate — a hands-on program will build the confidence to get hired.'; }
      else { tier = 'Worth exploring'; msg = 'Dental assisting could still be a great move — try our free tools and see how it feels.'; }
      var lastIn = { answers: answers }, lastOut = { score: score, tier: tier };
      out.hidden = false;
      out.innerHTML = '<div style="font-size:18px;font-weight:700;color:#0d9488">' + tier + '</div>' +
        '<div style="font-size:15px;color:#0f172a;margin-top:6px">' + msg + '</div>' +
        '<div style="margin-top:10px"><a href="/apply" style="' + CTA + '">Apply free to PDA →</a> <a href="/tools/practice-exam" style="' + CTA + ';background:#0d9488;color:#fff">Try the free exam →</a></div>';
      logBrain('quiz', lastIn, lastOut, null, null);
      out.appendChild(shareRow(function () { return 'I took the "Is dental assisting right for me?" quiz and got: ' + tier + '. Try it:'; }, SITE + '/blog', function (k) { logBrain('quiz', lastIn, lastOut, null, k); }));
      saveResults(out, 'quiz', function () { return lastIn; }, function () { return lastOut; }, '/apply', 'Apply free →');
    });
  }

  // ── LEAD FORM ───────────────────────────────────────────────────
  function renderLead(host) {
    var topic = host.getAttribute('data-topic') || '';
    var heading = host.getAttribute('data-heading') || 'Have a question? Ask Amanda.';
    var sub = host.getAttribute('data-sub') || 'She reads every message personally and follows up — no call center, no pressure.';
    var cta = host.getAttribute('data-cta') || 'Send my question';
    host.innerHTML =
      '<div style="' + CARD + '">' +
      '<div style="' + H + '">' + esc(heading) + '</div><div style="' + SUB + '">' + esc(sub) + '</div>' +
      '<input data-f="name" placeholder="Your name" style="' + INP + '">' +
      '<input data-f="email" type="email" placeholder="Email" style="' + INP + '">' +
      '<input data-f="phone" type="tel" placeholder="Mobile (so Amanda can text you back)" style="' + INP + '">' +
      '<textarea data-f="msg" rows="3" placeholder="What would you like to know?" style="' + INP + '"></textarea>' +
      '<button type="button" data-f="go" style="' + BTN + '">' + esc(cta) + ' →</button>' +
      '<div data-f="out" style="font-size:13px;margin-top:10px"></div></div>';
    var card = host.firstChild;
    card.querySelector('[data-f="go"]').addEventListener('click', function () {
      var name = card.querySelector('[data-f="name"]').value.trim();
      var email = card.querySelector('[data-f="email"]').value.trim();
      var phone = card.querySelector('[data-f="phone"]').value.trim();
      var msg = card.querySelector('[data-f="msg"]').value.trim();
      var o = card.querySelector('[data-f="out"]');
      if (!name || (!email && !phone)) { o.style.color = '#b91c1c'; o.textContent = 'Add your name and an email or mobile number.'; return; }
      submitLead({ name: name, email: email, phone: phone, message: msg, topic: topic, source: 'blog',
        context: 'blog ' + location.pathname }).then(function () {
        card.innerHTML = '<div style="' + CARD + ';text-align:center"><div style="font-size:40px">✅</div><div style="' + H + '">Got it, ' + esc(name.split(' ')[0]) + '!</div><div style="' + SUB + '">Amanda will follow up personally — usually the same day. Want to keep exploring? <a href="/enroll" style="color:#0d9488;font-weight:700">See programs &amp; tuition →</a></div></div>';
      });
    });
  }

  // ── Boot ────────────────────────────────────────────────────────
  function init() {
    document.querySelectorAll('[data-pda-lead]').forEach(renderLead);
    document.querySelectorAll('[data-pda-tool]').forEach(function (el) {
      var t = el.getAttribute('data-pda-tool');
      if (t === 'paycalc') toolPaycalc(el);
      else if (t === 'budget') toolBudget(el);
      else if (t === 'quiz') toolQuiz(el);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.PDAEngage = { logBrain: logBrain, submitLead: submitLead };
})();
