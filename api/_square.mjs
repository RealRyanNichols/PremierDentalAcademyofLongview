// Shared Square helpers for the site's own API (served by pda-api on the DigitalOcean droplet).
// Import-only: underscore files are not routed.
//
// Secrets live in the droplet's /etc/pda/api.env, never in this public repo:
//   SQUARE_ACCESS_TOKEN           production access token (on the droplet since Sep 23, 2026)
//   SQUARE_WEBHOOK_SIGNATURE_KEY  signature key of the droplet's webhook subscription
//                                 (ops/square/pda_square.py webhook-setup writes it; nobody copies it)
//   SQUARE_WEBHOOK_URL            optional; defaults to WEBHOOK_URL below. Square signs this exact URL.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const SQUARE_BASE = 'https://connect.squareup.com/v2';
export const SQUARE_VERSION = '2025-04-16';
export const LOCATION_ID = '2P2ZE3FJNEYTV';
export const WEBHOOK_URL = 'https://www.premierdentalacademyoflongview.com/api/square-webhook';

export function squareToken() {
  const t = process.env.SQUARE_ACCESS_TOKEN;
  return typeof t === 'string' && t.trim().length >= 20 ? t.trim() : '';
}

// One Square REST call. Throws on a non-2xx answer with err.status + err.squareErrors.
// A timeout or dropped connection throws with err.uncertain = true: the request may have
// reached Square, so callers that move money must not tell the buyer "no charge was made".
export async function sq(path, { method = 'GET', body, timeoutMs = 20_000 } = {}) {
  let res;
  try {
    res = await fetch(SQUARE_BASE + path, {
      method,
      headers: {
        'Square-Version': SQUARE_VERSION,
        Authorization: 'Bearer ' + squareToken(),
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    const err = new Error('Square could not be reached');
    err.uncertain = true;
    err.cause = e;
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const first = (data && data.errors && data.errors[0]) || {};
    const err = new Error(first.detail || first.code || `Square ${res.status}`);
    err.status = res.status;
    err.squareErrors = (data && data.errors) || [];
    throw err;
  }
  return data;
}

// Deterministic Square idempotency key: same inputs -> same key -> Square returns the
// original result instead of charging again. The part order matches the old Supabase
// functions exactly, so a retry that lands on either endpoint is still deduped.
export function idemKey(...parts) {
  return createHash('sha256').update(parts.join('::'), 'utf8').digest('hex').slice(0, 45);
}

// Square webhook signature: base64 HMAC-SHA256 of (notification URL + raw body).
export function squareSignature(key, url, raw) {
  return createHmac('sha256', String(key)).update(String(url) + String(raw), 'utf8').digest('base64');
}

export function safeEqual(a, b) {
  const A = Buffer.from(String(a || ''), 'utf8');
  const B = Buffer.from(String(b || ''), 'utf8');
  if (!A.length || A.length !== B.length) return false;
  return timingSafeEqual(A, B);
}

function readStream(req, { maxBytes, timeoutMs }) {
  return new Promise((resolve) => {
    const chunks = [];
    let size = 0;
    let done = false;
    const finish = (v) => { if (!done) { done = true; clearTimeout(timer); resolve(v); } };
    const timer = setTimeout(() => finish(null), timeoutMs);
    req.on('data', (c) => {
      size += c.length;
      if (size > maxBytes) { finish(null); return; }
      chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
    });
    req.on('end', () => finish(Buffer.concat(chunks).toString('utf8')));
    req.on('error', () => finish(null));
  });
}

// Every way this server might hand us the exact bytes Square signed, best first:
// an explicit raw body from the server, the unread request stream, a string/Buffer body,
// and last a re-serialization of an already-parsed JSON body. Trying a candidate is safe:
// a candidate only passes if its HMAC matches, which needs the secret key.
export async function rawBodyCandidates(req, { maxBytes = 1_000_000, timeoutMs = 5_000 } = {}) {
  const out = [];
  const add = (source, v) => {
    let s = null;
    if (typeof v === 'string') s = v;
    else if (Buffer.isBuffer(v)) s = v.toString('utf8');
    else if (v instanceof Uint8Array) s = Buffer.from(v).toString('utf8');
    if (s && !out.some((c) => c.raw === s)) out.push({ source, raw: s });
  };
  add('rawBody', req.rawBody);
  add('rawBody', req.bodyRaw);
  if (typeof req.body === 'string' || Buffer.isBuffer(req.body) || req.body instanceof Uint8Array) add('body', req.body);
  if (!out.length && typeof req.on === 'function' && req.readable !== false && !req.readableEnded && req.body === undefined) {
    add('stream', await readStream(req, { maxBytes, timeoutMs }));
  }
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body) && !(req.body instanceof Uint8Array)) {
    try { add('reserialized', JSON.stringify(req.body)); } catch { /* not JSON-able */ }
  }
  return out;
}

// Returns { source, raw } for the candidate whose signature matches, or null.
export function verifySignature({ key, url, signature, candidates }) {
  if (!key || !url || !signature) return null;
  for (const c of candidates || []) {
    if (safeEqual(squareSignature(key, url, c.raw), signature)) return c;
  }
  return null;
}

export function header(req, name) {
  const h = req && req.headers;
  if (!h) return '';
  if (typeof h.get === 'function') return h.get(name) || '';
  const v = h[name] ?? h[name.toLowerCase()];
  return Array.isArray(v) ? v[0] || '' : v || '';
}
