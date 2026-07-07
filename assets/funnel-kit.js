/* PDA funnel kit — the proven /go/dental-assistant components as one shared,
 * configurable module, so five persona funnels don't mean five copies.
 * ---------------------------------------------------------------------------
 * Usage (per funnel page):
 *   <link rel="stylesheet" href="/assets/funnel-kit.css">
 *   <script>window.FUNNEL = { campaign:'moms_lp', defaultFin:'plan', quiz:{...} }</script>
 *   <div data-fk="countdown"></div> … <div data-fk="race"></div> … etc.
 *   <script defer src="/assets/funnel-kit.js"></script>
 *
 * Mount points rendered by the kit (only the ones present on the page):
 *   countdown  — live seat-aware countdown to the next in-person class
 *   race       — the Time Race chart (animates on scroll)
 *   payback    — wage slider → weekly / payback / yearly readouts
 *   financing  — Ways To Pay tabs (pif / plan / split / wioa)
 *   quiz       — 3-question gut check (questions/messages from config)
 *   pack       — the Premier Pay-in-Full Pack section
 *   sticky     — mobile sticky CTA
 *
 * Truth layer is IDENTICAL on every funnel: $3,000 paid in full / $3,500 plan
 * ($500 down), ~12 weeks, real cohort dates + real seat counts from the
 * cohorts table. Personas change the ANGLE, never the facts.
 *
 * Events land in page_visits as `<event>|<path>` (fb_funnel, fb_funnel_enroll_click,
 * fb_funnel_chart_view, fb_funnel_fin_<tab>, fb_funnel_quiz_done) so the KPI page
 * can split funnels apart. Meta Pixel (1290830552877730) is initialized here.
 */
