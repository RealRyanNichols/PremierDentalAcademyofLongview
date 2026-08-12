// Generates the three Skills Lab drill pages from one template.
//
// The abbreviation drill, the instrument trainer and the tray builder are the same page wearing
// three hats: pick a mode, work through items, get a per-category read at the end. Writing them
// as three hand-maintained HTML files would guarantee they drifted apart, so they are generated
// from this one template and the per-drill config below.
//
// Run: node scripts/build-drill-pages.mjs   (wired into npm run build:static)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://www.premierdentalacademyoflongview.com";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function loadGlobal(relPath, globalName) {
  const p = join(root, relPath);
  if (!existsSync(p)) return null;
  const win = {};
  new Function("window", readFileSync(p, "utf8"))(win);
  return win[globalName] || null;
}

const ABBREV = loadGlobal("assets/skills-lab/abbreviations-data.js", "SL_ABBREV");
const INSTR = loadGlobal("assets/skills-lab/instruments-data.js", "SL_INSTRUMENTS");
const TRAYS = loadGlobal("assets/skills-lab/trays-data.js", "SL_TRAYS");

/* ── Per-drill configuration ──────────────────────────────────────────────── */
const DRILLS = [
  {
    file: "skills-lab/abbreviation-drill.html",
    path: "/skills-lab/abbreviation-drill",
    title: "Charting Abbreviation Drill — 96 Terms, Three Modes | Premier Dental Academy",
    description:
      "Drill all 96 dental charting abbreviations three ways: flip through them, type the meaning from memory, or answer multiple choice. Free, no signup, unlimited retakes.",
    eyebrow: "Skills Lab · Drill",
    h1: "Charting abbreviations, until they're automatic",
    lede: "You will read these on charts, routing slips and the schedule every single day. Flip through them, recall them from memory, or take them as multiple choice — whichever makes them stick.",
    dataScripts: ["/assets/skills-lab/abbreviations-data.js"],
    caveat:
      "Charting symbols and colours are <strong>not standardised nationally</strong> — they vary from office to office, and plenty of offices use shorthand of their own. Learn what each one means here, then learn the convention your own office uses.",
    promptLabel: "What does this abbreviation mean?",
    recallPlaceholder: "Type what it stands for…",
    itemsExpr: `(window.SL_ABBREV.GROUPS || []).reduce(function (out, g) {
        g.items.forEach(function (i) {
          out.push({ prompt: i.a, answer: i.m, detail: i.note || '', group: g.title });
        });
        return out;
      }, [])`,
    count: ABBREV ? ABBREV.GROUPS.reduce((n, g) => n + g.items.length, 0) : 0,
    unit: "abbreviations",
    groups: ABBREV ? ABBREV.GROUPS.map((g) => g.title) : [],
    reference: { href: "/skills-lab/abbreviations", label: "the full abbreviation reference" },
    next: [
      { href: "/skills-lab/instrument-id", emoji: "🔧", title: "Now the instruments", blurb: "84 instruments and materials, and how to tell apart the ones people mix up." },
      { href: "/skills-lab/quizzes", emoji: "⚡", title: "Mixed practice", blurb: "Questions across every category an office cares about." },
    ],
  },
  {
    file: "skills-lab/instrument-id.html",
    path: "/skills-lab/instrument-id",
    title: "Dental Instrument Identification Trainer — 84 Instruments | Premier Dental Academy",
    description:
      "Learn to identify 84 dental instruments and materials, and to tell apart the ones that get confused. Flip, recall or multiple choice. Free, no signup.",
    eyebrow: "Skills Lab · Drill",
    h1: "Know the instrument before it's asked for",
    lede: "The dentist puts out a hand without looking up. This drills all 84 instruments and materials — and, more usefully, how to tell apart the pairs that everyone confuses at first.",
    dataScripts: ["/assets/skills-lab/instruments-data.js"],
    caveat:
      "This trainer is <strong>text-based for now</strong>. Photographs are the obvious next step and the page is built to take them — the descriptions carry the learning until then.",
    promptLabel: "Which instrument is this?",
    recallPlaceholder: "Type the instrument name…",
    itemsExpr: `(window.SL_INSTRUMENTS.ITEMS || []).map(function (i) {
        var cat = (window.SL_INSTRUMENTS.CATEGORIES || []).filter(function (c) { return c.id === i.category; })[0];
        return {
          prompt: i.use + (i.recognise ? '\\n\\nTelling it apart: ' + i.recognise : ''),
          answer: i.name,
          detail: i.recognise || '',
          group: cat ? cat.title : (i.category || 'Other')
        };
      })`,
    count: INSTR ? INSTR.ITEMS.length : 0,
    unit: "instruments & materials",
    groups: INSTR ? INSTR.CATEGORIES.map((c) => c.title) : [],
    reference: { href: "/skills-lab/instruments", label: "the full instrument list" },
    next: [
      { href: "/skills-lab/tray-setup", emoji: "🗄️", title: "Put them on a tray", blurb: "14 procedure setups, graded against the real arrangement rules." },
      { href: "/skills-lab/abbreviation-drill", emoji: "✍️", title: "Charting shorthand", blurb: "96 abbreviations you will read every day." },
    ],
  },
];

