// Send a branded welcome email via Resend
// Auth: admin only (Amanda). Reads RESEND_API_KEY from secrets.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL = "https://premierdentalacademyoflongview.com";
const FROM = "Amanda at Premier Dental Academy <hello@premierdentalacademyoflongview.com>";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  // Admin gate
  const authHeader = req.headers.get("authorization") || "";
  const sbAuth = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: { user: caller } } = await sbAuth.auth.getUser();
  if (!caller) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...CORS, "content-type": "application/json" } });
  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: callerProfile } = await sb.from("profiles").select("is_admin").eq("id", caller.id).maybeSingle();
  if (!callerProfile?.is_admin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...CORS, "content-type": "application/json" } });

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured. Set it via Supabase Functions secrets.", how: "supabase secrets set RESEND_API_KEY=re_xxx" }), { status: 500, headers: { ...CORS, "content-type": "application/json" } });
  }

  const { email, first_name } = await req.json().catch(() => ({}));
  if (!email) return new Response(JSON.stringify({ error: "email required" }), { status: 400, headers: { ...CORS, "content-type": "application/json" } });

  // Generate magic link
  const { data: linkData } = await sb.auth.admin.generateLink({
    type: "magiclink", email,
    options: { redirectTo: `${SITE_URL}/dashboard.html` }
  });
  const magicLink = linkData?.properties?.action_link || `${SITE_URL}/login.html`;

  const greeting = first_name ? first_name : "there";
  const html = `
  <!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f7fb;margin:0;padding:0;color:#16294a;">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
      <div style="text-align:center;padding:18px;background:#16294a;border-radius:14px 14px 0 0;">
        <h1 style="color:#fff;font-family:Georgia,serif;font-size:24px;margin:0;">Premier Dental Academy of Longview</h1>
      </div>
      <div style="background:#fff;padding:32px 28px;border-radius:0 0 14px 14px;border:1px solid #e6edf6;border-top:0;">
        <h2 style="font-family:Georgia,serif;color:#16294a;font-size:28px;margin:0 0 16px;">Welcome, ${greeting}! 👋</h2>
        <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">I'm so glad you're here. You just took the first real step toward your career as a Registered Dental Assistant — and I'm proud of you for it.</p>
        <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">You now have access to <strong>two</strong> things:</p>

        <div style="background:#f4f7fb;border-radius:10px;padding:18px;margin-bottom:14px;border-left:4px solid #c9a961;">
          <h3 style="margin:0 0 6px;font-size:16px;color:#16294a;">📻 Your PDA Student Hub</h3>
          <p style="margin:0 0 10px;font-size:14px;color:#1f3a63;">All your tools, practice software, mock state board exam, dashboard, and direct text to me — in one place.</p>
          <a href="${magicLink}" style="display:inline-block;background:#16294a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">Sign in to my Student Hub →</a>
        </div>

        <div style="background:#f4f7fb;border-radius:10px;padding:18px;margin-bottom:14px;border-left:4px solid #2b4a7a;">
          <h3 style="margin:0 0 6px;font-size:16px;color:#16294a;">📚 Your Course in Kajabi</h3>
          <p style="margin:0 0 10px;font-size:14px;color:#1f3a63;">All your video lessons, quizzes, and curriculum live here. Use the same email you signed up with.</p>
          <a href="https://premierdentalacademyoflongview.mykajabi.com/library" style="display:inline-block;background:#2b4a7a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">Open my Kajabi courses →</a>
        </div>

        <p style="font-size:15px;line-height:1.6;margin:24px 0 8px;"><strong>What to do this week:</strong></p>
        <ol style="font-size:15px;line-height:1.7;margin:0 0 24px;padding-left:22px;">
          <li>Sign in to your Student Hub above and bookmark it.</li>
          <li>Open Kajabi and start <strong>Module 1: Anatomy</strong>.</li>
          <li>Save my number: <strong>(903) 913-6444</strong>. Text me anytime — I answer personally.</li>
        </ol>

        <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">If you get stuck, lost, or excited about something, text me. That's literally what I'm here for.</p>
        <p style="font-size:15px;line-height:1.6;margin:24px 0 0;">Talk soon,</p>
        <p style="font-size:18px;line-height:1.4;margin:4px 0 0;font-family:Georgia,serif;color:#16294a;"><strong>Amanda Williams</strong></p>
        <p style="font-size:13px;line-height:1.4;margin:2px 0 0;color:#1f3a63;">Founder + Lead Instructor, PDA</p>
      </div>
      <div style="text-align:center;padding:18px;font-size:12px;color:#1f3a63;">
        Premier Dental Academy of Longview · Longview, Texas<br/>
        <a href="mailto:hello@premierdentalacademyoflongview.com" style="color:#2b4a7a;">hello@premierdentalacademyoflongview.com</a>
      </div>
    </div>
  </body></html>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject: "Welcome to Premier Dental Academy! Here's where to start.",
      html
    })
  });
  const result = await r.json();

  // Log the send
  await sb.from("communications").insert({
    contact_email: email,
    contact_name: first_name || email,
    channel: "email",
    direction: "outbound",
    body: `[AUTO] Welcome email sent via Resend. Subject: 'Welcome to Premier Dental Academy! Here's where to start.'`,
    source: "resend",
    metadata: { resend_id: result.id, magic_link: magicLink }
  });

  return new Response(JSON.stringify({
    ok: r.ok, email, magic_link: magicLink, resend: result
  }), { headers: { ...CORS, "content-type": "application/json" } });
});
