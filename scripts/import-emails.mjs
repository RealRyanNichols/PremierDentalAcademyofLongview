#!/usr/bin/env node
// Import the PDA 30-day email calendar into public.email_campaigns (as DRAFTS),
// and optionally import a Kajabi contacts CSV into public.subscribers.
//
// Nothing here sends email. Campaigns are created status='draft'. The site only
// sends a campaign after an admin flips it to status='scheduled' (see
// api/cron-send-scheduled.js). Existing scheduled/sent rows are never downgraded.
//
// Usage (run locally or in CI with env set — NEVER commit the service key):
//   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/import-emails.mjs
//   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/import-emails.mjs --dir ./emails
//   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/import-emails.mjs --contacts ./kajabi-contacts.csv
//
// The HTML bodies (day01.html … day30.html) are the finished, client-safe emails
// produced alongside the calendar. Point --dir at the folder that holds them.

import fs from 'node:fs';
import path from 'node:path';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lmbsuwslsycukynzpzik.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error('SUPABASE_SERVICE_ROLE_KEY is required (never commit it).'); process.exit(1); }

const args = process.argv.slice(2);
function arg(name, def) { const i = args.indexOf(name); return i >= 0 && args[i + 1] ? args[i + 1] : def; }
const EMAIL_DIR = path.resolve(arg('--dir', './emails'));
const CONTACTS = arg('--contacts', null);

// 7:00 PM America/Chicago (CDT, UTC-5) each day → stored with an explicit offset.
const AT = (d) => `${d}T19:00:00-05:00`;

// The published PDA 30-day calendar (July 5 – Aug 3, 2026). campaign=pda30.
const CALENDAR = [
  { n: 1, date: '2026-07-05', subject: 'No pitch today (or this week, actually)', preview: 'Everything we give away for free, in one place.' },
  { n: 2, date: '2026-07-06', subject: 'Vote with one click: what should PDA teach next?', preview: "Tap the one you want. That's the whole survey." },
  { n: 3, date: '2026-07-07', subject: 'Could you pass the Texas RDA exam today?', preview: 'Free practice exam - real questions, instant explanations.' },
  { n: 4, date: '2026-07-08', subject: '"The hiring DDS hired me on the spot."', preview: 'Jasmine walked in already knowing the software.' },
  { n: 5, date: '2026-07-09', subject: 'What would YOUR paycheck look like?', preview: 'Real take-home pay for East Texas RDAs - free calculator.' },
  { n: 6, date: '2026-07-10', subject: 'Your first day - before your first day', preview: 'Step inside a real operatory from your phone.' },
  { n: 7, date: '2026-07-11', subject: 'The votes are in (well, almost)', preview: 'Last call - one click decides our next course.' },
  { n: 8, date: '2026-07-12', subject: 'The 5 questions everyone misses', preview: 'These exam topics trip up almost every future RDA.' },
  { n: 9, date: '2026-07-13', subject: '$19. Seriously.', preview: "The Study Pack - the cheapest 'yes' in dental training." },
  { n: 10, date: '2026-07-14', subject: 'Chart 25 patients before lunch', preview: 'What our students actually DO all day.' },
  { n: 11, date: '2026-07-15', subject: 'The phone call that books (or loses) the patient', preview: 'A front-desk script you can steal today.' },
  { n: 12, date: '2026-07-16', subject: 'You voted. We built it. (Doors open July 21)', preview: 'Introducing the PDA Career Vault - waitlist open now.' },
  { n: 13, date: '2026-07-17', subject: 'RDA is the door, not the room', preview: 'The career ladder nobody shows you.' },
  { n: 14, date: '2026-07-18', subject: 'Your Vault questions, answered', preview: "Is it for beginners? Do I keep access? What's inside?" },
  { n: 15, date: '2026-07-19', subject: '48 hours', preview: 'Founding price revealed tomorrow night.' },
  { n: 16, date: '2026-07-20', subject: 'The founding price is $147 (24 hours)', preview: "Doors open tomorrow at 7 PM. Here's the math." },
  { n: 17, date: '2026-07-21', subject: '🚀 The Career Vault is OPEN', preview: '$147 founding price - launch week only.' },
  { n: 18, date: '2026-07-22', subject: 'Inside Track 1 & 2: pass the exam, master the software', preview: 'A guided tour of half the Vault.' },
  { n: 19, date: '2026-07-23', subject: 'Inside Track 3 & 4: the skills that get you PAID', preview: 'Front office + career toolkit - the tour concludes.' },
  { n: 20, date: '2026-07-24', subject: '"I don\'t have time for this" - read this anyway', preview: "15 minutes a day is enough. Here's proof." },
  { n: 21, date: '2026-07-25', subject: 'Founding price ends TONIGHT at midnight', preview: '$147 becomes $247 at 12:00 AM.' },
  { n: 22, date: '2026-07-26', subject: "Vault's at $247 now - and bigger news", preview: 'August cohort dates are live.' },
  { n: 23, date: '2026-07-27', subject: 'Vault vs. the full program: which are you?', preview: 'A 60-second honest comparison.' },
  { n: 24, date: '2026-07-28', subject: '$200 holds your seat for August', preview: 'Reserve now, pay as you go - paid off before class ends.' },
  { n: 25, date: '2026-07-29', subject: "Who's paying for your training? (Maybe not you)", preview: 'Workforce Solutions, GI Bill, payment plans - check in 2 minutes.' },
  { n: 26, date: '2026-07-30', subject: 'East Texas offices keep calling us', preview: '85%+ placement. Offices request our grads by name.' },
  { n: 27, date: '2026-07-31', subject: "How to tell your family you're going back to school", preview: 'The conversation is harder than the coursework. A script helps.' },
  { n: 28, date: '2026-08-01', subject: 'August is here. So is your cohort.', preview: 'Class starts soon - seats are going.' },
  { n: 29, date: '2026-08-02', subject: 'Aisha was a single mom with a full-time job', preview: '"Twelve weeks later I had a job."' },
  { n: 30, date: '2026-08-03', subject: 'Where will you be in 12 weeks?', preview: 'Same spot - or scrubs, a certificate, and interviews?' },
];

