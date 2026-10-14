// Build once locally; the static site serves the checked-in, versioned asset.
// No dependency installation or CSS generation is needed on the web server.
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { isReviewedTheme, scanPublicPages } = require('./tailwind-public-pages.cjs');
const version = require('tailwindcss/package.json').version;
if (version !== '3.4.19') throw new Error('Use the locked Tailwind CSS 3.4.19 dependency.');

const { pages, excluded } = scanPublicPages(root);
const directory = await mkdtemp(join(tmpdir(), 'pda-tailwind-'));
try {
  const output = join(directory, 'compiled.css');
  const result = spawnSync(process.execPath, [
    require.resolve('tailwindcss/lib/cli.js'),
    '--config', join(root, 'tailwind.site.config.cjs'),
    '--input', join(root, 'styles/tailwind.css'),
    '--output', output,
    '--minify',
  ], { cwd: root, env: { ...process.env, NODE_ENV: 'production' }, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('Tailwind CSS compilation failed.');

  const css = await readFile(output);
  const digest = createHash('sha256').update(css).digest('hex').slice(0, 16);
  const filename = `pda-tailwind.v${version}.${digest}.min.css`;
  const href = `/assets/${filename}`;
  const updates = [];
  for (const page of pages) {
    const path = join(root, page);
    let html = await readFile(path, 'utf8');
    const runtime = /<script\b[^>]*\bsrc=["']https:\/\/cdn\.tailwindcss\.com(?:\?[^"']*)?["'][^>]*>\s*<\/script>/gi;
    const compiled = /<link\b[^>]*\bdata-pda-tailwind(?:\s|=)[^>]*>/gi;
    if ((html.match(runtime) || []).length + (html.match(compiled) || []).length !== 1) {
      throw new Error(`Expected one Tailwind runtime or compiled link in ${page}.`);
    }
    const link = `<link rel="stylesheet" href="${href}" data-pda-tailwind="compiled" />`;
    html = html.replace(runtime, link).replace(compiled, link);
    // The original Academy/Skills Lab client themes are in the build config.
    html = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>\s*/gi, (script, body) => {
      if (!/\btailwind\.config\s*=/.test(body)) return script;
      if (!isReviewedTheme(body)) throw new Error(`Unreviewed theme in ${page}.`);
      return '';
    });
    updates.push({ path, html });
  }
  await writeFile(join(root, 'assets', filename), css);
  for (const update of updates) await writeFile(update.path, update.html);
  console.log(`Compiled Tailwind ${version}: ${css.byteLength} bytes; updated ${pages.length} pages to ${href}`);
  const exceptions = excluded.filter(entry => !['noindex', 'private or utility page'].includes(entry.reason));
  if (exceptions.length) console.log('Retained existing runtime:', JSON.stringify(exceptions));
} finally {
  await rm(directory, { recursive: true, force: true });
}
