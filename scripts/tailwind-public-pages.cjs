// Keep this selection shared by the compiler and HTML dependency replacement.
const { readdirSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const skipDirectories = new Set([
  '.git', 'node_modules', 'scripts', 'assets', 'admin', 'marketing', 'templates',
  'db', 'supabase', '.vercel', 'kajabi-weeks-7-12', 'design-reference', 'migration',
  'docs', 'data',
]);
const privateOrUtilityPages = new Set([
  'login.html', 'logout.html', 'dashboard.html', 'portal.html', 'admin.html',
  'enroll-success.html', 'congrats.html', 'thank-you.html', 'unsubscribe.html',
  '404.html', 'feed.html', 'certificate.html', 'learn.html', 'paperwork.html',
  'payment-plan-setup.html',
]);
// These pages have their own component directives or palette. Their separately
// compiled styles must never be overwritten by the shared marketing bundle.
const separateStylePages = new Set([
  'tools/practice-pro.html', 'tools/chairside.html', 'career-plan.html',
]);
// The Academy and Skills Lab themes were inspected before migration. Skills Lab
// adds amber-600, whose value is already Tailwind's standard amber-600 value.
const academyTheme = "tailwind.config={theme:{extend:{fontFamily:{sans:['Inter','system-ui','sans-serif'],display:['Fraunces','Inter','serif']},colors:{navy:{900:'#0a1226',800:'#0f172a',700:'#1e293b'},teal:{600:'#0d9488',700:'#0f766e',800:'#115e59'},amber:{400:'#fbbf24',500:'#f59e0b'}}}}}";

function isReviewedTheme(body) {
  return body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, '')
    .replace(/^window\.tailwind=window\.tailwind\|\|\{\};/, '')
    .replace(/;$/, '').replace(",600:'#d97706'", '') === academyTheme;
}

function inspectPage(html) {
  if ((html.match(/<meta\b[^>]*>/gi) || []).some(tag =>
    /\bname\s*=\s*["']robots["']/i.test(tag) &&
    /\bcontent\s*=\s*["'][^"']*\bnoindex\b/i.test(tag))) return 'noindex';
  if (/<style\b[^>]*\btype\s*=\s*["']text\/tailwindcss["']/i.test(html) || /@apply\b/.test(html)) {
    return 'page-specific Tailwind components';
  }
  if (/https:\/\/cdn\.tailwindcss\.com[^"']*plugins=/i.test(html)) return 'unreviewed CDN plugin';
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (/\btailwind\.config\s*=/.test(match[1]) && !isReviewedTheme(match[1])) return 'distinct or unreviewed theme';
  }
  return null;
}

function scanPublicPages(root) {
  const pages = [], excluded = [];
  function walk(directory, prefix = '') {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const relative = prefix + entry.name;
      if (entry.isDirectory()) {
        if (!skipDirectories.has(entry.name)) walk(join(directory, entry.name), relative + '/');
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        const html = readFileSync(join(directory, entry.name), 'utf8');
        const reason = separateStylePages.has(relative) ? 'separate page-specific stylesheet' :
          !prefix && privateOrUtilityPages.has(entry.name) ? 'private or utility page' : inspectPage(html);
        if (reason) excluded.push({ page: relative, reason });
        else if (/cdn\.tailwindcss\.com|data-pda-tailwind/.test(html)) pages.push(relative);
      }
    }
  }
  walk(root);
  return { pages, excluded };
}

module.exports = { isReviewedTheme, scanPublicPages };
