// social-proof: real-activity popup engine for premierdentalacademyoflongview.com
// GET  ?feed=1   -> JSON feed of recent REAL events (first name + last initial only)
// GET  ?widget=1 -> serves the embeddable JS widget (one-line <script> include on the site)
// POST {event_type, item_kind, item_label, page, visitor_hash} -> logs impression/click/dismiss
// Data sources: public.leads, public.purchases (completed), public.cohorts (true seat counts).
// Privacy: never exposes emails/phones/full last names. Click data lands in public.popup_events.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};
const J = (o: unknown, s = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "content-type": "application/json", ...extra } });

function initial(last: string | null): string {
  const l = (last || "").trim();
  return l ? " " + l[0].toUpperCase() + "." : "";
}
function ago(ts: string): string {
  const m = Math.max(1, Math.round((Date.now() - new Date(ts).getTime()) / 60000));
  if (m < 60) return m + "m ago";
  const h = Math.round(m / 60);
  if (h < 24) return h + "h ago";
  const d = Math.round(h / 24);
  return d <= 1 ? "yesterday" : d + " days ago";
}

async function buildFeed(sb: any) {
  const since = new Date(Date.now() - 45 * 86400000).toISOString();
  const items: any[] = [];

  const { data: leads } = await sb.from("leads")
    .select("first_name,last_name,source,created_at")
    .gte("created_at", since).not("first_name", "is", null).neq("first_name", "")
    .order("created_at", { ascending: false }).limit(60);
  for (const l of leads || []) {
    const src = (l.source || "").toLowerCase();
    let action = "checked out the RDA program", url = "/calendar", city = "";
    if (src.includes("practice-exam")) { action = "took the free practice exam"; url = "/tools/practice-exam"; }
    else if (src === "facebook_lead_ad") { action = "requested class info"; url = "/calendar"; city = "Longview area"; }
    else if (src === "quo_sms" || src === "quo_call") { action = "asked about the next class"; url = "/calendar"; city = "Longview area"; }
    else if (src === "tour") { action = "booked a campus tour"; url = "/calendar"; city = "Longview area"; }
    else if (src.includes("apply")) { action = "started an application"; url = "/enroll"; }
    else if (src.includes("tuition")) { action = "ran the tuition calculator"; url = "/enroll"; }
    const name = String(l.first_name).trim();
    if (!name || name.startsWith("<")) continue; // skip test/dummy rows
    items.push({ kind: "lead", name: name + initial(l.last_name), action, city, when: ago(l.created_at), url, ts: l.created_at });
  }

  const { data: buys } = await sb.from("purchases")
    .select("product_key,product_label,contact_email,created_at,status")
    .eq("status", "completed").gte("created_at", since)
    .order("created_at", { ascending: false }).limit(20);
  for (const p of buys || []) {
    const em = (p.contact_email || "").split("@")[0];
    const name = em ? em[0].toUpperCase() + em.slice(1, 2) + "***" : "Someone";
    const isPro = (p.product_key || "").includes("exam_pro");
    items.push({ kind: "purchase", name, action: isPro ? "unlocked Exam Pro" : "enrolled in the RDA program", city: "", when: ago(p.created_at), url: isPro ? "/exam-pro" : "/enroll", ts: p.created_at });
  }

  const { data: cohorts } = await sb.from("cohorts")
    .select("name,start_date,enrolled_count,capacity,delivery_mode")
    .gte("start_date", new Date().toISOString().slice(0, 10))
    .eq("delivery_mode", "in_person")
    .order("start_date").limit(3);
  for (const c of cohorts || []) {
    const left = (c.capacity || 8) - (c.enrolled_count || 0);
    if (left > 0 && left <= 5 && c.enrolled_count > 0) {
      const d = new Date(c.start_date + "T12:00:00");
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      items.push({ kind: "seats", name: "", action: `Only ${left} seat${left === 1 ? "" : "s"} left in the ${label} class`, city: "", when: "live", url: "/calendar", ts: new Date().toISOString() });
    }
  }

  items.sort((a, b) => (a.kind === "seats" ? -1 : b.kind === "seats" ? 1 : (a.ts < b.ts ? 1 : -1)));
  return items.slice(0, 30);
}

