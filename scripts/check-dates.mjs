// Cohort date freshness check.
//
// WHY THIS EXISTS: on Sep 4, 2026 /classes and /calendar were found advertising the
// Aug 17 and Aug 25 cohorts as "upcoming" with live "Reserve your seat" buttons —
// three weeks after those classes had started. Hardcoded dates in static HTML go stale
// silently and only a human eye catches it. This gate makes that impossible to ship.
//
// WHAT IT DOES: finds every place the site frames dates as UPCOMING ("Upcoming class
// starts", "Next cohorts start", "Upcoming in-person start dates", "Starts Mon, ..."),
// reads the dates that follow, and fails if any of them are already in the past
// (America/Chicago).
//
// If a date is intentionally historical, add the opt-out comment on the line or block:
//   <!-- pda-dates-historical -->
// Run: node scripts/check-dates.mjs
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, relative } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// "today" in America/Chicago, as a UTC-midnight Date for clean comparison.
const chicago = new Date(
  new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })
);
const TODAY = Date.UTC(chicago.getFullYear(), chicago.getMonth(), chicago.getDate());
const THIS_YEAR = chicago.getFullYear();

const MONTHS = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, sept:8, oct:9, nov:10, dec:11 };

// Places the site promises a FUTURE date.
const MARKER = /(upcoming[^<>]{0,44}?(?:start|class|cohort|date)[a-z]*|next\s+(?:start|cohort|class)[a-z]*[^<>]{0,24}|starts?\s+(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*,)/gi;
const DATE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:\s*,?\s*(20\d{2}))?/gi;
const OPT_OUT = "pda-dates-historical";
const WINDOW = 340; // chars after a marker to inspect
const DUP_PROXIMITY = 58; // repeats closer than this are one list, i.e. a real copy bug

// Publication dates and bylines are NOT promises about the future. Strip them from the
// window before looking for dates, or every blog card ("Read → Jun 20, 2026") trips this.
const NOISE = [
  /<span class="text-xs text-slate-400">[^<]*<\/span>/gi, // blog card publish date
  /·\s*[A-Z][a-z]+\.?\s+\d{1,2},?\s*20\d{2}\s*·\s*\d+\s*min read/gi, // article byline
  /datePublished"?\s*:\s*"[^"]*"/gi,
  /dateModified"?\s*:\s*"[^"]*"/gi,
];

const SKIP_DIRS = new Set(["node_modules", ".git", "db", "supabase", "api", "marketing", "docs", "content", "scripts"]);

function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || name.startsWith(".")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...htmlFiles(p));
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

const strip = (s) => s.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ");

const problems = [];
let markerSites = 0, datesChecked = 0;

for (const file of htmlFiles(root)) {
  const html = readFileSync(file, "utf8");
  if (html.includes(OPT_OUT)) continue;
  const rel = relative(root, file);

  MARKER.lastIndex = 0;
  let m;
  while ((m = MARKER.exec(html)) !== null) {
    let raw = html.slice(m.index, m.index + WINDOW + m[0].length);
    for (const n of NOISE) raw = raw.replace(n, " ");
    const window = strip(raw);
    // A window describing the past is not a broken promise.
    if (/\b(graduated|last (?:cohort|class)|previous(?:ly)?|began|wrapped up|already started)\b/i.test(window)) continue;

    let d, found = false;
    const seenInWindow = new Map();
    DATE.lastIndex = 0;
    while ((d = DATE.exec(window)) !== null) {
      const mon = MONTHS[d[1].toLowerCase().replace(/\.$/, "")];
      if (mon === undefined) continue;
      const day = parseInt(d[2], 10);
      if (day < 1 || day > 31) continue;
      const explicitYear = d[3] ? parseInt(d[3], 10) : null;
      const year = explicitYear ?? THIS_YEAR;
      const when = Date.UTC(year, mon, day);
      found = true; datesChecked++;

      // A date repeated inside a single comma/"and" list is a copy bug (usually the
      // residue of a find-and-replace when dates rolled forward): "Sep 14, Sep 14, Sep 29".
      // A heading that restates dates the paragraph below repeats is NOT a bug, so only
      // flag repeats that sit close enough together to be one list.
      const key = `${mon}-${day}`;
      const prevAt = seenInWindow.get(key);
      const nearby = prevAt !== undefined && d.index - prevAt < DUP_PROXIMITY;
      seenInWindow.set(key, d.index);
      if (nearby) {
        problems.push({
          file: rel,
          marker: m[0].trim().replace(/\s+/g, " ").slice(0, 46),
          date: `${d[1]} ${day}`,
          duplicate: true,
        });
      }

      if (when < TODAY) {
        problems.push({
          file: rel,
          marker: m[0].trim().replace(/\s+/g, " ").slice(0, 46),
          date: `${d[1]} ${day}${explicitYear ? ", " + explicitYear : ""}`,
          assumed: !explicitYear,
        });
      }
    }
    if (found) markerSites++;
  }
}

console.log(
  `Cohort date check: ${markerSites} "upcoming" sites, ${datesChecked} dates, ` +
  `today ${new Date(TODAY).toISOString().slice(0, 10)} (America/Chicago)`
);

if (problems.length) {
  const past = problems.filter((p) => !p.duplicate).length;
  const dup = problems.length - past;
  console.error(
    `\n✗ ${past} past date(s) presented as upcoming` +
    (dup ? `, ${dup} duplicate date(s) in an upcoming list` : "") + ":\n"
  );
  const byFile = new Map();
  for (const p of problems) {
    if (!byFile.has(p.file)) byFile.set(p.file, []);
    byFile.get(p.file).push(p);
  }
  for (const [file, list] of [...byFile].sort()) {
    console.error(`  ${file}`);
    for (const p of list) {
      console.error(
        `      "${p.marker}" → ${p.date}` +
        (p.duplicate ? "  (listed twice in the same list)" : "") +
        (p.assumed ? "  (no year in copy; assumed " + THIS_YEAR + ")" : "")
      );
    }
  }
  console.error(
    `\n  Fix the dates, or if a mention is deliberately historical add ` +
    `<!-- ${OPT_OUT} --> to that file.`
  );
  process.exit(1);
}
console.log("✓ no past cohort dates are being advertised as upcoming");
