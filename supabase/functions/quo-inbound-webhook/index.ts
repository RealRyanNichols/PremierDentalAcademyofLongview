// >>> DRIFT-STATUS: repo_ahead — record: supabase/functions/DEPLOYED.json >>>
// !! NOT LIVE YET — DO NOT DEPLOY WITHOUT THE OWNER'S GO-AHEAD (checked 2026-09-24) !!
// Live is v13 (deployed 2026-09-22 21:59 UTC). Everything below this block is that exact
// source, pulled on 2026-09-24 and confirmed by two independent copies, plus exactly two
// additions (both marked "2026-09-20" in the code):
//   1. a completed call moves its lead out of "new" even when no Sona summary arrives;
//   2. an outbound text moves its lead out of "new".
// Every live protection is kept as-is: a real 10-digit number before any lead lookup,
// one row per call_id (upsert_call_event), the LeadFlow Pro line skipped, one admin task
// per call, and the duplicate-delivery claim (quo_webhook_events).
// To ship: deploy the output of `node scripts/check-edge-drift.mjs --body quo-inbound-webhook`
// (this block removed), confirm list_edge_functions shows v14, then set status in_sync in
// DEPLOYED.json and delete this block. npm test enforces both. Runbook: docs/edge-functions.md.
// <<< DRIFT-STATUS <<<
// Quo (OpenPhone) inbound webhook — Sona AI call data + SMS, into the pipeline.
// =============================================================================
// Handles two families of Quo events:
//
//   CALLS  call.completed / call.transcript.completed / call.summary.completed
//          → logged to communications (channel='call'), ONE row per call_id
//            (transcript + summary merge into it), lead upserted, an admin task
//            created on completion.
//
//   TEXTS  message.received (inbound) AND outbound sends
//          → logged to communications (channel='sms'), lead upserted, admin task
//            created. *** AUTO-REPLY STAYS OFF. *** Texts are LOGGED, never
//            auto-answered. The after-hours AI reply path is retained but gated
//            behind app_secrets.QUO_AUTOREPLY_ENABLED ('off' = silent, the
//            standing setting per Amanda). Logging happens regardless.
//
// PRICING — must match business_settings / approved offers. Do NOT drift.
//   In-Person: $3,000 paid in full, OR $3,500 on a plan = $500 down + $3,000 balance.
//   Online:    $397 promotional one-time, $997 regular. Self-paced, starts any day.
//   (Corrected Aug 7 2026 — previously held retired $1,997 / $200-down pricing.)
//
// 2026-09-18 changes (Claude, at Ryan's direction):
//   1. OUTBOUND TEXTS ARE NOW LOGGED. The handler used to return early on any
//      non-inbound message, so Amanda's own replies never reached the database.
//      Nothing downstream could tell "we replied and they went quiet" from
//      "nobody ever answered them", which made contacted leads read as cold.
//   2. A MISSING DURATION NO LONGER MEANS MISSED. The admin task used
//      `durationSec === 0`, and OpenPhone often omits `duration`. 256 calls with
//      status 'completed' carried no duration and each filed a "Missed call"
//      task. Status is authoritative; answeredAt is the fallback.
//   3. DURATION IS DERIVED from answeredAt/completedAt when OpenPhone omits it.
//   4. MESSAGE DEDUPE on msg_id, because sent and delivered both fire.
//
// 2026-09-22 changes (Claude, at Ryan's direction) — v11:
//   1. CALLS WERE FILED UNDER THE WRONG PEOPLE. Summary and transcript events
//      carry no phone number, so `upsertLeadByPhone('')` ran `ilike '%%'`, which
//      matches ANY lead. Since June every such event was attached to whichever
//      lead came back first (Blythe Squires collected 166 rows that were not
//      hers, and seeded grades/timelines on the wrong leads). A lead is now
//      only looked up or created from a real 10 digit number. Party-less events
//      merge into the call's existing row by call_id, or park as a placeholder
//      (metadata.pending_party) until the call.completed event names the caller.
//   2. ONE ROW PER CALL, FOR REAL. The call_id lookup used maybeSingle(), which
//      returns nothing once two rows exist, so every later event inserted again
//      (1,149 rows for 328 calls). Lookups now use limit(1), and a unique index
//      on metadata->>'call_id' makes concurrent duplicate deliveries collapse:
//      the loser of the insert race merges into the winner's row.
//   3. ONLY THE PDA LINE. Calls on The LeadFlow Pro line (903) 500-8898 were
//      reaching this function and being created as dental leads. Events whose
//      phoneNumberId is not PDA's, or whose parties do not include PDA's number,
//      are skipped.
//   4. ONE ADMIN TASK PER CALL, created only by the delivery that first ties the
//      call to a PDA caller.
//
// 2026-09-22 v12: EVERY QUO EVENT ARRIVES TWICE. Two subscriptions point here,
//   one on API v3 (from/to) and one on v4 (participants), carrying the SAME
//   event id. Both copies raced into upsertLeadByPhone and created the same new
//   lead twice. The event id is now claimed in quo_webhook_events (primary key)
//   before anything runs; the second copy of an event returns immediately.
//
// 2026-09-22 v13: SUMMARY AND TRANSCRIPT ERASED EACH OTHER. They arrive within
//   milliseconds for the same call, and each one read the row, merged in JS and
//   wrote the whole row back, so the last writer erased the other's text. Not one
//   transcript had ever been saved. All call writes now go through the SQL
//   function upsert_call_event, which merges each event's keys under a row lock.
//   Direction is only written by events that carry it (summaries used to stamp
//   "inbound" onto outbound calls). If processing throws, the event claim is
//   released and a 500 goes back, so Quo's retry is processed instead of skipped.
//
// NOTE: the repo mirror of this file was stale (it still held the retired
// $200-down pricing) until 2026-09-18. Deployed is the source of truth. If you
// edit this, deploy AND push, or the next person ships a price regression.
//
// Auth: ?secret= must equal SECRET below (matches the live Quo subscription).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SECRET = "pda-quo-2026";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = "https://premierdentalacademyoflongview.com";
const PDA_DIGITS = "9039136444"; // our Quo number, used to pick the "other" party
const PDA_PN_ID = "PNhV3szhHa";  // Quo phone-number id of (903) 913-6444

