# Square on the droplet (pda-square)

Moves the last Square pieces of the Premier Dental Academy of Longview website off Supabase and
onto the droplet (`leadflow-web`), where the site and `pda-api` already run.

## What moves, and why it matters

| Piece | Was | Now |
|---|---|---|
| Card checkout for tuition (`/api/enroll`) | droplet (since Sept 24) | unchanged |
| Checkout for the online program and every product (`buy-product`) | Supabase function | `api/buy-product.js` in pda-api |
| Exam Pro checkout for signed-in students (`buy-exam-pro`) | Supabase function | `api/buy-exam-pro.js` |
| Square payment notifications: welcome email, portal access, enrollment, purchase record (`square-webhook`) | Supabase function | `api/square-webhook.js` |
| Welcome email (`enroll-welcome`) | Supabase function | `api/_welcome.mjs`, called by the webhook |

The Square key (`SQUARE_ACCESS_TOKEN`) has been in `/etc/pda/api.env` since Sept 23, and two
website payments went through the droplet on Sept 24–25. The only new secret is the webhook's
signing key, and `pda-square webhook-setup` puts it there itself. Nobody copies a key or token.

The checkout pages call `/api/...` first and only fall back to the old Supabase function when the
new route answers 404 (pda-api not restarted yet) or can't be reached. Both sides build the same
Square idempotency key, so the fallback can never charge twice.

## Before you start (once)

1. The change must be on GitHub `main` (Amanda approves the merge).
2. The site folder has to be current. Its automatic update from GitHub stopped around Sept 24,
   which is also why the newer blog articles are not live. Check the update timer and
   `git -C /srv/sites/pda status`, bring the folder to `main`, then `sudo systemctl restart pda-api`.
3. Check the new routes answer:

   ```
   curl -s https://www.premierdentalacademyoflongview.com/api/square-webhook
   ```

   should print `{"ok":true,"service":"square-webhook","configured":false}`.

## The steps (DigitalOcean web console, about 10 minutes)

```
curl -fsSL https://raw.githubusercontent.com/RealRyanNichols/PremierDentalAcademyofLongview/<COMMIT>/ops/square/install.sh -o /tmp/pda-square-install.sh
sudo bash /tmp/pda-square-install.sh <COMMIT>
sudo pda-square webhook-setup
```

`<COMMIT>` is the commit id given in the handoff. The installer checks the file's fingerprint
before installing, then prints a read-only status.

`webhook-setup` does this, and stops with a plain explanation if anything is off:

1. Checks the Square key belongs to Premier's account (location `2P2ZE3FJNEYTV`).
2. Finds the Supabase webhook and creates the droplet one **switched OFF**, with the same events,
   pointing at `https://www.premierdentalacademyoflongview.com/api/square-webhook`.
3. Saves the signing key and URL in `/etc/pda/api.env` (dated copy of the old file in
   `/root/backups/pda-square/`), restarts pda-api (checkout pauses a second or two).
4. Self-test: sends pda-api a signed test message and checks it verifies on the exact bytes.
5. Asks Square to send a test event (ignored safely: the webhook re-reads every payment from
   Square, and test events use sample ids that don't exist).

Students are not affected yet: Supabase still handles payments.

**Switch (with Amanda's go-ahead):**

```
sudo pda-square cutover
```

It re-runs the self-test, asks you to type yes, turns the droplet webhook ON and the Supabase one
OFF. Undo any time: `sudo pda-square rollback` (Supabase ON, droplet OFF).

**Check any time (read-only):** `sudo pda-square status`

After the switch, the next paid student shows a note starting `[SQUARE WEBHOOK droplet]` in the
admin messages, and gets the welcome email.

## If the self-test says pda-api doesn't pass the exact bytes

Square signs the exact request text. If pda-api parses the JSON and throws the text away, real
Square messages can't be verified. In pda-api's request handler, keep the text before parsing:

```js
const text = Buffer.concat(chunks).toString('utf8');
req.rawBody = text;                 // add this line
req.body = text ? JSON.parse(text) : undefined;
```

Restart pda-api and run `sudo pda-square self-test`. `cutover` refuses until it passes.

## If Square won't let the key manage webhooks

Square only allows webhook changes with the website app's own personal access token.
`webhook-setup` then prints the five-minute manual route: add the subscription in the Square
Developer Console, and paste its signing key with `sudo pda-square set-webhook-key` (hidden).

## What it touches

- `/etc/pda/api.env`: sets `SQUARE_WEBHOOK_SIGNATURE_KEY` and `SQUARE_WEBHOOK_URL` only; every
  other line, the owner and the permissions stay as they were.
- `/root/backups/pda-square/`: dated copies of the env file (root-only).
- Square: creates one webhook subscription; `cutover` / `rollback` switch subscriptions on or off.
- Restarts `pda-api` after saving a key.
- Never prints a key or token. Nothing else on the droplet is changed.

## After Supabase is switched off

- Remove the fallback in `assets/pda-pay.js` (and its script tags) once nothing answers there.
- The welcome email's sign-in link and the checkout's login lookup live in `api/_accounts.mjs`;
  when logins move off Supabase Auth, that file is the only one to change.

## Tests (fictional data only)

```
npm run check:square-api                     # the four handlers, the page helper, the pages
python3 ops/square/tests/test_pda_square.py  # this tool vs a fake Square + the real webhook
```
