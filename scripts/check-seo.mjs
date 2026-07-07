// Static SEO audit for indexable marketing pages. Social scrapers (Facebook, iMessage,
// LinkedIn) don't run JS, so title/description/canonical/OG must be present in the HTML
// itself — not only injected at runtime by pda-seo.js. Exits 1 if any audited page is
// missing an essential (title / description / canonical). OG/Twitter gaps are warnings.
// Run: node scripts/check-seo.mjs
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, basename } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// App-like, admin, transactional, and non-page dirs are not indexable marketing pages.
const SKIP_DIRS = [".git", "node_modules", "scripts", "assets", "admin", "marketing",
  "templates", "tools", "skills-lab", "db", "supabase", ".vercel", "kajabi-weeks-7-12",
  "design-reference"];
// Utility / auth / transactional / noindex pages that don't need marketing SEO.
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

const checks = {
  title:       (h) => /<title>[^<]{3,}<\/title>/i.test(h),
  description: (h) => {
    const m = h.match(/<meta[^>]+name=["']description["'][^>]*>/i);
    if (!m) return false;
    const c = m[0].match(/content=("([^"]*)"|'([^']*)')/i);
    return (((c && (c[2] || c[3])) || "").trim().length) >= 20;
  },
  canonical:   (h) => /<link[^>]+rel=["']canonical["']/i.test(h),
  "og:title":       (h) => /property=["']og:title["']/i.test(h),
  "og:description": (h) => /property=["']og:description["']/i.test(h),
  "og:image":       (h) => /property=["']og:image["']/i.test(h),
  "twitter:card":   (h) => /name=["']twitter:card["']/i.test(h),
};
const ESSENTIAL = ["title", "description", "canonical"];

const files = walk(root);
let failPages = 0, warnPages = 0, noindexSkipped = 0;
const rows = [];
for (const f of files) {
  const h = readFileSync(f, "utf8");
  // noindex pages (redirect stubs, paid-ads landers) are not indexable marketing
  // pages — social/OG completeness is optional there.
  if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(h)) { noindexSkipped++; continue; }
  const missing = Object.keys(checks).filter((k) => !checks[k](h));
  if (!missing.length) continue;
  const essMissing = missing.filter((m) => ESSENTIAL.includes(m));
  rows.push({ f: f.replace(root + "/", ""), missing, essMissing });
  if (essMissing.length) failPages++; else warnPages++;
}

console.log("SEO audit: " + (files.length - noindexSkipped) + " indexable pages checked (" + noindexSkipped + " noindex skipped)");
if (rows.length) {
  for (const r of rows) {
    const tag = r.essMissing.length ? "✗" : "⚠";
    console.log("  " + tag + " " + r.f + " — missing: " + r.missing.join(", "));
  }
}
console.log((failPages ? "✗ " : "✓ ") + failPages + " page(s) missing essentials, " + warnPages + " with OG/Twitter warnings only");
if (failPages) process.exit(1);
