// quo-send-sms
// Admin-only: sends an outbound SMS via OpenPhone (Quo) to a recipient phone.
// Body: { to: "+19035551234", body: "text to send", related_lead_id?: string, related_student_id?: string }
// Logs the message into communications. Requires the caller to have profiles.is_admin = true.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  const headers = { ...CORS, "content-type": "application/json" };

  try {
    // Verify caller is an authenticated PDA admin
    const userClient = createClient(SUPABASE_URL, SERVICE_KEY, {
      global: { headers: { authorization: req.headers.get("authorization") || "" } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: profile } = await admin.from("profiles").select("is_admin, first_name, email").eq("id", userData.user.id).maybeSingle();
    if (!profile?.is_admin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers });

    const body = await req.json().catch(() => ({}));
    const to = String(body.to || "").trim();
    const content = String(body.body || "").trim();
    if (!to || !content) return new Response(JSON.stringify({ error: "missing to/body" }), { status: 400, headers });

    // Pull Quo API key
    const { data: keyRow } = await admin.from("app_secrets").select("value").eq("key", "QUO_API_KEY").maybeSingle();
    const QUO_API_KEY = keyRow?.value;
    if (!QUO_API_KEY) return new Response(JSON.stringify({ error: "QUO_API_KEY not configured" }), { status: 500, headers });

    // Look up Quo phone number id (cache via app_secrets so we don't hit Quo each call)
    let pdaPhoneId: string | null = null;
    const { data: cachedId } = await admin.from("app_secrets").select("value").eq("key", "QUO_PHONE_NUMBER_ID").maybeSingle();
    if (cachedId?.value) pdaPhoneId = cachedId.value;
    if (!pdaPhoneId) {
      const phNumRes = await fetch("https://api.openphone.com/v1/phone-numbers", { headers: { Authorization: QUO_API_KEY } });
      const phNumData = await phNumRes.json();
      const pdaPhone = (phNumData?.data || [])[0];
      pdaPhoneId = pdaPhone?.id || null;
      if (pdaPhoneId) {
        await admin.from("app_secrets").upsert({ key: "QUO_PHONE_NUMBER_ID", value: pdaPhoneId, updated_at: new Date().toISOString() });
      }
    }
    if (!pdaPhoneId) return new Response(JSON.stringify({ error: "no Quo phone number found" }), { status: 500, headers });

    // Send via OpenPhone
    const smsRes = await fetch("https://api.openphone.com/v1/messages", {
      method: "POST",
      headers: { Authorization: QUO_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({ from: pdaPhoneId, to: [to], content }),
    });
    const smsBody = await smsRes.json().catch(() => ({}));
    if (!smsRes.ok) {
      return new Response(JSON.stringify({ error: "openphone send failed", status: smsRes.status, detail: smsBody }), { status: 502, headers });
    }

    // Log into communications
    await admin.from("communications").insert({
      contact_phone: to,
      channel: "sms",
      direction: "outbound",
      body: content,
      source: "admin-reply",
      related_lead_id: body.related_lead_id || null,
      related_student_id: body.related_student_id || null,
      metadata: { sent_by: profile.email, sent_by_name: profile.first_name },
    });

    return new Response(JSON.stringify({ ok: true, sent: true, to }), { headers });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || String(err) }), { status: 500, headers });
  }
});
