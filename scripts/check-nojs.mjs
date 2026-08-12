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
import { readFileSync, readdirSync } from "node:fs";
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

console.log(`No-JS render check: ${files.length} public pages read as a crawler would`);
console.log(fail
  ? `✗ ${fail} page(s) ship pre-hydration placeholders — bake the real content into the HTML`
  : "✓ no page ships a pre-hydration placeholder");
process.exit(fail ? 1 : 0);
