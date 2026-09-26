import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const PUBLIC_URL = 'https://lmbsuwslsycukynzpzik.supabase.co';
const BUCKET = 'site';

function mimeFor(path: string): string {
  const p = path.toLowerCase();
  if (p.endsWith('.html') || p.endsWith('.htm')) return 'text/html; charset=utf-8';
  if (p.endsWith('.js') || p.endsWith('.mjs')) return 'application/javascript; charset=utf-8';
  if (p.endsWith('.css')) return 'text/css; charset=utf-8';
  if (p.endsWith('.json')) return 'application/json; charset=utf-8';
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.jpg') || p.endsWith('.jpeg')) return 'image/jpeg';
  if (p.endsWith('.svg')) return 'image/svg+xml';
  if (p.endsWith('.ico')) return 'image/x-icon';
  if (p.endsWith('.webp')) return 'image/webp';
  if (p.endsWith('.woff2')) return 'font/woff2';
  if (p.endsWith('.txt')) return 'text/plain; charset=utf-8';
  // Default: assume HTML for clean URLs
  return 'text/html; charset=utf-8';
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  let path = url.pathname;
  if (path.startsWith('/site')) path = path.slice(5);
  if (!path || path === '/' || path === '') path = '/index.html';
  if (path.endsWith('/')) path = path + 'index.html';
  const objectPath = path.replace(/^\/+/, '');

  const candidates = [objectPath];
  if (!/\.[a-z0-9]+$/i.test(objectPath)) candidates.push(objectPath + '.html');

  for (const candidate of candidates) {
    const target = `${PUBLIC_URL}/storage/v1/object/public/${BUCKET}/${candidate}?v=${Date.now()}`;
    try {
      const upstream = await fetch(target, { redirect: 'follow' });
      if (upstream.status === 200) {
        const body = await upstream.arrayBuffer();
        const ct = mimeFor(candidate);
        const headers = new Headers();
        headers.set('Content-Type', ct);
        headers.set('Cache-Control', 'public, max-age=30, s-maxage=30');
        headers.set('X-Content-Type-Options', 'nosniff');
        headers.set('Access-Control-Allow-Origin', '*');
        return new Response(body, { status: 200, headers });
      }
    } catch (_e) { /* try next */ }
  }

  // Fallback: serve index.html as the SPA root
  const fallback = await fetch(`${PUBLIC_URL}/storage/v1/object/public/${BUCKET}/index.html?v=${Date.now()}`);
  const fallbackHeaders = new Headers();
  fallbackHeaders.set('Content-Type', 'text/html; charset=utf-8');
  fallbackHeaders.set('Cache-Control', 'no-store');
  return new Response(await fallback.arrayBuffer(), { status: 200, headers: fallbackHeaders });
});