async function rest(pathq, { method = 'GET', body, prefer } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathq}`, {
    method,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${method} ${pathq} → ${res.status} ${text}`);
  return data;
}

function pad(n) { return String(n).padStart(2, '0'); }

async function importEmails() {
  if (!fs.existsSync(EMAIL_DIR)) {
    console.log(`\n⚠ Email folder not found: ${EMAIL_DIR}`);
    console.log('  Point --dir at the folder containing day01.html … day30.html, then re-run.');
    console.log('  (These bodies are produced alongside the calendar; nothing else in this repo has them.)');
    return;
  }
  let created = 0, updated = 0, missing = 0;
  for (const c of CALENDAR) {
    const file = path.join(EMAIL_DIR, `day${pad(c.n)}.html`);
    if (!fs.existsSync(file)) { missing++; console.log(`  · day${pad(c.n)}.html missing — skipped`); continue; }
    const html = fs.readFileSync(file, 'utf8');
    const internal_title = `PDA30 · Day ${pad(c.n)}`;
    const existing = await rest(`email_campaigns?internal_title=eq.${encodeURIComponent(internal_title)}&select=id,status`);
    const fields = { subject: c.subject, preview_text: c.preview, html, audience: 'all', scheduled_at: AT(c.date) };
    if (existing.length) {
      // Never downgrade a scheduled/sent campaign; only refresh content + timing.
      await rest(`email_campaigns?id=eq.${existing[0].id}`, { method: 'PATCH', body: { ...fields, internal_title } });
      updated++;
    } else {
      await rest('email_campaigns', { method: 'POST', body: [{ ...fields, internal_title, status: 'draft' }] });
      created++;
    }
  }
  console.log(`\n📧 Campaigns: ${created} created, ${updated} updated, ${missing} missing. All new rows are DRAFT.`);
}

// --- minimal CSV parser (handles quotes + commas) ---
function parseCSV(text) {
  const rows = []; let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') q = false;
      else field += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (ch === '\r') { /* skip */ }
    else field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c && c.trim()));
}

async function importContacts(csvPath) {
  const abs = path.resolve(csvPath);
  if (!fs.existsSync(abs)) { console.log(`\n⚠ Contacts CSV not found: ${abs}`); return; }
  const rows = parseCSV(fs.readFileSync(abs, 'utf8'));
  const header = rows.shift().map((h) => h.trim().toLowerCase());
  const col = (names) => header.findIndex((h) => names.includes(h));
  const iEmail = col(['email', 'email address', 'e-mail']);
  const iFirst = col(['first name', 'first_name', 'firstname', 'first']);
  const iId = col(['id', 'contact id', 'kajabi id']);
  if (iEmail < 0) { console.log('\n⚠ No Email column found in CSV header:', header.join(', ')); return; }

  let ok = 0, skipped = 0;
  // Batch upserts by email; merge-duplicates keeps existing tags/status intact where possible.
  const batch = [];
  for (const r of rows) {
    const email = (r[iEmail] || '').trim().toLowerCase();
    if (!email || !email.includes('@')) { skipped++; continue; }
    batch.push({
      email,
      first_name: iFirst >= 0 ? (r[iFirst] || '').trim() || null : null,
      source: 'kajabi-import',
      kajabi_contact_id: iId >= 0 ? (r[iId] || '').trim() || null : null,
    });
  }
  for (let i = 0; i < batch.length; i += 500) {
    const chunk = batch.slice(i, i + 500);
    await rest('subscribers?on_conflict=email', { method: 'POST', prefer: 'resolution=ignore-duplicates,return=minimal', body: chunk });
    ok += chunk.length;
  }
  console.log(`\n👥 Contacts: ${ok} upserted, ${skipped} skipped. Existing subscribers untouched (ignore-duplicates).`);
}

(async () => {
  console.log(`PDA email import → ${SUPABASE_URL}`);
  await importEmails();
  if (CONTACTS) await importContacts(CONTACTS);
  console.log('\nDone. Review in /admin (email tools) — flip a campaign to "scheduled" only when you\'re ready to send.');
})().catch((e) => { console.error('\n✗ Import failed:', e.message); process.exit(1); });
