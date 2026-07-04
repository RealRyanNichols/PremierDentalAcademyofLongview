// City-page generator for the East Texas local-SEO engine.
// Reads data/cities.mjs and writes dental-assistant-school-<slug>-tx.html for every
// non-`existing` town, plus the /locations hub page. Deterministic output — run it,
// review the diff, commit. Existing hand-built city pages are never overwritten.
//
// Run: node scripts/generate-city-pages.mjs
// Facts (pricing, phone, address) mirror assets/site-facts.js — update BOTH if they change.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { CITIES } from "../data/cities.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://www.premierdentalacademyoflongview.com";

// Real campus photos only (assets/photos/), each with honest Longview-campus alt text.
const PHOTOS = [
  { f: "students-group-sign.jpg", alt: "Premier Dental Academy students gathered by the school sign at the Longview campus" },
  { f: "chairside-patient.jpg",   alt: "Student practicing chairside assisting with a patient at the Longview campus" },
  { f: "grads-certs.jpg",         alt: "Premier Dental Academy graduates holding their certificates in Longview" },
  { f: "classroom-typodont.jpg",  alt: "Student working on a typodont in the Longview classroom" },
  { f: "skills-table.jpg",        alt: "Hands-on skills practice at a training table at the Longview campus" },
  { f: "operatory.jpg",           alt: "The training operatory at Premier Dental Academy in Longview" },
  { f: "sterilization.jpg",       alt: "Sterilization station used for infection-control training in Longview" },
  { f: "group-lineup.jpg",        alt: "A Premier Dental Academy class lined up together at the Longview campus" },
  { f: "study-table.jpg",         alt: "Students studying together at the Longview campus" },
  { f: "tray.jpg",                alt: "A prepared dental instrument tray in the Longview training lab" },
  { f: "chairside-team.jpg",      alt: "Students working as a chairside team at the Longview campus" },
  { f: "grads-sign.jpg",          alt: "Graduates celebrating by the Premier Dental Academy sign in Longview" },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pathFor = (c) => c.path || `/dental-assistant-school-${c.slug}-tx`;
const bySlug = Object.fromEntries(CITIES.map((c) => [c.slug, c]));

function jsonLd(c, url) {
  const faq = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: c.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const school = {
    "@context": "https://schema.org", "@type": "School",
    name: "Premier Dental Academy of Longview",
    url: SITE + "/",
    telephone: "+1-903-913-6444",
    address: { "@type": "PostalAddress", streetAddress: "2800 Gilmer Rd, Suite 106", addressLocality: "Longview", addressRegion: "TX", postalCode: "75604", addressCountry: "US" },
    areaServed: [{ "@type": "City", name: `${c.town}, TX` }, { "@type": "City", name: "Longview, TX" }],
    description: `Registered Dental Assistant (RDA) training serving ${c.town}, TX from one campus in Longview, TX — in-person with evening options, or 100% online.`,
  };
  const course = {
    "@context": "https://schema.org", "@type": "Course",
    name: "Registered Dental Assistant (RDA) Training",
    description: "Hands-on dental assistant training: charting, radiology basics, chairside assisting, infection control, and front-office software. In-person in Longview, TX or 100% online.",
    provider: { "@type": "School", name: "Premier Dental Academy of Longview", sameAs: SITE + "/" },
    offers: [
      { "@type": "Offer", category: "In-Person", price: "3000", priceCurrency: "USD" },
      { "@type": "Offer", category: "Online", price: "397", priceCurrency: "USD" },
    ],
    hasCourseInstance: [
      { "@type": "CourseInstance", courseMode: "Onsite", location: { "@type": "Place", name: "Premier Dental Academy of Longview", address: "2800 Gilmer Rd, Suite 106, Longview, TX 75604" } },
      { "@type": "CourseInstance", courseMode: "Online" },
    ],
  };
  const crumbs = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "Towns we serve", item: SITE + "/locations" },
      { "@type": "ListItem", position: 3, name: `${c.town}, TX`, item: url },
    ],
  };
  return [school, course, faq, crumbs]
    .map((o) => `  <script type="application/ld+json">\n  ${JSON.stringify(o)}\n  </script>`)
    .join("\n");
}

