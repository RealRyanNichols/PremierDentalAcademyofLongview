// Roll hardcoded "upcoming" cohort dates forward from the live Supabase cohorts table.
//
// WHY THIS EXISTS: on Oct 9, 2026 the deploy gate (scripts/check-dates.mjs) found October 5
// advertised as an upcoming class in 131 pages, 152 spots: the cohort cards on every program
// and city page, blog copy, even page titles. Every cohort date on this site is hardcoded, so
// each time a class starts the whole site goes stale at once and the deploy gate blocks every
// release until a human edits 100+ files. This script is the one place that fixes it: it reads
// the real schedule from Supabase (the same table the homepage countdown uses) and rewrites
// every stale mention in place, keeping each page's own wording and date format.
//
// WHAT IT DOES
//   1. Fetches in-person cohorts (status current/upcoming/open) from Supabase.
//   2. Finds every cohort date mention in the HTML (October 5 / Oct 5 / Monday, October 5 /
//      October 5, 2026 ...). Publication dates, bylines, scripts and comments are masked first;
//      JSON-LD stays in scope because the gate scans it too.
//   3. Groups mentions that belong to one list (a card grid, "October 5 and October 20",
//      "Sept 29, Oct 5, Oct 20, Nov 9"). A group is rewritten only when it contains a date that
//      is already in the past AND the copy frames it as upcoming (same markers check-dates.mjs
//      uses: "upcoming class", "next cohorts start", "starts Monday, ..."). It then becomes the
//      first N upcoming cohorts in order, N = size of the group. A lone past date next to a
//      Mon/Wed/Fri or Tue/Thu label rolls to the next class of that track instead.
//   4. Fixes the weekday prefix, the track label (Mon/Wed/Fri <-> Tue/Thu) and the class times
//      next to each rewritten date, and adds the year when it changes.
//   5. Skips files that opt out with <!-- pda-dates-historical --> and sentences that talk
//      about the past (underway, began, graduated, ...), same as check-dates.mjs.
//
// Run:  node scripts/roll-cohort-dates.mjs --dry --verbose   (report only)
//       node scripts/roll-cohort-dates.mjs                   (rewrite files)
//       node scripts/check-dates.mjs                         (then prove it)
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, relative } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
const VERBOSE = process.argv.includes("--verbose");

const SUPABASE_URL = "https://lmbsuwslsycukynzpzik.supabase.co";
// The public anon key already ships in index.html; reuse it rather than keeping a second copy.
function anonKey() {
  if (process.env.PDA_SUPABASE_ANON) return process.env.PDA_SUPABASE_ANON;
  const m = readFileSync(join(root, "index.html"), "utf8").match(/const SUPABASE_KEY\s*=\s*'([^']+)'/);
  if (!m) throw new Error("Could not find SUPABASE_KEY in index.html; set PDA_SUPABASE_ANON");
  return m[1];
}

const chicago = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));
const TODAY = Date.UTC(chicago.getFullYear(), chicago.getMonth(), chicago.getDate());
const THIS_YEAR = chicago.getFullYear();

const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_INDEX = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, sept:8, oct:9, nov:10, dec:11 };
const WEEKDAYS_FULL = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const WEEKDAYS_ABBR = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// Track labels as they appear in copy, longest first so replacement never leaves fragments.
const TRACK_WORDS = {
  MWF: { long: "Monday/Wednesday/Friday", label: "Mon/Wed/Fri", short: "MWF" },
  TTh: { long: "Tuesday/Thursday", label: "Tue/Thu", short: "T/Th" },
};
const TIME_RANGE = /\d{1,2}:\d{2}\s?(?:AM|PM)\s?[–-]\s?\d{1,2}:\d{2}\s?(?:AM|PM)/i;