/* ── The template ─────────────────────────────────────────────────────────── */
function page(d) {
  const groupList = d.groups.length
    ? `<ul class="mt-3 flex flex-wrap gap-2 list-none p-0">` +
      d.groups.map((g) => `<li class="bg-slate-100 text-slate-700 rounded-full px-3 py-1 text-xs font-semibold">${esc(g)}</li>`).join("") +
      `</ul>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(d.title)}</title>
<meta name="description" content="${esc(d.description)}">
<meta name="robots" content="index,follow">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon.png">
<link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon-48.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="canonical" href="${SITE}${d.path}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Premier Dental Academy of Longview">
<meta property="og:url" content="${SITE}${d.path}">
<meta property="og:title" content="${esc(d.h1)}">
<meta property="og:description" content="${esc(d.description)}">
<meta property="og:image" content="${SITE}/assets/og-skills-lab.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(d.h1)}">
<meta name="twitter:description" content="${esc(d.description)}">
<meta name="twitter:image" content="${SITE}/assets/og-skills-lab.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:wght@500;600;700;800&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = { theme: { extend: {
  fontFamily: { sans:['Inter','system-ui','sans-serif'], display:['Fraunces','Inter','serif'] },
  colors: { navy:{900:'#0a1226',800:'#0f172a',700:'#1e293b'}, teal:{600:'#0d9488',700:'#0f766e',800:'#115e59'}, amber:{400:'#fbbf24',500:'#f59e0b'} }
}}}
</script>
<style>
  body{font-family:'Inter',system-ui,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased;background:#f8fafc}
  .display{font-family:'Fraunces',serif}
  .tap{min-height:44px}
  .mode-chip{min-height:44px;padding:0 18px;border-radius:9999px;border:1.5px solid #e2e8f0;background:#fff;
             font-size:14px;font-weight:600;color:#475569;cursor:pointer;transition:.12s}
  .mode-chip.is-on{background:#0d9488;border-color:#0d9488;color:#fff}
  .opt{width:100%;text-align:left;border:1.5px solid #e2e8f0;border-radius:12px;padding:12px 14px;background:#fff;
       font-size:15px;font-weight:600;color:#0f172a;cursor:pointer;transition:.12s;min-height:44px}
  .opt:not(:disabled):hover{border-color:#0d9488;background:#f0fdfa}
  .opt-correct{border-color:#059669!important;background:#ecfdf5!important}
  .opt-wrong{border-color:#e11d48!important;background:#fff1f2!important}
  .fld{width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:12px 14px;font-size:16px;background:#fff}
  .fld:focus{outline:none;border-color:#0d9488;box-shadow:0 0 0 3px rgba(13,148,136,.12)}
</style>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"SoftwareApplication","name":${JSON.stringify(d.h1)},"applicationCategory":"EducationalApplication","operatingSystem":"Any modern web browser","url":"${SITE}${d.path}","description":${JSON.stringify(d.description)},"offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"provider":{"@type":"EducationalOrganization","name":"Premier Dental Academy of Longview","telephone":"+1-903-913-6444","address":{"@type":"PostalAddress","streetAddress":"2800 Gilmer Rd, Suite 106","addressLocality":"Longview","addressRegion":"TX","postalCode":"75604","addressCountry":"US"}}}
</script>
<script defer src="/assets/pda-analytics.js"></script>
<link rel="stylesheet" href="/assets/pda-polish.css">
<script defer src="/assets/pda-nav.js"></script>
</head>
<body class="min-h-screen pda-tinted">

<main class="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

  <div class="rounded-2xl bg-gradient-to-br from-navy-900 to-teal-800 text-white p-6 sm:p-8 shadow-xl">
    <p class="text-teal-200 text-sm font-semibold tracking-wide uppercase">${esc(d.eyebrow)}</p>
    <h1 class="display text-2xl sm:text-4xl font-bold mt-1">${esc(d.h1)}</h1>
    <p class="text-slate-200 mt-2 text-sm sm:text-base">${esc(d.lede)}</p>
    <p class="text-slate-300 mt-3 text-sm"><strong class="text-white">${d.count}</strong> ${esc(d.unit)} in this drill, across ${d.groups.length} categories. Free, no signup, unlimited retakes.</p>
  </div>

  <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-5">
    <p class="text-sm text-amber-900">${d.caveat}</p>
  </div>

  <section class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mt-5">
    <h2 class="display text-lg font-bold">What's in here</h2>
    ${groupList}
    <p class="text-sm text-slate-600 mt-3">Prefer to read rather than drill? Open <a class="font-semibold text-teal-700 underline" href="${esc(d.reference.href)}">${esc(d.reference.label)}</a>.</p>
  </section>

  <section class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mt-5">
    <h2 class="display text-lg font-bold">Pick how you want to practise</h2>
    <div id="modes" class="flex flex-wrap gap-2 mt-3" role="group" aria-label="Drill mode">
      <button type="button" class="mode-chip is-on" data-mode="flip">Flip through</button>
      <button type="button" class="mode-chip" data-mode="recall">Type it from memory</button>
      <button type="button" class="mode-chip" data-mode="quiz">Multiple choice</button>
    </div>
    <p id="mode-help" class="text-sm text-slate-600 mt-3">Show the prompt, think, then reveal the answer and mark yourself. Good for a first pass.</p>
    <div class="flex flex-wrap items-center gap-3 mt-4">
      <label for="len" class="text-sm font-semibold text-navy-900">How many</label>
      <select id="len" class="fld tap" style="width:auto">
        <option value="10">10</option>
        <option value="20" selected>20</option>
        <option value="40">40</option>
        <option value="0">All ${d.count}</option>
      </select>
      <button type="button" id="start" class="tap bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-full">Start drilling →</button>
    </div>
  </section>

  <section id="drill" class="hidden mt-5" aria-live="polite"></section>
  <section id="report" class="hidden mt-5"></section>

  <nav class="mt-8 grid sm:grid-cols-2 gap-4" aria-label="Related tools">
    ${d.next
      .map(
        (n) =>
          `<a href="${esc(n.href)}" class="bg-white rounded-2xl border border-slate-200 p-5 block hover:border-teal-300 transition">` +
          `<div class="text-2xl" aria-hidden="true">${n.emoji}</div>` +
          `<h2 class="font-bold mt-2">${esc(n.title)}</h2>` +
          `<p class="text-sm text-slate-600 mt-1">${esc(n.blurb)}</p></a>`
      )
      .join("\n    ")}
  </nav>

  <p class="text-center mt-8"><a href="/toolbox" class="font-semibold text-teal-700 underline">← Back to the toolbox</a></p>

</main>

${d.dataScripts.map((s) => `<script src="${s}"></script>`).join("\n")}
<script src="/assets/skills-lab/drill-engine.js"></script>
<script>
(function () {
  'use strict';
  var D = window.SL_DRILL;
  var esc = function (s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  var nl2br = function (s) { return esc(s).replace(/\\n/g, '<br>'); };

  var ALL = ${d.itemsExpr};

  var MODE_HELP = {
    flip:   'Show the prompt, think, then reveal the answer and mark yourself. Good for a first pass.',
    recall: 'Type the answer from memory. Harder than flipping, and the one that actually makes it stick.',
    quiz:   'Four options, pick one. Closest to how a written exam asks it.'
  };

  var mode = 'flip', queue = [], idx = 0, score = null;
  var modesEl = document.getElementById('modes');
  var drillEl = document.getElementById('drill');
  var reportEl = document.getElementById('report');

  modesEl.addEventListener('click', function (e) {
    var b = e.target.closest('.mode-chip'); if (!b) return;
    mode = b.dataset.mode;
    Array.prototype.slice.call(modesEl.querySelectorAll('.mode-chip'))
      .forEach(function (c) { c.classList.toggle('is-on', c === b); });
    document.getElementById('mode-help').textContent = MODE_HELP[mode];
  });

  document.getElementById('start').addEventListener('click', function () {
    if (!ALL.length) {
      drillEl.innerHTML = '<div class="bg-white rounded-2xl border border-rose-200 p-6">' +
        '<h2 class="display text-xl font-bold text-rose-800">This drill could not load its questions</h2>' +
        '<p class="text-slate-700 mt-2">Nothing is wrong with your device — the question bank did not load. ' +
        'Try refreshing, or ring us on <a class="font-semibold text-teal-700 underline" href="tel:+19039136444">(903) 913-6444</a> and we will sort it.</p></div>';
      drillEl.classList.remove('hidden');
      return;
    }
    queue = D.build({ items: ALL, mode: mode, length: parseInt(document.getElementById('len').value, 10), distractorsFrom: ALL });
    idx = 0; score = D.newScore();
    reportEl.classList.add('hidden'); reportEl.innerHTML = '';
    drillEl.classList.remove('hidden');
    render();
    drillEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  function progressBar() {
    var pct = Math.round(idx / queue.length * 100);
    return '<div class="flex items-center justify-between text-sm mb-2">' +
      '<span class="font-semibold text-slate-700">' + (idx + 1) + ' of ' + queue.length + '</span>' +
      '<span class="text-slate-500">' + score.right + ' right · ' + score.wrong + ' to review</span></div>' +
      '<div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-5">' +
      '<div class="h-full bg-teal-600" style="width:' + pct + '%"></div></div>';
  }

  function render() {
    if (idx >= queue.length) return finish();
    var q = queue[idx];
    var body;

    if (mode === 'quiz') {
      body = '<div class="space-y-2" id="opts">' + q.options.map(function (o, i) {
        return '<button type="button" class="opt" data-i="' + i + '">' + esc(o) + '</button>';
      }).join('') + '</div>';
    } else if (mode === 'recall') {
      body = '<form id="recallForm" class="flex flex-col sm:flex-row gap-2">' +
        '<input class="fld tap" id="recallInput" autocomplete="off" autocapitalize="none" spellcheck="false" ' +
        'placeholder="${esc(d.recallPlaceholder)}" aria-label="${esc(d.recallPlaceholder)}">' +
        '<button type="submit" class="tap bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 rounded-xl">Check</button></form>';
    } else {
      body = '<button type="button" id="reveal" class="tap w-full bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl">Reveal the answer</button>';
    }

    drillEl.innerHTML = '<div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6">' +
      progressBar() +
      (q.group ? '<p class="text-xs font-semibold text-teal-700 uppercase tracking-wide">' + esc(q.group) + '</p>' : '') +
      '<p class="text-sm text-slate-500 mt-1">${esc(d.promptLabel)}</p>' +
      '<p class="display text-xl sm:text-2xl font-bold text-navy-900 mt-1">' + nl2br(q.prompt) + '</p>' +
      '<div class="mt-5">' + body + '</div>' +
      '<div id="feedback" class="mt-4"></div></div>';

    if (mode === 'quiz') {
      document.getElementById('opts').addEventListener('click', function (e) {
        var b = e.target.closest('.opt'); if (!b) return;
        var chosen = parseInt(b.dataset.i, 10);
        var correct = chosen === q.correctIndex;
        Array.prototype.slice.call(document.querySelectorAll('.opt')).forEach(function (o, i) {
          o.disabled = true;
          if (i === q.correctIndex) o.classList.add('opt-correct');
          else if (i === chosen) o.classList.add('opt-wrong');
        });
        mark(q, correct);
      });
    } else if (mode === 'recall') {
      var form = document.getElementById('recallForm');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var given = document.getElementById('recallInput').value;
        mark(q, D.matches(given, q.answer), given);
      });
      document.getElementById('recallInput').focus();
    } else {
      document.getElementById('reveal').addEventListener('click', function () {
        document.getElementById('reveal').classList.add('hidden');
        document.getElementById('feedback').innerHTML =
          '<div class="bg-slate-50 border border-slate-200 rounded-xl p-4">' +
          '<p class="font-bold text-navy-900">' + esc(q.answer) + '</p>' +
          (q.detail ? '<p class="text-sm text-slate-600 mt-1">' + esc(q.detail) + '</p>' : '') +
          '<p class="text-sm text-slate-700 mt-3">Did you get it?</p>' +
          '<div class="flex gap-2 mt-2">' +
          '<button type="button" id="gotIt" class="tap bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-2.5 rounded-full">Yes</button>' +
          '<button type="button" id="missedIt" class="tap bg-white border border-slate-300 text-navy-900 font-bold px-5 py-2.5 rounded-full">Not quite</button>' +
          '</div></div>';
        document.getElementById('gotIt').addEventListener('click', function () { score.record(q.group, true); next(); });
        document.getElementById('missedIt').addEventListener('click', function () { score.record(q.group, false); next(); });
      });
    }
  }

  function mark(q, correct, given) {
    score.record(q.group, correct);
    var fb = document.getElementById('feedback');
    fb.innerHTML =
      '<div class="' + (correct ? 'bg-teal-50 border-teal-200' : 'bg-amber-50 border-amber-200') + ' border rounded-xl p-4">' +
      '<p class="font-bold ' + (correct ? 'text-teal-800' : 'text-amber-900') + '">' +
        (correct ? 'That\\'s right.' : 'Not this time.') + '</p>' +
      (correct ? '' : '<p class="text-slate-800 mt-1">The answer is <strong>' + esc(q.answer) + '</strong>' +
        (given && given.trim() ? ', not "' + esc(given.trim()) + '"' : '') + '.</p>') +
      (q.detail ? '<p class="text-sm text-slate-600 mt-1">' + esc(q.detail) + '</p>' : '') +
      '<button type="button" id="nextQ" class="tap mt-3 bg-navy-900 text-white font-bold px-6 py-2.5 rounded-full">' +
        (idx + 1 >= queue.length ? 'See how you did →' : 'Next →') + '</button></div>';
    document.getElementById('nextQ').addEventListener('click', next);
    document.getElementById('nextQ').focus();
  }

  function next() { idx++; render(); }

  function finish() {
    drillEl.classList.add('hidden');
    var attempted = score.attempted();
    var weak = score.weakest();
    var rows = weak.map(function (g) {
      return '<div class="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0">' +
        '<span class="text-slate-700">' + esc(g.group) + '</span>' +
        '<span class="font-semibold text-navy-900">' + g.right + '/' + g.total + '</span></div>';
    }).join('');

    var advice = weak.length && weak[0].pct < 100
      ? 'Your weakest category this round was <strong>' + esc(weak[0].group) + '</strong> (' +
        weak[0].right + ' of ' + weak[0].total + '). That is where the next ten minutes are worth spending.'
      : 'You got everything you attempted. Try a longer round, or switch to typing them from memory.';

    reportEl.innerHTML = '<div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">' +
      '<h2 class="display text-2xl font-bold">' + score.right + ' of ' + attempted + ' right</h2>' +
      '<p class="text-sm text-slate-600 mt-1">How that broke down by category, weakest first:</p>' +
      '<div class="mt-3">' + rows + '</div>' +
      '<p class="text-slate-700 mt-4">' + advice + '</p>' +
      '<div class="mt-5 flex flex-wrap gap-3">' +
        '<button type="button" id="again" class="tap bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-full">Go again</button>' +
        '<a href="${esc(d.reference.href)}" class="tap inline-flex items-center bg-white border border-slate-200 text-navy-900 font-bold px-6 py-3 rounded-full">Read the reference</a>' +
      '</div>' +
      '<p class="text-xs text-slate-500 mt-4">Scored in your browser. Nothing is sent anywhere and nothing is stored.</p></div>';
    reportEl.classList.remove('hidden');
    document.getElementById('again').addEventListener('click', function () { document.getElementById('start').click(); });
    reportEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.PDA && window.PDA.track) {
      try { window.PDA.track('drill_complete', { drill: '${d.path}', mode: mode, right: score.right, attempted: attempted }); } catch (e) {}
    }
  }
})();
</script>
<script defer src="/assets/pda-track.js"></script>
</body>
</html>
`;
}

let written = 0;
for (const d of DRILLS) {
  if (!d.count) {
    console.error(`  ✗ ${d.file} — its data module is missing or empty; not generating a page with no content`);
    process.exitCode = 1;
    continue;
  }
  writeFileSync(join(root, d.file), page(d));
  console.log(`  ✓ ${d.file} — ${d.count} ${d.unit} across ${d.groups.length} categories`);
  written++;
}
console.log(`Drill pages: ${written} generated`);