function head(c, url) {
  const title = `Dental Assistant School Near ${c.town}, TX | Premier Dental Academy`;
  const desc = `Become a Registered Dental Assistant from ${c.town}, TX. Train hands-on at our Longview campus (about ${c.minutes} minutes away, evening options) or 100% online. In-person $3,000 paid in full ($500 down on a plan) or online $397.`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon.png" />
  <link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon-48.png" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:wght@500;600;700&display=swap" rel="stylesheet" />
  <style>
    body { font-family: 'Inter', sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased; }
    .display { font-family: 'Fraunces', serif; }
    .gradient-text { background: linear-gradient(90deg, #0d9488 0%, #0891b2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  </style>
  <script src="/assets/pda-seo.js" defer></script>
  <script src="/assets/ask-premier.js" defer></script>
  <script src="/assets/pda-nav.js" defer></script>
  <script defer src="/_vercel/insights/script.js"></script>
  <script defer src="/_vercel/speed-insights/script.js"></script>

  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Premier Dental Academy of Longview" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(`Train as a Registered Dental Assistant from ${c.town} — hands-on at our Longview campus (evening options) or 100% online.`)}" />
  <meta property="og:image" content="${SITE}/assets/og-cover.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(`Train as a Registered Dental Assistant from ${c.town} — in-person at our Longview campus or 100% online.`)}" />
  <meta name="twitter:image" content="${SITE}/assets/og-cover.png" />

${jsonLd(c, url)}
</head>`;
}

const NAV = `
<nav class="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2 font-bold text-slate-900">
      <img src="/assets/logo-mark.png" alt="Premier Dental Academy of Longview" width="36" height="36" class="w-9 h-9 rounded-lg shrink-0" />
      <span class="text-base sm:text-lg">Premier Dental Academy</span>
    </a>
    <div class="flex items-center gap-3">
      <a href="/login" class="hidden md:inline-flex text-sm font-medium text-slate-700 hover:text-teal-700">Sign in</a>
      <a href="/enroll" data-event="location_page_cta_click" class="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-sm">Enroll →</a>
    </div>
  </div>
</nav>`;

function twoWays(c) {
  const inPerson = `
      <div class="bg-slate-50 rounded-xl p-5 flex flex-col">
        <div class="font-semibold text-slate-900 text-base">🦷 In-Person in Longview</div>
        <p class="text-slate-600 mt-1">Hands-on, chairside training at our one campus — about ${c.minutes} minutes from ${esc(c.town)} via ${esc(c.route)}. Evening options are available so you can keep your current job.</p>
        <p class="text-slate-900 font-semibold mt-3">$3,000 paid in full · or $500 down</p>
        <p class="text-slate-500 text-xs mt-1">On a plan it's $3,500 total: $500 down, then simple weekly or monthly payments.</p>
        <a href="/enroll?plan=in-person" data-event="location_page_cta_click" class="mt-4 inline-block text-center bg-teal-700 hover:bg-teal-800 text-white font-semibold px-4 py-2.5 rounded-full">Enroll in-person →</a>
      </div>`;
  const online = `
      <div class="bg-slate-50 rounded-xl p-5 flex flex-col">
        <div class="font-semibold text-slate-900 text-base">💻 Online from ${esc(c.town)}</div>
        <p class="text-slate-600 mt-1">The same curriculum, fully online and self-paced — no drive at all. Perfect if you're juggling family and work${c.band === "far" ? ", or if the distance makes weekly trips unrealistic" : ""}.</p>
        <p class="text-slate-900 font-semibold mt-3">$397 · self-paced</p>
        <p class="text-slate-500 text-xs mt-1">Start whenever you're ready and move at your own pace.</p>
        <a href="/enroll?plan=online" data-event="location_page_cta_click" class="mt-4 inline-block text-center bg-teal-700 hover:bg-teal-800 text-white font-semibold px-4 py-2.5 rounded-full">Enroll online →</a>
      </div>`;
  const cards = c.band === "far" ? online + inPerson : inPerson + online;
  return `
  <div class="bg-white rounded-2xl border-2 border-teal-200 shadow-sm p-5 sm:p-6 mb-10">
    <p class="text-sm font-bold uppercase tracking-widest text-teal-700">Two ways to train from ${esc(c.town)}</p>
    <div class="grid sm:grid-cols-2 gap-4 mt-5 text-sm">${cards}
    </div>
  </div>`;
}

function photoStrip(c, idx) {
  const pick = [0, 1, 2].map((k) => PHOTOS[(idx * 3 + k) % PHOTOS.length]);
  return `
  <section class="mt-12">
    <div class="text-center max-w-2xl mx-auto mb-6">
      <p class="text-xs uppercase tracking-widest text-teal-700 font-bold">See inside the school</p>
      <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">Real hands, real gear &mdash; about ${c.minutes} minutes from ${esc(c.town)}.</h2>
      <p class="text-slate-600 mt-2 text-sm">Every photo is an actual Premier Dental Academy class at our Longview campus.</p>
    </div>
    <div class="grid grid-cols-3 gap-2 sm:gap-3">
${pick.map((p) => `      <figure class="rounded-xl overflow-hidden shadow-sm border border-white aspect-[4/5] bg-white"><img src="/assets/photos/${p.f}" alt="${esc(p.alt)}" class="w-full h-full object-cover transition duration-500 hover:scale-105" loading="lazy"></figure>`).join("\n")}
    </div>
  </section>`;
}

function nearbySection(c) {
  const links = (c.nearby || []).map((s) => bySlug[s]).filter(Boolean);
  if (!links.length) return "";
  return `
  <section class="mt-12">
    <h2 class="display text-2xl font-bold">Nearby towns we also serve</h2>
    <p class="text-slate-600 mt-2 text-sm">One campus in Longview, students from all over East Texas. If you're closer to one of these, that page has the drive details for your side of the woods:</p>
    <div class="mt-4 flex flex-wrap gap-2">
${links.map((n) => `      <a href="${pathFor(n)}" class="bg-white border border-slate-200 hover:border-teal-400 text-slate-700 text-sm font-medium px-4 py-2 rounded-full">${esc(n.town)}, TX →</a>`).join("\n")}
      <a href="/locations" class="bg-teal-50 border border-teal-200 hover:border-teal-400 text-teal-800 text-sm font-medium px-4 py-2 rounded-full">All East Texas towns →</a>
    </div>
  </section>`;
}

// Payment calculator — identical embed to the hand-built city pages.
const CALC = `
<section class="bg-white border-y border-slate-200 mt-12 rounded-2xl border border-slate-200">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
    <div class="text-center max-w-2xl mx-auto mb-8">
      <p class="text-xs uppercase tracking-widest text-teal-700 font-semibold mb-2">No surprises</p>
      <h2 class="text-2xl sm:text-3xl font-bold text-slate-900" style="font-family:Fraunces,serif">See exactly what you'll pay</h2>
      <p class="text-slate-600 mt-3">You don't pay it all at once. Pick a path and watch your real payment update.</p>
    </div>
    <div class="grid md:grid-cols-2 gap-6 items-start">
      <div class="bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <div class="grid grid-cols-2 gap-3" id="pdacalc-plans">
          <button type="button" data-plan="inperson" class="pdacalc-opt text-left rounded-xl border-2 border-teal-600 bg-teal-50 p-4 ring-4 ring-teal-600/10">
            <div class="text-[11px] uppercase tracking-wide font-bold text-slate-500">In person</div>
            <div class="text-2xl font-bold text-slate-900" style="font-family:Fraunces,serif">$500 <span class="text-sm font-medium text-slate-500">down</span></div>
            <div class="text-xs text-slate-600">$3,000 total &middot; weekly or monthly</div>
          </button>
          <button type="button" data-plan="online" class="pdacalc-opt text-left rounded-xl border-2 border-slate-200 bg-white p-4">
            <div class="text-[11px] uppercase tracking-wide font-bold text-slate-500">Online</div>
            <div class="text-2xl font-bold text-slate-900" style="font-family:Fraunces,serif">$397</div>
            <div class="text-xs text-slate-600">Sale (reg $997) &middot; start today</div>
          </button>
        </div>
        <div id="pdacalc-body" class="mt-5">
          <div class="flex items-center justify-between text-sm text-slate-600 mb-1">
            <span>Pay it off</span>
            <span class="inline-flex bg-slate-200 rounded-full p-1">
              <button type="button" id="pdacalc-wk" class="px-3 py-1 rounded-full text-xs font-semibold text-slate-600">Weekly</button>
              <button type="button" id="pdacalc-mo" class="px-3 py-1 rounded-full text-xs font-semibold bg-white text-teal-700 shadow-sm">Monthly</button>
            </span>
          </div>
          <input type="range" id="pdacalc-term" min="2" max="12" value="6" step="1" class="w-full accent-teal-600">
          <div class="flex items-center justify-between text-sm text-slate-600 mt-1">
            <span id="pdacalc-termlbl">6 months</span><span>$3,500 total</span>
          </div>
        </div>
      </div>
      <div>
        <div class="bg-slate-900 text-white rounded-2xl p-6 flex items-end justify-between">
          <div>
            <div class="text-sm text-slate-400" id="pdacalc-reslbl">$500 down today, then</div>
            <div class="text-4xl font-bold text-amber-400" style="font-family:Fraunces,serif" id="pdacalc-amt">$500/mo</div>
          </div>
          <div class="text-right text-sm text-slate-400" id="pdacalc-count">6 payments</div>
        </div>
        <a href="/enroll" data-event="enroll_click" class="mt-4 inline-flex w-full items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-full shadow-md">Reserve my spot &rarr;</a>
        <p class="text-center text-xs text-slate-500 mt-3">Up to 12 weekly or monthly payments. Certificate issued when tuition is paid in full. Klarna or Afterpay too. WIOA funding through Workforce Solutions East Texas.</p>
      </div>
    </div>
  </div>
</section>
<script>
(function(){
  var TOTAL=3500,DOWN=500,plan="inperson",mode="monthly";
  var root=document.getElementById("pdacalc-plans");if(!root)return;
  var body=document.getElementById("pdacalc-body"),term=document.getElementById("pdacalc-term");
  var amt=document.getElementById("pdacalc-amt"),cnt=document.getElementById("pdacalc-count"),lbl=document.getElementById("pdacalc-termlbl"),reslbl=document.getElementById("pdacalc-reslbl");
  var wk=document.getElementById("pdacalc-wk"),mo=document.getElementById("pdacalc-mo");
  function on(b){b.classList.add("bg-white","text-teal-700","shadow-sm");b.classList.remove("text-slate-600");}
  function off(b){b.classList.remove("bg-white","text-teal-700","shadow-sm");b.classList.add("text-slate-600");}
  function render(){
    if(plan==="online"){reslbl.textContent="One-time (reg $997)";amt.textContent="$397";cnt.textContent="start today";return;}
    var n=parseInt(term.value,10),per=Math.round((TOTAL-DOWN)/n),u=mode==="weekly"?"wk":"mo";
    reslbl.textContent="$500 down today, then";amt.textContent="$"+per.toLocaleString()+"/"+u;
    cnt.textContent=n+" payments";lbl.textContent=n+(mode==="weekly"?" weeks":" months");
  }
  root.querySelectorAll(".pdacalc-opt").forEach(function(b){b.addEventListener("click",function(){
    plan=b.dataset.plan;
    root.querySelectorAll(".pdacalc-opt").forEach(function(x){
      var ac=x===b;
      x.classList.toggle("border-teal-600",ac);x.classList.toggle("bg-teal-50",ac);x.classList.toggle("ring-4",ac);x.classList.toggle("ring-teal-600/10",ac);
      x.classList.toggle("border-slate-200",!ac);x.classList.toggle("bg-white",!ac);
    });
    body.style.display=plan==="online"?"none":"block";render();
  });});
  wk.addEventListener("click",function(){mode="weekly";on(wk);off(mo);term.min=4;term.max=12;term.value=12;render();});
  mo.addEventListener("click",function(){mode="monthly";on(mo);off(wk);term.min=1;term.max=3;term.value=3;render();});
  term.addEventListener("input",render);render();
})();
</script>`;

const FOOTER = `
<footer class="bg-slate-900 text-slate-300 py-8 mt-12">
  <div class="max-w-7xl mx-auto px-6 text-xs text-center space-y-2">
    <div class="flex flex-wrap gap-x-4 gap-y-1 justify-center">
      <a href="/" class="hover:text-white">Home</a>
      <a href="/classes" class="hover:text-white">Classes</a>
      <a href="/enroll" class="hover:text-white">Enroll</a>
      <a href="/salary" class="hover:text-white">Salary</a>
      <a href="/locations" class="hover:text-white">Towns we serve</a>
      <a href="/become-a-dental-assistant-in-texas" class="hover:text-white">Become an RDA</a>
      <a href="/contact" class="hover:text-white">Contact</a>
    </div>
    <div>© 2026 Premier Dental Academy of Longview · 2800 Gilmer Rd, Suite 106, Longview, TX 75604</div>
  </div>
</footer>`;

// Two rotating variants of the shared "what you'll learn" section keep even the
// factual blocks from being word-for-word identical across every page.
function learnSection(c, idx) {
  const tools = idx % 2 === 0
    ? `You can get a feel for the work right now, for free. Try our <a href="/skills-lab" class="text-teal-700 underline">Skills Lab</a> and the <a href="/tools/practice-pro" class="text-teal-700 underline">Practice Pro</a> charting trainer — the same kinds of tools you'll use on the job.`
    : `Want to test-drive it before you spend a dollar? The free <a href="/tools/practice-exam" class="text-teal-700 underline">Texas RDA practice exam</a> and our <a href="/tools/how-to-chart" class="text-teal-700 underline">charting trainer</a> show you exactly what the work feels like.`;
  return `
    <section>
      <h2 class="display text-2xl font-bold">What you'll learn</h2>
      <p class="text-slate-600 mt-2">${idx % 2 === 0 ? "Both paths cover the core skills a dental office actually needs from day one:" : "In-person or online, the curriculum is the same set of skills offices hire for:"}</p>
      <ul class="mt-3 space-y-2 text-slate-700 text-sm">
        <li class="flex gap-2"><span class="text-teal-600 font-bold">✓</span> <strong>Charting</strong> — reading the tooth chart and recording conditions and treatment accurately.</li>
        <li class="flex gap-2"><span class="text-teal-600 font-bold">✓</span> <strong>Radiology basics</strong> — how dental x-rays work and how they fit into patient care.</li>
        <li class="flex gap-2"><span class="text-teal-600 font-bold">✓</span> <strong>Chairside assisting</strong> — setting up, passing instruments, and supporting the dentist during procedures.</li>
        <li class="flex gap-2"><span class="text-teal-600 font-bold">✓</span> <strong>Front-office software</strong> — the practice-management tools offices use to schedule, chart, and bill.</li>
        <li class="flex gap-2"><span class="text-teal-600 font-bold">✓</span> <strong>Infection control</strong> — sterilization and safety the way real offices run it.</li>
      </ul>
      <p class="text-slate-600 mt-4">${tools}</p>
    </section>`;
}

function page(c, idx) {
  const url = SITE + pathFor(c);
  return `${head(c, url)}
<body class="bg-gradient-to-br from-slate-50 to-cyan-50/40 min-h-screen pda-tinted">
${NAV}

<main class="max-w-3xl mx-auto px-5 sm:px-6 py-10 sm:py-14">

  <header class="mb-8 bg-gradient-to-b from-[#0a1226] to-[#070d1f] text-white rounded-3xl px-6 sm:px-10 py-10 sm:py-14">
    <span class="bg-amber-400/20 text-amber-200 text-xs font-bold uppercase tracking-widest px-2 py-1 rounded">Serving ${esc(c.town)} &amp; ${esc(c.county)} County</span>
    <h1 class="display text-4xl sm:text-5xl font-bold mt-3 leading-tight">Dental assistant school <span class="gradient-text">near ${esc(c.town)}, TX</span></h1>
    <p class="text-slate-300 mt-4 text-lg">${esc(c.intro)}</p>
  </header>
${twoWays(c)}
  <article class="space-y-9">
    <section>
      <h2 class="display text-2xl font-bold">From ${esc(c.town)} to the classroom</h2>
      <p class="text-slate-600 mt-2">${esc(c.commute)}</p>
      <p class="text-slate-500 text-sm mt-3">Our one and only campus: 2800 Gilmer Rd, Suite 106, Longview, TX 75604 — about ${c.miles} miles from ${esc(c.town)} via ${esc(c.route)}. Distances and drive times are approximate; check your own route.</p>
    </section>
${learnSection(c, idx)}
    <section>
      <h2 class="display text-2xl font-bold">Pay &amp; funding</h2>
      <p class="text-slate-600 mt-2">We keep tuition straightforward. In-person is <strong>$3,000 paid in full</strong>, or <strong>$500 down on a $3,500 payment plan</strong> with simple weekly or monthly payments. Online is a flat <strong>$397</strong>, self-paced. No surprises and nothing buried in fine print.</p>
      <p class="text-slate-600 mt-3">Depending on your situation, you <em>may</em> qualify for WIOA workforce funding through your local Workforce Solutions office — we can't promise anything, but we're glad to point you in the right direction. <a href="/apply" class="text-teal-700 underline">Apply or reach out</a> and we'll talk through your options. Wondering what dental assistants earn in East Texas? See our <a href="/salary" class="text-teal-700 underline">salary page</a>.</p>
    </section>

    <section>
      <h2 class="display text-2xl font-bold">New to dental assisting?</h2>
      <p class="text-slate-600 mt-2">Start with our plain-English guide: <a href="/become-a-dental-assistant-in-texas" class="text-teal-700 underline">How to become a dental assistant in Texas</a> — the requirements, training, registration, cost, and timeline, step by step.</p>
    </section>

    <section>
      <h2 class="display text-2xl font-bold mb-4">${esc(c.town)}-area FAQs</h2>
      <div class="space-y-3">
${c.faqs.map((f) => `        <details class="bg-white rounded-xl border border-slate-200 p-4">
          <summary class="font-semibold cursor-pointer">${esc(f.q)}</summary>
          <p class="text-slate-600 mt-2 text-sm">${esc(f.a)}</p>
        </details>`).join("\n")}
      </div>
    </section>
  </article>
${photoStrip(c, idx)}
  <section class="mt-12 bg-gradient-to-br from-teal-700 to-teal-600 text-white rounded-3xl p-8 text-center">
    <h2 class="display text-3xl font-bold">Start training from ${esc(c.town)}</h2>
    <p class="text-teal-50 mt-2 max-w-xl mx-auto">${c.band === "far" ? "Online from home — or in-person in Longview if the drive works for you. Pick what fits your life and we'll help you get started." : "In-person in Longview or online from home — pick what fits your life and we'll help you get started."}</p>
    <div class="mt-6 flex flex-wrap gap-3 justify-center">
      <a href="/enroll?plan=in-person" data-event="location_page_cta_click" class="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-full shadow">Enroll in-person →</a>
      <a href="/enroll?plan=online" data-event="location_page_cta_click" class="bg-white text-teal-800 hover:bg-teal-50 font-bold px-6 py-3 rounded-lg shadow">Enroll online →</a>
    </div>
    <div class="mt-4 flex flex-wrap gap-3 justify-center">
      <a href="/calendar" data-event="location_page_cta_click" class="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-6 py-3 rounded-lg">See class dates</a>
      <a href="/apply" data-event="location_page_cta_click" class="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-6 py-3 rounded-lg">Apply now</a>
      <a href="tel:+19039136444" class="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-6 py-3 rounded-lg">📞 Call or text Amanda (903) 913-6444</a>
    </div>
  </section>
${nearbySection(c)}
${CALC}
</main>
${FOOTER}
</body>
</html>
`;
}

function locationsHub() {
  const url = SITE + "/locations";
  const sorted = [...CITIES].sort((a, b) => a.miles - b.miles);
  const cards = sorted.map((c) => `      <a href="${pathFor(c)}" class="block bg-white rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition p-5">
        <div class="flex items-baseline justify-between gap-2">
          <span class="font-bold text-slate-900">${esc(c.town)}, TX</span>
          <span class="text-xs text-slate-500 whitespace-nowrap">~${c.minutes} min</span>
        </div>
        <p class="text-slate-600 text-sm mt-1">${esc(c.blurb)}</p>
        <span class="inline-block mt-3 text-teal-700 text-sm font-semibold">${esc(c.town)} details →</span>
      </a>`).join("\n");
  const itemList = {
    "@context": "https://schema.org", "@type": "ItemList",
    name: "East Texas towns served by Premier Dental Academy of Longview",
    itemListElement: sorted.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: `${c.town}, TX`, url: SITE + pathFor(c) })),
  };
  const title = "Dental Assistant School Near You in East Texas | Towns We Serve";
  const desc = "One campus in Longview, TX — students from all over East Texas. Find the drive time from your town, or train 100% online. Tyler, Marshall, Kilgore, Gilmer, Carthage, Mount Pleasant and more.";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon.png" />
  <link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon-48.png" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:wght@500;600;700&display=swap" rel="stylesheet" />
  <style>
    body { font-family: 'Inter', sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased; }
    .display { font-family: 'Fraunces', serif; }
    .gradient-text { background: linear-gradient(90deg, #0d9488 0%, #0891b2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  </style>
  <script src="/assets/pda-seo.js" defer></script>
  <script src="/assets/ask-premier.js" defer></script>
  <script src="/assets/pda-nav.js" defer></script>
  <script defer src="/_vercel/insights/script.js"></script>
  <script defer src="/_vercel/speed-insights/script.js"></script>
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Premier Dental Academy of Longview" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:image" content="${SITE}/assets/og-cover.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image" content="${SITE}/assets/og-cover.png" />
  <script type="application/ld+json">
  ${JSON.stringify(itemList)}
  </script>
</head>
<body class="bg-gradient-to-br from-slate-50 to-cyan-50/40 min-h-screen pda-tinted">
${NAV}

<main class="max-w-5xl mx-auto px-5 sm:px-6 py-10 sm:py-14">
  <header class="mb-10 text-center max-w-3xl mx-auto">
    <span class="bg-teal-100 text-teal-800 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">One campus · all of East Texas</span>
    <h1 class="display text-4xl sm:text-5xl font-bold mt-4 leading-tight">Dental assistant training <span class="gradient-text">near your town</span></h1>
    <p class="text-slate-600 mt-4 text-lg">Our campus is in Longview — 2800 Gilmer Rd, Suite 106 — and our students come from all over the piney woods. Find your town below for honest drive times and local answers, or skip the drive entirely with the <a href="/enroll?plan=online" class="text-teal-700 underline">100% online program</a>.</p>
  </header>

  <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
${cards}
  </div>

  <p class="text-slate-500 text-sm mt-8 text-center">Don't see your town? If you can get to Longview, you can train with us — and if you can't, the online program comes to you. <a href="/contact" class="text-teal-700 underline">Ask us anything</a>.</p>

  <section class="mt-12 bg-gradient-to-br from-teal-700 to-teal-600 text-white rounded-3xl p-8 text-center">
    <h2 class="display text-3xl font-bold">Ready when you are</h2>
    <p class="text-teal-50 mt-2 max-w-xl mx-auto">In-person in Longview or online from anywhere in East Texas.</p>
    <div class="mt-6 flex flex-wrap gap-3 justify-center">
      <a href="/enroll" data-event="location_page_cta_click" class="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-full shadow">Enroll now →</a>
      <a href="/tour" data-event="location_page_cta_click" class="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-6 py-3 rounded-lg">Book a campus tour</a>
      <a href="tel:+19039136444" class="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-6 py-3 rounded-lg">📞 Call or text Amanda (903) 913-6444</a>
    </div>
  </section>
</main>
${FOOTER}
</body>
</html>
`;
}

let n = 0;
CITIES.filter((c) => !c.existing).forEach((c, idx) => {
  const file = join(root, `dental-assistant-school-${c.slug}-tx.html`);
  writeFileSync(file, page(c, idx));
  n++;
  console.log("wrote " + file.replace(root + "/", ""));
});
writeFileSync(join(root, "locations.html"), locationsHub());
console.log("wrote locations.html");
console.log(`✓ generated ${n} city pages + locations hub`);
