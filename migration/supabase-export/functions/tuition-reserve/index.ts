// Tuition reservation — captures the calculator selection + student contact info,
// creates lead + admin task + texts Amanda via Quo with the exact amounts.
//
// v3: Online is now $397 one-time (limited-time sale, was $997). Falls back to
//     $397 if total_cents is omitted for online; $1,997 default for in-person.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AMANDA_QUO_PHONE = "+19039136444";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS"
};

const usd = (cents: number) => "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (dollars: number) => "$" + dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const body = await req.json().catch(() => ({}));

  const firstName: string = (body.first_name || "").trim();
  const lastName: string = (body.last_name || "").trim();
  const email: string = (body.email || "").toLowerCase().trim();
  const phone: string = (body.phone || "").trim();
  const path: string = body.path || "in-person";
  const plan: string = body.plan || (path === "online" ? "one-time" : "weekly");
  const startDate: string = body.start_date || "";
  const cohortName: string = body.cohort_name || (path === "online" ? "Online — start any day" : "next available");
  const cohortId: string | null = body.cohort_id || null;

  // Default totals: $397 limited-time online, $1,997 in-person.
  const totalCents: number = parseInt(body.total_cents, 10) || (path === "online" ? 39700 : 199700);
  // Online = one-time payment; down defaults to the whole total.
  const downCents: number = parseInt(body.down_cents, 10) || (path === "online" ? totalCents : 20000);
  const installmentCents: number = parseInt(body.installment_cents, 10) || 0;
  const installmentCount: number = parseInt(body.installment_count, 10) || 0;

  if (!firstName || !email || !phone) {
    return new Response(JSON.stringify({ error: "missing required fields" }), { status: 400, headers: { ...CORS, "content-type": "application/json" } });
  }

  const fullName = `${firstName} ${lastName}`.trim();
  const remainingCents = Math.max(0, totalCents - downCents);
  const isPayInFull = downCents >= totalCents;
  const isOnlineSale = path === "online" && totalCents <= 39700;

  // 1. Insert (or update) lead row
  let leadId: string | null = null;
  const { data: existingLead } = await sb.from("leads")
    .select("id").eq("email", email).limit(1).maybeSingle();

  const leadFields = {
    first_name: firstName, last_name: lastName, phone,
    path_preference: path,
    pipeline_stage: "paying",
    pay_intent: isPayInFull ? `Pay in Full ${usd(totalCents)}` : `${plan} ${money(installmentCents/100)} × ${installmentCount}`,
    pay_when: startDate ? `First installment ${startDate}` : null,
    amanda_notes: `Calculator submission · ${path} · ${usd(totalCents)} total · ${usd(downCents)} down · cohort ${cohortName}${cohortId ? ` (${cohortId})` : ""}${isOnlineSale ? " · 🔥 ONLINE SALE" : ""}`,
    last_contact_at: new Date().toISOString()
  };

  if (existingLead) {
    await sb.from("leads").update(leadFields).eq("id", existingLead.id);
    leadId = existingLead.id;
  } else {
    const { data: newLead } = await sb.from("leads").insert({
      ...leadFields, email,
      source: "tuition_calculator"
    }).select().single();
    leadId = newLead?.id || null;
  }

  // 2. Auto-create urgent admin task for Amanda
  const taskTitle = isOnlineSale
    ? `🔥 ONLINE SALE: ${fullName} — send $397 Square invoice (one-time)`
    : isPayInFull
      ? `🎉 PAY-IN-FULL: ${fullName} — send ${usd(totalCents)} Square invoice`
      : `🎉 NEW ENROLLMENT: ${fullName} — ${usd(downCents)} down + ${money(installmentCents/100)}/${plan} × ${installmentCount}`;

  const taskNotes = [
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Path: ${path} (${usd(totalCents)} total)`,
    `Cohort: ${cohortName}${cohortId ? ` [${cohortId}]` : ""}`,
    `———`,
    isOnlineSale
      ? `🔥 ONLINE LIMITED-TIME SALE: ${usd(totalCents)} one-time payment. Non-refundable but transferable to In-Person credit.`
      : isPayInFull
        ? `PAY IN FULL: ${usd(totalCents)}`
        : `Today's down payment: ${usd(downCents)}\nRemaining: ${usd(remainingCents)}\nPlan: ${money(installmentCents/100)} per ${plan} × ${installmentCount}\nFirst installment date: ${startDate || "class start"}`,
    `———`,
    `NEXT STEP: Open Square → New Invoice → Email ${email} for ${usd(downCents)}. ${isPayInFull ? "" : `Then create recurring invoice for ${money(installmentCents/100)} starting ${startDate || "class start"}.`}`
  ].join("\n");

  await sb.from("admin_tasks").insert({
    title: taskTitle,
    notes: taskNotes,
    priority: 1, status: "open",
    related_lead_id: leadId,
    related_phone: phone
  });

  // 3. Log to communications
  await sb.from("communications").insert({
    contact_name: fullName, contact_email: email, contact_phone: phone,
    channel: "note", direction: "inbound",
    body: `[CALCULATOR] ${taskTitle}\n\n${taskNotes}`,
    source: "tuition_calculator",
    related_lead_id: leadId
  });

  // 4. Text Amanda via Quo / OpenPhone
  const { data: secretRow } = await sb.from("app_secrets").select("value").eq("key", "QUO_API_KEY").maybeSingle();
  const QUO_API_KEY = secretRow?.value;
  let quoResult: any = { sent: false, reason: "QUO_API_KEY not configured" };

  if (QUO_API_KEY) {
    try {
      const phNumRes = await fetch("https://api.openphone.com/v1/phone-numbers", {
        headers: { "Authorization": QUO_API_KEY }
      });
      const phNumData = await phNumRes.json();
      const pdaPhone = (phNumData?.data || []).find((p: any) => p.number === AMANDA_QUO_PHONE) || (phNumData?.data || [])[0];

      if (pdaPhone?.id) {
        const smsBody = isOnlineSale
          ? `🔥 ONLINE SALE ENROLLMENT\n\n${fullName}\n${phone}\n${email}\n\nWants to pay $397 ONLINE one-time.\nNon-refundable but transferable.\n\nSend a $397 Square invoice now — admin.html for details.`
          : isPayInFull
            ? `🎉 PAY-IN-FULL ENROLLMENT\n\n${fullName}\n${phone}\n${email}\n\nWants to pay ${usd(totalCents)} today.\nCohort: ${cohortName}\n\nSend a ${usd(totalCents)} Square invoice now — admin.html for details.`
            : `🎉 NEW ENROLLMENT\n\n${fullName}\n${phone}\n${email}\n\n💵 ${usd(downCents)} down + ${money(installmentCents/100)}/${plan} × ${installmentCount}\n📅 First installment: ${startDate || "class start"}\n🏫 Cohort: ${cohortName}\n\nFull details + 1-click invoice button on /admin.html`;

        const smsRes = await fetch("https://api.openphone.com/v1/messages", {
          method: "POST",
          headers: { "Authorization": QUO_API_KEY, "content-type": "application/json" },
          body: JSON.stringify({
            from: pdaPhone.id,
            to: [AMANDA_QUO_PHONE],
            content: smsBody
          })
        });
        quoResult = { sent: smsRes.ok, status: smsRes.status };
      } else {
        quoResult = { sent: false, reason: "no phoneNumberId found" };
      }
    } catch (e) {
      quoResult = { sent: false, error: String(e) };
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    lead_id: leadId,
    quo_alert: quoResult,
    summary: {
      name: fullName,
      email, phone, path,
      total: usd(totalCents),
      down_payment: usd(downCents),
      remaining: usd(remainingCents),
      plan: isPayInFull ? "Pay in Full" : plan,
      installment_count: isPayInFull ? 0 : installmentCount,
      installment_amount: isPayInFull ? "—" : money(installmentCents/100),
      first_installment_date: isPayInFull ? "—" : (startDate || "class start"),
      cohort: cohortName
    }
  }), { headers: { ...CORS, "content-type": "application/json" } });
});
