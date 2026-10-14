// Compile the two trainers and the Career Plan without changing their application code.
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const version = require('tailwindcss/package.json').version;
if (version !== '3.4.19') throw new Error('Use the locked Tailwind CSS 3.4.19 dependency.');

const scopes = [
  { name: 'practice-pro', page: 'tools/practice-pro.html' },
  { name: 'chairside', page: 'tools/chairside.html' },
  { name: 'career-plan', page: 'career-plan.html' },
];
const runtime = /<script\b[^>]*\bsrc=["']https:\/\/cdn\.tailwindcss\.com(?:\?[^"']*)?["'][^>]*>\s*<\/script>/gi;
const scopedLink = /<link\b[^>]*\bdata-pda-scoped-css=["'][^"']+["'][^>]*>/gi;
const tailwindStyle = /^[\t ]*<style\b[^>]*\btype=["']text\/tailwindcss["'][^>]*>([\s\S]*?)<\/style>/gim;
const scripts = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const hash = value => createHash('sha256').update(value).digest('hex');

function functionalScripts(html) {
  return [...html.matchAll(scripts)].filter(([, attributes, body]) =>
    !/cdn\.tailwindcss\.com/.test(attributes) && !/\btailwind\.config\s*=/.test(body))
    .map(([, attributes, body]) => hash(attributes + '\n' + body));
}

function removeTheme(html, scope) {
  return html.replace(scripts, (element, attributes, body) => {
    if (!/\btailwind\.config\s*=/.test(body)) return element;
    if (scope !== 'career-plan') throw new Error('Unexpected inline trainer theme.');
    // The retired script must only assign a plain theme object, with no app behavior.
    if (!/^\s*tailwind\.config\s*=\s*\{[\s\S]*\}\s*;?\s*$/.test(body)) {
      throw new Error('Career Plan theme contains additional behavior.');
    }
    return '';
  });
}

function withoutInfrastructure(html, scope) {
  return removeTheme(html, scope).replace(runtime, '').replace(scopedLink, '')
    .replace(tailwindStyle, '').replace(/\s+/g, ' ').trim();
}

const directory = await mkdtemp(join(tmpdir(), 'pda-scoped-tailwind-'));
const updates = [];
try {
  for (const scope of scopes) {
    const path = join(root, scope.page);
    const before = await readFile(path, 'utf8');
    if ((before.match(runtime) || []).length + (before.match(scopedLink) || []).length !== 1) {
      throw new Error(`Expected one runtime or scoped CSS link in ${scope.page}.`);
    }
    const input = join(root, 'styles', `tailwind-${scope.name}.css`);
    const source = await readFile(input, 'utf8');
    for (const match of before.matchAll(tailwindStyle)) {
      if (!source.includes(match[1].trim())) throw new Error(`Component source differs in ${scope.page}.`);
    }
    const output = join(directory, `${scope.name}.css`);
    const result = spawnSync(process.execPath, [
      require.resolve('tailwindcss/lib/cli.js'),
      '--config', join(root, 'tailwind.scoped.config.cjs'),
      '--input', input, '--output', output, '--minify',
    ], {
      cwd: root,
      env: { ...process.env, NODE_ENV: 'production', PDA_TAILWIND_SCOPE: scope.name },
      stdio: 'inherit',
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Compilation failed for ${scope.name}.`);
    const css = await readFile(output);
    const filename = `pda-tailwind-${scope.name}.v${version}.${hash(css).slice(0, 16)}.min.css`;
    const href = `/assets/${filename}`;
    const link = `<link rel="stylesheet" href="${href}" data-pda-scoped-css="${scope.name}" />`;
    let after = before.replace(runtime, link).replace(scopedLink, link);
    after = removeTheme(after, scope.name).replace(tailwindStyle, '');
    if (JSON.stringify(functionalScripts(before)) !== JSON.stringify(functionalScripts(after))) {
      throw new Error(`Functional scripts changed in ${scope.page}.`);
    }
    if (withoutInfrastructure(before, scope.name) !== withoutInfrastructure(after, scope.name)) {
      throw new Error(`Non-Tailwind page content changed in ${scope.page}.`);
    }
    updates.push({ ...scope, path, after, filename, href, css, sha256: hash(css) });
  }
  // Publish local assets only after all three compilations and preservation checks pass.
  for (const update of updates) {
    await writeFile(join(root, 'assets', update.filename), update.css);
    await writeFile(update.path, update.after);
    console.log(`${update.page}: ${update.css.byteLength} bytes; ${update.href}; functional scripts preserved`);
  }
} finally {
  await rm(directory, { recursive: true, force: true });
}
