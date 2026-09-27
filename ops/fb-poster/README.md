# pda-fb-poster: the droplet keeps the Facebook Page schedule full

Premier Dental Academy of Longview posts 5 times a day on its Facebook Page (7:45 AM, 10:30 AM,
1:15 PM, 4:30 PM and 7:15 PM Central). Facebook only lets a post be scheduled about 30 days ahead,
so somebody used to have to load each new day by hand in Business Suite. This small program does it
on the droplet instead, every 15 minutes, with nobody's computer turned on.

## What it does on every run

1. Reads the approved post queue (JSON files in `/var/lib/pda-fb-poster/queue/`, plus any remote
   queue links in the settings).
2. Finds each post whose time is now inside Facebook's window (29.5 days ahead).
3. If that time slot already has a post on the Page's schedule (for example one loaded by hand in
   Business Suite), it leaves it alone. Otherwise it schedules the post through Facebook's official
   API, with its photo when the queue gives it one.
4. Writes everything to a ledger, so the same post is never scheduled twice, and a status file.
5. After each post's time, checks that Facebook really published it.

Posts that break a content rule are held back and listed under "Needs attention" instead of
going out. The rules: no em dashes or hashtags, no retired prices ($1,997, $200 down), no
"$500 down" without the $3,500 plan total, only (903) 913-6444, only www links, no night,
evening or weekend classes, no job, pay or guarantee claims, no partner-office or superlative
claims, no unapproved statistics, only the dates each queue approves, and only the approved class
hours (8:30 AM to 12:30 PM, 9:00 AM to 3:00 PM).

Photos of people are never attached unless the queue records written consent.

## Install (one time, about 5 minutes)

On the droplet, as a user with sudo:

```
curl -fsSL https://raw.githubusercontent.com/RealRyanNichols/PremierDentalAcademyofLongview/COMMIT/ops/fb-poster/install.sh -o /tmp/pda-fb-install.sh
sudo bash /tmp/pda-fb-install.sh COMMIT
```

Replace COMMIT with the commit id given in the handoff. The installer checks every file against
`MANIFEST.sha256`, then creates only: the `pdafb` user, `/opt/pda-fb-poster`,
`/var/lib/pda-fb-poster`, `/etc/pda-fb-poster`, `/usr/local/bin/pda-fb-poster` and the
`pda-fb-poster` service and timer. It does not touch Caddy, other sites, the CRM, packages or
any other service.

### Give it a Facebook token

The poster needs a token that can create posts on the Page. The token that never expires is a
**system user** token:

1. Business Suite, then Settings (gear), then Users, then **System users**, then **Add**. Name it
   `PDA Poster`, role **Admin**, then Create.
2. With PDA Poster selected: **Assign assets**, then Pages, then Premier Dental Academy of Longview.
   Turn on **Content** (create and manage posts), then Assign.
3. **Generate token**. Pick the app in the list, set expiration to **Never**, tick
   `pages_manage_posts`, `pages_read_engagement` and `pages_show_list`, then Generate and Copy.
4. On the droplet: `sudo pda-fb-poster set-token`, paste, press Enter. It shows the Page name,
   the permissions and "Saved". The token is never shown on screen or written to a log.

If the token is missing a permission, it says so and saves nothing.

## Everyday use

| Want to... | Run |
|---|---|
| See what is scheduled, waiting, held or failed | `sudo pda-fb-poster status` |
| Test the token (prints no secrets) | `sudo pda-fb-poster check` |
| Stop all new scheduling | `sudo pda-fb-poster pause` |
| Start again | `sudo pda-fb-poster resume` |
| Run a pass now instead of waiting | `sudo pda-fb-poster run` |
| Preview a pass without posting anything | `sudo pda-fb-poster run --dry-run` |
| Check a new month of posts | `pda-fb-poster validate FILE.json` |
| Add a new month of posts | `sudo pda-fb-poster import FILE.json` |
| Let a post that was deleted by hand go out again | `sudo pda-fb-poster requeue "2026-11-10 16:30"` |
| Read the log | `journalctl -u pda-fb-poster --since today` |

Posts already on Facebook's schedule still go out while paused; remove them in Business Suite if
needed. Deleting a post in Business Suite is respected: the poster will not add it back.

### Adding an illustration later

Save it as `/var/lib/pda-fb-poster/photos/ai01.jpg` (the name the queue gives that post), owned by
`pdafb`. If the post is still more than 2 hours away, the next run swaps the text-only version for
one with the picture.

### New posts every month

A monthly Claude task writes the next 30 days of posts, checks them against the same rules, and
publishes them as an approved queue file. The droplet picks up that file from the link in
`PDAFB_REMOTE_QUEUES` in `/etc/pda-fb-poster/poster.env`. Each post is scheduled 29.5 days
before its time, so there are about four weeks to change or remove anything in Business Suite.

## Undo

```
sudo systemctl disable --now pda-fb-poster.timer
sudo rm /etc/systemd/system/pda-fb-poster.service /etc/systemd/system/pda-fb-poster.timer /usr/local/bin/pda-fb-poster
sudo systemctl daemon-reload
```

That stops it completely. Posts it already scheduled stay on the Page's schedule (delete them in
Business Suite if wanted). The ledger stays in `/var/lib/pda-fb-poster` until deleted on purpose.
To remove every trace: `sudo rm -r /opt/pda-fb-poster /var/lib/pda-fb-poster /etc/pda-fb-poster && sudo userdel pdafb`.

## Queue file format (`pda-fb-queue/1`)

```json
{
  "format": "pda-fb-queue/1",
  "page_id": "180743142587539",
  "issued_at": "2026-10-12T09:00:00-05:00",
  "approved": true,
  "approved_by": "...",
  "allowed_dates": ["December 7"],
  "allowed_money": ["$3,000", "$3,500", "$500", "$997"],
  "images": {"ai01": {"kind": "ai_illustration", "file": null, "people": false}},
  "posts": [
    {"date": "2026-11-23", "time": "07:45", "text": "...", "images": ["ai01"]}
  ]
}
```

`time` is 24-hour Central time. A later `issued_at` wins when two files have the same slot, as
long as that slot has not been scheduled yet. `images` lists pictures in order of preference; the
first one that exists and is allowed is used, otherwise the post goes out as text.

## Tests

`python3 -m unittest discover -s ops/fb-poster/tests -v` runs 24 tests against a fake Facebook API:
first fill, idempotent re-runs, adopting Business Suite posts, the start-after guard, held posts,
lost responses (no duplicates), retries, expired tokens, removed posts, publication checks,
missed slots, late images, consent, pause, newer queue wins, daylight-saving time, and that no
token is ever printed.
