#!/usr/bin/env python3
"""One-off validator for newly published blog posts. Not part of npm test."""
import os, re, sys, xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SLUGS = sys.argv[1:]
fail = []

def chk(cond, msg):
    if not cond:
        fail.append(msg)

def resolves(path):
    p = path.split('#')[0].split('?')[0].rstrip('/')
    if not p or p == '':
        return True
    p = p.lstrip('/')
    for cand in (p, p + '.html', os.path.join(p, 'index.html')):
        if os.path.exists(os.path.join(ROOT, cand)):
            return True
    return False

for slug in SLUGS:
    fp = os.path.join(ROOT, 'blog', slug + '.html')
    chk(os.path.exists(fp), 'MISSING FILE ' + slug)
    if not os.path.exists(fp):
        continue
    s = open(fp).read()
    chk(len(re.findall(r'<h1[\s>]', s)) == 1, slug + ': h1 count != 1')
    chk(len(re.findall(r'rel="canonical"', s)) == 1, slug + ': canonical count != 1')
    chk(len(re.findall(r'application/ld\+json', s)) == 1, slug + ': ld+json count != 1')
    chk('<html lang="en">' in s, slug + ': missing html lang=en')
    chk(len(re.findall(r'data-pda-lead', s)) == 1, slug + ': data-pda-lead count != 1')
    chk(len(re.findall(r'blog_cta_click', s)) == 1, slug + ': blog_cta_click count != 1')
    chk(len(re.findall(r'blog_tour_click', s)) == 1, slug + ': tour CTA count != 1')
    chk('tel:+19039136444' in s, slug + ': missing tap-to-call in tour CTA')
    chk('/calendar' in s, slug + ': missing /calendar link')
    og = '/assets/og/blog-%s.jpg' % slug
    chk(s.count(og) == 3, slug + ': og/twitter/json-ld image refs != 3')
    chk(os.path.exists(os.path.join(ROOT, 'assets', 'og', 'blog-%s.png' % slug)), slug + ': thumbnail file missing')
    chk('canonical" href="https://www.premierdentalacademyoflongview.com/blog/%s"' % slug in s, slug + ': canonical wrong')
    chk('premierdentalacademyoflongview.com' in s and not re.search(r'https://premierdentalacademyoflongview\.com', s), slug + ': apex host used somewhere')
    # every internal href resolves
    for href in set(re.findall(r'href=[\'"](/[^\'"#]*)[\'"]', s)):
        if href.startswith('/assets/') or href.startswith('/_vercel'):
            chk(os.path.exists(os.path.join(ROOT, href.lstrip('/'))), slug + ': asset missing ' + href)
        else:
            chk(resolves(href), slug + ': dead internal link ' + href)
    # no hard-coded prices in new copy
    for m in re.findall(r'\$[0-9][0-9,]*', s):
        fail.append(slug + ': hard-coded price ' + m)
    # no evening/night/saturday class claims
    for bad in ('evening class', 'night class', 'Saturday class', '5:30', '6-9pm', '6–9pm'):
        chk(bad.lower() not in s.lower(), slug + ': forbidden schedule string "%s"' % bad)

# blog.html cards
b = open(os.path.join(ROOT, 'blog.html')).read()
for slug in SLUGS:
    chk(b.count('/blog/%s"' % slug) == 1, 'blog.html: card count != 1 for ' + slug)

# sitemap
sm = os.path.join(ROOT, 'sitemap.xml')
try:
    ET.parse(sm)
except Exception as e:
    fail.append('sitemap.xml XML parse error: %s' % e)
sms = open(sm).read()
for slug in SLUGS:
    chk(sms.count('/blog/%s<' % slug) == 1, 'sitemap: entry count != 1 for ' + slug)
chk('<loc>https://premierdentalacademyoflongview.com' not in sms, 'sitemap: apex host present')

if fail:
    print('FAIL (%d)' % len(fail))
    for f in fail:
        print(' -', f)
    sys.exit(1)
print('PASS — all checks green for:', ', '.join(SLUGS))
