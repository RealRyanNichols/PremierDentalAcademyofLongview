// run-automations: fires the public.automations engine for an event.
// Called by the leads DB trigger (pg_net, ?secret= from app_secrets.AUTOMATIONS_SECRET)
// and usable server-to-server for any form/tag/purchase event.
//
// Body forms:
//   { record: {...leads row...} }                        — from the DB trigger; maps
//     leads.source -> a form_submitted trigger value and enrolls the lead by email.
//   { trigger_type, trigger_value, email, first_name }   — direct invocation.
//
// Same rule engine as buy-product v2 / api/_automations.mjs: add_tag (with tag_added
// cascades), subscribe_sequence, unsubscribe_sequence over subscribers/email_sequences/
// sequence_subscriptions. Leads without an email are skipped (calls/texts often have none).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const J = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });

// leads.source -> automations.trigger_value for form_submitted rules.
// Sources not listed pass through unchanged, so new rules can target them directly.
const SOURCE_MAP: Record<string, string> = {
  "facebook_lead_ad": "fb-lead-ad",
  "premierdentalacademyoflongview.com": "get-class-info",
  "index.html": "get-class-info",
};

async function ensureSubscriber(sb: any, email: string, firstName: string | null, source: string | null) {
  const { data: found } = await sb.from("subscribers").select("id,email,tags,status").eq("email", email).maybeSingle();
  if (found) return found;
  const { data: ins } = await sb.from("subscribers").insert({ email, first_name: firstName || null, source: source || "automation" }).select("id,email,tags,status").maybeSingle();
  return ins;
}

async function applyRules(sb: any, triggerType: string, triggerValues: (string | null)[], subscriber: any, depth = 0): Promise<any[]> {
  if (depth > 4 || !subscriber) return [];
  const { data: rules } = await sb.from("automations").select("id,name,trigger_value,action_type,action_value,runs").eq("active", true).eq("trigger_type", triggerType);
  const vals = triggerValues.filter(Boolean);
  const matched = (rules || []).filter((r: any) => r.trigger_value == null || vals.includes(r.trigger_value));
  const done: any[] = [];
  for (const rule of matched) {
    try {
      if (rule.action_type === "add_tag") {
        const tags: string[] = Array.isArray(subscriber.tags) ? subscriber.tags : [];
        if (!tags.includes(rule.action_value)) {
          subscriber.tags = [...tags, rule.action_value];
          await sb.from("subscribers").update({ tags: subscriber.tags }).eq("id", subscriber.id);
          done.push({ rule: rule.name, add_tag: rule.action_value });
          done.push(...await applyRules(sb, "tag_added", [rule.action_value], subscriber, depth + 1));
        }
      } else if (rule.action_type === "subscribe_sequence") {
        const { data: seq } = await sb.from("email_sequences").select("id,key").eq("key", rule.action_value).maybeSingle();
        if (seq) {
          const { data: existing } = await sb.from("sequence_subscriptions").select("id").eq("sequence_id", seq.id).eq("email", subscriber.email).eq("status", "active").limit(1);
          if (!existing || !existing.length) {
            const { data: first } = await sb.from("sequence_emails").select("delay_days").eq("sequence_id", seq.id).eq("active", true).order("position", { ascending: true }).limit(1);
            const delayDays = first && first[0] ? Number(first[0].delay_days || 0) : 0;
            await sb.from("sequence_subscriptions").insert({ sequence_id: seq.id, subscriber_id: subscriber.id, email: subscriber.email, current_position: 0, status: "active", next_send_at: new Date(Date.now() + delayDays * 86400000).toISOString() });
            done.push({ rule: rule.name, subscribed: rule.action_value });
          }
        }
      } else if (rule.action_type === "unsubscribe_sequence") {
        const { data: seq } = await sb.from("email_sequences").select("id").eq("key", rule.action_value).maybeSingle();
        if (seq) {
          await sb.from("sequence_subscriptions").update({ status: "stopped" }).eq("sequence_id", seq.id).eq("email", subscriber.email).eq("status", "active");
          done.push({ rule: rule.name, stopped: rule.action_value });
        }
      }
      await sb.from("automations").update({ runs: (rule.runs || 0) + 1 }).eq("id", rule.id);
    } catch (_) { /* each rule is best-effort */ }
  }
  return done;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return J({ error: "Method not allowed" }, 405);
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  // Shared-secret auth (same pattern as lead-notify / quo-inbound-webhook).
  const url = new URL(req.url);
  const provided = url.searchParams.get("secret") || "";
  const { data: secretRow } = await sb.from("app_secrets").select("value").eq("key", "AUTOMATIONS_SECRET").maybeSingle();
  if (!secretRow?.value || provided !== secretRow.value) return J({ error: "unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));

  let triggerType: string, triggerValues: (string | null)[], email: string, firstName: string | null, source: string | null;
  if (body.record) {
    const lead = body.record;
    email = String(lead.email || "").toLowerCase().trim();
    if (!email || !email.includes("@")) return J({ ok: true, skipped: "lead has no email" });
    firstName = lead.first_name || null;
    source = lead.source || null;
    triggerType = "form_submitted";
    const mapped = source ? (SOURCE_MAP[source] || source) : null;
    triggerValues = [mapped, source];
  } else {
    triggerType = String(body.trigger_type || "");
    triggerValues = [body.trigger_value != null ? String(body.trigger_value) : null];
    email = String(body.email || "").toLowerCase().trim();
    firstName = body.first_name || null;
    source = body.source || null;
    if (!["form_submitted", "tag_added", "tag_removed", "purchase"].includes(triggerType)) return J({ error: "invalid trigger_type" }, 400);
    if (!email) return J({ error: "email required" }, 400);
  }

  try {
    const subscriber = await ensureSubscriber(sb, email, firstName, source);
    if (!subscriber) return J({ ok: true, skipped: "could not create subscriber" });
    const actions = await applyRules(sb, triggerType, triggerValues, subscriber, 0);
    return J({ ok: true, email, trigger_type: triggerType, actions });
  } catch (e) {
    return J({ ok: false, error: String(e) }, 500);
  }
});
