// Quo (OpenPhone) inbound webhook — Sona AI call data + SMS, into the pipeline.
// =============================================================================
// Handles two families of Quo events:
//
//   CALLS  call.completed / call.transcript.completed / call.summary.completed
//          → logged to communications (channel='call'), ONE row per call_id
//            (transcript + summary merge into it), lead upserted, an admin task
//            created on completion. Sona's captured fields (email / name /
//            program interest / timeline) are parsed from the summary and used
//            to seed the lead grade + "ready now vs which month".
//
//   TEXTS  message.received
//          → logged to communications (channel='sms'), lead upserted, admin task
//            created. *** AUTO-REPLY STAYS OFF. *** Texts are LOGGED, never
//            auto-answered. The after-hours AI reply path is retained but gated
//            behind app_secrets.QUO_AUTOREPLY_ENABLED ('off' = silent, the
//            standing setting per Amanda). Logging happens regardless.
//
// PRICING (single source of truth — do NOT drift):
//   In-Person $3,000 · Online $397 · $200 min down, build-your-own plan.
//
// Auth: ?secret= must equal SECRET below (matches the live Quo subscription).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SECRET = "pda-quo-2026";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = "https://premierdentalacademyoflongview.com";
const PDA_DIGITS = "9039136444"; // our Quo number, used to pick the "other" party

const PRICE_IN_PERSON = 3000;
const PRICE_ONLINE = 397;
const MIN_DOWN = 200;

const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });

function isAfterHours(now = new Date()): boolean {
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", hour12: false });
  const hour = parseInt(fmt.format(now), 10);
  return hour >= 20 || hour < 6;
}

function digits10(p: string): string { return (p || "").replace(/\D/g, "").slice(-10); }

