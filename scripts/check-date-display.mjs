// Calendar-date display check.
//
// WHY THIS EXISTS: on Sep 24, 2026 /classes showed every class one day early
// ("Sun, Oct 4" for the Monday, Oct 5 class). cohorts.start_date is a calendar date
// ("2026-10-05"); `new Date("2026-10-05")` reads it as midnight UTC, which is the
// evening before in Central time, so the formatted day slipped back by one.
//
// WHAT IT DOES:
//  1. Public pages: fails if a date formatter hands its argument straight to
//     `new Date(x)` and the page feeds it a *_date field. Parse "YYYY-MM-DD" from its
//     parts (or append "T00:00:00") instead.
//  2. Runs the /classes formatter in America/Chicago and checks real cohort dates
//     come out on the right weekday.
// Run: node scripts/check-date-display.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, relative } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set(["node_modules", ".git", "db", "supabase", "api", "marketing", "docs", "content", "scripts", "admin"]);

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

const problems = [];

// 1. Static tripwire.
const FORMATTER = /(?:const|let|var)\s+(\w+)\s*=\s*\((\w+)\)\s*=>\s*(?:\2\s*\?\s*)?new Date\(\2\)\.toLocale(?:Date)?String/g;
for (const file of htmlFiles(root)) {
  const html = readFileSync(file, "utf8");
  FORMATTER.lastIndex = 0;
  let m;
  while ((m = FORMATTER.exec(html)) !== null) {
    const name = m[1];
    const feedsDateField = new RegExp(`\\b${name}\\(\\s*[\\w.]*_date\\b`).test(html);
    if (!feedsDateField) continue;
    const line = html.slice(0, m.index).split("\n").length;
    problems.push(`${relative(root, file)}:${line} — ${name}() parses a calendar date with new Date(x); it will show a day early in Central time`);
  }
}

// 2. Behavioral check of the /classes formatter.
process.env.TZ = "America/Chicago";
const classes = readFileSync(join(root, "classes.html"), "utf8");
const helper = classes.match(/const toCalendarDate = \(d\) => \{[\s\S]*?\n  \};/);
const fmt = classes.match(/const fmtDate = \(d\) => [^\n]+;/);
if (!helper || !fmt) {
  problems.push("classes.html — could not find toCalendarDate()/fmtDate(); update this check if the formatter moved");
} else {
  const fmtDate = new Function(`${helper[0]}\n${fmt[0]}\nreturn fmtDate;`)();
  const cases = [
    ["2026-10-05", "Mon, Oct 5, 2026"],
    ["2026-10-20", "Tue, Oct 20, 2026"],
    ["2026-11-09", "Mon, Nov 9, 2026"],
    ["2026-11-17", "Tue, Nov 17, 2026"],
    ["2026-09-29", "Tue, Sep 29, 2026"],
  ];
  for (const [input, want] of cases) {
    const got = fmtDate(input);
    if (got !== want) problems.push(`classes.html fmtDate("${input}") = "${got}", expected "${want}"`);
  }
}

if (problems.length) {
  console.error("check:date-display FAILED\n  " + problems.join("\n  "));
  process.exit(1);
}
console.log("check:date-display OK — calendar dates render on the right day in Central time");