const PRICE_IN_PERSON_PIF = 3000;
const PRICE_IN_PERSON_PLAN = 3500;
const PLAN_DOWN = 500;
const PRICE_ONLINE_PROMO = 397;
const PRICE_ONLINE_REGULAR = 997;
const TUITION_URL = `${SITE_URL}/apply`;

const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });

function isAfterHours(now = new Date()): boolean {
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", hour12: false });
  const hour = parseInt(fmt.format(now), 10);
  return hour >= 20 || hour < 6;
}

function digits10(p: string): string { return (p || "").replace(/\D/g, "").slice(-10); }

// ── Which line, and who is on the other end ──
function asPhone(v: any): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") return String(v.phoneNumber || v.phone_number || v.number || v.phone || "");
  return "";
}
// Every phone number the event names, in whatever shape Quo sent it.
function partiesOf(obj: any): string[] {
  const out: string[] = [];
  const push = (v: any) => { const p = asPhone(v); if (p) out.push(p); };
  push(obj.from ?? obj.from_number);
  const to = obj.to ?? obj.to_number;
  if (Array.isArray(to)) to.forEach(push); else push(to);
  if (Array.isArray(obj.participants)) obj.participants.forEach(push);
  return out;
}
// "pda" = this event is on (903) 913-6444. "other" = it is on another Quo line
// (The LeadFlow Pro shares the workspace). "unknown" = the event names no line
// and no parties (summary / transcript events), so it can only merge by call_id.
function lineOf(obj: any): "pda" | "other" | "unknown" {
  const pn = String(obj.phoneNumberId || obj.phone_number_id || "");
  if (pn) return pn === PDA_PN_ID ? "pda" : "other";
  const ds = partiesOf(obj).map(digits10).filter((d) => d.length === 10);
  if (ds.includes(PDA_DIGITS)) return "pda";
  if (ds.length >= 2) return "other";
  return "unknown";
}
// The caller or callee who is not us. Empty when the event does not say.
function externalOf(obj: any): string {
  const ext = partiesOf(obj).filter((p) => { const d = digits10(p); return d.length === 10 && d !== PDA_DIGITS; });
  return ext[0] || "";
}

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
// NEVER call the lookup with fewer than 10 digits: `ilike '%%'` matches every
// lead, which is how calls got filed under strangers.
async function upsertLeadByPhone(sb: any, phone: string, opts: {
  firstName?: string; email?: string; source: string; note?: string;
}): Promise<any> {
  const clean = digits10(phone);
  if (clean.length !== 10) return null;
  let { data: found } = await sb.from("leads").select("*").ilike("phone", `%${clean}%`)
    .order("created_at", { ascending: true }).limit(1);
  let lead = found?.[0] || null;
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
  const line = lineOf(obj);

  // Not our line. The LeadFlow Pro shares this Quo workspace; its calls are not
  // dental leads. Drop any placeholder a party-less sub-event parked for it.
  if (line === "other") {
    if (callId) {
      await sb.from("communications").delete().eq("channel", "call")
        .filter("metadata->>call_id", "eq", callId)
        .filter("metadata->>pending_party", "eq", "true")
        .is("related_lead_id", null);
    }
    return json({ ok: true, skipped: "not the PDA line", type, call_id: callId });
  }

  // Only events that carry a direction may set it. Summary and transcript
  // events do not, and defaulting them to "inbound" mislabeled outbound calls.
  const dirRaw = String(obj.direction || "").toLowerCase();
  const direction: string | null = dirRaw ? (dirRaw.includes("out") ? "outbound" : "inbound") : null;
  const external: string = line === "pda" ? externalOf(obj) : "";
  const status: string = obj.status || obj.disposition || "";
  const rawDuration: number = Number(obj.duration ?? obj.duration_seconds ?? obj.callDuration ?? 0) || 0;
  const answeredAt: string = obj.answeredAt || obj.answered_at || "";
  const completedAt: string = obj.completedAt || obj.completed_at || "";
  // OpenPhone frequently omits `duration`. When it does, answeredAt +
  // completedAt give it exactly. Never let a missing duration imply "missed".
  let durationSec = rawDuration;
  if (!durationSec && answeredAt && completedAt) {
    const ms = new Date(completedAt).getTime() - new Date(answeredAt).getTime();
    if (ms > 0) durationSec = Math.round(ms / 1000);
  }
  const recordingUrl: string = obj.recordingUrl || obj.media?.[0]?.url || obj.recording?.url || "";

  if (!external && !callId) return json({ ok: false, reason: "call missing party + id", type }, 200);

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

  const richText = `${summaryText}\n${transcriptText}`.trim();
  const extracted = extractInfo(richText);

  // Lead: only from a real number this event names. Never guessed.
  let lead: any = null;
  if (external) {
    lead = await upsertLeadByPhone(sb, external, {
      firstName: extracted.firstName, email: extracted.email, source: "quo_call",
      note: `Auto-created from Quo ${type}`,
    });
  }

  const st = status.toLowerCase();
  const isCompletion = type === "call.completed";
  const missed = st.includes("miss") || st.includes("no-answer") || (st !== "" && st !== "completed" && !answeredAt);
  const defaultBody: string | null = isCompletion ? (missed ? "[Missed call]" : "[Call]") : null;

  if (!callId) {
    // No id to merge on. Keep the record anyway.
    await sb.from("communications").insert({
      contact_phone: external || null, contact_name: extracted.firstName || lead?.first_name || null,
      contact_email: extracted.email || lead?.email || null, channel: "call",
      direction: direction || "inbound", body: summaryText || defaultBody || "[Call]", source: "quo",
      duration_seconds: durationSec || null, related_lead_id: lead?.id || null,
      metadata: { status, direction, duration_seconds: durationSec, summary: summaryText || null,
        transcript: transcriptText || null, last_event: type, extracted, no_call_id: true },
    });
    return json({ ok: true, type, call_id: null, lead_id: lead?.id || null });
  }

  // Only the keys this event actually knows. The database merges them in.
  const patch: Record<string, unknown> = { call_id: callId, last_event: type };
  if (status) patch.status = status;
  if (direction) patch.direction = direction;
  if (durationSec) patch.duration_seconds = durationSec;
  if (recordingUrl) patch.recording_url = recordingUrl;
  if (transcriptText) patch.transcript = transcriptText;
  if (summaryText) patch.summary = summaryText;
  if (answeredAt) patch.answered_at = answeredAt;
  if (completedAt) patch.completed_at = completedAt;
  if (extracted.firstName || extracted.email) patch.extracted = extracted;

  const { data: res, error: rpcErr } = await sb.rpc("upsert_call_event", {
    p_call_id: callId, p_patch: patch,
    p_summary_body: summaryText || null, p_default_body: defaultBody,
    p_duration: durationSec ? Math.round(durationSec) : null, p_direction: direction,
    p_phone: external || null, p_lead: lead?.id || null,
    p_name: extracted.firstName || lead?.first_name || null,
    p_email: extracted.email || lead?.email || null,
  });
  if (rpcErr) throw new Error(`upsert_call_event failed: ${rpcErr.message}`);
  const tied = !!res?.tied;              // true for exactly one event per call: the one that first named the caller
  const rowLeadId: string | null = res?.lead_id || lead?.id || null;
  const rowSummary: string = summaryText || res?.summary || "";

  // Seed grade + timeline from the Sona summary onto the lead the call belongs
  // to, only filling blanks. Runs when this event brings the summary, or when
  // this event ties the caller to a summary that arrived first.
  if (rowLeadId && rowSummary && (summaryText || tied)) {
    let leadRow: any = lead?.id === rowLeadId ? lead : null;
    if (!leadRow) {
      const { data } = await sb.from("leads").select("*").eq("id", rowLeadId).limit(1);
      leadRow = data?.[0] || null;
    }
    if (leadRow) {
      const seedText = `${rowSummary}\n${transcriptText}`.trim();
      const p: any = {};
      if (!leadRow.lead_grade) { const g = seedGrade(rowSummary); if (g) p.lead_grade = g; }
      if (!leadRow.ready_timeline) { const tl = detectTimeline(seedText); if (tl) p.ready_timeline = tl; }
      if (!leadRow.path_preference) { const pp = detectPath(seedText); if (pp !== "unspecified") p.path_preference = pp; }
      if ((leadRow.pipeline_stage || "new") === "new") p.pipeline_stage = "contacted";
      if (Object.keys(p).length) await sb.from("leads").update(p).eq("id", leadRow.id);
    }
  }
  // 2026-09-20: any completed call — Amanda dialing out, or an answered inbound call —
  // is a contact even when no Sona summary ever arrives. Before this, a lead stayed
  // "new" (and read as uncontacted on the KPI page) unless a summary event fired.
  if (lead?.id && isCompletion && (lead.pipeline_stage || "new") === "new") {
    const connected = direction === "outbound" || st === "completed" || !!answeredAt || durationSec > 0;
    if (connected) await sb.from("leads").update({ pipeline_stage: "contacted" }).eq("id", lead.id);
  }

  // One admin task per call: on completion, by the event that first tied the
  // call to a real PDA caller. Duplicates and sub-events create none.
  if (isCompletion && tied) {
    await sb.from("admin_tasks").insert({
      title: `📞 ${missed ? "Missed call" : "Call"} from ${extracted.firstName || lead?.first_name || external} — review`,
      notes: [
        `Call ${callId} · ${direction || "inbound"} · ${status || "completed"} · ${durationSec}s`,
        extracted.email ? `Email captured: ${extracted.email}` : null,
        `Sona summary will attach when it arrives. Open the lead in the office to grade + set next action.`,
      ].filter(Boolean).join("\n"),
      priority: 1, status: "open", related_phone: external, related_lead_id: rowLeadId,
    });
  }

  return json({ ok: true, type, call_id: callId, direction, line, lead_id: rowLeadId, created: !!res?.created, tied });
}

