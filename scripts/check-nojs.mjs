// check:nojs — fail the build if any public page ships a pre-hydration placeholder.
//
// This site is static HTML with no SSR, so "what Googlebot sees" is literally the file on
// disk. Pages that built their content in JavaScript were shipping "0 questions in the
// bank", "Loading…" and "0 of 0" to every crawler and every no-JS visitor while a real
// browser showed the true numbers. This check makes that class of bug impossible to
// reintroduce: it reads each page as a crawler would, strips scripts and styles, and
// fails if the visible text still contains a placeholder.
//
// Run: node scripts/check-nojs.mjs
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Private/app surfaces are allowed to render after auth resolves — they are noindexed and
// a crawler is never meant to read them. Everything a visitor can reach from search is in.
const SKIP_DIRS = [".git", "node_modules", "scripts", "assets", "db", "supabase", ".vercel",
  "marketing", "templates", "design-reference", "kajabi-weeks-7-12", "admin", "api", "data", "docs"];
const SKIP_FILES = new Set(["admin.html", "dashboard.html", "portal.html", "login.html",
  "logout.html", "learn.html", "certificate.html", "paperwork.html", "teach.html",
  "enroll-success.html", "congrats.html", "thank-you.html", "unsubscribe.html", "feed.html"]);

// Phrases that mean "the page has not loaded its content yet". Matched against the visible
// text with whitespace collapsed, so markup between the number and its label doesn't hide it.
const PLACEHOLDERS = [
  /\bLoading…/i,
  /\bLoading\.\.\./i,
  /\b0 of 0\b/i,
  /\b0 questions in the bank\b/i,
  /\b0 instruments (&amp;|&|and) materials\b/i,
  /\bYou scored 0%/i,
  /\b0 tools\b/i,
];

// A placeholder is the loud version of this bug. The quiet version is a container that ships
// completely empty and is filled by JavaScript — nothing for a crawler to read at all, and no
// telltale string to grep for. These are the known content containers on public pages; each
// must arrive with real content inside it.
const CONTENT_CONTAINERS = [
  ["skills-lab/abbreviations.html", "groups", "the charting abbreviation reference"],
  ["skills-lab/instruments.html", "instGrid", "the instrument list"],
  ["skills-lab/procedures.html", "cards", "the procedure scenarios"],
  ["skills-lab/tray-builder.html", "trayCards", "the tray setups"],
  ["tools/first-30-days.html", "weeks", "the week-by-week plan"],
  ["tools/resource-hub.html", "cards", "the resource list"],
  ["tools/index.html", "paid-grid", "the prep-tools grid"],
];

function walk(dir) {
  let out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else if (e.name.endsWith(".html") && !SKIP_FILES.has(e.name)) out.push(p);
  }
  return out;
}

// Pull the inner HTML of <tag id="wanted"> … </tag>, counting nesting so a container full of
// nested divs isn't truncated at the first closing tag.
function innerHTMLOf(html, id) {
  const open = new RegExp(`<(\\w+)\\b[^>]*\\bid=["']${id}["'][^>]*>`, "i");
  const m = html.match(open);
  if (!m) return null;
  if (/\/>\s*$/.test(m[0])) return "";
  const tag = m[1];
  const start = m.index + m[0].length;
  const scan = new RegExp(`</?${tag}\\b`, "gi");
  scan.lastIndex = start;
  let depth = 1, hit;
  while ((hit = scan.exec(html))) {
    depth += hit[0][1] === "/" ? -1 : 1;
    if (depth === 0) return html.slice(start, hit.index);
  }
  return html.slice(start);
}

// Approximate what a crawler reads: no scripts, no styles, no comments, no tags.
function visibleText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const files = walk(root);
let fail = 0;
for (const f of files) {
  const rel = f.replace(root + "/", "");
  const html = readFileSync(f, "utf8");
  // A noindex redirect stub has no content by design.
  if (/<meta[^>]+http-equiv=["']refresh["']/i.test(html)) continue;
  const text = visibleText(html);
  const hits = PLACEHOLDERS.filter((re) => re.test(text)).map((re) => String(re));
  if (hits.length) {
    console.error(`  ✗ ${rel} — ships placeholder text to crawlers: ${hits.join(", ")}`);
    fail++;
  }
}

for (const [rel, id, what] of CONTENT_CONTAINERS) {
  const p = join(root, rel);
  if (!existsSync(p)) continue;
  const html = readFileSync(p, "utf8");
  const inner = innerHTMLOf(html, id);
  if (inner === null) {
    console.error(`  ✗ ${rel} — expected a #${id} container holding ${what}, but no such element exists`);
    fail++;
    continue;
  }
  const words = visibleText(inner).split(/\s+/).filter(Boolean).length;
  if (words < 20) {
    console.error(`  ✗ ${rel} — #${id} ships ${words} word(s); ${what} is built by JavaScript and is invisible to search`);
    fail++;
  }
}

console.log(`No-JS render check: ${files.length} public pages read as a crawler would, ${CONTENT_CONTAINERS.length} content containers verified non-empty`);
console.log(fail
  ? `✗ ${fail} page(s) ship pre-hydration placeholders — bake the real content into the HTML`
  : "✓ no page ships a pre-hydration placeholder");
process.exit(fail ? 1 : 0);
