# Cowork request — July 13, 2026 (enable Amanda's "Enroll a student" button)

*A 5-minute browser task. Paste the prompt below into a browser-capable Claude
(Cowork / local agent mode) on Amanda's Mac, or hand it to anyone with the
Supabase + Vercel logins. The code is already built and live — this only sets one
secret environment variable so the admin enroll button works.*

*Context: this one variable is also step 4 of the larger
`docs/COWORK-REQUEST-2026-07-10.md` (Kajabi exit). If you're doing that full doc,
you can skip this one — it's the same key. This standalone version exists for when
the ONLY goal is turning on manual enrollment.*

---

## PROMPT — copy everything below this line

You are enabling one feature for Premier Dental Academy of Longview: the admin
"+ Enroll a student" button on `/admin/students`, which lets Amanda give a student
access to a course without a purchase. The code is already deployed; it just needs
the Supabase service-role key set in Vercel. Never paste the key into chat, a
document, or the code repo — it goes ONLY into the Vercel environment-variable
field. Do these in order and report the result.

### 1. Copy the service-role key from Supabase
- Sign in at supabase.com/dashboard and open the project **`lmbsuwslsycukynzpzik`**
  (Premier Dental Academy).
- Left sidebar: **Project Settings** (gear) → **API Keys** (older dashboards:
  **Settings → API**).
- Under **Project API keys**, find the row labeled **`service_role`** / **`secret`**.
- Click **Reveal**, then **Copy**. It's a long string starting with `eyJ...`.
- ⚠️ This is the **service_role** key, NOT the `anon`/`publishable` one. It has full
  admin power — never put it in the website code or any public place.

### 2. Paste it into Vercel
- Sign in at vercel.com → team **realryannichols** → project
  **`premier-dental-academyof-longview`** → **Settings** → **Environment Variables**.
- Add a new variable:
  - **Key:** `SUPABASE_SERVICE_ROLE_KEY`
  - **Value:** *(paste the key from step 1)*
  - **Environments:** check **Production** (and **Preview** if offered).
- Click **Save**.

### 3. Redeploy so it takes effect
- **Deployments** → newest deployment → **⋯** menu → **Redeploy**.
- Wait for the deploy to finish (green "Ready").

### 4. Verify it works
- Go to **premierdentalacademyoflongview.com/admin/students** (signed in as an admin
  account — Amanda's, or Ryan's).
- Click **"+ Enroll a student"**, enter a test email + name, pick **Online RDA
  program**, and submit.
- Expected: a green success message (and a magic sign-in link shown in the box if
  email isn't configured yet). If it says *"SUPABASE_SERVICE_ROLE_KEY not set"*, the
  variable didn't save or the app wasn't redeployed — repeat steps 2–3.
- (Optional cleanup: that test enrollment can be left as-is or removed later via the
  same tool's "Remove access" action.)

### 5. Report back
State: which key you set, that the redeploy finished, and the result of the test
enrollment (success message? magic link shown?). Flag anything that blocked you.

## Notes
- This same `SUPABASE_SERVICE_ROLE_KEY` also powers the email cron jobs, but those
  need three more variables (`RESEND_API_KEY`, `RESEND_FROM`, `CRON_SECRET`) — see
  `docs/COWORK-REQUEST-2026-07-10.md` if you want to turn email on too.
- Nothing here charges anyone or sends any email. It only lets an admin grant course
  access.
