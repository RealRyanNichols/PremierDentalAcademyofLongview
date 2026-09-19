// GET /go/<slug> → 302 to a site page with campaign tags. Table: data/go-links.mjs.
// Routed by the `/go/:slug` rewrite in vercel.json; real files under go/*.html
// (the persona funnels) are served by the filesystem first and never reach here.
//
// - Unknown slug → still lands somewhere useful (the homepage) tagged
//   utm_campaign=unknown-<slug>, so a typo in a post shows up in the KPI page instead
//   of a dead link.
// - Query utm_* and click ids (fbclid, gclid, …) on the short link pass through and
//   override the defaults (e.g. ?utm_source=instagram).
// - Destinations are same-site only (a row can never redirect off the domain).
// - Each hit is logged to page_visits as `go|<slug>` (public INSERT policy), bounded
//   to ~800 ms so the redirect is never slow. Logging failure never blocks the redirect.
import { GO_LINKS, DEFAULTS } from '../data/go-links.mjs';
import { SUPABASE_URL, PUBLISHABLE_KEY, SITE_URL } from './_common.mjs';

const CLICK_IDS = /^(fbclid|gclid|ttclid|msclkid)$/;

export function resolveGo(slugRaw, query = {}) {
  const slug = String(slugRaw || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60);
  const link = Object.prototype.hasOwnProperty.call(GO_LINKS, slug) ? GO_LINKS[slug] : null;
  const site = new URL(SITE_URL);
  let dest;
  try { dest = new URL(link ? link.to : '/', site); } catch { dest = new URL('/', site); }
  if (dest.origin !== site.origin) dest = new URL('/', site); // never leave the site
  // Caller-supplied campaign values win (Instagram reuse of a Facebook link, A/B content).
  for (const [k, v] of Object.entries(query || {})) {
    if (k === 'slug' || v == null) continue;
    if (/^utm_[a-z]+$/.test(k) || CLICK_IDS.test(k)) dest.searchParams.set(k, String(Array.isArray(v) ? v[0] : v).slice(0, 200));
  }
  const defaults = {
    ...DEFAULTS,
    utm_campaign: link ? (link.utm_campaign || slug) : `unknown-${slug || 'blank'}`,
    ...(link && link.utm_content ? { utm_content: link.utm_content } : {}),
    ...(link && link.utm_source ? { utm_source: link.utm_source } : {}),
    ...(link && link.utm_medium ? { utm_medium: link.utm_medium } : {}),
  };
  for (const [k, v] of Object.entries(defaults)) if (!dest.searchParams.has(k)) dest.searchParams.set(k, v);
  return { slug, known: !!link, location: dest.toString() };
}

async function logHit(slug, known) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 800);
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/page_visits`, {
      method: 'POST',
      headers: { apikey: PUBLISHABLE_KEY, Authorization: `Bearer ${PUBLISHABLE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ page: `${known ? 'go' : 'go_unknown'}|${slug || 'blank'}`.slice(0, 250), visitor_hash: 'go-redirect' }),
      signal: ctrl.signal,
    });
  } catch { /* logging must never block or fail the redirect */ }
  finally { clearTimeout(t); }
}

export default async function handler(req, res) {
  const { slug, known, location } = resolveGo(req.query?.slug, req.query);
  if (req.method === 'GET' || req.method === 'HEAD') await logHit(slug, known);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Location', location);
  res.statusCode = 302;
  res.end();
}
