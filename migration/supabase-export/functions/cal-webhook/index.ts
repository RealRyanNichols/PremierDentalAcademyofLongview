// Cal.com webhook receiver — writes booked tours into the tours table
// Cal.com webhook payload shape: https://cal.com/docs/core-features/event-types/webhooks
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SECRET = "REDACTED-see-migration/supabase-export/README";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.searchParams.get("secret") !== SECRET) {
    return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { "content-type": "application/json" } });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  let body: any = {};
  try { body = await req.json(); } catch { /* keep empty */ }

  const triggerEvent = body.triggerEvent || "";
  const payload = body.payload || body;

  // Cal.com sends e.g. BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED
  // Pull attendee + start time from the payload
  const attendees = payload.attendees || [];
  const attendee = attendees[0] || {};
  const startTime = payload.startTime || payload.start || null;
  const eventTitle = (payload.eventType?.title || payload.title || "").toLowerCase();

  // Only process Campus Tour bookings (skip 15min/30min etc)
  if (!eventTitle.includes("campus tour")) {
    return new Response(JSON.stringify({ ok: true, skipped: "not a campus tour", event: eventTitle }), { headers: { "content-type": "application/json" } });
  }

  if (triggerEvent === "BOOKING_CANCELLED") {
    // Mark any existing tour for this attendee as cancelled
    if (attendee.email) {
      await sb.from("tours").update({ status: "cancelled" }).eq("email", attendee.email).eq("status", "requested");
    }
    return new Response(JSON.stringify({ ok: true, action: "cancelled" }), { headers: { "content-type": "application/json" } });
  }

  // BOOKING_CREATED or BOOKING_RESCHEDULED → upsert a tours row
  const startDate = startTime ? new Date(startTime) : new Date();
  const preferredDate = startDate.toISOString().slice(0, 10);
  const preferredTime = startDate.toLocaleString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Chicago"
  });

  const insert = {
    full_name: attendee.name || "Tour booking",
    email: attendee.email || "unknown@unknown.local",
    phone: attendee.phoneNumber || (payload.responses?.phone?.value) || null,
    preferred_date: preferredDate,
    preferred_time: preferredTime,
    party_size: 1,
    notes: payload.responses?.notes?.value || payload.additionalNotes || null,
    status: triggerEvent === "BOOKING_RESCHEDULED" ? "confirmed" : "confirmed",  // cal.com is the system of record
    source: "cal.com"
  };

  const { error } = await sb.from("tours").insert(insert);
  if (error) {
    return new Response(JSON.stringify({ error: error.message, payload: insert }), { status: 500, headers: { "content-type": "application/json" } });
  }

  return new Response(JSON.stringify({ ok: true, action: triggerEvent, tour: insert }), { headers: { "content-type": "application/json" } });
});
