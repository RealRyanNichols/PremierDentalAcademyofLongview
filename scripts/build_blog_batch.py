#!/usr/bin/env python3
"""Batch blog builder — emits gold-standard blog/<slug>.html from JSON content
files, inserts blog.html cards + sitemap lines. Stdlib only.
Usage: python3 scripts/build_blog_batch.py content/*.json
"""
import json, sys, os, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://www.premierdentalacademyoflongview.com"

HEAD = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>{title}</title>
  <meta name="description" content="{meta_desc}" />
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon.png" />
  <link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon-48.png" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:wght@500;600;700&display=swap" rel="stylesheet" />
  <style>
    body {{ font-family: 'Inter', sans-serif; color: #0f172a; line-height: 1.6; -webkit-font-smoothing: antialiased; }}
    .display {{ font-family: 'Fraunces', serif; }}
    .prose p {{ margin-bottom: 1rem; color: #1e293b; font-size: 16px; }}
    .prose strong {{ color: #0f172a; }}
    .wx-item.done {{ background:#f0fdfa; border-color:#0f766e; }}
    .wx-item.done .wx-box {{ background:#0f766e; border-color:#0f766e; color:#fff !important; }}
    .wx-card.open {{ border-color:#0f766e; background:#f0fdfa; }}
    .wx-body {{ display:none; }}
    .wx-card.open .wx-body {{ display:block; }}
    .wx-tab.active {{ background:#0f766e; color:#fff; }}
  </style>
  <script src="/assets/pda-seo.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" defer></script>
  <script src="/assets/ask-premier.js" defer></script>
  <script src="/assets/pda-nav.js" defer></script>
  <script src="/assets/pda-engage.js" defer></script>
  <script defer src="/_vercel/speed-insights/script.js"></script>
  <script src="/assets/pda-social-proof.js" defer></script>
  <link rel="canonical" href="{site}/blog/{slug}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Premier Dental Academy of Longview" />
  <meta property="og:url" content="{site}/blog/{slug}" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{og_desc}" />
  <meta property="og:image" content="{site}/assets/og/blog-{slug}.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{tw_title}" />
  <meta name="twitter:description" content="{tw_desc}" />
  <meta name="twitter:image" content="{site}/assets/og/blog-{slug}.png" />
  <script type="application/ld+json">{{"@context":"https://schema.org","@type":"BlogPosting","headline":"{title}","description":"{og_desc}","datePublished":"{date}","dateModified":"{date}","author":{{"@type":"Organization","name":"Premier Dental Academy of Longview","url":"{site}"}},"publisher":{{"@type":"Organization","name":"Premier Dental Academy of Longview","logo":{{"@type":"ImageObject","url":"{site}/assets/logo-mark.png"}}}},"image":"{site}/assets/og/blog-{slug}.png","mainEntityOfPage":"{site}/blog/{slug}"}}</script>
</head>
<body class="bg-white">

<nav class="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2 font-bold text-slate-900">
      <img src="/assets/logo-mark.png" alt="Premier Dental Academy of Longview" width="36" height="36" class="w-9 h-9 rounded-lg shrink-0" />
      <span class="text-base sm:text-lg">Premier Dental Academy</span>
    </a>
    <div class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
      <a href="/#programs" class="hover:text-teal-700">Programs</a>
      <a href="/calendar" class="hover:text-teal-700">Calendar</a>
      <a href="/blog" class="hover:text-teal-700">Blog</a>
      <a href="/contact" class="hover:text-teal-700">Contact</a>
    </div>
    <a href="/enroll" class="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm">Enroll →</a>
  </div>
</nav>
"""

TOUR_CTA = """
    <div class="not-prose bg-white border-2 border-teal-600 rounded-2xl p-6 my-6">
      <div class="display text-xl font-bold text-slate-900">📅 Upcoming class starts — Longview campus</div>
      <div class="grid sm:grid-cols-2 gap-3 mt-4">
        <div class="bg-teal-50 rounded-xl p-3"><div class="font-bold text-teal-800">September 14</div><div class="text-xs text-slate-600">Mon/Wed/Fri · daytime</div></div>
        <div class="bg-teal-50 rounded-xl p-3"><div class="font-bold text-teal-800">September 29</div><div class="text-xs text-slate-600">Tue/Thu · daytime</div></div>
        <div class="bg-teal-50 rounded-xl p-3"><div class="font-bold text-teal-800">November 9</div><div class="text-xs text-slate-600">Mon/Wed/Fri · daytime</div></div>
        <div class="bg-teal-50 rounded-xl p-3"><div class="font-bold text-teal-800">November 17</div><div class="text-xs text-slate-600">Tue/Thu · daytime</div></div>
      </div>
      <div class="flex flex-wrap gap-3 mt-4">
        <a href="/tour" data-event="blog_tour_click" class="bg-teal-700 hover:bg-teal-800 text-white font-bold px-5 py-2.5 rounded-full text-sm">Schedule a free tour →</a>
        <a href="/calendar" class="border-2 border-teal-700 text-teal-700 font-bold px-5 py-2.5 rounded-full text-sm hover:bg-teal-50">See the full calendar</a>
        <a href="tel:+19039136444" class="border-2 border-amber-500 text-amber-600 font-bold px-5 py-2.5 rounded-full text-sm hover:bg-amber-50">Call or text (903) 913-6444</a>
      </div>
    </div>
"""

def esc(s): return html.escape(s, quote=True)

def stat_cards(stats):
    colors = [("teal-50","teal-100","teal-700"),("amber-50","amber-100","amber-600"),("cyan-50","cyan-100","cyan-700")]
    out = ['  <div class="grid grid-cols-3 gap-3 mt-8 not-prose">']
    for (bg,bd,tx),s in zip(colors,stats):
        out.append(f'    <div class="bg-{bg} border border-{bd} rounded-xl p-4 text-center"><div class="display text-2xl font-bold text-{tx}">{s["v"]}</div><div class="text-xs text-slate-600 mt-1">{s["l"]}</div></div>')
    out.append('  </div>')
    return "\n".join(out)

def widget_html(w, slug):
    t = w["type"]
    if t == "custom":
        return w["html"], w.get("js","")
    if t == "checklist":
        h = ('<div class="not-prose bg-white border border-slate-200 rounded-2xl p-5" data-event="blog_widget_%s">\n'
             '  <div class="flex items-center justify-between mb-3"><div class="text-sm font-semibold text-slate-700">%s</div>'
             '<div class="text-sm font-bold text-teal-700"><span id="wxCount">0</span> of %d</div></div>\n'
             '  <div class="h-2 bg-slate-100 rounded-full overflow-hidden mb-4"><div id="wxBar" class="h-full bg-teal-600 rounded-full transition-all" style="width:0%%"></div></div>\n'
             '  <div id="wxList" class="space-y-2"></div>\n  <div id="wxMsg" class="mt-4 text-sm text-slate-600"></div>\n</div>') % (slug, esc(w.get("label","Your checklist")), len(w["items"]))
        js = """(function(){
  var items=%s, msgs=%s;
  var list=document.getElementById('wxList'),bar=document.getElementById('wxBar'),cnt=document.getElementById('wxCount'),msg=document.getElementById('wxMsg'),done=0,total=items.length;
  function u(){cnt.textContent=done;bar.style.width=(done/total*100)+'%%';var i=Math.min(Math.floor(done/total*(msgs.length-1e-9)),msgs.length-1);msg.textContent=done?msgs[i]:'';}
  items.forEach(function(t){var d=document.createElement('div');d.className='wx-item flex items-start gap-3 border border-slate-200 rounded-xl p-3 cursor-pointer select-none';d.innerHTML='<span class="wx-box shrink-0 w-6 h-6 rounded-md border-2 border-slate-300 flex items-center justify-center text-xs font-bold" style="color:transparent">✓</span><span class="text-[15px] text-slate-700">'+t+'</span>';d.addEventListener('click',function(){done+=d.classList.toggle('done')?1:-1;u();});list.appendChild(d);});
  u();})();""" % (json.dumps(w["items"]), json.dumps(w["messages"]))
        return h, js
    if t == "reveal":
        h = '<div class="not-prose space-y-3" id="wxCards" data-event="blog_widget_%s"></div>' % slug
        js = """(function(){
  var cards=%s,wrap=document.getElementById('wxCards');
  cards.forEach(function(c){var d=document.createElement('div');d.className='wx-card border border-slate-200 rounded-xl overflow-hidden cursor-pointer transition';d.innerHTML='<div class="flex items-center gap-3 p-4"><span class="text-2xl">'+c.e+'</span><span class="font-semibold text-slate-800 flex-1">'+c.t+'</span><span class="wx-tog text-teal-700 text-sm font-bold">+</span></div><div class="wx-body px-4 pb-4 -mt-1 text-[15px] text-slate-700">'+c.b+'</div>';d.addEventListener('click',function(){d.querySelector('.wx-tog').textContent=d.classList.toggle('open')?'−':'+';});wrap.appendChild(d);});})();""" % json.dumps(w["cards"])
        return h, js
    if t == "tabs":
        btns = "".join('<button class="wx-tab%s text-sm font-semibold border border-teal-600 text-teal-700 rounded-full px-5 py-2" data-t="%d">%s</button>' % (" active" if i==0 else "", i, esc(tb["label"])) for i,tb in enumerate(w["tabs"]))
        h = ('<div class="not-prose" data-event="blog_widget_%s"><div class="flex flex-wrap gap-2 mb-4">%s</div>'
             '<div id="wxTabBox" class="bg-slate-50 border-l-4 border-teal-600 p-4 rounded-r-lg text-[15px] text-slate-700 min-h-[84px]"></div></div>') % (slug, btns)
        js = """(function(){
  var tabs=%s,box=document.getElementById('wxTabBox'),btns=document.querySelectorAll('.wx-tab');
  function show(i){box.innerHTML=tabs[i];btns.forEach(function(b,j){b.classList.toggle('active',i===j);});}
  btns.forEach(function(b){b.addEventListener('click',function(){show(+b.dataset.t);});});show(0);})();""" % json.dumps([tb["html"] for tb in w["tabs"]])
        return h, js
    raise ValueError("unknown widget "+t)

def build(a):
    slug = a["slug"]
    head = HEAD.format(site=SITE, slug=slug, title=esc(a["title"]), meta_desc=esc(a["meta_desc"]),
                       og_desc=esc(a["og_desc"]), tw_title=esc(a["tw_title"]), tw_desc=esc(a["tw_desc"]), date=a["date"])
    parts = [head]
    parts.append('\n<main class="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">')
    parts.append('  <p class="text-xs uppercase tracking-widest text-teal-700 font-semibold">%s</p>' % esc(a["chip"]))
    parts.append('  <h1 class="display text-3xl sm:text-4xl font-bold mt-2 leading-tight">%s</h1>' % a["h1"])
    parts.append('  <p class="text-slate-500 mt-3 text-lg">%s</p>' % a["lead"])
    if a.get("hero"):
        parts.append('\n  <img src="/assets/%s" alt="%s" class="w-full rounded-2xl mt-8 shadow-lg" loading="lazy" />' % (a["hero"], esc(a["hero_alt"])))
    parts.append("\n" + stat_cards(a["stats"]))
    parts.append('\n  <div class="prose max-w-none mt-8">')
    wjs = ""
    for i, sec in enumerate(a["sections"]):
        parts.append('    <h2 class="display text-2xl font-bold mt-10">%s</h2>' % sec["h2"])
        parts.append("    " + sec["html"])
        if a.get("widget") is not None and a.get("widget_after", 0) == i:
            wh, wjs = widget_html(a["widget"], slug)
            parts.append("    " + wh)
    if a.get("tour_cta", True):
        parts.append(TOUR_CTA)
    parts.append('    <div class="not-prose" data-pda-lead data-topic="%s" data-heading="%s" data-sub="She reads every message personally and follows up fast. No pressure, no call center." data-cta="%s"></div>' % (slug, esc(a["lead_heading"]), esc(a.get("lead_cta","Send my question"))))
    cta = a["cta"]
    parts.append('''
    <div class="bg-gradient-to-br from-teal-700 to-teal-600 text-white rounded-2xl p-8 mt-12 text-center">
      <h2 class="display text-2xl font-bold mb-2">%s</h2>
      <p class="text-teal-100 mb-5">%s</p>
      <a href="%s" data-event="blog_cta_click" class="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-full">%s</a>
    </div>''' % (esc(cta["h2"]), esc(cta["p"]), cta["href"], esc(cta["btn"])))
    kr = " · ".join('<a href="%s" class="text-teal-700 font-semibold">%s</a>' % (k["href"], esc(k["label"])) for k in a["keep_reading"])
    parts.append('\n    <p class="text-sm text-slate-500 mt-8">Keep reading: %s</p>' % kr)
    parts.append('  </div>\n</main>\n')
    parts.append('<footer class="bg-slate-900 text-slate-300 py-8 mt-16">\n  <div class="max-w-7xl mx-auto px-6 text-xs text-center">© 2026 Premier Dental Academy of Longview</div>\n</footer>')
    if wjs:
        parts.append('<script>\n%s\n</script>' % wjs)
    parts.append('</body>\n</html>\n')
    return "\n".join(parts)

def card(a):
    return ('\n    <article data-aos="fade-up" class="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition pda-glow-card">\n'
            '      <a href="/blog/%s" class="flex flex-col h-full">\n'
            '        <div class="h-28 bg-gradient-to-br %s flex items-center justify-center text-5xl">%s</div>\n'
            '        <div class="p-6 flex flex-col flex-1">\n'
            '          <span class="text-xs uppercase tracking-widest text-teal-700 font-semibold">%s</span>\n'
            '          <h3 class="display text-lg font-bold mt-2">%s</h3>\n'
            '          <p class="text-slate-600 text-sm mt-2 leading-relaxed flex-1">%s</p>\n'
            '          <div class="mt-4 flex items-center justify-between"><span class="text-teal-700 font-semibold text-sm">Read →</span><span class="text-xs text-slate-400">%s</span></div>\n'
            '        </div>\n      </a>\n    </article>\n') % (
        a["slug"], a.get("card_grad","from-teal-100 to-cyan-100"), a["emoji"], esc(a["chip"]), esc(a["title"]), esc(a["card_desc"]), a["card_date"])

def main():
    articles = []
    for f in sys.argv[1:]:
        with open(f) as fh:
            data = json.load(fh)
            articles.extend(data if isinstance(data, list) else [data])
    # write article files
    for a in articles:
        p = os.path.join(ROOT, "blog", a["slug"] + ".html")
        if os.path.exists(p):
            print("SKIP exists:", a["slug"]); continue
        with open(p, "w") as fh: fh.write(build(a))
        print("wrote", p)
    # blog.html cards (insert at top of grid, newest first -> reverse so first article ends up on top)
    bp = os.path.join(ROOT, "blog.html")
    src = open(bp).read()
    marker = '<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">'
    idx = src.index('Latest articles'); gidx = src.index(marker, idx) + len(marker)
    cards = "".join(card(a) for a in articles)
    src = src[:gidx] + cards + src[gidx:]
    open(bp, "w").write(src); print("blog.html cards:", len(articles))
    # sitemap
    sp = os.path.join(ROOT, "sitemap.xml")
    s = open(sp).read()
    key = "<url><loc>%s/blog</loc>" % SITE
    kidx = s.index(key); eidx = s.index("</url>", kidx) + len("</url>")
    lines = "".join("\n  <url><loc>%s/blog/%s</loc><priority>0.8</priority><changefreq>monthly</changefreq></url>" % (SITE, a["slug"]) for a in articles)
    s = s[:eidx] + lines + s[eidx:]
    open(sp, "w").write(s); print("sitemap entries:", len(articles))

if __name__ == "__main__":
    main()