// ============================ SMS EVENTS ============================
// Knowledge base kept for the OPTIONAL after-hours AI (kill-switch gated, OFF).
const SMS_KB: Array<{ test: RegExp; intent: string; confidence: "high" | "low"; reply: (t: string) => string }> = [
  { intent: "price", confidence: "high", test: /(price|cost|tuition|how much|expense|afford|payment|fee)/i,
    reply: (text) => { const p = detectPath(text);
      if (p === "online") return `PDA Online is $${PRICE_ONLINE_PROMO} right now (regular $${PRICE_ONLINE_REGULAR}), self-paced, start any day. ${TUITION_URL}`;
      if (p === "in_person") return `PDA In-Person is $${PRICE_IN_PERSON_PIF.toLocaleString()} paid in full, or $${PRICE_IN_PERSON_PLAN.toLocaleString()} on a payment plan ($${PLAN_DOWN} down, then the $${PRICE_IN_PERSON_PIF.toLocaleString()} balance). ${TUITION_URL}`;
      return `Two tracks:\n• In-Person: $${PRICE_IN_PERSON_PIF.toLocaleString()} paid in full, or $${PRICE_IN_PERSON_PLAN.toLocaleString()} on a plan ($${PLAN_DOWN} down)\n• Online: $${PRICE_ONLINE_PROMO} right now (regular $${PRICE_ONLINE_REGULAR}), self-paced\n${TUITION_URL}`; } },
  { intent: "payments", confidence: "high", test: /(payment plan|installment|weekly|monthly|daily|financing|finance|down|deposit|put down)/i,
    reply: () => `On a plan it's $${PLAN_DOWN} down, then the $${PRICE_IN_PERSON_PIF.toLocaleString()} balance over 2–12 payments — $${PRICE_IN_PERSON_PLAN.toLocaleString()} total. Or $${PRICE_IN_PERSON_PIF.toLocaleString()} if you pay in full. ${TUITION_URL}` },
  { intent: "link", confidence: "high", test: /(send (me )?(a |the )?link|sign me up|enroll me|i want to (sign|enroll|join|pay))/i,
    reply: () => `Here's the application — it's free and takes about a minute: ${TUITION_URL}` },
  { intent: "stop", confidence: "high", test: /\b(stop|unsubscribe|leave me alone)\b/i, reply: () => `Got it — you won't hear from us again.` },
  { intent: "hello", confidence: "low", test: /^(hi|hello|hey|yo|sup)$/i, reply: () => "" },
];
function classify(text: string): { intent: string; confidence: "high" | "low"; replyBody: string } {
  const t = (text || "").trim();
  for (const item of SMS_KB) if (item.test.test(t)) return { intent: item.intent, confidence: item.confidence, replyBody: item.reply(t) };
  return { intent: "escalate", confidence: "low", replyBody: "" };
}

