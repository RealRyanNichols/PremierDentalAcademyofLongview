// Exercise styling that static extraction can miss: form states and computed alerts.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const postcss = require('postcss');
const escapeClassName = require('tailwindcss/lib/util/escapeClassName').default;
const { scanPublicPages } = require('./tailwind-public-pages.cjs');

function findRule(ast, selector) {
  let found;
  ast.walkRules(rule => {
    if (rule.selector.split(',').includes(selector)) found = rule;
  });
  assert.ok(found, `Missing CSS rule ${selector}`);
  return found;
}

function declaration(rule, property) {
  return rule.nodes.find(node => node.type === 'decl' && node.prop === property)?.value;
}

function utility(ast, name) {
  return findRule(ast, '.' + escapeClassName(name));
}

function color(ast, className, property, expectedRgb) {
  const value = declaration(utility(ast, className), property);
  assert.ok(value?.includes(`rgb(${expectedRgb}`), `${className} has unexpected ${property}: ${value}`);
}

const pages = [
  { name: 'practice-pro', page: 'tools/practice-pro.html' },
  { name: 'chairside', page: 'tools/chairside.html' },
  { name: 'career-plan', page: 'career-plan.html' },
];
const publicPages = new Set(scanPublicPages(root).pages);

for (const scope of pages) {
  const html = await readFile(join(root, scope.page), 'utf8');
  assert.ok(!/cdn\.tailwindcss\.com|\btailwind\.config\s*=|type=["']text\/tailwindcss["']/.test(html), `Runtime remains in ${scope.page}`);
  const links = [...html.matchAll(/<link\b[^>]*data-pda-scoped-css=["']([^"']+)["'][^>]*>/gi)];
  assert.equal(links.length, 1, `Expected one scoped stylesheet in ${scope.page}`);
  assert.equal(links[0][1], scope.name);
  const href = links[0][0].match(/href=["']([^"']+)["']/)[1];
  assert.match(href, new RegExp(`^/assets/pda-tailwind-${scope.name}\\.v3\\.4\\.19\\.[a-f0-9]{16}\\.min\\.css$`));
  const css = await readFile(join(root, href.slice(1)), 'utf8');
  const digest = createHash('sha256').update(css).digest('hex').slice(0, 16);
  assert.ok(href.includes(`.${digest}.min.css`), 'Asset hash does not match its bytes');
  assert.ok(!publicPages.has(scope.page), 'Broad compiler would overwrite a scoped page');
  const ast = postcss.parse(css);
  utility(ast, 'hidden');
  utility(ast, 'flex');
  utility(ast, 'md:hidden');
  if (scope.name !== 'career-plan') {
    assert.equal(declaration(findRule(ast, '.input'), 'width'), '100%');
    assert.equal(declaration(findRule(ast, '.input'), 'font-size'), '13px');
    assert.equal(declaration(findRule(ast, '.label'), 'font-size'), '11px');
    assert.equal(declaration(findRule(ast, '.btn'), 'display'), 'inline-flex');
    findRule(ast, '.input:focus');
    findRule(ast, '.btn-danger:hover');
    const primary = declaration(findRule(ast, '.btn-primary'), 'background-color');
    assert.ok(primary.includes(scope.name === 'practice-pro' ? 'rgb(15 118 110' : 'rgb(14 116 144'), 'Trainer primary button color changed');
  }
  if (scope.name === 'practice-pro') {
    for (const tone of ['rose', 'amber']) {
      utility(ast, `bg-${tone}-50`);
      utility(ast, `border-${tone}-200`);
      utility(ast, `text-${tone}-900`);
    }
    color(ast, 'bg-rose-50', 'background-color', '255 241 242');
    findRule(ast, '.marker-btn');
  }
  if (scope.name === 'career-plan') {
    color(ast, 'bg-rose-50', 'background-color', '253 241 244');
    color(ast, 'text-rose-600', 'color', '196 83 111');
    color(ast, 'text-plum-900', 'color', '61 46 68');
    color(ast, 'bg-sage-50', 'background-color', '240 249 246');
    color(ast, 'text-gold-700', 'color', '185 130 43');
    color(ast, 'bg-lav-100', 'background-color', '241 236 250');
  }
  console.log(`PASS ${scope.page}: hashed CSS, scoped ownership, layout, and required form/palette rules`);
}
