// kajabi-my-courses
// Returns the signed-in student's Kajabi-granted offers (their "courses")
// so the PDA dashboard can render them as 1-click cards.
//
// Credentials are stored in the public.app_secrets table (same pattern as
// QUO_API_KEY). Keys read: KAJABI_CLIENT_ID, KAJABI_CLIENT_SECRET,
// KAJABI_SITE_ID, KAJABI_SITE_URL.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const KAJABI_API = "https://api.kajabi.com/v1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

async function loadKajabiSecrets(admin: any) {
  const { data } = await admin
    .from("app_secrets")
    .select("key, value")
    .like("key", "KAJABI_%");
  const map: Record<string, string> = {};
  (data || []).forEach((r: any) => { map[r.key] = r.value; });
  return {
    clientId:     map["KAJABI_CLIENT_ID"]     || "",
    clientSecret: map["KAJABI_CLIENT_SECRET"] || "",
    siteId:       map["KAJABI_SITE_ID"]       || "",
    siteUrl:     (map["KAJABI_SITE_URL"]      || "").replace(/\/$/, ""),
  };
}

async function getKajabiToken(clientId: string, clientSecret: string): Promise<string> {
  const res = await fetch(`${KAJABI_API}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) throw new Error(`Kajabi auth failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

async function findContactIdByEmail(token: string, siteId: string, email: string): Promise<string | null> {
  const url = `${KAJABI_API}/contacts?filter[site_id]=${siteId}&filter[email_contains]=${encodeURIComponent(email)}&page[size]=10`;
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${token}`, accept: "application/vnd.api+json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const match = (data.data || []).find((c: any) =>
    (c.attributes?.email || "").toLowerCase() === email.toLowerCase()
  );
  return match?.id ?? null;
}

async function listOfferIdsForContact(token: string, contactId: string): Promise<string[]> {
  const res = await fetch(`${KAJABI_API}/contacts/${contactId}/relationships/offers`, {
    headers: { authorization: `Bearer ${token}`, accept: "application/vnd.api+json" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data || []).map((d: any) => d.id);
}

async function getOffer(token: string, offerId: string): Promise<any | null> {
  const res = await fetch(`${KAJABI_API}/offers/${offerId}`, {
    headers: { authorization: `Bearer ${token}`, accept: "application/vnd.api+json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const headers = { "content-type": "application/json", ...cors };

  try {
    const authHeader = req.headers.get("authorization") || "";
    const userClient = createClient(SUPABASE_URL, SERVICE_KEY, {
      global: { headers: { authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers });
    }
    const user = userData.user;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    const { clientId, clientSecret, siteId, siteUrl } = await loadKajabiSecrets(admin);
    const libraryUrl = siteUrl ? `${siteUrl}/library` : null;

    if (!clientId || !clientSecret || !siteId) {
      return new Response(JSON.stringify({
        configured: false,
        courses: [],
        library_url: libraryUrl,
        message: "Kajabi credentials not yet configured."
      }), { headers });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("kajabi_id, email")
      .eq("id", user.id)
      .maybeSingle();

    const email = (profile?.email || user.email || "").toLowerCase().trim();
    let kajabiId: string | null = profile?.kajabi_id ?? null;

    if (!email) {
      return new Response(JSON.stringify({
        configured: true, courses: [], library_url: libraryUrl,
        message: "No email on your profile."
      }), { headers });
    }

    const token = await getKajabiToken(clientId, clientSecret);

    if (!kajabiId) {
      kajabiId = await findContactIdByEmail(token, siteId, email);
      if (kajabiId) {
        await admin.from("profiles").update({ kajabi_id: kajabiId }).eq("id", user.id);
      }
    }

    if (!kajabiId) {
      return new Response(JSON.stringify({
        configured: true,
        courses: [],
        library_url: libraryUrl,
        message: "We couldn’t find a Kajabi account matching your email yet. Once your purchase finishes processing, your courses will appear here."
      }), { headers });
    }

    const offerIds = await listOfferIdsForContact(token, kajabiId);
    const offers = await Promise.all(offerIds.map((id) => getOffer(token, id)));
    const courses = offers.filter(Boolean).map((o: any) => ({
      id: o.id,
      title: o.attributes?.title || o.attributes?.name || "Course",
      description: o.attributes?.description || null,
      deep_link: libraryUrl,
    }));

    return new Response(JSON.stringify({
      configured: true,
      kajabi_id: kajabiId,
      courses,
      library_url: libraryUrl,
    }), { headers });
  } catch (err: any) {
    return new Response(JSON.stringify({
      configured: true,
      courses: [],
      error: err?.message || String(err),
      message: "Couldn’t reach Kajabi right now — try again in a moment."
    }), { status: 200, headers });
  }
});
