#!/usr/bin/env node
/**
 * Social-preview (Open Graph / Twitter card) image generator.
 *
 * Renders a branded 1200×630 card at 2× device pixels (2400×1260, retina-crisp)
 * for every blog post, plus the site-wide default cover. Design system = the live
 * site: Fraunces display headline, Inter UI text, slate-900 / teal-700 / amber-500
 * palette, the graduation-tooth logo mark, and the Practice Pro anatomical arch
 * (assets/tooth-shapes.js) as line art. Nothing is invented: every string on the
 * card comes from the post itself (og:title + its category eyebrow) or from
 * assets/site-facts.js.
 *
 *   node scripts/generate-og.mjs                 # every blog post + assets/og-cover.jpg
 *   node scripts/generate-og.mjs --slug my-post  # one post
 *   node scripts/generate-og.mjs --missing       # only posts whose card is absent
 *   node scripts/generate-og.mjs --site          # only the site cover
 *   node scripts/generate-og.mjs --preview out.html --slug my-post   # dump the HTML
 *
 * Needs Playwright's Chromium. Uses the project-local `playwright` package if
 * installed, otherwise the machine's global install (`npm i -g playwright`).
 * Fonts are vendored in scripts/og-fonts (SIL OFL) so renders are reproducible
 * offline and never fall back to a system serif.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BLOG_DIR = join(ROOT, "blog");
const OUT_DIR = join(ROOT, "assets", "og");
const FONT_DIR = join(__dirname, "og-fonts");
const SITE = "https://www.premierdentalacademyoflongview.com";

// ── CLI ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const ONLY_SLUG = opt("--slug");
const PREVIEW = opt("--preview");
const MISSING_ONLY = flag("--missing");
const SITE_ONLY = flag("--site");
const JPEG_QUALITY = +(opt("--quality") || 86);

// ── Facts (single source of truth) ───────────────────────────────────────────
function loadFacts() {
  const src = readFileSync(join(ROOT, "assets", "site-facts.js"), "utf8");
  const g = {};
  new Function("globalThis", "window", src)(g, undefined);
  return g.PDA_FACTS;
}
const FACTS = loadFacts();

// ── Playwright resolution (local → global) ───────────────────────────────────
async function loadPlaywright() {
  const req = createRequire(import.meta.url);
  try { return req("playwright"); } catch {}
  try { return req("playwright-core"); } catch {}
  let globalRoot = "";
  try { globalRoot = execSync("npm root -g", { encoding: "utf8" }).trim(); } catch {}
  for (const name of ["playwright", "playwright-core"]) {
    try { return createRequire(join(globalRoot, "x.js"))(name); } catch {}
  }
  throw new Error("Playwright not found. Install it locally (npm i -D playwright) or globally (npm i -g playwright).");
}

// ── Post metadata extraction ─────────────────────────────────────────────────
const ENTITIES = { "&amp;": "&", "&quot;": '"', "&#39;": "'", "&#x27;": "'", "&apos;": "'", "&lt;": "<", "&gt;": ">", "&nbsp;": " ", "&#x2019;": "’", "&rsquo;": "’", "&lsquo;": "‘", "&ldquo;": "“", "&rdquo;": "”", "&mdash;": "—", "&ndash;": "–", "&hellip;": "…" };
const decode = (s) => s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&[a-z]+;/gi, (m) => ENTITIES[m] ?? m);
const clean = (s) => decode(s).replace(/\s+/g, " ").trim();
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function attr(html, re) { const m = html.match(re); return m ? clean(m[1]) : ""; }

function readPost(slug) {
  const html = readFileSync(join(BLOG_DIR, slug + ".html"), "utf8");
  const ogTitle = attr(html, /<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i);
  const h1 = attr(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, "");
  const docTitle = attr(html, /<title>([\s\S]*?)<\/title>/i).replace(/\s*[|·–—-]\s*Premier Dental Academy.*$/i, "");
  const eyebrowRaw = attr(html, /<p class="text-xs uppercase tracking-widest text-teal-700 font-semibold">([\s\S]*?)<\/p>/i).replace(/<[^>]+>/g, "");
  const redirect = /<meta\s+http-equiv=["']refresh["']/i.test(html);
  return { slug, title: ogTitle || h1 || docTitle, eyebrow: tidyEyebrow(eyebrowRaw), redirect };
}

// The category eyebrow sometimes carries a date / read time or is blank; keep
// only the category words so the card never shows stale metadata.
function tidyEyebrow(s) {
  const parts = s.split(/\s*[·/|]\s*/).map((p) => p.trim()).filter(Boolean)
    .filter((p) => !/\b\d{1,2},?\s+\d{4}\b/.test(p) && !/\bmin read\b/i.test(p) && !/^(est|updated)\b/i.test(p));
  return parts.slice(0, 2).join(" · ");
}