// The gate's markers, plus a few phrasings that promise a future date just as plainly.
const MARKER = /(upcoming[^<>]{0,44}?(?:start|class|cohort|date)[a-z]*|next\s+(?:[a-z-]+\s+)?(?:start|cohort|class)[a-z]*[^<>]{0,24}|next up:?|starts?\s+(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*,|(?:cohorts|classes|starts)\s+(?:currently\s+)?(?:start|begin|are)\b|remaining[^<>]{0,30}start)/i;
const MARKER_REACH = 340; // chars before a mention to look for a marker (check-dates WINDOW)
const PAST_TALK = /\b(graduated|last (?:cohort|class)|previous(?:ly)?|began|wrapped up|already started)\b/i; // same words as check-dates.mjs

function trackOf(text) {
  const mwf = /Mon\/Wed\/Fri|MWF|Monday\/Wednesday\/Friday/.test(text || "");
  const tth = /Tue\/Thu|T\/Th|Tuesday\/Thursday/.test(text || "");
  if (mwf && !tth) return "MWF";
  if (tth && !mwf) return "TTh";
  return null;
}

async function fetchCohorts() {
  const url = SUPABASE_URL + "/rest/v1/cohorts?select=start_date,status,schedule,name,delivery_mode"
    + "&status=in.(current,upcoming,open)&or=(delivery_mode.is.null,delivery_mode.neq.online)&order=start_date.asc";
  const key = anonKey();
  const r = await fetch(url, { headers: { apikey: key, Authorization: "Bearer " + key } });
  if (!r.ok) throw new Error("Supabase cohorts fetch failed: HTTP " + r.status);
  const rows = await r.json();
  const out = [];
  for (const row of rows) {
    const [y, m, d] = row.start_date.split("-").map(Number);
    const when = Date.UTC(y, m - 1, d);
    out.push({ when, y, m: m - 1, d, track: trackOf(row.schedule), time: (row.schedule || "").match(TIME_RANGE)?.[0] || null, weekday: new Date(when).getUTCDay() });
  }
  out.sort((a, b) => a.when - b.when);
  return out;
}

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

// Regions holding dates that are not promises about the future. Blanked (same length) before matching.
const MASKS = [
  /<script\b(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/gi, // JS data (cohort-id maps, countdowns) is never text-rolled
  /<!--[\s\S]*?-->/g,
  /<span class="text-xs text-slate-400">[^<]*<\/span>/gi,              // blog card publish date
  /·\s*[A-Z][a-z]+\.?\s+\d{1,2},?\s*20\d{2}\s*·\s*\d+\s*min read/gi, // article byline
  /<time\b[^>]*>[^<]*<\/time>/gi,
  /date(?:Published|Modified)"?\s*:\s*"[^"]*"/gi,
];
function masked(html) {
  let s = html;
  for (const re of MASKS) s = s.replace(re, (m) => " ".repeat(m.length));
  return s;
}

const DATE_RE = new RegExp(
  "(?:\\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tues|Tue|Wed|Thurs|Thu|Fri|Sat|Sun)(\\.?,?\\s+))?" +
  "\\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)([a-z]*)(\\.?)\\s+(\\d{1,2})(?!\\d|:)" +
  "(?:(\\s*,?\\s*)(20\\d{2}))?",
  "g"
);

const plainText = (s) => s.replace(/<[^>]*>/g, " ").replace(/[<>"]/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ");

// The sentence fragments before and after a mention, tags stripped.
function context(shadow, start, end) {
  const pre = plainText(shadow.slice(Math.max(0, start - 240), start));
  const post = plainText(shadow.slice(end, Math.min(shadow.length, end + 240)));
  const cut = pre.search(/[.!?]\s[^.!?]*$/);
  const preS = cut >= 0 ? pre.slice(cut + 2) : pre;
  const stop = post.search(/[.!?](\s|$)/);
  const postS = stop >= 0 ? post.slice(0, stop + 1) : post;
  return { pre: preS, post: postS };
}

function formatDate(c, like) {
  // Reproduce the original mention's shape (weekday? month style, year?) with the new date.
  let s = "";
  if (like.weekday) s += (WEEKDAYS_FULL.includes(like.weekday) ? WEEKDAYS_FULL[c.weekday] : WEEKDAYS_ABBR[c.weekday]) + like.weekdaySep;
  const monthFull = (like.monthHead + like.monthRest).toLowerCase() === MONTHS_FULL[like.monthIdx].toLowerCase();
  s += (monthFull ? MONTHS_FULL[c.m] : MONTHS_ABBR[c.m] + (like.monthDot ? "." : "")) + " " + c.d;
  if (!like.sharedYear && (like.year !== null || c.y !== THIS_YEAR)) s += (like.yearSep ?? ", ") + c.y;
  return s;
}

function rewriteLabels(segment, oldTrack, newTrack, newTime) {
  if (!oldTrack || !newTrack || oldTrack === newTrack) return segment;
  let s = segment;
  const from = TRACK_WORDS[oldTrack], to = TRACK_WORDS[newTrack];
  for (const k of ["long", "label", "short"]) s = s.split(from[k]).join(to[k]);
  if (newTime) s = s.replace(TIME_RANGE, newTime);
  return s;
}

async function main() {
  const cohorts = await fetchCohorts();
  const upcoming = cohorts.filter((c) => c.when >= TODAY);
  const byWhen = new Map(cohorts.map((c) => [c.when, c]));
  if (upcoming.length < 6) throw new Error("Fewer than six upcoming cohorts came back; refusing to rewrite the site on thin data.");
  const nextOfTrack = (track) => upcoming.find((c) => c.track === track);
  console.log(`today ${new Date(TODAY).toISOString().slice(0, 10)} (America/Chicago) · ${cohorts.length} in-person cohorts, ${upcoming.length} upcoming; next: ` +
    upcoming.slice(0, 4).map((c) => `${MONTHS_ABBR[c.m]} ${c.d} ${c.track || "?"}`).join(", "));

  let filesChanged = 0, mentionsRewritten = 0, groups = 0, skippedNoMarker = 0;
  const notes = [];
  for (const file of htmlFiles(root)) {
    const html = readFileSync(file, "utf8");
    if (html.includes("pda-dates-historical")) continue;
    const rel = relative(root, file);
    const shadow = masked(html);

    // 1. Collect cohort-date mentions.
    const mentions = [];
    DATE_RE.lastIndex = 0;
    let m;
    while ((m = DATE_RE.exec(shadow)) !== null) {
      const monthIdx = MONTH_INDEX[(m[3] + m[4]).toLowerCase()] ?? MONTH_INDEX[m[3].toLowerCase()];
      if (monthIdx === undefined) continue;
      const day = parseInt(m[6], 10);
      if (day < 1 || day > 31) continue;
      const year = m[8] ? parseInt(m[8], 10) : null;
      const when = Date.UTC(year ?? THIS_YEAR, monthIdx, day);
      const cohort = byWhen.get(when);
      if (!cohort) continue; // not a class start date at all
      const ctx = context(shadow, m.index, m.index + m[0].length);
      // "Promised" means an upcoming-marker sits within reach before the date, and the copy from
      // that marker to the end of the sentence does not describe the past (same test as the gate).
      const reach = shadow.slice(Math.max(0, m.index - MARKER_REACH), m.index);
      let markerAt = -1, mk;
      const markerRe = new RegExp(MARKER.source, "gi");
      while ((mk = markerRe.exec(reach)) !== null) markerAt = mk.index;
      const promised = markerAt >= 0 && !PAST_TALK.test(plainText(reach.slice(markerAt)) + " " + ctx.post);
      mentions.push({
        start: m.index, end: m.index + m[0].length, text: m[0],
        weekday: m[1] || null, weekdaySep: m[2] || "", monthHead: m[3], monthRest: m[4], monthDot: m[5] === ".",
        monthIdx, day, year, yearSep: m[7] ?? null, when, cohort, past: when < TODAY, ctx,
        promised,
      });
    }
    if (!mentions.length) continue;

    // 2. Group mentions that form one list (card grid, "A and B", "A, B, C and D").
    const clusters = [];
    for (const mn of mentions) {
      const last = clusters[clusters.length - 1];
      if (last) {
        const gap = shadow.slice(last[last.length - 1].end, mn.start);
        const sameList = gap.length < 450 && !/[.!?]\s/.test(gap) && !/<\/(?:p|h[1-6]|li|section|article|table)\b/i.test(gap);
        if (sameList) { last.push(mn); continue; }
      }
      clusters.push([mn]);
    }

    // 3. Plan replacements for lists that contain a past date framed as upcoming.
    const edits = [];
    for (const cl of clusters) {
      const pastOnes = cl.filter((x) => x.past);
      if (!pastOnes.length) continue;
      const soleText = (x) => {
        const gt = shadow.lastIndexOf(">", x.start), lt = shadow.indexOf("<", x.end);
        return gt >= 0 && lt >= 0 && /^\s*$/.test(shadow.slice(gt + 1, x.start)) && /^\s*$/.test(shadow.slice(x.end, lt));
      };
      const isCardGrid = cl.length >= 2 && cl.every(soleText);
      // Three or more class dates in ascending order is a schedule list even without a marker word,
      // as long as rolling it would not have to reach into a later year than the list already does.
      const ascending = cl.every((x, i) => i === 0 || x.when > cl[i - 1].when);
      const lastYear = new Date(cl[cl.length - 1].when).getUTCFullYear();
      const isScheduleList = cl.length >= 3 && ascending && upcoming.length >= cl.length && upcoming[cl.length - 1].y <= lastYear;
      if (!isCardGrid && !isScheduleList && !pastOnes.some((x) => x.promised)) {
        skippedNoMarker++;
        if (VERBOSE) console.log(`  (left alone) ${rel}: ...${plainText(shadow.slice(Math.max(0, cl[0].start - 70), cl[cl.length - 1].end + 40)).trim()}...`);
        continue;
      }
      let targets;
      if (cl.length === 1) {
        const track = trackOf(cl[0].ctx.post.slice(0, 110)) || trackOf(cl[0].ctx.pre.slice(-80));
        targets = [track ? nextOfTrack(track) : upcoming[0]];
      } else {
        targets = upcoming.slice(0, cl.length);
      }
      if (targets.some((t) => !t)) { notes.push(`${rel}: could not fill a ${cl.length}-date list`); continue; }
      groups++;
      cl.forEach((mn, i) => {
        const c = targets[i];
        // The label/time segment that belongs to this date: up to the next date in the list,
        // or to the end of this card / sentence for the last one.
        let segEnd;
        if (i + 1 < cl.length) segEnd = cl[i + 1].start;
        else {
          const tail = shadow.slice(mn.end, mn.end + 110);
          const stops = [tail.search(/[.!?]\s/), tail.search(/<\/div>\s*<\/div>/), tail.search(/<\/(?:p|li|h[1-6])\b/i)].filter((x) => x >= 0);
          segEnd = mn.end + (stops.length ? Math.min(...stops) : tail.length);
        }
        // "<strong>December 22</strong>, 2026." carries the whole list's year outside the tag: keep it
        // there (and update it) instead of writing a second year inside the tag.
        const sharedYear = i + 1 === cl.length && mn.year === null && /^<\/[a-z]+>\s*,?\s*20\d{2}\b/.test(shadow.slice(mn.end, mn.end + 30));
        edits.push({ start: mn.start, end: mn.end, text: formatDate(c, { ...mn, sharedYear }), segStart: mn.end, segEnd, oldTrack: mn.cohort.track, newTrack: c.track, newTime: c.time, from: mn.text, sharedYear: sharedYear ? String(c.y) : null });
      });
    }
    if (!edits.length) continue;

    edits.sort((a, b) => b.start - a.start);
    let out = html;
    for (const e of edits) {
      let seg = out.slice(e.segStart, e.segEnd);
      if (e.sharedYear) seg = seg.replace(/^(<\/[a-z]+>\s*,?\s*)(20\d{2})\b/, "$1" + e.sharedYear);
      out = out.slice(0, e.segStart) + rewriteLabels(seg, e.oldTrack, e.newTrack, e.newTime) + out.slice(e.segEnd);
      out = out.slice(0, e.start) + e.text + out.slice(e.end);
      mentionsRewritten++;
      if (VERBOSE) console.log(`  ${rel}: "${e.from}" -> "${e.text}"`);
    }
    filesChanged++;
    if (!DRY) writeFileSync(file, out);
  }
  console.log(`${DRY ? "[dry run] " : ""}${filesChanged} file(s), ${groups} list(s), ${mentionsRewritten} date mention(s) rolled forward; ${skippedNoMarker} stale list(s) left alone because the copy does not frame them as upcoming.`);
  for (const n of notes) console.log("  note: " + n);
}

main().catch((e) => { console.error("✗ " + e.message); process.exit(1); });
