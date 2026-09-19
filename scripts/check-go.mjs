// check:go — the /go/<slug> short-link table and redirect handler.
//   - every row points at a real page on this site (cleanUrls-aware), never off-site
//   - no slug collides with a real go/*.html funnel page (the filesystem would win)
//   - utm_campaign values are KPI-safe (a-z0-9_-)
//   - every destination page has full Open Graph tags (og:title/description/image +
//     twitter:card), because these links are what get pasted into Facebook
//   - the handler 302s with the tags, passes fbclid through, lets ?utm_source=instagram
//     override, sends unknown slugs to the homepage tagged unknown-<slug>, and can never
//     redirect off the domain
//   - vercel.json carries the /go/:slug rewrite and the /night-class → /classes redirects
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.error('✗ ' + msg); } };

const { GO_LINKS } = await import(join(root, 'data/go-links.mjs'));
globalThis.fetch = async () => ({ ok: true, status: 201, text: async () => '', json: async () => ({}) }); // page_visits log
const { default: handler, resolveGo } = await import(join(root, 'api/go.js'));

function pageFile(path) {
  const p = path.split('?')[0].replace(/\/$/, '');
  if (p === '' || p === '/') return join(root, 'index.html');
  const a = join(root, p.slice(1) + '.html');
  const b = join(root, p.slice(1), 'index.html');
  return existsSync(a) ? a : existsSync(b) ? b : null;
}

const seenDest = new Set();
for (const [slug, link] of Object.entries(GO_LINKS)) {
  ok(/^[a-z0-9][a-z0-9-]{1,59}$/.test(slug), `slug "${slug}" must be lowercase letters, digits, dashes`);
  ok(!existsSync(join(root, 'go', slug + '.html')), `slug "${slug}" collides with go/${slug}.html (the file would be served instead)`);
  ok(typeof link.to === 'string' && link.to.startsWith('/') && !link.to.startsWith('//'), `"${slug}": to must be a same-site path`);
  ok(/^[a-z0-9_-]+$/.test(link.utm_campaign || ''), `"${slug}": utm_campaign must be a-z0-9_- (got "${link.utm_campaign}")`);
  const file = pageFile(link.to);
  ok(!!file, `"${slug}": destination ${link.to} is not a real page`);
  if (file && !seenDest.has(file)) {
    seenDest.add(file);
    const html = readFileSync(file, 'utf8');
    for (const tag of ['og:title', 'og:description', 'og:image']) ok(new RegExp(`property="${tag}"`).test(html), `${link.to}: missing ${tag} (Facebook preview would be blank)`);
    ok(/name="twitter:card"/.test(html), `${link.to}: missing twitter:card`);
  }
}

// Handler behavior
const site = 'https://www.premierdentalacademyoflongview.com';
let r = resolveGo('fb-apply', { slug: 'fb-apply', fbclid: 'abc123' });
ok(r.known && r.location.startsWith(site + '/apply?'), `fb-apply → /apply (got ${r.location})`);
let u = new URL(r.location);
ok(u.searchParams.get('utm_source') === 'facebook' && u.searchParams.get('utm_medium') === 'social' && u.searchParams.get('utm_campaign') === 'fb_apply', 'default utm tags applied');
ok(u.searchParams.get('fbclid') === 'abc123', 'fbclid passed through');
r = resolveGo('fb-apply', { utm_source: 'instagram', utm_content: 'reel-2' });
u = new URL(r.location);
ok(u.searchParams.get('utm_source') === 'instagram' && u.searchParams.get('utm_content') === 'reel-2', 'query utm_* overrides the defaults');
r = resolveGo('fb-plan', {});
u = new URL(r.location);
ok(u.pathname === '/enroll' && u.searchParams.get('plan') === 'in-person' && u.searchParams.get('paymode') === 'plan' && u.searchParams.get('utm_campaign') === 'fb_plan', 'destination query string preserved and tagged');
r = resolveGo('does-not-exist', {});
u = new URL(r.location);
ok(!r.known && u.pathname === '/' && u.searchParams.get('utm_campaign') === 'unknown-does-not-exist', 'unknown slug → homepage tagged unknown-<slug>');
r = resolveGo('../../etc/passwd?x=1', {});
ok(new URL(r.location).origin === site, 'garbage slug stays on site');
GO_LINKS['zz-test-external'] = { to: 'https://evil.example/steal', utm_campaign: 'x' };
r = resolveGo('zz-test-external', {});
ok(new URL(r.location).origin === site && new URL(r.location).pathname === '/', 'an off-site destination row is neutralized to the homepage');
GO_LINKS['zz-test-proto'] = { to: '//evil.example/steal', utm_campaign: 'x' };
r = resolveGo('zz-test-proto', {});
ok(new URL(r.location).origin === site, 'protocol-relative destination neutralized');
delete GO_LINKS['zz-test-external']; delete GO_LINKS['zz-test-proto'];

const res = { headers: {}, statusCode: 0, ended: false, setHeader(k, v) { this.headers[k] = v; }, end() { this.ended = true; } };
await handler({ method: 'GET', query: { slug: 'fb-exam' } }, res);
ok(res.statusCode === 302 && res.ended && String(res.headers.Location).startsWith(site + '/tools/practice-exam?'), 'handler answers 302 with Location');
ok(/no-store/.test(res.headers['Cache-Control']) && /noindex/.test(res.headers['X-Robots-Tag']), 'handler sets no-store + noindex');

// vercel.json routes
const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
ok((vercel.rewrites || []).some((x) => x.source === '/go/:slug' && x.destination === '/api/go?slug=:slug'), 'vercel.json: /go/:slug → /api/go rewrite present');
for (const src of ['/night-class', '/night-class.html']) {
  ok((vercel.redirects || []).some((x) => x.source === src && x.destination === '/classes' && x.permanent === true), `vercel.json: ${src} → /classes permanent redirect present`);
}
ok(vercel.cleanUrls === true, 'vercel.json: cleanUrls stays on (funnel pages under /go/ depend on it)');

console.log(fails === 0
  ? `✓ go links: ${Object.keys(GO_LINKS).length} short links resolve to real, OG-complete pages; redirect handler + routes verified`
  : `✗ go links: ${fails} failure(s)`);
process.exit(fails ? 1 : 0);
