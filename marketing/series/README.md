# PDA daily email series (14-day list test)

These are **paste-ready HTML email bodies** for the daily Kajabi broadcast test
(one email/day to the **entire list**, sending **6:30 PM CT**). Each file is a
self-contained, inline-styled HTML fragment in PDA's house style with: a buy/enroll
button, a link to an interactive website tool, "call/text Amanda" CTAs, and a share row.

> **Important — who clicks "send":** I (Claude, in this repo) **cannot send or
> schedule Kajabi broadcasts, and cannot pull your open/click stats.** Kajabi
> admin actions happen inside Kajabi by you (or a browser-capable assistant). These
> files do everything *up to* the send. See `docs/HANDOFF-kajabi-online-course-buildout.md`
> and the "Hand this to another assistant" section below if you want someone else to
> click send/schedule for you.

## How to schedule ONE email in Kajabi (~60 seconds)
1. Kajabi → **Marketing → Email Broadcasts → New broadcast** (or Email Campaigns → new email).
2. In the email editor, add a **Custom Code** block.
3. Open the day's `.html` file here, **copy everything**, and **paste** into the Custom Code block.
4. Set the **Subject** (below). Recipients = **your entire list/segment** (check the box).
5. **Schedule** for the day's date at **6:30 PM Central**. Save/Schedule.
6. Repeat for the next day.

## The calendar

| Day | File | Subject line | Featured tool / link | Primary CTA |
|----|------|--------------|----------------------|-------------|
| 1 (today) | `day-01-phones-back-on.html` | Our phone was down — it's fixed. Call or text us 📞 | Skills Lab + Practice Exam | Call/Text Amanda |
| 2 | `day-02-skills-lab-tray.html` | Set up a dental tray like you already work here (free) 🦷 | Skills Lab tray builder | Enroll |
| 3 | `day-03-salary.html` | What do dental assistants really make in East Texas? | /salary | Enroll |
| 4 | `day-04-payment-plan.html` | Start for $200 down — here's how the payments work | /enroll | Enroll (in-person) |
| 5 | `day-05-online-anywhere.html` | Can't get to class? Train 100% online for $397 | Flashcards | Enroll (online) |
| 6 | `day-06-tooth-chart.html` | Chart teeth like a pro — try our free trainer | Practice Pro / how-to-chart | Enroll |
| 7 | `day-07-day-in-the-life.html` | What's a day really like as a dental assistant? | Skills Lab | Enroll |
| 8 | `day-08-practice-exam.html` | Think you could pass the dental-assistant exam? Try it free | Practice Exam | Enroll |
| 9 | _(to build)_ | East Texas offices are hiring — and they call us | /graduates | Enroll |
| 10 | _(to build)_ | Build your dental-assistant résumé free (15 min) | /tools/resume-builder | Enroll |
| 11 | _(to build)_ | Veteran or qualify for funding? You may train for $0 | /apply | Apply for funding |
| 12 | _(to build)_ | Evening classes in Longview — keep your job | /night-class | Enroll (in-person) |
| 13 | _(to build)_ | No experience? No degree? The honest answer. | FAQ → /enroll | Enroll |
| 14 | _(to build)_ | Seats are filling for our next class — let's talk | /enroll | Call/Text + Enroll |

Days 1–8 are built (covers the next week). Days 9–14 are planned — ask Claude to generate them.

## Rules these emails follow (keep it this way)
- **Real only:** no fabricated stats, names, testimonials, grad counts, or salary numbers.
  Salary claims live on `/salary`; we link there instead of quoting figures.
- **No held offers:** only the **$200-down / $1,997 in-person** and **$397 online** offers.
  No `$1,497` / `$1,500` / pay-in-full / night-class-deposit pricing anywhere.
- Inline styles only (email clients strip `<style>`/JS). Buttons are real `<a>` links.
- `{{ unsubscribe_link }}` placeholder is in every footer — Kajabi will fill it (keep it).

## Hand the SENDING to another assistant (optional)
If you want a browser-capable Claude or a VA to click send for you, give them:
"Log into Kajabi for Premier Dental Academy of Longview. For each file in
`marketing/series/day-NN-*.html`, create an email broadcast, paste the file's HTML
into a Custom Code block, set the subject from `marketing/series/README.md`, select
the entire list, and schedule it for 6:30 PM Central on consecutive days starting
today. Do not alter the HTML. Report back each broadcast's scheduled date/time."
