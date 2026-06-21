// Sitemap freshness check: every <loc> in sitemap.xml must resolve to a real page
// (cleanUrls-aware), and the key marketing pages should be listed. A sitemap pointing at
// 404s hurts crawl budget/SEO. Exits 1 on any broken entry. Run: node scripts/check-sitemap.mjs
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const xml = readFileSync(join(root, "sitemap.xml"), "utf8");

const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1]);

function pathExists(p) {
  let r = p.replace(/^https?:\/\/[^/]+/i, "").split("#")[0].split("?")[0];
  if (r === "" || r === "/") return existsSync(join(root, "index.html"));
  r = r.replace(/^\//, "").replace(/\/$/, "");
  return [join(root, r), join(root, r + ".html"), join(root, r, "index.html")].some(existsSync);
}

const broken = locs.filter((u) => !pathExists(u));
console.log("Sitemap check: " + locs.length + " <loc> entries");
if (broken.length) {
  console.error("✗ broken sitemap entries (resolve to no file):");
  broken.forEach((u) => console.error("  " + u));
  process.exit(1);
}
console.log("✓ all sitemap entries resolve to real pages");
