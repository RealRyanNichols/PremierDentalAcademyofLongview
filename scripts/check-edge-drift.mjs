// check:edge-drift — the repo copies of Supabase edge functions vs. what is deployed.
//
// A git push does NOT deploy an edge function, and the dashboard/MCP can deploy one
// without touching git. So the repo copy and the live copy drift, silently, in either
// direction (Sep 2026: quo-inbound-webhook and lead-notify had each drifted both ways;
// shipping either repo copy would have undone live fixes). supabase/functions/DEPLOYED.json
// is the record of what is live; this script holds the repo to that record.
//
// Offline (npm test) — fails when:
//   - a function directory has no record, or a record has no directory
//   - a record's status is not one of in_sync | repo_ahead | live_ahead | diverged
//   - status in_sync, but the file differs from the recorded deployed source, or it still
//     carries a DRIFT-STATUS / DO-NOT-DEPLOY block (a stale warning is also a lie)
//   - status is anything else, but the file lacks the DRIFT-STATUS block naming that
//     status, or the file changed since the record was written (edit → update the record)
//   - a directory holds files the record does not cover
// Hashes are sha256 over the file with its leading DRIFT-STATUS block removed, so the
// warning block never makes a synced file look different from live.
//
// Tools (not part of npm test):
//   node scripts/check-edge-drift.mjs --body <slug>   print the deployable source (block removed)
//   node scripts/check-edge-drift.mjs --sha <file>    print the body sha256 of any file
//   node scripts/check-edge-drift.mjs --live <file>   compare a saved list_edge_functions JSON
//                                                     against the record (catches live moving)
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fnDir = join(root, 'supabase/functions');
const recordPath = join(fnDir, 'DEPLOYED.json');
const STATUSES = ['in_sync', 'repo_ahead', 'live_ahead', 'diverged'];
const BLOCK_START = /^\/\/ >>> DRIFT-STATUS: ([a-z_]+)\b/;
const BLOCK_END = /^\/\/ <<< DRIFT-STATUS <<<\s*$/;

export function splitBlock(text) {
  const lines = text.split('\n');
  const m = lines[0] && lines[0].match(BLOCK_START);
  if (!m) return { status: null, body: text };
  const end = lines.findIndex((l) => BLOCK_END.test(l));
  if (end < 0) return { status: m[1], body: text, broken: true };
  return { status: m[1], body: lines.slice(end + 1).join('\n') };
}
export const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
export const bodySha = (text) => sha(splitBlock(text).body);

// Importable for its helpers (the hash must be computed one way everywhere); runs only as a script.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

