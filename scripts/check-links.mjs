// Internal-link checker for the static site. Verifies every internal href ("/...")
// resolves to a real page or asset (accounting for Vercel cleanUrls: /foo -> foo.html).
// Exits 1 if any internal link is broken. Run: node scripts/check-links.mjs
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir) {
  let out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "scripts"].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

// Marketing email fragments use absolute https URLs and aren't web routes; skip scanning them.
const SKIP_DIRS = ["marketing/"];

function routeExists(route) {
  let r = route.split("#")[0].split("?")[0];
  if (r === "" || r === "/") return existsSync(join(root, "index.html"));
  r = r.replace(/^\//, "").replace(/\/$/, "");
  return [
    join(root, r),                 // exact (assets, etc.)
    join(root, r + ".html"),       // cleanURL page
    join(root, r, "index.html"),   // directory index
    join(root, r + ".js"),         // serverless fn (api/enroll)
  ].some(existsSync);
}

const files = walk(root).filter((f) => !SKIP_DIRS.some((d) => f.includes("/" + d)));
const hrefRe = /\bhref\s*=\s*"([^"]+)"/g;
const broken = {};
let checked = 0;

for (const f of files) {
  const rel = f.replace(root + "/", "");
  const html = readFileSync(f, "utf8");
  let m;
  while ((m = hrefRe.exec(html))) {
    const href = m[1].trim();
    if (!href.startsWith("/") || href.startsWith("//")) continue; // internal absolute only
    checked++;
    if (!routeExists(href)) (broken[rel] ||= new Set()).add(href);
  }
}

const bad = Object.keys(broken);
console.log("Internal link check: " + checked + " internal links across " + files.length + " files");
if (bad.length) {
  console.error("✗ BROKEN internal links:");
  for (const f of bad) console.error("  " + f + " -> " + [...broken[f]].join(", "));
  process.exit(1);
}
console.log("✓ no broken internal links");