const WIDGET_JS = `(function(){
if(window.__pdaProof)return;window.__pdaProof=1;
if(sessionStorage.getItem('pda_proof_off'))return;
var BASE='https://lmbsuwslsycukynzpzik.supabase.co/functions/v1/social-proof';
var css='#pda-proof{position:fixed;left:16px;bottom:16px;z-index:99999;max-width:320px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;transform:translateY(140%);transition:transform .45s cubic-bezier(.2,.9,.3,1.2);cursor:pointer}#pda-proof.on{transform:translateY(0)}#pda-proof .card{display:flex;gap:10px;align-items:center;background:#fff;border:1px solid #e6edf6;border-left:4px solid #c9a961;border-radius:12px;box-shadow:0 8px 28px rgba(22,41,74,.18);padding:12px 14px}#pda-proof .ic{width:38px;height:38px;border-radius:50%;background:#16294a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:17px;flex:none}#pda-proof .tx{font-size:13.5px;line-height:1.35;color:#16294a}#pda-proof .tx b{font-weight:700}#pda-proof .meta{font-size:11.5px;color:#64748b;margin-top:2px}#pda-proof .x{position:absolute;top:2px;right:8px;color:#94a3b8;font-size:14px;padding:4px;line-height:1}';
var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
var el=document.createElement('div');el.id='pda-proof';el.innerHTML='<div class="card"><div class="ic">🦷</div><div class="tx"></div><span class="x">×</span></div>';document.body.appendChild(el);
var feed=[],i=0,timer=null;
function post(t,it){try{navigator.sendBeacon(BASE,new Blob([JSON.stringify({event_type:t,item_kind:it.kind,item_label:(it.name?it.name+' ':'')+it.action,page:location.pathname})],{type:'application/json'}))}catch(e){}}
function icon(k){return k==='seats'?'🔥':k==='purchase'?'🎉':'🦷'}
function show(){if(!feed.length)return;var it=feed[i%feed.length];i++;var tx=el.querySelector('.tx');
var line=it.kind==='seats'?'<b>'+it.action+'</b>':'<b>'+it.name+'</b>'+(it.city?' ('+it.city+')':'')+' '+it.action;
tx.innerHTML=line+'<div class="meta">'+(it.when==='live'?'⚡ live seat count':it.when+' · verified by PDA')+'</div>';
el.querySelector('.ic').textContent=icon(it.kind);el.dataset.url=it.url;el.classList.add('on');post('impression',it);
setTimeout(function(){el.classList.remove('on')},6500);}
el.addEventListener('click',function(e){if(e.target.classList.contains('x')){e.stopPropagation();el.classList.remove('on');sessionStorage.setItem('pda_proof_off','1');clearInterval(timer);post('dismiss',{kind:'widget',name:'',action:'dismissed'});return}
var it=feed[(i-1)%feed.length]||{};post('click',it);location.href=el.dataset.url||'/calendar';});
fetch(BASE+'?feed=1').then(function(r){return r.json()}).then(function(d){feed=(d.items||[]).filter(function(x){return x.name!=='Someone'||x.kind!=='purchase'});if(!feed.length)return;setTimeout(show,4500);timer=setInterval(show,15000);}).catch(function(){});
})();`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  const url = new URL(req.url);

  if (req.method === "GET" && url.searchParams.get("widget") === "1") {
    return new Response(WIDGET_JS, { headers: { ...CORS, "content-type": "application/javascript", "cache-control": "public, max-age=300" } });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  if (req.method === "GET") {
    const items = await buildFeed(sb);
    return J({ items }, 200, { "cache-control": "public, max-age=120" });
  }

  if (req.method === "POST") {
    const b = await req.json().catch(() => ({}));
    const t = ["impression", "click", "dismiss"].includes(b.event_type) ? b.event_type : "impression";
    await sb.from("popup_events").insert({
      event_type: t,
      item_kind: String(b.item_kind || "").slice(0, 40),
      item_label: String(b.item_label || "").slice(0, 160),
      page: String(b.page || "").slice(0, 200),
      visitor_hash: String(b.visitor_hash || "").slice(0, 64),
    });
    return J({ ok: true });
  }

  return J({ error: "method" }, 405);
});
