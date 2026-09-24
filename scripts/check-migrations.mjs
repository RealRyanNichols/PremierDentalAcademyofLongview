// check:migrations — every SQL file in db/migrations and db/pending vs. db/migrations/MANIFEST.json.
//
// Why: "absent from supabase_migrations.schema_migrations" does NOT mean "not applied". Some
// changes were run as plain SQL (no history row) and are live; some migrations were applied
// with no file ever committed. Sep 2026: seven applied migrations had no file, nine live files
// had no history row, and a few live objects were in neither. Guessing from either list alone
// leads to "re-applying to be safe" or to shipping code whose tables do not exist.
// MANIFEST.json records, for every file, whether it is applied or staged and how we know.
//
// Offline (npm test) — fails when:
//   - a .sql file has no manifest entry, or an entry points at a missing file
//   - an applied file is not in db/migrations, or a staged one is not in db/pending
//   - an applied file changed since it was recorded (history does not get edited silently)
//   - provenance is missing or inconsistent: schema_migrations / recovered need a live version
//     that points back at the file; plain_sql / reconstructed need written evidence
//   - a recovered file's statement (below its marker line) no longer matches the live md5
//   - a live migration newer than the baseline has no file
// Tools (not part of npm test):
//   node scripts/check-migrations.mjs --print-sql        SQL that lists live migrations (run via MCP)
//   node scripts/check-migrations.mjs --live <file>      compare that output (saved as text) to the manifest
//   node scripts/check-migrations.mjs --sha <file>       sha256 of a file, for a new manifest entry
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = join(root, 'db/migrations/MANIFEST.json');
const MARKER = '-- ---- recovered statement below ----\n';
const hash = (algo, s) => createHash(algo).update(s, 'utf8').digest('hex');
const LIST_SQL = `select string_agg(version || ' ' || name || ' ' || md5(array_to_string(statements, E'\\n')), E'\\n' order by version) from supabase_migrations.schema_migrations;`;

const args = process.argv.slice(2);
if (args[0] === '--print-sql') { console.log(LIST_SQL); process.exit(0); }
if (args[0] === '--sha') { console.log(hash('sha256', readFileSync(args[1], 'utf8'))); process.exit(0); }

const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
const files = m.files || {};
const live = m.schema_migrations || {};

if (args[0] === '--live') {
  const rows = readFileSync(args[1], 'utf8').trim().split('\n').map((l) => l.trim().split(/\s+/)).filter((r) => r.length >= 3);
  let d = 0;
  const seen = new Set();
  for (const [v, name, md5] of rows) {
    seen.add(v);
    const r = live[v];
    if (!r) { d++; console.error(`✗ ${v} ${name}: applied live, not in MANIFEST.json — commit its file (recover it from schema_migrations) and record it`); continue; }
    if (r.md5 !== md5) { d++; console.error(`✗ ${v} ${name}: live statement md5 ${md5} differs from the recorded ${r.md5}`); }
  }
  for (const v of Object.keys(live)) if (!seen.has(v)) { d++; console.error(`✗ ${v}: recorded as applied but not in the live list`); }
  console.log(d ? `check-migrations --live: ${d} difference(s)` : `check-migrations --live: manifest matches all ${rows.length} live migrations`);
  process.exit(d ? 1 : 0);
}

let fails = 0;
const fail = (s) => { fails++; console.error('✗ ' + s); };
const sqlIn = (dir) => existsSync(join(root, dir)) ? readdirSync(join(root, dir)).filter((f) => f.endsWith('.sql')).map((f) => `${dir}/${f}`) : [];
const onDisk = [...sqlIn('db/migrations'), ...sqlIn('db/pending')];

for (const f of onDisk) if (!files[f]) fail(`${f}: not in db/migrations/MANIFEST.json. Applied? Say how you know (schema_migrations version, or evidence). Staged? Put it in db/pending with its gate.`);

const counts = { applied: 0, staged: 0 };
for (const [f, e] of Object.entries(files)) {
  const p = join(root, f);
  if (!existsSync(p)) { fail(`${f}: in the manifest but the file is missing`); continue; }
  if (e.state === 'staged') {
    counts.staged++;
    if (!f.startsWith('db/pending/')) fail(`${f}: staged migrations live in db/pending/`);
    if (!e.gate) fail(`${f}: a staged migration must name its approval gate`);
    continue;
  }
  if (e.state !== 'applied') { fail(`${f}: state must be applied or staged (got ${e.state})`); continue; }
  counts.applied++;
  if (!f.startsWith('db/migrations/')) fail(`${f}: applied migrations live in db/migrations/ (move it and say when it was applied)`);
  const text = readFileSync(p, 'utf8');
  if (hash('sha256', text) !== e.sha256) fail(`${f}: changed since it was recorded. Applied history should not be edited; if this is deliberate (e.g. a note), update sha256 via --sha.`);
  switch (e.provenance) {
    case 'schema_migrations':
    case 'recovered': {
      const r = live[e.version];
      if (!r) { fail(`${f}: version ${e.version} is not in the recorded schema_migrations list`); break; }
      if (r.file !== f) fail(`${f}: schema_migrations ${e.version} points at ${r.file}, not this file`);
      if (e.provenance === 'recovered') {
        const i = text.indexOf(MARKER);
        if (i < 0) { fail(`${f}: recovered file lost its marker line`); break; }
        if (hash('md5', text.slice(i + MARKER.length)) !== r.md5) fail(`${f}: statement no longer matches the live md5 ${r.md5}`);
      }
      break;
    }
    case 'plain_sql':
    case 'reconstructed':
      if (!e.evidence) fail(`${f}: ${e.provenance} needs evidence that it is live`);
      if (e.version) fail(`${f}: ${e.provenance} has no schema_migrations version`);
      break;
    default:
      fail(`${f}: provenance must be schema_migrations | recovered | plain_sql | reconstructed`);
  }
}

const baseline = m.snapshot?.files_required_after;
let noFile = 0;
for (const [v, r] of Object.entries(live)) {
  if (r.file) { if (!files[r.file] || files[r.file].version !== v) fail(`schema_migrations ${v}: points at ${r.file}, which does not record version ${v}`); continue; }
  noFile++;
  if (!baseline || v > baseline) fail(`schema_migrations ${v} (${r.name}): applied live after ${baseline} with no file — recover it (see the recovered files for the pattern)`);
}
if (m.snapshot?.count !== Object.keys(live).length) fail(`snapshot.count ${m.snapshot?.count} ≠ ${Object.keys(live).length} recorded live migrations`);

if (fails) { console.error(`check:migrations — ${fails} problem(s)`); process.exit(1); }
console.log(`check:migrations — ${counts.applied} applied + ${counts.staged} staged files match MANIFEST.json; ${Object.keys(live).length} live migrations recorded (${noFile} pre-${baseline} ones kept only in the database), snapshot ${m.snapshot.checked_at}`);