async function handleSms(sb: any, obj: any, body: any): Promise<Response> {
  // Not our line (The LeadFlow Pro shares the workspace): not a dental lead.
  if (lineOf(obj) === "other") return json({ ok: true, skipped: "not the PDA line" });

  const fromPhone: string = asPhone(obj.from || obj.from_number || obj.sender || obj.phone || "");
  const text: string = obj.body || obj.text || obj.message || obj.content || "";
  const direction: string = obj.direction || "";
  const phoneNumberId: string = obj.phoneNumberId || obj.phone_number_id || "";
  const senderName: string = obj.name || body.name || "";
  const msgId: string = String(obj.id || obj.messageId || obj.message_id || "");

  // The same message arrives on more than one event (sent, delivered). One row.
  if (msgId) {
    const { data: dup } = await sb.from("communications").select("id")
      .eq("channel", "sms").filter("metadata->>msg_id", "eq", msgId).limit(1);
    if (dup && dup.length) return json({ ok: true, skipped: "already logged", msg_id: msgId });
  }

  // OUTBOUND: log it and stop. No admin task, no auto-reply.
  // Without these rows nothing can tell "we replied and they went quiet" from
  // "nobody ever answered them", which is how a contacted lead reads as cold.
  if (direction && direction !== "incoming" && direction !== "inbound") {
    const toPhone: string = Array.isArray(obj.to) ? asPhone(obj.to[0]) : asPhone(obj.to || obj.to_number || "");
    if (!toPhone || !text) return json({ ok: true, skipped: "outbound missing to or body" });
    // Look up only. Never create a lead from an outbound text: Amanda also
    // texts students, vendors and parents, and those are not leads.
    let outLead: any = null;
    if (digits10(toPhone).length === 10) {
      const { data } = await sb.from("leads").select("id,first_name,email,pipeline_stage")
        .ilike("phone", `%${digits10(toPhone)}%`).order("created_at", { ascending: true }).limit(1);
      outLead = data?.[0] || null;
    }
    const { error } = await sb.from("communications").insert({
      contact_phone: toPhone, contact_name: outLead?.first_name || null,
      contact_email: outLead?.email || null,
      channel: "sms", direction: "outbound", body: text, source: "quo",
      related_lead_id: outLead?.id || null,
      metadata: { quo_event: body.type || null, msg_id: msgId || null, logged_outbound: true },
    });
    if (error && String(error.code) === "23505") return json({ ok: true, skipped: "already logged", msg_id: msgId });
    // 2026-09-20: a text FROM Amanda is a contact. Move the lead out of "new" so the KPI
    // page and the inbox stop calling a contacted lead uncontacted. (last_contact_at is
    // already stamped by trg_touch_lead_last_contact on the communications insert above.)
    if (outLead?.id && (outLead.pipeline_stage || "new") === "new") {
      await sb.from("leads").update({ pipeline_stage: "contacted" }).eq("id", outLead.id);
    }
    return json({ ok: true, logged: "outbound sms", lead_id: outLead?.id, msg_id: msgId });
  }

  if (!fromPhone || !text) return json({ ok: false, reason: "missing from or body" });

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
  // recorded in the DB whether or not anything replies. The SMS drip's
  // stop-on-reply gate reads these rows, so this insert must never be skipped.
  const { error: insErr } = await sb.from("communications").insert({
    contact_phone: fromPhone, contact_name: senderName || lead?.first_name || firstName || null,
    contact_email: extracted.email || lead?.email || null,
    channel: "sms", direction: "inbound", body: text, source: "quo",
    related_lead_id: lead?.id || null,
    metadata: { intent, confidence, extracted, quo_event: body.type || null, msg_id: msgId || null },
  });
  // A concurrent duplicate delivery already logged it and filed the task.
  if (insErr && String(insErr.code) === "23505") return json({ ok: true, skipped: "already logged", msg_id: msgId });

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

  // One delivery per Quo event. The v3 and v4 subscriptions send the same event
  // id; whichever copy claims it first does the work, the other stops here.
  // Fails open: if the claim table is unreachable, process the event anyway.
  let claimed = false;
  if (body.id) {
    const { error: claimErr } = await sb.from("quo_webhook_events").insert({ evt: String(body.id), type });
    if (claimErr && String(claimErr.code) === "23505") {
      return json({ ok: true, skipped: "duplicate delivery", evt: body.id, type });
    }
    claimed = !claimErr;
  }

  // Shape log, no phone numbers or message text: which event, which line, which
  // payload version. This is how the duplicate subscriptions were found.
  try {
    console.log(JSON.stringify({
      evt: body.id || null, type, api: body.apiVersion || null,
      pn: obj.phoneNumberId || obj.phone_number_id || null, line: lineOf(obj),
      has_from: !!(obj.from || obj.from_number), has_to: !!(obj.to || obj.to_number),
      n_participants: Array.isArray(obj.participants) ? obj.participants.length : null,
      call_id: obj.callId || (type.startsWith("call.") ? obj.id : null) || null,
    }));
  } catch (_) { /* never block on logging */ }

  try {
    if (type.startsWith("call.")) return await handleCall(sb, type, obj, body);
    // Everything else is treated as an inbound message (message.received / legacy).
    return await handleSms(sb, obj, body);
  } catch (e) {
    // Release the claim so Quo's retry of this event is processed, not skipped.
    console.error(JSON.stringify({ evt: body.id || null, type, error: String((e as Error)?.message || e) }));
    if (claimed) await sb.from("quo_webhook_events").delete().eq("evt", String(body.id));
    return json({ ok: false, error: "processing failed, will retry" }, 500);
  }
});
