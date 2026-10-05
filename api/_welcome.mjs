// Welcome email for a newly paid student. Import-only; used by /api/square-webhook.
// Droplet port of the Supabase function enroll-welcome v4 (Sep 28, 2026).
//
// Same behavior: one welcome per email (claimed atomically in public.welcome_log), the
// in-person version carries the supply list and class start date, hello@ gets a notice, and
// a failed send releases the claim so the next Square event can try again.
// Changes from v4: the course button opens /learn (Kajabi was retired Aug 16, 2026), links
// use the www address, and the supply list is attached from the site instead of Supabase
// Storage.
import { sb, SITE_URL, resendSend } from './_common.mjs';
import { signInLink } from './_accounts.mjs';

const FROM = 'Amanda at Premier Dental Academy <hello@premierdentalacademyoflongview.com>';
const TEAM_INBOX = 'hello@premierdentalacademyoflongview.com';
export const SUPPLY_LIST_URL = process.env.PDA_SUPPLY_LIST_URL || `${SITE_URL}/assets/docs/PDA-School-Supply-List.pdf`;

const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function prettyDate(iso) {
  const s = String(iso || '');
  if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return '';
  const d = new Date(s.slice(0, 10) + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

const isDuplicate = (e) => e && (e.status === 409 || (e.detail && e.detail.code === '23505'));

export function welcomeHtml({ first_name, planLabel, niceStart, isInPerson, link }) {
  const greeting = first_name ? esc(first_name) : 'there';
  const startBlock = niceStart
    ? '<div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:10px;padding:16px;margin-bottom:14px;"><h3 style="margin:0 0 4px;font-size:16px;color:#065f46;">🗓️ Your class start date</h3><p style="margin:0;font-size:15px;color:#064e3b;">Your <strong>' + esc(planLabel) + '</strong> class begins <strong>' + esc(niceStart) + '</strong>. Add it to your calendar — we can’t wait to meet you!</p></div>'
    : '';
  const supplyBlock = isInPerson
    ? '<div style="background:#fff7ed;border:1px solid #fbbf24;border-radius:10px;padding:16px;margin-bottom:14px;"><h3 style="margin:0 0 6px;font-size:16px;color:#16294a;">📎 Your School Supply List (attached)</h3><p style="margin:0;font-size:14px;color:#1f3a63;">We’ve attached your supply list to this email — grab these before your first day on the Longview campus. Don’t forget your <strong>driver’s license</strong> and <strong>high school diploma (or equivalent)</strong>.</p></div>'
    : '';
  return '<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#f4f7fb;margin:0;padding:0;color:#16294a;"><div style="max-width:560px;margin:0 auto;padding:32px 24px;"><div style="text-align:center;padding:18px;background:#16294a;border-radius:14px 14px 0 0;"><h1 style="color:#fff;font-family:Georgia,serif;font-size:24px;margin:0;">Premier Dental Academy of Longview</h1></div><div style="background:#fff;padding:32px 28px;border-radius:0 0 14px 14px;border:1px solid #e6edf6;border-top:0;"><h2 style="font-family:Georgia,serif;color:#16294a;font-size:28px;margin:0 0 16px;">Welcome, ' + greeting + '! 👋</h2><p style="font-size:16px;line-height:1.6;margin:0 0 16px;">I’m so glad you’re here. You just took the first real step toward your career as a Registered Dental Assistant — and I’m proud of you for it.</p>'
    + startBlock + supplyBlock
    + '<div style="background:#f4f7fb;border-radius:10px;padding:18px;margin-bottom:14px;border-left:4px solid #c9a961;"><h3 style="margin:0 0 6px;font-size:16px;color:#16294a;">🎒 Your PDA Student Hub</h3><p style="margin:0 0 10px;font-size:14px;color:#1f3a63;">All your tools, practice software, mock state board exam, classmates, and direct text to me — in one place.</p><a href="' + esc(link) + '" style="display:inline-block;background:#16294a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">Sign in to my Student Hub →</a></div>'
    + '<div style="background:#f4f7fb;border-radius:10px;padding:18px;margin-bottom:14px;border-left:4px solid #2b4a7a;"><h3 style="margin:0 0 6px;font-size:16px;color:#16294a;">📚 Your Course</h3><p style="margin:0 0 10px;font-size:14px;color:#1f3a63;">Your lessons and quizzes are under My courses in your Student Hub. Sign in with the same email you enrolled with.</p><a href="' + SITE_URL + '/learn" style="display:inline-block;background:#2b4a7a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">Open my course →</a></div>'
    + '<p style="font-size:15px;line-height:1.6;margin:24px 0 8px;">Save my number: <strong>(903) 913-6444</strong>. Text me anytime — lost, stuck, or excited. That’s what I’m here for.</p><p style="font-size:15px;line-height:1.6;margin:24px 0 0;">Talk soon,</p><p style="font-size:18px;line-height:1.4;margin:4px 0 0;font-family:Georgia,serif;color:#16294a;"><strong>Amanda Williams</strong></p><p style="font-size:13px;line-height:1.4;margin:2px 0 0;color:#1f3a63;">Founder + Lead Instructor, PDA</p></div><div style="text-align:center;padding:18px;font-size:12px;color:#1f3a63;">Premier Dental Academy of Longview · Longview, Texas<br/><a href="mailto:hello@premierdentalacademyoflongview.com" style="color:#2b4a7a;">hello@premierdentalacademyoflongview.com</a></div></div></body></html>';
}

// Sends the welcome once per email. Returns { ok, deduped?, in_person, error? }.
export async function sendWelcome({ email, first_name = '', last_name = '', phone = '', path = '', class_name = '', start_date = '', force = false }) {
  const emailKey = String(email || '').toLowerCase().trim();
  if (!emailKey) return { ok: false, error: 'email required' };
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY not configured' };
  const meta = { path: path || null, class_name: class_name || null, start_date: start_date || null };

  // Claim the welcome (primary key on email makes this atomic).
  if (force) {
    await sb('welcome_log', {
      method: 'POST',
      query: { on_conflict: 'email' },
      prefer: 'resolution=merge-duplicates,return=minimal',
      body: { email: emailKey, sent_at: new Date().toISOString(), meta: { ...meta, forced: true } },
    });
  } else {
    try {
      await sb('welcome_log', { method: 'POST', prefer: 'return=minimal', body: { email: emailKey, meta } });
    } catch (e) {
      if (isDuplicate(e)) return { ok: true, deduped: true };
      throw e;
    }
  }

  const isInPerson = String(path || '').toLowerCase().includes('person');
  const planLabel = class_name || (isInPerson ? 'In-Person (Longview campus)' : 'Online (12-week, self-paced)');
  const niceStart = prettyDate(start_date);
  const link = await signInLink(emailKey, '/dashboard');
  const html = welcomeHtml({ first_name, planLabel, niceStart, isInPerson, link });

  let sent = null;
  let sendError = null;
  try {
    sent = await resendSend({
      from: FROM,
      to: emailKey,
      subject: 'Welcome to Premier Dental Academy! Here’s where to start.',
      html,
      attachments: isInPerson ? [{ filename: 'PDA-School-Supply-List.pdf', path: SUPPLY_LIST_URL }] : undefined,
    });
  } catch (e) {
    sendError = e.message || 'send failed';
  }
  // Fail-open: release the claim so a later Square event retries the welcome.
  if (!sent && !force) {
    try { await sb('welcome_log', { method: 'DELETE', query: { email: 'eq.' + emailKey }, prefer: 'return=minimal' }); } catch { /* best effort */ }
  }

  const fullName = `${first_name || ''} ${last_name || ''}`.trim();
  const adminHtml = '<div style="font-family:-apple-system,sans-serif;color:#16294a;max-width:520px;"><h2 style="margin:0 0 8px;">🎓 New enrollment</h2><table style="font-size:15px;line-height:1.7;"><tr><td style="padding-right:12px;color:#64748b;">Name</td><td><strong>' + esc(fullName) + '</strong></td></tr><tr><td style="padding-right:12px;color:#64748b;">Email</td><td>' + esc(emailKey) + '</td></tr><tr><td style="padding-right:12px;color:#64748b;">Phone</td><td>' + esc(phone || '—') + '</td></tr><tr><td style="padding-right:12px;color:#64748b;">Class</td><td><strong>' + esc(planLabel) + '</strong></td></tr>' + (niceStart ? '<tr><td style="padding-right:12px;color:#64748b;">Starts</td><td><strong>' + esc(niceStart) + '</strong></td></tr>' : '') + '</table><p style="font-size:13px;color:#64748b;margin-top:14px;">Welcome email ' + (sent ? 'sent ✓' : 'FAILED ✗') + (isInPerson ? ' (supply list attached)' : '') + '.</p></div>';
  let adminNotify = { sent: false };
  try {
    await resendSend({ from: FROM, to: TEAM_INBOX, subject: '🎓 New ' + (isInPerson ? 'In-Person' : 'Online') + ' enrollment: ' + fullName, html: adminHtml });
    adminNotify = { sent: true };
  } catch { adminNotify = { sent: false }; }

  try {
    await sb('communications', {
      method: 'POST',
      prefer: 'return=minimal',
      body: {
        contact_email: emailKey,
        contact_name: first_name || emailKey,
        channel: 'email',
        direction: 'outbound',
        body: '[AUTO] Welcome email (' + planLabel + ') ' + (sent ? 'sent' : 'FAILED') + ' via Resend' + (isInPerson ? ' with supply list' : '') + (niceStart ? ' — starts ' + niceStart : '') + '. Team notified at hello@.',
        source: 'resend',
        metadata: { resend_id: (sent && sent.id) || null, path: path || null, start_date: start_date || null, admin_notify: adminNotify, via: 'droplet' },
      },
    });
  } catch { /* logging is best effort */ }

  return sent ? { ok: true, in_person: isInPerson } : { ok: false, in_person: isInPerson, error: sendError };
}
