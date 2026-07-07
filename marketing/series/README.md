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
| 4 | `day-04-payment-plan.html` | Start for $500 down — here’s how the payments work | /enroll | Enroll (in-person) |
| 5 | `day-05-online-anywhere.html` | Can't get to class? Train 100% online for $397 | Flashcards | Enroll (online) |
| 6 | `day-06-tooth-chart.html` | Chart teeth like a pro — try our free trainer | Practice Pro / how-to-chart | Enroll |
| 7 | `day-07-day-in-the-life.html` | What's a day really like as a dental assistant? | Skills Lab | Enroll |
| 8 | `day-08-practice-exam.html` | Think you could pass the dental-assistant exam? Try it free | Practice Exam | Enroll |
| 9 | `day-09-offices-hiring.html` | East Texas offices are hiring — and they call us | /graduates | Enroll |
| 10 | `day-10-resume-builder.html` | Build your dental-assistant résumé free | /tools/resume-builder | Enroll |
| 11 | `day-11-funding.html` | Veteran or qualify for funding? You may train for $0 | /apply | Apply for funding |
| 12 | `day-12-evening-classes.html` | Evening classes in Longview — keep your job | /night-class | Enroll (in-person) |
| 13 | `day-13-no-experience-faq.html` | No experience? No degree? The honest answer. | FAQ → /enroll | Enroll |
| 14 | `day-14-last-call.html` | Seats are filling for our next class — let's talk | /enroll | Call/Text + Enroll |

### Days 15–28 (extends the test to ~4 weeks)
| Day | File | Subject line | Featured tool / link |
|----|------|--------------|----------------------|
| 15 | `day-15-graduate-success.html` | Where our graduates are now | /graduates |
| 16 | `day-16-day-shift-sim.html` | Run a full day at a dental office — free simulator | /skills-lab/day-shift |
| 17 | `day-17-why-pda.html` | Why students choose Premier Dental Academy | /about |
| 18 | `day-18-split-pay.html` | Split it into easy payments — Klarna, Afterpay, Affirm | /enroll |
| 19 | `day-19-how-to-chart.html` | New to tooth charting? Start here — free | /tools/how-to-chart |
| 20 | `day-20-front-desk.html` | Run a real dental front desk — practice free | /tools/practice-pro |
| 21 | `day-21-flashcards.html` | Master dental terms in 10 minutes a day (free) | /tools/flashcards |
| 22 | `day-22-employers-hire.html` | Why East Texas offices hire our graduates | /employers |
| 23 | `day-23-night-class.html` | Train at night, keep your paycheck | /night-class |
| 24 | `day-24-how-long-faq.html` | How long does it take to become a dental assistant? | /classes |
| 25 | `day-25-radiology.html` | Dental X-rays made simple — test yourself free | /skills-lab/quizzes |
| 26 | `day-26-chairside.html` | Chairside assisting: try the SmartDoc trainer free | /tools/chairside |
| 27 | `day-27-funding-veterans.html` | You may be able to train for $0 — here's how | /apply |
| 28 | `day-28-enroll-now.html` | Ready? Let's get you enrolled | /calendar |

**All 28 days are built** — enough to run the full 2–4 week test.

## Built for CLICKS (not opens)
Apple Mail Privacy Protection auto-loads tracking pixels, so **open rates are unreliable**
— optimize for **clicks**, which still predict sales. Every email therefore carries lots of
click targets: a **quick-links bar** under the header (Free tools · Class dates · What
you'll earn · Apply), a **"more to explore" row** above the footer (practice exam ·
tooth-chart trainer · résumé builder · graduates · enroll), the buy buttons, the featured
tool, the share row, and tap-to-call/text. ~12+ links per email. When reviewing Kajabi
stats during the test, **track click-through rate, not open rate.**

## Rules these emails follow (keep it this way)
- **Real only:** no fabricated stats, names, testimonials, grad counts, or salary numbers.
  Salary claims live on `/salary`; we link there instead of quoting figures.
- **No held offers:** only the **$3,000-paid-in-full / $3,500-plan ($500 down) in-person** and **$397 online** offers.
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