// Category family → accent + icon. Keyed on the eyebrow text (then the slug).
const FAMILIES = [
  { key: "money", test: /money|fund|tuition|budget|cost|pay|afford|price|\$/i, accent: "#f59e0b", accent2: "#fbbf24", label: "Money & funding", icon: "money" },
  { key: "local", test: /local|longview|east texas|tyler|marshall|kilgore|county|near|commut|, tx\b/i, accent: "#38bdf8", accent2: "#7dd3fc", label: "Local · East Texas", icon: "pin" },
  { key: "employers", test: /employer|office|hiring|retention|job post/i, accent: "#60a5fa", accent2: "#93c5fd", label: "Employers & offices", icon: "building" },
  { key: "encouragement", test: /encourage|positiv|you.ve got|motivat|letter|permission|proud|behind|timeline|doubt|hard season|regret|confidence/i, accent: "#fb7185", accent2: "#fda4af", label: "Encouragement", icon: "sun" },
  { key: "feature", test: /feature|spotlight|free tool|practice pro|skills lab|trainer|tool|software|walkthrough|mobile|app\b/i, accent: "#22d3ee", accent2: "#67e8f9", label: "Free tools", icon: "spark" },
  { key: "exam", test: /exam|licens|credential|accredit|registered|rda\b|state board|certif/i, accent: "#34d399", accent2: "#6ee7b7", label: "Exam prep & credentials", icon: "shield" },
  { key: "howto", test: /how.to|basics|skills|chairside|clinical|charting|x.ray|safety|fundamental|front desk|verify/i, accent: "#2dd4bf", accent2: "#5eead4", label: "How-to", icon: "check" },
  { key: "classes", test: /class|enroll|cohort|schedule|start|now enrolling|august|september|november|october/i, accent: "#14b8a6", accent2: "#2dd4bf", label: "Classes & enrollment", icon: "calendar" },
  { key: "inside", test: /inside pda|our way|behind the scenes|student life|patient safety|documentation/i, accent: "#14b8a6", accent2: "#5eead4", label: "Inside PDA", icon: "tooth" },
  { key: "career", test: /career|path|senior|college|high school|first job|interview|resume|advance|hygienist|specialt|choos/i, accent: "#14b8a6", accent2: "#5eead4", label: "Career", icon: "briefcase" },
];
const DEFAULT_FAMILY = { key: "career", accent: "#14b8a6", accent2: "#5eead4", label: "From the blog", icon: "briefcase" };

function familyFor(post) {
  const hay = post.eyebrow || "";
  for (const f of FAMILIES) if (f.test.test(hay)) return f;
  for (const f of FAMILIES) if (f.test.test(post.slug.replace(/-/g, " "))) return f;
  return DEFAULT_FAMILY;
}

