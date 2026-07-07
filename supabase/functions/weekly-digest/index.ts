// weekly-digest: Monday 7am CT email to Amanda — visitors, top pages, tools,
// leads by source, purchases, waiting student questions, seat status.
// Triggered by pg_cron (job 'weekly-owner-digest') via pg_net http_post with
// ?key=<DIGEST_TOKEN>; the token lives in public.app_secrets. verify_jwt is
// off because cron can't mint a user JWT — the token is the auth, and the
// function no-ops without it.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TO = "hello@premierdentalacademyoflongview.com";
const FROM = "PDA Weekly Numbers <hello@premierdentalacademyoflongview.com>";

const J = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });
const esc = (x: unknown) => String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

Deno.serve(async (req) => {
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: secretRows } = await sb.from("app_secrets").select("key,value").in("key", ["DIGEST_TOKEN", "RESEND_API_KEY"]);
  const cfg: Record<string, string> = {};
  (secretRows || []).forEach((r: { key: string; value: string }) => (cfg[r.key] = r.value));

  const key = new URL(req.url).searchParams.get("key") || "";
  if (!cfg["DIGEST_TOKEN"] || key !== cfg["DIGEST_TOKEN"]) return J({ error: "Unauthorized" }, 401);
  if (!cfg["RESEND_API_KEY"]) return J({ error: "RESEND_API_KEY not configured" }, 500);

  const since = new Date(Date.now() - 7 * 864e5);
  const sinceIso = since.toISOString();
  const sinceDay = sinceIso.slice(0, 10);

  const [leadsQ, purchasesQ, statsQ, questionsQ, cohortsQ] = await Promise.all([
    sb.from("leads").select("source,created_at").gte("created_at", sinceIso).limit(2000),
    sb.from("purchases").select("product_label,amount_cents,status,created_at").gte("created_at", sinceIso).eq("status", "completed"),
    sb.from("daily_stats").select("page,hits").gte("day", sinceDay).limit(20000),
    sb.from("student_questions").select("id").is("answer", null),
    sb.from("cohorts").select("name,start_date,capacity,enrolled_count").eq("status", "upcoming").order("start_date").limit(3),
  ]);

  const leads = leadsQ.data || [];
  const bySource: Record<string, number> = {};
  leads.forEach((l: { source?: string }) => { const k = l.source || "site"; bySource[k] = (bySource[k] || 0) + 1; });
  const srcLines = Object.entries(bySource).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([k, n]) => `<li>${esc(k)} — <b>${n}</b></li>`).join("") || "<li>None this week</li>";

  const purchases = purchasesQ.data || [];
  const revenue = purchases.reduce((a: number, p: { amount_cents?: number }) => a + (p.amount_cents || 0), 0);

  const stats = statsQ.data || [];
  const pv = stats.filter((r: { page: string }) => r.page.startsWith("pv:"));
  const visits = pv.reduce((a: number, r: { hits: number }) => a + r.hits, 0);
  const pageAgg: Record<string, number> = {};
  pv.forEach((r: { page: string; hits: number }) => { const k = r.page.slice(3) || "/"; pageAgg[k] = (pageAgg[k] || 0) + r.hits; });
  const topPages = Object.entries(pageAgg).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([k, n]) => `<li>${esc(k)} — <b>${n}</b></li>`).join("") || "<li>No pageviews logged</li>";
  const toolAgg: Record<string, number> = {};
  stats.filter((r: { page: string }) => r.page.startsWith("click:tool:")).forEach((r: { page: string; hits: number }) => {
    const k = r.page.slice(11).split("|")[0]; toolAgg[k] = (toolAgg[k] || 0) + r.hits;
  });
  const topTools = Object.entries(toolAgg).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([k, n]) => `<li>${esc(k)} — <b>${n}</b></li>`).join("") || "<li>No tool clicks logged</li>";

  const waiting = (questionsQ.data || []).length;
  const cohortLines = (cohortsQ.data || []).map((c: { name: string; start_date: string; capacity?: number; enrolled_count?: number }) => {
    const left = Math.max(0, (c.capacity || 0) - (c.enrolled_count || 0));
    return `<li>${esc(c.name)} (${esc(c.start_date)}) — ${c.enrolled_count || 0}/${c.capacity || 0} enrolled, <b>${left} seat${left === 1 ? "" : "s"} open</b></li>`;
  }).join("") || "<li>No upcoming cohorts in the table</li>";

  const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,sans-serif;color:#16294a;max-width:560px;margin:0 auto;padding:24px;">
    <h1 style="font-family:Georgia,serif;font-size:22px;">Your week at Premier Dental Academy 🦷</h1>
    <p style="color:#475569;font-size:14px;">Monday numbers for the last 7 days. Full detail: <a href="https://www.premierdentalacademyoflongview.com/admin/kpi">/admin/kpi</a></p>
    <h2 style="font-size:16px;">The headline</h2>
    <ul style="line-height:1.7;">
      <li><b>${visits.toLocaleString()}</b> pageviews · <b>${leads.length}</b> new leads · <b>${purchases.length}</b> purchases ($${(revenue / 100).toLocaleString()})</li>
      <li>${waiting ? `<b style="color:#b45309">${waiting} student question${waiting === 1 ? "" : "s"} waiting for an answer</b> → <a href="https://www.premierdentalacademyoflongview.com/admin/questions">/admin/questions</a>` : "No student questions waiting — inbox zero 🎉"}</li>
    </ul>
    <h2 style="font-size:16px;">Leads by source</h2><ul style="line-height:1.7;">${srcLines}</ul>
    <h2 style="font-size:16px;">Top pages</h2><ul style="line-height:1.7;">${topPages}</ul>
    <h2 style="font-size:16px;">Top tools</h2><ul style="line-height:1.7;">${topTools}</ul>
    <h2 style="font-size:16px;">Classes &amp; seats</h2><ul style="line-height:1.7;">${cohortLines}</ul>
    <p style="color:#94a3b8;font-size:12px;margin-top:20px;">Sent automatically every Monday at 7am. First-party data only — no cookies, no third parties.</p>
  </body></html>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + cfg["RESEND_API_KEY"], "content-type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [TO], subject: `PDA weekly: ${visits.toLocaleString()} visits · ${leads.length} leads · ${purchases.length} purchases`, html }),
  });
  return J({ ok: r.ok, status: r.status });
});