// ── Sona / free-text field extraction ──
// Common words the name patterns can falsely catch ("This is my test" → "my").
const NAME_STOPWORDS = new Set(["my","the","a","an","this","that","just","here","interested","looking","trying","calling","texting","wondering","hoping","ready","still","very","really","also","not","your","our","good","doing","going","gonna","wanting","need","available","free","able","sorry","yes","no","ok","okay"]);
function extractInfo(text: string): { email?: string; firstName?: string } {
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  const email = emailMatch ? emailMatch[0].toLowerCase() : undefined;
  const nameMatch =
    text.match(/\b(?:my name is|this is|i am|i'?m|name'?s|caller(?:'s)? name(?: is)?)\s+([A-Z][a-z]{1,25})\b/i) ||
    text.match(/^([A-Z][a-z]{1,25})\s+(?:here|texting|reaching out|called|calling)/i);
  let firstName = nameMatch ? nameMatch[1] : undefined;
  if (firstName && NAME_STOPWORDS.has(firstName.toLowerCase())) firstName = undefined;
  if (firstName) firstName = firstName.replace(/^./, (c) => c.toUpperCase());
  return { email, firstName };
}

function detectPath(text: string): "online" | "in_person" | "unspecified" {
  const t = text.toLowerCase();
  if (/\b(online|virtual|remote|zoom|from home)\b/.test(t)) return "online";
  if (/\b(in.?person|in person|campus|longview|on.?site|on site)\b/.test(t)) return "in_person";
  return "unspecified";
}

// "ready now" vs "wants to start in <month>" from a call summary / transcript.
const MONTHS = ["january","february","march","april","may","june","july","august","september","october","november","december"];
function detectTimeline(text: string): string | null {
  const t = (text || "").toLowerCase();
  if (/\b(ready (to (start|enroll|sign up|go))?|start (now|today|asap|right away|immediately)|sign up now|enroll now|as soon as possible)\b/.test(t)) return "ready_now";
  for (let i = 0; i < MONTHS.length; i++) {
    if (new RegExp(`\\b${MONTHS[i]}\\b`).test(t)) {
      const now = new Date();
      let year = now.getFullYear();
      if (i < now.getMonth()) year += 1; // a past month name means next year
      return `${year}-${String(i + 1).padStart(2, "0")}`;
    }
  }
  if (/\bnext month\b/.test(t)) { const d = new Date(); d.setMonth(d.getMonth() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
  return null;
}

// Conservative seed grade from a call summary. Amanda owns the final grade — we
// only ever set it when it's still null.
function seedGrade(text: string): "hot" | "qualified" | "non_qualified" | null {
  const t = (text || "").toLowerCase();
  if (/\b(ready to (enroll|sign up|start|pay|go)|wants to enroll|sign(ed)? up|paid|deposit|put.* down|card)\b/.test(t)) return "hot";
  if (/\b(not (interested|qualified)|wrong number|spam|no longer|just looking|price too high|can'?t afford)\b/.test(t)) return "non_qualified";
  if (/\b(interested|asked about|wants info|qualif|good fit|high school|ged|timeline|tour)\b/.test(t)) return "qualified";
  return null;
}

// ── Lead upsert by phone ──
async function upsertLeadByPhone(sb: any, phone: string, opts: {
  firstName?: string; email?: string; source: string; note?: string;
}): Promise<any> {
  const clean = digits10(phone);
  let { data: lead } = await sb.from("leads").select("*").ilike("phone", `%${clean}%`).limit(1).maybeSingle();
  if (!lead) {
    const { data: created } = await sb.from("leads").insert({
      first_name: opts.firstName || "", email: opts.email || null, phone,
      pipeline_stage: "new", source: opts.source,
      amanda_notes: opts.note || null, last_contact_at: new Date().toISOString(),
    }).select().single();
    return created;
  }
  const updates: any = { last_contact_at: new Date().toISOString() };
  if (opts.email && !lead.email) updates.email = opts.email;
  if (opts.firstName && !lead.first_name) updates.first_name = opts.firstName;
  await sb.from("leads").update(updates).eq("id", lead.id);
  return { ...lead, ...updates };
}

// ============================ CALL EVENTS ============================
async function handleCall(sb: any, type: string, obj: any, body: any): Promise<Response> {
  const callId: string = String(obj.callId || obj.id || obj.call_id || "");
  const direction: string = (obj.direction || "").toLowerCase().includes("out") ? "outbound" : "inbound";
  const from: string = obj.from || obj.from_number || "";
  const to: string = obj.to || obj.to_number || "";
  // The "other party" is whichever side isn't our Quo number.
  let external = direction === "outbound" ? to : from;
  if (digits10(from) === PDA_DIGITS) external = to;
  if (digits10(to) === PDA_DIGITS) external = from;
  const status: string = obj.status || obj.disposition || "";
  const durationSec: number = Number(obj.duration ?? obj.duration_seconds ?? obj.callDuration ?? 0) || 0;
  const recordingUrl: string = obj.recordingUrl || obj.media?.[0]?.url || obj.recording?.url || "";

  if (!external && !callId) return json({ ok: false, reason: "call missing party + id", type, got: body }, 200);

  // Build transcript / summary text from whatever this sub-event carries.
  let transcriptText = "";
  if (type.includes("transcript")) {
    if (Array.isArray(obj.dialogue)) transcriptText = obj.dialogue.map((d: any) => `${d.identifier || d.userId || "?"}: ${d.content || ""}`).join("\n");
    else transcriptText = obj.transcript || obj.text || "";
  }
  let summaryText = "";
  if (type.includes("summary")) {
    const parts: string[] = [];
    if (Array.isArray(obj.summary)) parts.push(...obj.summary);
    else if (obj.summary) parts.push(String(obj.summary));
    if (Array.isArray(obj.nextSteps)) parts.push("Next steps: " + obj.nextSteps.join("; "));
    summaryText = parts.join("\n");
  }

  // Lead upsert + Sona field capture (from summary/transcript when present).
  const richText = `${summaryText}\n${transcriptText}`.trim();
  const extracted = extractInfo(richText);
  const lead = await upsertLeadByPhone(sb, external || from || to, {
    firstName: extracted.firstName, email: extracted.email, source: "quo_call",
    note: `Auto-created from Quo ${type}`,
  });

  // Seed grade + timeline from the summary, only filling blanks.
  if (lead?.id && summaryText) {
    const patch: any = {};
    if (!lead.lead_grade) { const g = seedGrade(summaryText); if (g) patch.lead_grade = g; }
    if (!lead.ready_timeline) { const tl = detectTimeline(richText); if (tl) patch.ready_timeline = tl; }
    if (!lead.path_preference) { const p = detectPath(richText); if (p !== "unspecified") patch.path_preference = p; }
    if ((lead.pipeline_stage || "new") === "new") patch.pipeline_stage = "contacted";
    if (Object.keys(patch).length) await sb.from("leads").update(patch).eq("id", lead.id);
  }

  // ONE communications row per call_id; transcript + summary merge into it.
  let existing: any = null;
  if (callId) {
    const { data } = await sb.from("communications").select("id,body,metadata,duration_seconds")
      .eq("channel", "call").filter("metadata->>call_id", "eq", callId).maybeSingle();
    existing = data;
  }
  const baseBody = summaryText || (existing?.body) ||
    (status.toLowerCase().includes("miss") || status.toLowerCase().includes("no-answer") ? "[Missed call]" : "[Call]");
  const mergedMeta = {
    ...(existing?.metadata || {}),
    call_id: callId, status, direction, duration_seconds: durationSec || existing?.metadata?.duration_seconds || 0,
    recording_url: recordingUrl || existing?.metadata?.recording_url || null,
    transcript: transcriptText || existing?.metadata?.transcript || null,
    summary: summaryText || existing?.metadata?.summary || null,
    last_event: type, extracted,
  };
  if (existing) {
    await sb.from("communications").update({
      body: baseBody, duration_seconds: durationSec || existing.duration_seconds || null, metadata: mergedMeta,
    }).eq("id", existing.id);
  } else {
    await sb.from("communications").insert({
      contact_phone: external || from, contact_name: extracted.firstName || lead?.first_name || null,
      contact_email: extracted.email || lead?.email || null,
      channel: "call", direction, body: baseBody, source: "quo",
      duration_seconds: durationSec || null, related_lead_id: lead?.id || null, metadata: mergedMeta,
    });
  }

  // One admin task per call, on the completion event.
  if (type === "call.completed") {
    const missed = status.toLowerCase().includes("miss") || status.toLowerCase().includes("no-answer") || durationSec === 0;
    await sb.from("admin_tasks").insert({
      title: `📞 ${missed ? "Missed call" : "Call"} from ${extracted.firstName || external || from} — review`,
      notes: [
        `Call ${callId || "(no id)"} · ${direction} · ${status || "completed"} · ${durationSec}s`,
        extracted.email ? `Email captured: ${extracted.email}` : null,
        `Sona summary will attach when it arrives. Open the lead in the office to grade + set next action.`,
      ].filter(Boolean).join("\n"),
      priority: 1, status: "open", related_phone: external || from, related_lead_id: lead?.id || null,
    });
  }

  return json({ ok: true, type, call_id: callId, direction, lead_id: lead?.id, merged: !!existing });
}

// ============================ SMS EVENTS ============================
// Knowledge base kept for the OPTIONAL after-hours AI (kill-switch gated, OFF).
const SMS_KB: Array<{ test: RegExp; intent: string; confidence: "high" | "low"; reply: (t: string) => string }> = [
  { intent: "price", confidence: "high", test: /(price|cost|tuition|how much|expense|afford|payment|fee)/i,
    reply: (text) => { const p = detectPath(text);
      if (p === "online") return `PDA Online is $${PRICE_ONLINE} total. Pay in full or build your own plan from $${MIN_DOWN} down. ${SITE_URL}/tuition.html`;
      if (p === "in_person") return `PDA In-Person is $${PRICE_IN_PERSON} total. Pay in full or build your own plan from $${MIN_DOWN} down. ${SITE_URL}/tuition.html`;
      return `Two tracks:\n• In-Person: $${PRICE_IN_PERSON}\n• Online: $${PRICE_ONLINE}\nBuild your own plan from $${MIN_DOWN} down. ${SITE_URL}/tuition.html`; } },
  { intent: "payments", confidence: "high", test: /(payment plan|installment|weekly|monthly|daily|financing|finance|down|deposit|put down)/i,
    reply: () => `$${MIN_DOWN} minimum down, then daily / weekly / monthly until paid off. ${SITE_URL}/tuition.html` },
  { intent: "link", confidence: "high", test: /(send (me )?(a |the )?link|sign me up|enroll me|i want to (sign|enroll|join|pay))/i,
    reply: () => `Tuition + enrollment: ${SITE_URL}/tuition.html` },
  { intent: "stop", confidence: "high", test: /\b(stop|unsubscribe|leave me alone)\b/i, reply: () => `Got it — you won't hear from us again.` },
  { intent: "hello", confidence: "low", test: /^(hi|hello|hey|yo|sup)$/i, reply: () => "" },
];
function classify(text: string): { intent: string; confidence: "high" | "low"; replyBody: string } {
  const t = (text || "").trim();
  for (const item of SMS_KB) if (item.test.test(t)) return { intent: item.intent, confidence: item.confidence, replyBody: item.reply(t) };
  return { intent: "escalate", confidence: "low", replyBody: "" };
}

async function handleSms(sb: any, obj: any, body: any): Promise<Response> {
  const fromPhone: string = obj.from || obj.from_number || obj.sender || obj.phone || "";
  const text: string = obj.body || obj.text || obj.message || obj.content || "";
  const direction: string = obj.direction || "";
  const phoneNumberId: string = obj.phoneNumberId || obj.phone_number_id || "";
  const senderName: string = obj.name || body.name || "";

  if (direction && direction !== "incoming" && direction !== "inbound") return json({ ok: true, skipped: "outbound message" });
  if (!fromPhone || !text) return json({ ok: false, reason: "missing from or body", got: body });

  const extracted = extractInfo(text);
  const firstName = extracted.firstName || (senderName || "").split(" ")[0] || undefined;
  const lead = await upsertLeadByPhone(sb, fromPhone, {
    firstName, email: extracted.email, source: "quo_sms",
    note: `Auto-created from inbound Quo SMS: "${text.slice(0, 200)}"`,
  });

  const { intent, confidence, replyBody } = classify(text);
  if (lead?.id && (lead.pipeline_stage || "new") === "new") {
    await sb.from("leads").update({ pipeline_stage: "contacted", last_contact_at: new Date().toISOString() }).eq("id", lead.id);
  }

  // ALWAYS log the inbound text. This is the core requirement: texts are
  // recorded in the DB whether or not anything replies.
  await sb.from("communications").insert({
    contact_phone: fromPhone, contact_name: senderName || lead?.first_name || firstName || null,
    contact_email: extracted.email || lead?.email || null,
    channel: "sms", direction: "inbound", body: text, source: "quo",
    related_lead_id: lead?.id || null, metadata: { intent, confidence, extracted, quo_event: body.type || null },
  });

  // Auto-reply: OFF unless the kill switch is explicitly 'on'. Standing setting
  // is 'off' (Amanda replies to texts personally). We never reply during the day.
  const { data: switchRow } = await sb.from("app_secrets").select("value").eq("key", "QUO_AUTOREPLY_ENABLED").maybeSingle();
  const killSwitchOn = (switchRow?.value || "off").toLowerCase() === "on";
  const afterHours = isAfterHours();
  const shouldReply = killSwitchOn && afterHours && confidence === "high" && replyBody.length > 0;

  await sb.from("admin_tasks").insert({
    title: `💬 SMS from ${senderName || firstName || fromPhone} — needs personal reply`,
    notes: [`Their message: "${text}"`, `Intent: ${intent} (${confidence})`, `Phone: ${fromPhone}`,
      extracted.email ? `Email captured: ${extracted.email}` : null,
      shouldReply ? "✅ After-hours AI replied (kill switch ON)." : "Auto-reply OFF — reply personally."].filter(Boolean).join("\n"),
    priority: 1, status: "open", related_phone: fromPhone, related_lead_id: lead?.id || null,
  });

  let sent = false;
  if (shouldReply) {
    const { data: keyRow } = await sb.from("app_secrets").select("value").eq("key", "QUO_API_KEY").maybeSingle();
    const QUO_API_KEY = keyRow?.value;
    if (QUO_API_KEY && phoneNumberId) {
      const fullReply = `🤖 Hi! This is Amanda's AI assistant after hours.\n\n${replyBody}\n\nAmanda will text you personally first thing in the morning.`;
      try {
        const r = await fetch("https://api.openphone.com/v1/messages", {
          method: "POST", headers: { "Authorization": QUO_API_KEY, "content-type": "application/json" },
          body: JSON.stringify({ from: phoneNumberId, to: [fromPhone], content: fullReply }),
        });
        sent = r.ok;
        await sb.from("communications").insert({
          contact_phone: fromPhone, channel: "sms", direction: "outbound", body: fullReply,
          source: "quo-ai-night", related_lead_id: lead?.id || null, metadata: { intent, ai_disclosure: true },
        });
      } catch (_) { /* logging-first; never throw on reply failure */ }
    }
  }

  return json({ ok: true, intent, confidence, auto_replied: sent, after_hours: afterHours, kill_switch: killSwitchOn ? "on" : "off", lead_id: lead?.id });
}

// ============================ ENTRY ============================
Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.searchParams.get("secret") !== SECRET) return json({ error: "forbidden" }, 403);

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  let body: any = {};
  try { body = await req.json(); } catch { /* ignore */ }

  const type: string = (body.type || body.event || body.event_name || "").toLowerCase();
  const obj = body?.data?.object || body?.object || body;

  if (type.startsWith("call.")) return handleCall(sb, type, obj, body);
  // Everything else is treated as an inbound message (message.received / legacy).
  return handleSms(sb, obj, body);
});