// ── Icons (hand-drawn 24×24 stroke glyphs, no emoji) ─────────────────────────
const ICONS = {
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12h18"/>',
  money: '<circle cx="12" cy="12" r="9"/><path d="M12 6.5v11M15 9.2c-.5-1-1.6-1.5-3-1.5-1.7 0-2.8.8-2.8 2 0 2.6 5.8 1.2 5.8 4 0 1.3-1.2 2.1-3 2.1-1.5 0-2.7-.6-3.2-1.7"/>',
  pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 21v-4h6v4M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM5 17l.8 2.2L8 20l-2.2.8L5 23l-.8-2.2L2 20l2.2-.8zM19 3l.6 1.6L21 5.2l-1.4.6L19 7.4l-.6-1.6L17 5.2l1.4-.6z"/>',
  shield: '<path d="M12 2.5l7.5 3v6c0 5-3.3 8.4-7.5 10-4.2-1.6-7.5-5-7.5-10v-6z"/><path d="M8.8 12.2l2.2 2.2 4.4-4.6"/>',
  check: '<rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M8 12.2l2.6 2.6L16 9.4M8 8h3"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h3M13 14h3M8 17.5h3"/>',
  tooth: '<path d="M7.6 3.5c1.6 0 2.6.9 4.4.9s2.8-.9 4.4-.9c2.6 0 4.1 2.2 4.1 4.9 0 3.6-2.3 5.6-2.8 9-.3 2.1-.7 4.1-2.1 4.1-1.6 0-1.6-4.3-3.6-4.3s-2 4.3-3.6 4.3c-1.4 0-1.8-2-2.1-4.1C5.8 14 3.5 12 3.5 8.4c0-2.7 1.5-4.9 4.1-4.9z"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.briefcase}</svg>`;

// ── Template ─────────────────────────────────────────────────────────────────
// Everything is inlined (data: URIs / inline script): the page is rendered from
// a blank origin, so file:// subresources would be blocked.
const dataUri = (path, mime) => `data:${mime};base64,${readFileSync(path).toString("base64")}`;
const fontUrl = (f) => dataUri(join(FONT_DIR, f), "font/woff2");
const LOGO = dataUri(join(ROOT, "assets", "icon-512.png"), "image/png");
const TOOTH_LIB = readFileSync(join(ROOT, "assets", "tooth-shapes.js"), "utf8").replace(/<\/script/gi, "<\\/script");

function headlineSize(title) {
  const n = title.length;
  if (n <= 34) return 68;
  if (n <= 48) return 60;
  if (n <= 64) return 54;
  if (n <= 80) return 48;
  if (n <= 96) return 44;
  return 40;
}

function render({ kind, title, eyebrow, family, sub }) {
  const size = headlineSize(title);
  const A = family.accent, A2 = family.accent2;
  const phone = FACTS.phone.display;
  const city = FACTS.address.city + ", " + FACTS.address.state;

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<style>
@font-face{font-family:"Inter";src:url("${fontUrl("inter-latin-var.woff2")}") format("woff2");font-weight:100 900;font-style:normal;font-display:block}
@font-face{font-family:"Fraunces";src:url("${fontUrl("fraunces-latin-var.woff2")}") format("woff2");font-weight:100 900;font-style:normal;font-display:block}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1200px;height:630px;overflow:hidden;background:#0b1728}
body{font-family:"Inter",system-ui,sans-serif;color:#fff;-webkit-font-smoothing:antialiased;position:relative}
.bg{position:absolute;inset:0;background:
  radial-gradient(900px 620px at 92% 110%, ${hex(A, .42)} 0%, ${hex(A, .16)} 34%, transparent 62%),
  radial-gradient(760px 520px at 100% -10%, rgba(37,99,235,.34) 0%, transparent 60%),
  radial-gradient(640px 420px at -8% 108%, rgba(15,118,110,.40) 0%, transparent 60%),
  linear-gradient(118deg,#0b1728 0%,#0f2238 46%,#0f3a45 100%)}
.grid{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.085) 1px,transparent 1.4px);background-size:28px 28px;background-position:14px 14px;
  -webkit-mask-image:linear-gradient(115deg,rgba(0,0,0,.9) 0%,rgba(0,0,0,.35) 55%,rgba(0,0,0,.05) 100%);mask-image:linear-gradient(115deg,rgba(0,0,0,.9) 0%,rgba(0,0,0,.35) 55%,rgba(0,0,0,.05) 100%)}
.vignette{position:absolute;inset:0;box-shadow:inset 0 0 160px rgba(3,10,20,.55)}
.edge{position:absolute;left:0;right:0;bottom:0;height:7px;background:linear-gradient(90deg,#f59e0b 0,#f59e0b 220px,${A} 220px,${A} 100%)}
.arch{position:absolute;right:-190px;top:120px;width:860px;height:600px;
  -webkit-mask-image:linear-gradient(97deg,transparent 4%,rgba(0,0,0,.5) 34%,#000 62%);mask-image:linear-gradient(97deg,transparent 4%,rgba(0,0,0,.5) 34%,#000 62%)}
.arch svg{width:100%;height:100%;overflow:visible}
.wrap{position:absolute;inset:0;padding:58px 64px 54px;display:flex;flex-direction:column}
.top{display:flex;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:18px}
.logo{width:64px;height:64px;border-radius:18px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 30px -10px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.35) inset}
.logo img{width:52px;height:52px;display:block}
.name{font-weight:800;font-size:23px;letter-spacing:-.01em;line-height:1.1}
.name small{display:block;font-weight:500;font-size:15px;color:rgba(255,255,255,.72);letter-spacing:.01em;margin-top:5px}
.pill{display:flex;align-items:center;gap:9px;font-weight:600;font-size:14px;color:rgba(255,255,255,.86);border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);padding:9px 15px 9px 12px;border-radius:999px;backdrop-filter:blur(6px);letter-spacing:.01em}
.pill i{width:18px;height:18px;display:block;color:#fcd34d}
.pill i svg{width:18px;height:18px}
.main{flex:1;display:flex;flex-direction:column;justify-content:center;padding-top:16px;padding-bottom:12px;min-height:0}
.eyebrow{display:inline-flex;align-items:center;gap:10px;color:${A2};font-weight:700;font-size:15px;letter-spacing:.16em;text-transform:uppercase;margin-bottom:20px}
.eyebrow i{width:30px;height:30px;border-radius:9px;background:${hex(A, .16)};border:1px solid ${hex(A, .38)};display:flex;align-items:center;justify-content:center;color:${A2}}
.eyebrow i svg{width:18px;height:18px}
h1{font-family:"Fraunces",Georgia,serif;font-weight:700;font-variation-settings:"opsz" 96;font-size:${size}px;line-height:1.12;letter-spacing:-.008em;word-spacing:.04em;max-width:840px;text-wrap:balance;text-shadow:0 2px 24px rgba(0,0,0,.35)}
h1 em{font-style:normal;color:${A2}}
.sub{margin-top:18px;font-size:22px;font-weight:500;color:rgba(255,255,255,.8);max-width:820px;line-height:1.4}
.chips{display:flex;gap:10px;margin-top:22px;flex-wrap:wrap}
.chip{font-weight:600;font-size:16px;color:#fff;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);padding:9px 16px;border-radius:999px}
.bottom{display:flex;align-items:flex-end;justify-content:space-between}
.rule{width:64px;height:5px;border-radius:999px;background:linear-gradient(90deg,#fbbf24,#f59e0b);margin-bottom:14px;box-shadow:0 0 18px rgba(245,158,11,.5)}
.url{font-weight:600;font-size:19px;color:rgba(255,255,255,.9);letter-spacing:.005em}
.url b{color:#fff;font-weight:700}
.meta{display:flex;align-items:center;gap:22px;font-weight:600;font-size:16px;color:rgba(255,255,255,.78)}
.meta span{display:flex;align-items:center;gap:8px}
.meta svg{width:18px;height:18px;color:${A2}}
</style></head><body>
<div class="bg"></div><div class="grid"></div><div class="vignette"></div>
<div class="arch" id="arch"></div>
<div class="wrap">
  <div class="top">
    <div class="brand"><div class="logo"><img src="${LOGO}" alt=""></div>
      <div class="name">${esc(FACTS.academyName)}<small>Registered Dental Assistant training · ${esc(city)}</small></div></div>
    <div class="pill"><i>${icon("shield")}</i>TWC Career School #S5316</div>
  </div>
  <div class="main">
    ${eyebrow ? `<div class="eyebrow"><i>${icon(family.icon)}</i>${esc(eyebrow)}</div>` : ""}
    <h1 id="h1">${esc(title)}</h1>
    ${kind === "site" ? `<div class="chips">${sub.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>` : ""}
  </div>
  <div class="bottom">
    <div><div class="rule"></div><div class="url"><b>premierdentalacademyoflongview.com</b>${kind === "site" ? "" : "/blog"}</div></div>
    <div class="meta"><span>${icon("pin")}${esc(city)}</span><span>${icon("check")}${esc(phone)}</span></div>
  </div>
</div>
<script>${TOOTH_LIB}</script>
<script>
(function(){
  // Anatomical upper arch from the Practice Pro chart library, as faint line art.
  var T = window.PDA_TOOTH_SHAPES; if (!T) return;
  var L = T.layout({ width: 860, unit: 6.4, a: 400, b: 250, topPad: 10 });
  var s = '<svg viewBox="0 0 860 ' + Math.ceil(L.yApexU + 150) + '" xmlns="http://www.w3.org/2000/svg">';
  s += '<g fill="none" stroke="rgba(255,255,255,.22)" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">';
  L.upper.forEach(function(tt){
    var f = T.facial(tt.num, L.U), tr = T.transformOf(tt);
    s += '<g transform="' + tr + '">';
    f.roots.forEach(function(r){ s += '<path d="' + r.d + '" stroke="rgba(255,255,255,.13)"/>'; });
    s += '<path d="' + f.crown + '" fill="rgba(255,255,255,.035)"/>';
    s += '<path d="' + f.cej + '" stroke="rgba(255,255,255,.14)"/>';
    f.details.forEach(function(d){ s += '<path d="' + d + '" stroke="rgba(255,255,255,.12)"/>'; });
    s += '</g>';
  });
  s += '</g></svg>';
  document.getElementById('arch').innerHTML = s;
})();
// Shrink-to-fit guard so a long headline can never collide with the footer.
(function(){
  var h = document.getElementById('h1'), main = h.parentElement, fs = parseFloat(getComputedStyle(h).fontSize);
  for (var i = 0; i < 12 && main.scrollHeight > main.clientHeight + 1; i++) { fs -= 2; h.style.fontSize = fs + 'px'; }
})();
</script>
</body></html>`;
}

function hex(h, a) {
  const n = parseInt(h.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// ── Jobs ─────────────────────────────────────────────────────────────────────
function blogSlugs() {
  return readdirSync(BLOG_DIR).filter((f) => f.endsWith(".html") && f !== "index.html").map((f) => f.replace(/\.html$/, "")).sort();
}

function jobs() {
  const list = [];
  if (!ONLY_SLUG || SITE_ONLY) {
    if (!ONLY_SLUG) list.push({
      kind: "site", out: join(ROOT, "assets", "og-cover.jpg"),
      title: "Hands-on dental assistant training in Longview, Texas",
      eyebrow: "Registered Dental Assistant program",
      family: { ...DEFAULT_FAMILY, icon: "tooth" },
      sub: [`In person · ${FACTS.programLength.display}`, "Online · self-paced", "Real equipment, real workflows"],
    });
  }
  if (SITE_ONLY) return list;
  const slugs = ONLY_SLUG ? [ONLY_SLUG] : blogSlugs();
  for (const slug of slugs) {
    const out = join(OUT_DIR, `blog-${slug}.jpg`);
    if (MISSING_ONLY && existsSync(out)) continue;
    const post = readPost(slug);
    if (post.redirect) { console.log("skip (redirect stub):", slug); continue; }
    if (!post.title) { console.warn("skip (no title):", slug); continue; }
    list.push({ kind: "post", out, title: post.title, eyebrow: post.eyebrow, family: familyFor(post), sub: null, slug });
  }
  return list;
}

async function main() {
  const work = jobs();
  if (PREVIEW) {
    writeFileSync(PREVIEW, render(work[0]));
    console.log("preview written:", PREVIEW, "→", work[0].out);
    return;
  }
  const { chromium } = await loadPlaywright();
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  let n = 0, bytes = 0;
  for (const job of work) {
    await page.setContent(render(job), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const fontsOk = await page.evaluate(() => document.fonts.check('700 40px "Fraunces"') && document.fonts.check('600 16px "Inter"'));
    if (!fontsOk) throw new Error("Brand fonts failed to load — refusing to render with a fallback font.");
    await page.screenshot({ path: job.out, type: "jpeg", quality: JPEG_QUALITY, clip: { x: 0, y: 0, width: 1200, height: 630 } });
    const sz = statSync(job.out).size; bytes += sz; n++;
    console.log(`✓ ${job.out.replace(ROOT + "/", "")}  ${(sz / 1024).toFixed(0)} KB  [${job.family.key}]`);
  }
  await browser.close();
  console.log(`\n${n} image(s), ${(bytes / 1024 / 1024).toFixed(1)} MB total, 2400×1260 px each.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