(function () {
  'use strict';
  var SUPABASE_URL = 'https://lmbsuwslsycukynzpzik.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_vzuQZbkmj-UsYZVs5Zqw9w_c8PiOfbh';
  var CFG = window.FUNNEL || {};
  var PATH = location.pathname.replace(/\/$/, '');
  var CAMPAIGN = CFG.campaign || 'da_lp';
  var UTM = 'utm_source=facebook&utm_medium=cpc&utm_campaign=' + CAMPAIGN;
  var ENROLL_PLAN = '/enroll?plan=in-person&paymode=plan&' + UTM;
  var ENROLL_FULL = '/enroll?plan=in-person&paymode=full&' + UTM;

  /* ── Meta Pixel (one copy for every funnel) ── */
  try {
    if (!window.fbq) {
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', '1290830552877730');
      window.fbq('track', 'PageView');
    }
    window.fbq('track', 'ViewContent', { content_name: 'FB Funnel — ' + (CFG.personaLabel || CAMPAIGN), content_category: 'in_person_program' });
  } catch (e) {}

  /* ── First-party events (same visitor id pda-track uses, so journeys stitch) ── */
  function visitorHash() {
    try {
      var h = localStorage.getItem('pda_vid');
      if (!h) { h = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('pda_vid', h); }
      return h;
    } catch (e) { return 'v_anon'; }
  }
  function logEventSafe(name) {
    try {
      fetch(SUPABASE_URL + '/rest/v1/page_visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, Prefer: 'return=minimal' },
        body: JSON.stringify({ page: (name + '|' + PATH).slice(0, 250), visitor_hash: visitorHash() }),
        keepalive: true,
      }).catch(function () {});
    } catch (e) {}
  }
  logEventSafe('fb_funnel');

  function mount(name) { return document.querySelector('[data-fk="' + name + '"]'); }

  /* ── Countdown: next in-person class WITH seats (sold-out only if it's the only one) ── */
  (function () {
    var el = mount('countdown');
    if (!el) return;
    el.innerHTML =
      '<div class="countdown-bar" id="fk-countdown" style="display:none">' +
        '<div class="cd-label">⏰ The next in-person class (<strong id="fk-cd-name">…</strong>) starts in:</div>' +
        '<div class="cd-units">' +
          '<div class="cd-unit"><div class="cd-num" id="fk-cd-d">–</div><div class="cd-word">days</div></div>' +
          '<div class="cd-unit"><div class="cd-num" id="fk-cd-h">–</div><div class="cd-word">hours</div></div>' +
          '<div class="cd-unit"><div class="cd-num" id="fk-cd-m">–</div><div class="cd-word">mins</div></div>' +
          '<div class="cd-unit"><div class="cd-num" id="fk-cd-s">–</div><div class="cd-word">secs</div></div>' +
        '</div><div id="fk-seats-line"></div></div>';
    (async function () {
      try {
        var today = new Date().toISOString().slice(0, 10);
        var res = await fetch(SUPABASE_URL + '/rest/v1/cohorts?select=name,start_date,capacity,enrolled_count&delivery_mode=eq.in_person&status=eq.upcoming&start_date=gte.' + today + '&order=start_date.asc&limit=8',
          { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } });
        var rows = await res.json();
        if (!Array.isArray(rows) || !rows.length) return;
        var c = rows.find(function (r) { return ((r.capacity || 0) - (r.enrolled_count || 0)) > 0; }) || rows[0];
        var target = new Date(c.start_date + 'T08:00:00-05:00');
        if (isNaN(target) || target <= new Date()) return;
        document.getElementById('fk-cd-name').textContent = new Date(c.start_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        document.getElementById('fk-countdown').style.display = 'block';
        var left = Math.max(0, (c.capacity || 0) - (c.enrolled_count || 0));
        var line = document.getElementById('fk-seats-line');
        if (left <= 0) line.innerHTML = '<span class="seats-pill">This class is full — ask about the next one</span>';
        else if (left === 1) line.innerHTML = '<span class="seats-pill">Last seat left!</span>';
        else line.innerHTML = '<span class="seats-pill">Only ' + left + ' seats left — 2 Pay-in-Full Packs available</span>';
        (function tick() {
          var ms = target - new Date();
          if (ms <= 0) { document.getElementById('fk-countdown').style.display = 'none'; return; }
          document.getElementById('fk-cd-d').textContent = Math.floor(ms / 86400000);
          document.getElementById('fk-cd-h').textContent = String(Math.floor(ms / 3600000) % 24).padStart(2, '0');
          document.getElementById('fk-cd-m').textContent = String(Math.floor(ms / 60000) % 60).padStart(2, '0');
          document.getElementById('fk-cd-s').textContent = String(Math.floor(ms / 1000) % 60).padStart(2, '0');
          setTimeout(tick, 1000);
        })();
      } catch (e) { /* timer stays hidden — never fake */ }
    })();
  })();

  /* ── Time Race ── */
  (function () {
    var el = mount('race');
    if (!el) return;
    var o = CFG.race || {};
    el.innerHTML =
      '<div class="tool-card"><span class="kicker">⏱ ' + (o.kicker || 'The Time Race') + '</span>' +
      '<h2 class="sec">' + (o.heading || 'How fast can you actually be working?') + '</h2>' +
      '<p class="lead">' + (o.lead || 'Same career. Very different waits. Watch how the paths compare:') + '</p>' +
      '<div class="race" id="fk-race">' +
        '<div class="race-row"><div class="r-label"><span>🦷 Premier Dental Academy (hands-on, Longview)</span><span class="r-time">~12 weeks</span></div><div class="race-track"><div class="race-fill pda" data-w="12">12 weeks</div></div></div>' +
        '<div class="race-row"><div class="r-label"><span>Typical college certificate program</span><span class="r-time">~9–12 months</span></div><div class="race-track"><div class="race-fill cert" data-w="60">up to ~52 weeks</div></div></div>' +
        '<div class="race-row"><div class="r-label"><span>Associate degree route</span><span class="r-time">~2 years</span></div><div class="race-track"><div class="race-fill college" data-w="100">~104 weeks</div></div></div>' +
      '</div>' +
      '<p style="margin-top:20px;font-weight:700;color:var(--navy)">' + (o.punch || 'While the 2-year route is still in its first semester, you could already be working chairside in an East Texas office — earning, not owing.') + '</p>' +
      '<div style="margin-top:16px"><a class="btn gold enroll" href="' + ENROLL_PLAN + '">' + (o.cta || "I don't want to wait 2 years — enroll me →") + '</a></div>' +
      '<p class="tool-note">Program length ~12 weeks. Certificate and degree lengths are typical published program durations; check any school you compare for exact timelines.</p></div>';
    var race = document.getElementById('fk-race');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          race.querySelectorAll('.race-fill').forEach(function (f) { f.style.width = f.dataset.w + '%'; });
          io.disconnect();
          logEventSafe('fb_funnel_chart_view');
        }
      });
    }, { threshold: 0.4 });
    io.observe(race);
  })();

  /* ── Payback slider ── */
  (function () {
    var el = mount('payback');
    if (!el) return;
    var o = CFG.payback || {};
    el.innerHTML =
      '<div class="tool-card"><span class="kicker">🧮 ' + (o.kicker || 'The Payback Math') + '</span>' +
      '<h2 class="sec">' + (o.heading || 'Slide your future wage. See when tuition pays for itself.') + '</h2>' +
      '<p class="lead">' + (o.lead || 'East Texas dental assistants in our published data earn roughly $38,000–$46,000 a year. Move the slider and do your own math:') + '</p>' +
      '<div class="slider-wrap">' +
        '<input type="range" id="fk-wage" min="15" max="25" step="0.5" value="20" aria-label="Hourly wage">' +
        '<div style="text-align:center;font-weight:800;color:var(--navy);font-size:1.15rem">If you earned <span id="fk-wage-out" style="color:var(--gold)">$20.00/hr</span> full-time…</div>' +
        '<div class="slider-readout">' +
          '<div class="readout-box"><div class="r-big" id="fk-ro-week">$800</div><div class="r-small">per week (gross)</div></div>' +
          '<div class="readout-box"><div class="r-big" id="fk-ro-payback">~4 wks</div><div class="r-small">of pay ≈ your $3,000 tuition</div></div>' +
          '<div class="readout-box"><div class="r-big" id="fk-ro-year">$41,600</div><div class="r-small">per year (gross)</div></div>' +
        '</div></div>' +
      '<div style="margin-top:18px"><a class="btn gold enroll" href="' + ENROLL_PLAN + '">' + (o.cta || 'Show me how to get there →') + '</a></div>' +
      '<p class="tool-note">This is arithmetic, not a promise — wages vary by office, experience, and duties. Figures based on the East Texas ranges on our <a href="/salary" style="color:var(--teal)">salary page</a>.</p></div>';
    var s = document.getElementById('fk-wage');
    var fmt = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
    function upd() {
      var hr = parseFloat(s.value), week = hr * 40;
      document.getElementById('fk-wage-out').textContent = '$' + hr.toFixed(2) + '/hr';
      document.getElementById('fk-ro-week').textContent = fmt(week);
      document.getElementById('fk-ro-payback').textContent = '~' + Math.ceil(3000 / week) + ' wks';
      document.getElementById('fk-ro-year').textContent = fmt(hr * 2080);
    }
    s.addEventListener('input', upd); upd();
  })();

  /* ── Ways To Pay (default tab per persona) ── */
  (function () {
    var el = mount('financing');
    if (!el) return;
    var def = CFG.defaultFin || 'pif';
    var o = CFG.financing || {};
    function act(k) { return k === def ? ' active' : ''; }
    el.innerHTML =
      '<div class="tool-card" id="pay"><span class="kicker">💳 Ways To Pay</span>' +
      '<h2 class="sec">' + (o.heading || 'Four real ways to cover tuition. Pick your style, then enroll.') + '</h2>' +
      '<div class="fin-tabs">' +
        '<button class="fin-tab' + act('pif') + '" data-fin="pif" type="button">Pay in full</button>' +
        '<button class="fin-tab' + act('plan') + '" data-fin="plan" type="button">Payment plan</button>' +
        '<button class="fin-tab' + act('split') + '" data-fin="split" type="button">Klarna / Afterpay / Affirm</button>' +
        '<button class="fin-tab' + act('wioa') + '" data-fin="wioa" type="button">WIOA (may be free)</button>' +
      '</div>' +
      '<div class="fin-panel' + act('pif') + '" id="fin-pif"><h3>Pay in full — the straight line</h3><div class="fp-big">$3,000</div>' +
        '<p>One payment, done. It’s $500 less than the plan total — and right now the first two pay-in-full students in the next class also take home the <strong>Premier Pay-in-Full Pack</strong>.</p>' +
        '<a class="btn gold pulse enroll" href="' + ENROLL_FULL + '">Enroll pay-in-full →</a></div>' +
      '<div class="fin-panel' + act('plan') + '" id="fin-plan"><h3>Payment plan — small bites</h3><div class="fp-big">$500 down today</div>' +
        '<p>Then the $3,000 balance splits into simple auto-billed payments ($3,500 plan total). Slide to see what fits:</p>' +
        '<input type="range" id="fk-npay" min="4" max="12" step="1" value="8" aria-label="Number of payments">' +
        '<p style="font-weight:800;color:var(--navy);font-size:1.1rem;margin-top:6px"><span id="fk-npay-n">8</span> payments of <span id="fk-npay-amt" style="color:var(--gold)">$375</span> <span style="font-weight:600;color:var(--muted)">(weekly or monthly — your pick)</span></p>' +
        '<a class="btn gold enroll" href="' + ENROLL_PLAN + '">Start with $500 down →</a></div>' +
      '<div class="fin-panel' + act('split') + '" id="fin-split"><h3>Klarna, Afterpay, or Affirm</h3>' +
        '<p>Prefer to split payments through a service you already use? Klarna, Afterpay, and Affirm are accepted at checkout — their terms and approval are between you and them.</p>' +
        '<a class="btn gold enroll" href="/enroll?plan=in-person&' + UTM + '">See checkout options →</a></div>' +
      '<div class="fin-panel' + act('wioa') + '" id="fin-wioa"><h3>WIOA funding — training that may cost you $0</h3>' +
        '<p>' + (o.wioaLead || 'Texas Workforce Solutions offers WIOA funding that can help cover dental-assistant training for people who qualify. The application takes about 6–8 weeks, so if the timing matters, hold your seat with $500 down now and start the WIOA process in the meantime.') + '</p>' +
        '<a class="btn gold" href="/tools/funding-finder">Check if I qualify (free, 6 questions) →</a></div>' +
      '</div>';
    el.querySelectorAll('.fin-tab').forEach(function (t) {
      t.addEventListener('click', function () {
        el.querySelectorAll('.fin-tab').forEach(function (x) { x.classList.remove('active'); });
        el.querySelectorAll('.fin-panel').forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        el.querySelector('#fin-' + t.dataset.fin).classList.add('active');
        logEventSafe('fb_funnel_fin_' + t.dataset.fin);
      });
    });
    var n = document.getElementById('fk-npay');
    if (n) {
      var upd = function () {
        document.getElementById('fk-npay-n').textContent = n.value;
        document.getElementById('fk-npay-amt').textContent = '$' + Math.ceil(3000 / parseInt(n.value, 10)).toLocaleString('en-US');
      };
      n.addEventListener('input', upd); upd();
    }
  })();

  /* ── Pay-in-Full Pack ── */
  (function () {
    var el = mount('pack');
    if (!el) return;
    el.innerHTML =
      '<div class="pack"><span class="pack-tag">🎁 First 2 pay-in-full students only</span>' +
      '<h2>The Premier Pay-in-Full Pack</h2>' +
      '<p class="pack-sub">Be one of the <strong>first two students</strong> to enroll in the next Longview class and pay in full, and you don’t just lock your seat — you start like a pro on day one, with gear picked out by Amanda herself:</p>' +
      '<div class="goodies">' +
        '<div class="goodie"><span class="g-ico">🥼</span><span class="g-name">Embroidered scrub coat</span></div>' +
        '<div class="goodie"><span class="g-ico">👕</span><span class="g-name">Custom PDA T-shirt</span></div>' +
        '<div class="goodie"><span class="g-ico">🪪</span><span class="g-name">Badge reel</span></div>' +
        '<div class="goodie"><span class="g-ico">🦷</span><span class="g-name">Your own typodont</span></div>' +
        '<div class="goodie"><span class="g-ico">⚙️</span><span class="g-name">Engraved starter instrument set</span></div>' +
        '<div class="goodie"><span class="g-ico">🤝</span><span class="g-name">Private onboarding with Amanda</span></div>' +
        '<div class="goodie"><span class="g-ico">📜</span><span class="g-name">Performance-based recommendation letter at graduation</span></div>' +
        '<div class="goodie"><span class="g-ico">✨</span><span class="g-name">Plus surprise goodies along the way</span></div>' +
      '</div>' +
      '<a class="btn gold pulse enroll" href="' + ENROLL_FULL + '">Enroll Pay-in-Full — Claim the Pack →</a>' +
      '<p class="fine-print">Pack goes to the first two pay-in-full enrollments in the upcoming Longview class — once those two seats are claimed, it’s gone for this session. Recommendation letter is earned through performance during the program.</p></div>';
  })();

  /* ── Quiz (persona-tuned questions + composed message) ── */
  (function () {
    var el = mount('quiz');
    if (!el || !CFG.quiz || !CFG.quiz.questions) return;
    var Q = CFG.quiz.questions; // [{q, opts:[[val,label],...]}, x3]
    var M = CFG.quiz.messages;  // [{val: sentence}, x3]
    el.innerHTML =
      '<div class="tool-card"><span class="kicker">✅ 30-Second Gut Check</span>' +
      '<h2 class="sec">' + (CFG.quiz.heading || 'Is this actually right for you? Tap through.') + '</h2>' +
      Q.map(function (q, i) {
        return '<div class="quiz-q' + (i === 0 ? ' active' : '') + '" id="fk-qq' + (i + 1) + '">' +
          '<div class="quiz-progress">Question ' + (i + 1) + ' of ' + Q.length + '</div>' +
          '<p style="font-weight:700;color:var(--navy);font-size:1.05rem">' + q.q + '</p>' +
          '<div class="quiz-opts">' + q.opts.map(function (o) {
            return '<button class="quiz-opt" data-q="' + (i + 1) + '" data-val="' + o[0] + '" type="button">' + o[1] + '</button>';
          }).join('') + '</div></div>';
      }).join('') +
      '<div class="quiz-result" id="fk-quiz-result"><p id="fk-quiz-msg"></p>' +
      '<a class="btn gold pulse enroll" href="' + ENROLL_PLAN + '">' + (CFG.quiz.cta || 'Reserve my seat →') + '</a>' +
      '<p class="tool-note">Still deciding? Take the full <a href="/tools/is-it-for-me" style="color:var(--teal)">"Is it for me?" tool</a> — no signup needed.</p></div></div>';
    var ans = {};
    el.querySelectorAll('.quiz-opt').forEach(function (b) {
      b.addEventListener('click', function () {
        var q = +b.dataset.q;
        ans[q] = b.dataset.val;
        document.getElementById('fk-qq' + q).classList.remove('active');
        if (q < Q.length) { document.getElementById('fk-qq' + (q + 1)).classList.add('active'); return; }
        var msg = Q.map(function (_, i) { return (M[i] && M[i][ans[i + 1]]) || ''; }).join(' ');
        document.getElementById('fk-quiz-msg').textContent = msg;
        document.getElementById('fk-quiz-result').style.display = 'block';
        logEventSafe('fb_funnel_quiz_done');
      });
    });
  })();

  /* ── Sticky mobile CTA ── */
  (function () {
    var el = mount('sticky');
    if (!el) return;
    el.innerHTML = '<div class="sticky-cta"><a class="btn gold pulse enroll" href="' + ENROLL_PLAN + '" style="width:100%;max-width:420px;text-align:center">' + (CFG.stickyCta || 'Reserve My Seat — $500 Down →') + '</a></div>';
  })();

  /* ── Enroll links: fbclid/UTM propagation + InitiateCheckout ── */
  (function () {
    var src = new URLSearchParams(location.search);
    document.querySelectorAll('a.enroll').forEach(function (a) {
      try {
        var u = new URL(a.getAttribute('href'), location.origin);
        ['fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
          if (src.get(k) && !u.searchParams.get(k)) u.searchParams.set(k, src.get(k));
        });
        a.setAttribute('href', u.pathname + u.search);
      } catch (e) {}
      a.addEventListener('click', function () {
        if (typeof window.fbq === 'function') window.fbq('track', 'InitiateCheckout', { content_category: 'in_person_program' });
        logEventSafe('fb_funnel_enroll_click');
      });
    });
  })();

  /* ── Gallery pop-in (if the page has one) ── */
  (function () {
    var items = document.querySelectorAll('.gallery .gphoto');
    if (!items.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          setTimeout(function () { el.classList.add('in'); }, (+el.dataset.i || 0) * 60);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.15 });
    items.forEach(function (el, i) { el.dataset.i = i % 6; io.observe(el); });
  })();
})();
