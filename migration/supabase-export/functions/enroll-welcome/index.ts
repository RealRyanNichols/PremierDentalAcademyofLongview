// enroll-welcome: branded welcome (in-person gets supply list + start date) + notify hello@.
// Public + secret-protected (body.secret == app_secrets.ENROLL_WELCOME_SECRET). Reads RESEND key from app_secrets.
// Deduped via public.welcome_log (one welcome per email) unless body.force === true. Fail-open: a failed
// Resend send releases the dedupe claim so a later event can retry.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_FROM_ENV = Deno.env.get("RESEND_API_KEY");
const SITE_URL = "https://premierdentalacademyoflongview.com";
const FROM = "Amanda at Premier Dental Academy <hello@premierdentalacademyoflongview.com>";
const TEAM_INBOX = "hello@premierdentalacademyoflongview.com";
const SUPPLY_URL = "https://lmbsuwslsycukynzpzik.supabase.co/storage/v1/object/public/pda-assets/PDA-School-Supply-List.pdf";

const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, content-type, apikey", "access-control-allow-methods": "POST, OPTIONS" };
const J = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "content-type": "application/json" } });
const esc = (x: unknown) => String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

function prettyDate(iso: string): string {
  const s = String(iso || "");
  if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return "";
  const d = new Date(s.slice(0, 10) + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const body = await req.json().catch(() => ({}));
  const { email, first_name, last_name, phone, path, class_name, start_date, secret, force } = body as Record<string, string | boolean>;

  const { data: rows } = await sb.from("app_secrets").select("key,value").in("key", ["ENROLL_WELCOME_SECRET", "RESEND_API_KEY"]);
  const cfg: Record<string, string> = {}; (rows || []).forEach((r: any) => cfg[r.key] = r.value);
  if (!secret || secret !== cfg["ENROLL_WELCOME_SECRET"]) return J({ error: "unauthorized" }, 401);
  if (!email) return J({ error: "email required" }, 400);
  const RESEND_API_KEY = cfg["RESEND_API_KEY"] || RESEND_FROM_ENV;
  if (!RESEND_API_KEY) return J({ error: "RESEND_API_KEY not configured" }, 500);

  const emailKey = String(email).toLowerCase().trim();

  // Dedupe: one welcome per email (atomic via PK) unless force===true.
  if (force === true) {
    await sb.from("welcome_log").upsert({ email: emailKey, sent_at: new Date().toISOString(), meta: { path: path || null, class_name: class_name || null, start_date: start_date || null, forced: true } }, { onConflict: "email" });
  } else {
    const { error: claimErr } = await sb.from("welcome_log").insert({ email: emailKey, meta: { path: path || null, class_name: class_name || null, start_date: start_date || null } });
    if (claimErr && (claimErr.code === "23505" || /duplicate key/i.test(claimErr.message || ""))) {
      return J({ ok: true, deduped: true, email: emailKey });
    }
  }

  const isInPerson = String(path || "").toLowerCase().includes("person");
  const planLabel = (class_name as string) || (isInPerson ? "In-Person (Longview campus)" : "Online (12-week, self-paced)");
  const greeting = first_name ? esc(first_name) : "there";

  const { data: linkData } = await sb.auth.admin.generateLink({ type: "magiclink", email: emailKey, options: { redirectTo: SITE_URL + "/dashboard" } });
  const magicLink = linkData?.properties?.action_link || (SITE_URL + "/login");

  const niceStart = prettyDate(start_date as string);
  const startBlock = niceStart ? '<div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:10px;padding:16px;margin-bottom:14px;"><h3 style="margin:0 0 4px;font-size:16px;color:#065f46;">🗓️ Your class start date</h3><p style="margin:0;font-size:15px;color:#064e3b;">Your <strong>' + esc(planLabel) + '</strong> class begins <strong>' + esc(niceStart) + '</strong>. Add it to your calendar — we can’t wait to meet you!</p></div>' : "";

  const supplyBlock = isInPerson ? '<div style="background:#fff7ed;border:1px solid #fbbf24;border-radius:10px;padding:16px;margin-bottom:14px;"><h3 style="margin:0 0 6px;font-size:16px;color:#16294a;">📎 Your School Supply List (attached)</h3><p style="margin:0;font-size:14px;color:#1f3a63;">We’ve attached your supply list to this email — grab these before your first day on the Longview campus. Don’t forget your <strong>driver’s license</strong> and <strong>high school diploma (or equivalent)</strong>.</p></div>' : "";

  const html = '<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#f4f7fb;margin:0;padding:0;color:#16294a;"><div style="max-width:560px;margin:0 auto;padding:32px 24px;"><div style="text-align:center;padding:18px;background:#16294a;border-radius:14px 14px 0 0;"><h1 style="color:#fff;font-family:Georgia,serif;font-size:24px;margin:0;">Premier Dental Academy of Longview</h1></div><div style="background:#fff;padding:32px 28px;border-radius:0 0 14px 14px;border:1px solid #e6edf6;border-top:0;"><h2 style="font-family:Georgia,serif;color:#16294a;font-size:28px;margin:0 0 16px;">Welcome, ' + greeting + '! 👋</h2><p style="font-size:16px;line-height:1.6;margin:0 0 16px;">I’m so glad you’re here. You just took the first real step toward your career as a Registered Dental Assistant — and I’m proud of you for it.</p>' + startBlock + supplyBlock + '<div style="background:#f4f7fb;border-radius:10px;padding:18px;margin-bottom:14px;border-left:4px solid #c9a961;"><h3 style="margin:0 0 6px;font-size:16px;color:#16294a;">🎒 Your PDA Student Hub</h3><p style="margin:0 0 10px;font-size:14px;color:#1f3a63;">All your tools, practice software, mock state board exam, classmates, and direct text to me — in one place.</p><a href="' + magicLink + '" style="display:inline-block;background:#16294a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">Sign in to my Student Hub →</a></div><div style="background:#f4f7fb;border-radius:10px;padding:18px;margin-bottom:14px;border-left:4px solid #2b4a7a;"><h3 style="margin:0 0 6px;font-size:16px;color:#16294a;">📚 Your Course in Kajabi</h3><p style="margin:0 0 10px;font-size:14px;color:#1f3a63;">All your video lessons, quizzes, and curriculum live here. Use the same email you signed up with.</p><a href="https://premierdentalacademyoflongview.mykajabi.com/library" style="display:inline-block;background:#2b4a7a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">Open my Kajabi courses →</a></div><p style="font-size:15px;line-height:1.6;margin:24px 0 8px;">Save my number: <strong>(903) 913-6444</strong>. Text me anytime — lost, stuck, or excited. That’s what I’m here for.</p><p style="font-size:15px;line-height:1.6;margin:24px 0 0;">Talk soon,</p><p style="font-size:18px;line-height:1.4;margin:4px 0 0;font-family:Georgia,serif;color:#16294a;"><strong>Amanda Williams</strong></p><p style="font-size:13px;line-height:1.4;margin:2px 0 0;color:#1f3a63;">Founder + Lead Instructor, PDA</p></div><div style="text-align:center;padding:18px;font-size:12px;color:#1f3a63;">Premier Dental Academy of Longview · Longview, Texas<br/><a href="mailto:hello@premierdentalacademyoflongview.com" style="color:#2b4a7a;">hello@premierdentalacademyoflongview.com</a></div></div></body></html>';

  const studentPayload: Record<string, unknown> = { from: FROM, to: [emailKey], subject: "Welcome to Premier Dental Academy! Here’s where to start.", html };
  if (isInPerson) studentPayload.attachments = [{ filename: "PDA-School-Supply-List.pdf", path: SUPPLY_URL }];

  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + RESEND_API_KEY, "content-type": "application/json" }, body: JSON.stringify(studentPayload) });
  const result = await r.json().catch(() => ({}));

  // Fail-open: if the send failed and this wasn't forced, release the dedupe claim so a later event retries.
  if (!r.ok && force !== true) { await sb.from("welcome_log").delete().eq("email", emailKey); }

  const adminHtml = '<div style="font-family:-apple-system,sans-serif;color:#16294a;max-width:520px;"><h2 style="margin:0 0 8px;">🎓 New enrollment</h2><table style="font-size:15px;line-height:1.7;"><tr><td style="padding-right:12px;color:#64748b;">Name</td><td><strong>' + esc((first_name || "") + " " + (last_name || "")) + '</strong></td></tr><tr><td style="padding-right:12px;color:#64748b;">Email</td><td>' + esc(emailKey) + '</td></tr><tr><td style="padding-right:12px;color:#64748b;">Phone</td><td>' + esc(phone || "—") + '</td></tr><tr><td style="padding-right:12px;color:#64748b;">Class</td><td><strong>' + esc(planLabel) + '</strong></td></tr>' + (niceStart ? '<tr><td style="padding-right:12px;color:#64748b;">Starts</td><td><strong>' + esc(niceStart) + '</strong></td></tr>' : '') + '</table><p style="font-size:13px;color:#64748b;margin-top:14px;">Welcome email ' + (r.ok ? "sent ✓" : "FAILED ✗") + (isInPerson ? " (supply list attached)" : "") + '.</p></div>';
  let adminNotify: unknown = { sent: false };
  try {
    const ar = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + RESEND_API_KEY, "content-type": "application/json" }, body: JSON.stringify({ from: FROM, to: [TEAM_INBOX], subject: "🎓 New " + (isInPerson ? "In-Person" : "Online") + " enrollment: " + ((first_name || "") + " " + (last_name || "")).trim(), html: adminHtml }) });
    adminNotify = { sent: ar.ok, status: ar.status };
  } catch (e) { adminNotify = { sent: false, error: String(e) }; }

  await sb.from("communications").insert({ contact_email: emailKey, contact_name: (first_name || emailKey), channel: "email", direction: "outbound", body: "[AUTO] Welcome email (" + planLabel + ") sent via Resend" + (isInPerson ? " with supply list" : "") + (niceStart ? " — starts " + niceStart : "") + ". Team notified at hello@.", source: "resend", metadata: { resend_id: (result as any)?.id, path: path || null, start_date: start_date || null, admin_notify: adminNotify } });

  return J({ ok: r.ok, email: emailKey, in_person: isInPerson, start_date: start_date || null, resend: result, admin_notify: adminNotify });
});
