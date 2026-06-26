// Lightweight accessibility/quality audit for indexable pages. Catches the high-impact,
// statically-checkable issues: missing <html lang>, missing viewport meta, <img> without an
// alt attribute (screen readers + layout), and h1 structure. Exits 1 on essential failures
// (lang / viewport / img alt); h1 count is a warning. Run: node scripts/check-a11y.mjs
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const SKIP_DIRS = [".git", "node_modules", "scripts", "assets", "admin", "marketing",
  "templates", "tools", "skills-lab", "db", "supabase", ".vercel", "kajabi-weeks-7-12",
  "design-reference"];
const SKIP_FILES = new Set(["login.html", "logout.html", "dashboard.html", "portal.html",
  "enroll-success.html", "congrats.html", "thank-you.html", "unsubscribe.html",
  "404.html", "feed.html", "admin.html"]);

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

const files = walk(root);
let fail = 0, warn = 0;
for (const f of files) {
  const rel = f.replace(root + "/", "");
  const h = readFileSync(f, "utf8");
  const problems = [];
  const warns = [];

  if (!/<html[^>]*\slang=/i.test(h)) problems.push("no <html lang>");
  if (!/<meta[^>]+name=["']viewport["']/i.test(h)) problems.push("no viewport meta");

  const imgs = h.match(/<img\b[^>]*>/gi) || [];
  const noAlt = imgs.filter((t) => !/\salt\s*=/i.test(t));
  if (noAlt.length) problems.push(noAlt.length + " <img> without alt");

  const h1s = (h.match(/<h1[\s>]/gi) || []).length;
  if (h1s !== 1) warns.push(h1s + " <h1> (expected 1)");

  if (problems.length) { console.log("  ✗ " + rel + " — " + problems.join("; ")); fail++; }
  else if (warns.length) { console.log("  ⚠ " + rel + " — " + warns.join("; ")); warn++; }
}

console.log("A11y audit: " + files.length + " pages checked");
console.log((fail ? "✗ " : "✓ ") + fail + " page(s) with essential a11y issues, " + warn + " with h1 warnings");
if (fail) process.exit(1);