function main() {
const args = process.argv.slice(2);
if (args[0] === '--sha') { console.log(bodySha(readFileSync(args[1], 'utf8'))); process.exit(0); }
if (args[0] === '--body') { process.stdout.write(splitBlock(readFileSync(join(fnDir, args[1], 'index.ts'), 'utf8')).body); process.exit(0); }

const record = JSON.parse(readFileSync(recordPath, 'utf8'));
const fns = record.functions || {};
const unmirrored = record.unmirrored || {};

if (args[0] === '--live') {
  const live = JSON.parse(readFileSync(args[1], 'utf8'));
  const list = Array.isArray(live) ? live : live.functions || [];
  let drift = 0;
  const seen = new Set();
  for (const f of list) {
    seen.add(f.slug);
    const r = fns[f.slug] || unmirrored[f.slug];
    if (!r) { drift++; console.error(`✗ ${f.slug}: live v${f.version} has no record — add it to DEPLOYED.json (functions or unmirrored)`); continue; }
    if (r.deployed_version !== f.version || r.deployed_ezbr_sha256 !== f.ezbr_sha256) {
      drift++;
      console.error(`✗ ${f.slug}: record says v${r.deployed_version}, live is v${f.version}${r.deployed_ezbr_sha256 !== f.ezbr_sha256 ? ' (bundle hash differs)' : ''} — pull the live source (get_edge_function), re-diff, update the record`);
    }
  }
  for (const slug of [...Object.keys(fns), ...Object.keys(unmirrored)]) if (!seen.has(slug)) { drift++; console.error(`✗ ${slug}: in the record but not live`); }
  console.log(drift ? `edge-drift --live: ${drift} difference(s)` : `edge-drift --live: record matches all ${list.length} live functions`);
  process.exit(drift ? 1 : 0);
}

let fails = 0;
const warn = [];
const fail = (m) => { fails++; console.error('✗ ' + m); };

const dirs = readdirSync(fnDir).filter((d) => statSync(join(fnDir, d)).isDirectory());
for (const d of dirs) {
  if (!fns[d]) fail(`supabase/functions/${d}: no record in DEPLOYED.json (pull the live source, diff it, record it)`);
  if (unmirrored[d]) fail(`supabase/functions/${d}: listed as unmirrored but a repo copy exists — move it to "functions"`);
}
for (const [slug, r] of Object.entries(fns)) {
  const file = join(fnDir, slug, 'index.ts');
  if (!existsSync(file)) { fail(`${slug}: recorded but supabase/functions/${slug}/index.ts is missing`); continue; }
  const extra = readdirSync(join(fnDir, slug)).filter((f) => f !== 'index.ts');
  if (extra.length) fail(`${slug}: files the record does not cover: ${extra.join(', ')}`);
  if (!STATUSES.includes(r.status)) { fail(`${slug}: status "${r.status}" must be one of ${STATUSES.join(' | ')}`); continue; }
  for (const k of ['deployed_version', 'deployed_sha256', 'repo_sha256', 'deployed_ezbr_sha256']) if (r[k] == null || r[k] === '') fail(`${slug}: record is missing ${k}`);

  const text = readFileSync(file, 'utf8');
  const { status: blockStatus, broken } = splitBlock(text);
  const now = bodySha(text);
  if (broken) fail(`${slug}: DRIFT-STATUS block has no closing "// <<< DRIFT-STATUS <<<" line`);

  if (r.status === 'in_sync') {
    if (blockStatus) fail(`${slug}: record says in_sync but the file still carries a DRIFT-STATUS block — delete it`);
    if (/DO NOT DEPLOY/i.test(text)) fail(`${slug}: record says in_sync but the file still says DO NOT DEPLOY`);
    if (r.repo_sha256 !== r.deployed_sha256) fail(`${slug}: in_sync record with different repo/deployed hashes`);
    if (now !== r.deployed_sha256) fail(`${slug}: file differs from deployed v${r.deployed_version} but the record says in_sync. If you edited it, set status repo_ahead + a DRIFT-STATUS block; if live moved, pull it down.`);
  } else {
    if (blockStatus !== r.status) fail(`${slug}: record says ${r.status}, so the file must open with "// >>> DRIFT-STATUS: ${r.status}" (found ${blockStatus || 'no block'})`);
    if (now !== r.repo_sha256) fail(`${slug}: file changed since DEPLOYED.json was written (body sha ${now.slice(0, 12)}…, recorded ${String(r.repo_sha256).slice(0, 12)}…). Update repo_sha256 and say what changed.`);
    if (r.repo_sha256 === r.deployed_sha256) fail(`${slug}: status ${r.status} but repo and deployed hashes are equal — that is in_sync`);
    if (r.status === 'repo_ahead' && !(Array.isArray(r.additions) && r.additions.length)) fail(`${slug}: repo_ahead must list its additions`);
    warn.push(`${slug}: ${r.status} (live v${r.deployed_version}) — ${r.status === 'repo_ahead' ? 'awaiting an approved deploy' : 'needs reconciling before anyone deploys it'}`);
  }
}

for (const w of warn) console.log('• ' + w);
if (fails) { console.error(`check:edge-drift — ${fails} problem(s)`); process.exit(1); }
console.log(`check:edge-drift — ${Object.keys(fns).length} mirrored functions match DEPLOYED.json (${Object.keys(unmirrored).length} live-only functions recorded, record checked ${record.checked_at})`);
}
