// Generates /calendar.ics — a subscribable calendar of class start dates.
//
// Somebody deciding whether to enrol usually is not ready on the day they visit. A calendar
// subscription means the next cohort turns up in their diary without them having to remember
// to come back and check, which is the whole point.
//
// Written from the same data/cohorts.json snapshot the pages use, so the calendar cannot say
// something different from the website.
//
// Run: node scripts/build-ics.mjs   (wired into npm run build:static)
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://www.premierdentalacademyoflongview.com";

const win = {};
new Function("window", readFileSync(join(root, "assets/tools/ics.js"), "utf8"))(win);
const ICS = win.PDA_ICS;

const snapshot = JSON.parse(readFileSync(join(root, "data/cohorts.json"), "utf8"));
const cohorts = (snapshot.cohorts || []).filter((c) => c.status !== "cancelled");

// DTSTAMP comes from the snapshot's synced_at rather than the clock, so rebuilding without a
// data change produces a byte-identical file instead of a diff on every run.
const stamp = String(snapshot.synced_at || "2026-01-01").replace(/-/g, "") + "T000000Z";

const events = cohorts
  .slice()
  .sort((a, b) => a.start_date.localeCompare(b.start_date))
  .map((c) => {
    const seats = Math.max(0, (c.capacity || 0) - (c.enrolled_count || 0));
    return {
      uid: `cohort-${c.start_date}@premierdentalacademyoflongview.com`,
      start: c.start_date,
      summary: "RDA class starts — Premier Dental Academy, Longview",
      description: [
        "Registered Dental Assistant training starts today at the Longview campus.",
        "",
        // Never print class times here: PDA no longer offers evening classes and the exact
        // daytime hours are not published, so the calendar points at the phone instead.
        snapshot.neutral_schedule || "Call or text (903) 913-6444 for current class days & times.",
        "",
        seats > 0 ? `${seats} of ${c.capacity} seats were open when this calendar was built.`
                  : "This cohort was full when this calendar was built — ask about the waitlist.",
        "",
        "In-person tuition is $3,000 paid in full, or $3,500 on a plan ($500 down plus a $3,000",
        "balance in weekly or monthly instalments). Refund and transfer terms: " + SITE + "/terms",
        "",
        "Questions: (903) 913-6444 · hello@premierdentalacademyoflongview.com",
      ].join("\n"),
      location: c.location || "2800 Gilmer Rd, Suite 106, Longview, TX 75604",
      url: `${SITE}/classes`,
    };
  });

const ics = ICS.build({
  name: "Premier Dental Academy of Longview — class dates",
  description:
    "Start dates for Registered Dental Assistant training at Premier Dental Academy of Longview. " +
    "Call or text (903) 913-6444 for current class days and times.",
  stamp,
  events,
});

writeFileSync(join(root, "calendar.ics"), ics);
console.log(`Calendar: calendar.ics written with ${events.length} class date(s)`);
if (!events.length) {
  console.log("  (no upcoming cohorts in the snapshot — the calendar is valid but empty)");
}
