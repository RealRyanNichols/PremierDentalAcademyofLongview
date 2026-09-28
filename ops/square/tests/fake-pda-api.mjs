// Test stand-in for the droplet's pda-api. It serves the repo's REAL api/square-webhook.js the
// way a Vercel-style adapter does, so the Python tool's signed self-test is checked by the same
// code that will run on the droplet.
//   node fake-pda-api.mjs <port> <env-file> <raw|parsed> <repo-root>
//   raw     the adapter keeps the exact request text as req.rawBody (what pda-api needs)
//   parsed  the adapter only hands over the parsed JSON body (the broken case)
// The env file is re-read on every request, which stands in for "restart pda-api".
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const [, , port, envFile, mode, repoRoot] = process.argv;
const { default: handler } = await import(pathToFileURL(join(repoRoot, 'api/square-webhook.js')).href);

function loadEnv() {
  for (const k of ['SQUARE_WEBHOOK_SIGNATURE_KEY', 'SQUARE_WEBHOOK_URL', 'SQUARE_ACCESS_TOKEN']) delete process.env[k];
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const i = line.indexOf('=');
    if (i > 0 && !line.trim().startsWith('#')) process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
}

http.createServer((req, res) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', async () => {
    const send = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };
    if (!req.url.startsWith('/api/square-webhook')) { send(404, { error: 'not found' }); return; }
    loadEnv();
    const text = Buffer.concat(chunks).toString('utf8');
    let body;
    try { body = text ? JSON.parse(text) : undefined; } catch { body = text; }
    const shim = { method: req.method, headers: req.headers, url: req.url, body };
    if (mode === 'raw') shim.rawBody = text;
    const out = { code: 200, status(c) { this.code = c; return this; }, json(o) { send(this.code, o); return this; } };
    try { await handler(shim, out); } catch { send(500, { error: 'crash' }); }
  });
}).listen(Number(port), '127.0.0.1', () => console.log('ready'));
