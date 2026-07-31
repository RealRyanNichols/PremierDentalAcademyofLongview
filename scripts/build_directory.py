#!/usr/bin/env python3
"""Build the East Texas Dental Office Directory for Premier Dental Academy of Longview.

Source of truth: db/et_dental_directory.json
Outputs:
  05_Live_Site/directory.html            (searchable index)
  05_Live_Site/directory/<slug>.html     (one full profile per office)
  05_Live_Site/sitemap.xml               (adds /directory + profile URLs, idempotent)

Honesty rules: every fact rendered comes from the dataset (which carries source URLs
and a verified date). No hours, staff, ratings, or claims are invented; missing data
gets an honest fallback + a "help us complete it" CTA.
"""
import json, re, html, hashlib, unicodedata, urllib.parse, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "05_Live_Site")
OUT_DIR = os.path.join(SITE, "directory")
VERIFIED = "July 30, 2026"
DOMAIN = "https://premierdentalacademyoflongview.com"

# ---------------------------------------------------------------- load + dedupe
def norm_addr(a):
    if not a: return None
    a = a.lower().replace(".", "").replace(",", "")
    a = re.sub(r"\b(suite|ste|unit|#)\s*", "ste ", a)
    return re.sub(r"\s+", " ", a).strip()

def name_tokens(n):
    n = re.sub(r"[^a-z0-9 ]", " ", n.lower())
    stop = {"dds","dr","dental","dentistry","family","the","of","and","-", "office","center","clinic","tx"}
    return {t for t in n.split() if t and t not in stop}

def merge(a, b):
    """Merge record b into a (a = richer/base)."""
    for k in ("phone","website","facebook","instagram","address","county"):
        if not a.get(k) and b.get(k): a[k] = b[k]
    for k in ("services","dentists","positive_themes","photo_sources","source_urls"):
        seen = {x.lower() for x in a.get(k,[])}
        for x in b.get(k,[]):
            if x.lower() not in seen: a[k].append(x); seen.add(x.lower())
    if (b.get("google_reviews") or 0) > (a.get("google_reviews") or 0):
        a["google_reviews"], a["google_rating"] = b["google_reviews"], b.get("google_rating") or a.get("google_rating")
    conf = {"low":0,"medium":1,"high":2}
    if conf[b["data_confidence"]] > conf[a["data_confidence"]]: a["data_confidence"] = b["data_confidence"]
    return a

def dedupe(records):
    out = []
    for r in records:
        hit = None
        for o in out:
            if o["city"] != r["city"]: continue
            na, nb = norm_addr(o.get("address")), norm_addr(r.get("address"))
            same_addr = na and nb and na == nb
            phone_match = o.get("phone") and o.get("phone") == r.get("phone")
            ta, tb = name_tokens(o["name"]), name_tokens(r["name"])
            sim = len(ta & tb) / max(1, len(ta | tb))
            if (same_addr and (phone_match or sim >= 0.34)) or (phone_match and sim >= 0.34):
                hit = o; break
        if hit: merge(hit, r)
        else:
            r = dict(r)
            out.append(r)
    return out

def slugify(name, city, taken):
    s = unicodedata.normalize("NFKD", name).encode("ascii","ignore").decode()
    s = re.sub(r"\(.*?\)", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    s = re.sub(r"-{2,}", "-", s)[:60].strip("-")
    if s in taken: s = f"{s}-{re.sub(r'[^a-z0-9]+','-',city.lower()).strip('-')}"
    n = 2; base = s
    while s in taken: s = f"{base}-{n}"; n += 1
    taken.add(s); return s

# ---------------------------------------------------------------- theming
PALETTES = [  # (name, from, to, soft bg)
    ("teal",   "#0d9488", "#0e7490", "#ccfbf1"),
    ("ocean",  "#0369a1", "#164e63", "#e0f2fe"),
    ("emerald","#059669", "#065f46", "#d1fae5"),
    ("amber",  "#d97706", "#92400e", "#fef3c7"),
    ("violet", "#7c3aed", "#4c1d95", "#ede9fe"),
    ("rose",   "#e11d48", "#881337", "#ffe4e6"),
    ("indigo", "#4f46e5", "#312e81", "#e0e7ff"),
    ("slateblue","#475569", "#1e293b", "#e2e8f0"),
]
def theme(name):
    h = int(hashlib.md5(name.encode()).hexdigest(), 16)
    return PALETTES[h % 8], h // 8 % 4  # palette, pattern idx (0 rings,1 dots,2 waves,3 bars)

def initials(name):
    n = re.sub(r"\(.*?\)", "", name)
    words = [w for w in re.split(r"[^A-Za-z0-9]+", n) if w and w.lower() not in ("the","of","and","dds","dr","dmd")]
    return "".join(w[0].upper() for w in words[:2]) or "D"

def pattern_svg(idx, color):
    if idx == 0:  # rings
        return f'<g stroke="{color}" stroke-opacity=".18" fill="none" stroke-width="2"><circle cx="1050" cy="40" r="90"/><circle cx="1050" cy="40" r="60"/><circle cx="1050" cy="40" r="30"/><circle cx="90" cy="230" r="70"/><circle cx="90" cy="230" r="42"/></g>'
    if idx == 1:  # dots
        dots = "".join(f'<circle cx="{60+ (i%12)*38}" cy="{160+ (i//12)*30}" r="3"/>' for i in range(36))
        return f'<g fill="{color}" fill-opacity=".22">{dots}</g>'
    if idx == 2:  # waves
        return f'<g stroke="{color}" stroke-opacity=".2" fill="none" stroke-width="3"><path d="M0 200 Q 150 160 300 200 T 600 200 T 900 200 T 1200 200"/><path d="M0 235 Q 150 195 300 235 T 600 235 T 900 235 T 1200 235"/></g>'
    return f'<g fill="{color}" fill-opacity=".16"><rect x="920" y="0" width="26" height="280" transform="skewX(-18)"/><rect x="980" y="0" width="14" height="280" transform="skewX(-18)"/><rect x="1030" y="0" width="44" height="280" transform="skewX(-18)"/></g>'

def cover_svg(o):
    (pname, c1, c2, soft), pidx = theme(o["name"])
    mono = initials(o["name"])
    return f'''<svg viewBox="0 0 1200 280" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cover art for {html.escape(o["name"])}" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient></defs>
<rect width="1200" height="280" fill="url(#g)"/>{pattern_svg(pidx, "#ffffff")}
<text x="1140" y="235" font-family="Georgia,serif" font-size="200" font-weight="700" fill="#ffffff" fill-opacity=".08" text-anchor="end">{html.escape(mono)}</text></svg>'''

def avatar(o, size=104, fs=38, ring=True):
    (pname, c1, c2, soft), _ = theme(o["name"])
    r = 'style="box-shadow:0 8px 24px -8px rgba(15,23,42,.4)"' if ring else ""
    return f'''<div class="grid place-items-center rounded-2xl border-4 border-white flex-none" {r} aria-hidden="true"><svg width="{size}" height="{size}" viewBox="0 0 100 100" style="border-radius:12px;display:block"><defs><linearGradient id="a{abs(hash(o['name']))%99999}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient></defs><rect width="100" height="100" rx="0" fill="url(#a{abs(hash(o['name']))%99999})"/><text x="50" y="50" dy=".36em" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="{fs}" fill="#fff">{html.escape(initials(o["name"]))}</text></svg></div>'''

# ---------------------------------------------------------------- classification
def specialty(o):
    s = " ".join(o.get("services", [])).lower()
    if "communit" in s: return "Community Clinic"
    if "orthodont" in s or "braces" in s:
        if "general" not in s and "pediatric" not in s: return "Orthodontics"
    if "pediatric" in s or "children" in s:
        if "general" not in s: return "Pediatric Dentistry"
    if "oral surgery" in s or "maxillofacial" in s:
        if "general" not in s: return "Oral Surgery"
    if "endodont" in s and "general" not in s: return "Endodontics"
    if "periodont" in s and "general" not in s: return "Periodontics"
    if "denture" in s and "general" not in s and "implant" not in s.replace("implant denture",""): return "Dentures & Prosthetics"
    if "sedation dentistry" in s and "general" in s: return "Sedation & Implants"
    return "General & Family"

# ---------------------------------------------------------------- shared page bits
def head(title, desc, canonical, extra=""):
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>{html.escape(title)}</title>
  <meta name="description" content="{html.escape(desc)}" />
  <link rel="canonical" href="{canonical}" />
  <meta property="og:title" content="{html.escape(title)}" />
  <meta property="og:description" content="{html.escape(desc)}" />
  <meta property="og:type" content="website" />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='4' fill='%230d9488'/%3E%3C/svg%3E" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:wght@500;600;700&display=swap" rel="stylesheet" />
  <style>
    body {{ font-family: 'Inter', sans-serif; color: #0f172a; }}
    .display {{ font-family: 'Fraunces', serif; }}
    .gradient-text {{ background: linear-gradient(90deg, #0d9488 0%, #0891b2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
    .gradient-bg {{ background: radial-gradient(at 0% 0%, rgba(13,148,136,.10), transparent 50%), radial-gradient(at 100% 100%, rgba(8,145,178,.10), transparent 50%); }}
    .card-lift {{ transition: transform .25s ease, box-shadow .25s ease; }}
    .card-lift:hover {{ transform: translateY(-4px); box-shadow: 0 20px 40px -12px rgba(15,23,42,.18); }}
    @media (prefers-reduced-motion: reduce) {{ .card-lift:hover {{ transform:none }} }}
  </style>
  {extra}
  <script src="/assets/pda-seo.js" defer></script>
  <script src="/assets/ask-premier.js" defer></script>
  <script src="/assets/pda-nav.js" defer></script>
</head>
<body class="bg-gradient-to-br from-slate-50 to-cyan-50/40 min-h-screen gradient-bg">'''

def nav(active):
    def cls(k): return 'class="text-teal-700 font-semibold"' if k==active else 'class="hover:text-teal-700"'
    return f'''<nav class="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2 font-bold text-slate-900">
      <span class="inline-block w-7 h-7 rounded bg-gradient-to-br from-teal-600 to-cyan-700 text-white font-extrabold text-sm grid place-items-center">P</span>
      <span class="text-sm sm:text-base">Premier Dental Academy</span>
      <span class="hidden lg:inline text-xs text-slate-500 font-normal">of Longview</span>
    </a>
    <div class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
      <a href="/#programs" class="hover:text-teal-700">Programs</a>
      <a href="/career-archives" {cls("archives")}>Archives</a>
      <a href="/directory" {cls("directory")}>Directory</a>
      <a href="/salary" class="hover:text-teal-700">Salary</a>
      <a href="/blog" class="hover:text-teal-700">Blog</a>
      <a href="/about" class="hover:text-teal-700">About</a>
      <a href="/contact" class="hover:text-teal-700">Contact</a>
    </div>
    <div class="flex items-center gap-2">
      <a id="nav-account" href="/login" class="hidden sm:inline-block text-sm font-medium text-slate-600 hover:text-slate-900 px-2 py-1.5">Sign in</a>
      <a href="/enroll" class="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg shadow-sm">Enroll →</a>
    </div>
  </div>
</nav>'''

FOOTER = f'''<footer class="bg-slate-900 text-slate-300 mt-14">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-12">
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <div>
        <div class="flex items-center gap-2 font-bold text-white mb-3"><span class="inline-block w-7 h-7 rounded bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-extrabold text-sm grid place-items-center">P</span><span>Premier Dental Academy</span></div>
        <p class="text-xs text-slate-400 leading-relaxed">East Texas RDA training built on real practice management software. Get hired faster.</p>
      </div>
      <div><div class="text-white font-semibold mb-3 text-sm">Community</div><ul class="space-y-1.5 text-sm">
        <li><a href="/directory" class="hover:text-white">Dental office directory</a></li>
        <li><a href="/career-archives" class="hover:text-white">Career archives</a></li>
        <li><a href="/hiring-partners" class="hover:text-white">For dental offices</a></li>
      </ul></div>
      <div><div class="text-white font-semibold mb-3 text-sm">Resources</div><ul class="space-y-1.5 text-sm">
        <li><a href="/blog" class="hover:text-white">Blog</a></li>
        <li><a href="/salary" class="hover:text-white">Salary calculator</a></li>
        <li><a href="/guide" class="hover:text-white">Free guide</a></li>
        <li><a href="/apply" class="hover:text-white">Apply now</a></li>
      </ul></div>
      <div><div class="text-white font-semibold mb-3 text-sm">Contact</div><ul class="space-y-1.5 text-sm">
        <li>2800 Gilmer Rd, Suite 106<br/>Longview, TX 75604</li>
        <li><a href="tel:+19039136444" class="hover:text-white">(903) 913-6444</a></li>
        <li><a href="mailto:hello@premierdentalacademyoflongview.com" class="hover:text-white break-all">hello@premierdentalacademyoflongview.com</a></li>
      </ul></div>
    </div>
    <div class="border-t border-slate-800 mt-10 pt-6 text-xs text-slate-500">
      <p>Directory data compiled from public sources and verified {VERIFIED}. Each profile lists its sources. This is a free community resource — Premier Dental Academy of Longview is not affiliated with the offices listed and doesn't rank or endorse them. Own one of these offices? <a href="mailto:hello@premierdentalacademyoflongview.com?subject=Directory%20profile%20update" class="text-slate-400 hover:text-white">Claim or correct your profile</a>.</p>
    </div>
  </div>
</footer>'''

ICON = {
 "phone": '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"/></svg>',
 "globe": '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
 "pin": '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
 "star": '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7L5.8 21l1.6-7L2 9.2l7.1-.6z"/></svg>',
 "clock": '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
 "fb": '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.7c0-.9.3-1.5 1.6-1.5h1.6V3.3c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.5H7.6V13h2.7v8z"/></svg>',
 "ig": '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
 "team": '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
 "heart": '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
 "ext": '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>',
 "chk": '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',
}

def fmt_rating(o):
    if o.get("google_rating") and o.get("google_reviews"):
        return f'<span class="inline-flex items-center gap-1 text-amber-500 font-bold">{ICON["star"]}<span class="text-slate-900">{o["google_rating"]}</span></span><span class="text-slate-500 text-sm">· {o["google_reviews"]:,} Google reviews <span class="text-slate-400">(public listings, Jul 2026)</span></span>'
    if o.get("google_reviews"):
        return f'<span class="text-slate-500 text-sm">{o["google_reviews"]:,} Google reviews <span class="text-slate-400">(public listings, Jul 2026)</span></span>'
    return ""

def maps_q(o):
    parts = [o["name"]]
    if o.get("address"): parts.append(o["address"])
    parts.append(f'{o["city"]}, TX')
    return urllib.parse.quote(" ".join(parts))

# ---------------------------------------------------------------- profile page
def profile_html(o):
    (pname, c1, c2, soft), pidx = theme(o["name"])
    spec = o["_spec"]; slug = o["_slug"]
    title = f'{o["name"]} — {spec} in {o["city"]}, TX'
    desc = f'{o["name"]} in {o["city"]}, Texas: services, doctors, contact info, map and public review summary. Part of the free East Texas Dental Office Directory.'
    canonical = f"{DOMAIN}/directory/{slug}"
    schema = {"@context":"https://schema.org","@type":"Dentist","name":o["name"],
              "address":{"@type":"PostalAddress","addressLocality":o["city"],"addressRegion":"TX","addressCountry":"US"}}
    if o.get("address"): schema["address"]["streetAddress"] = o["address"]
    if o.get("phone"): schema["telephone"] = o["phone"]
    if o.get("website"): schema["url"] = o["website"]
    breadcrumb = {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
        {"@type":"ListItem","position":1,"name":"Home","item":DOMAIN+"/"},
        {"@type":"ListItem","position":2,"name":"Dental Office Directory","item":DOMAIN+"/directory"},
        {"@type":"ListItem","position":3,"name":o["name"],"item":canonical}]}
    extra = f'<script type="application/ld+json">{json.dumps(schema)}</script>\n<script type="application/ld+json">{json.dumps(breadcrumb)}</script>'

    q = maps_q(o)
    addr_line = ", ".join(x for x in [o.get("address"), f'{o["city"]}, TX'] if x)
    svcs = "".join(f'<span class="bg-white border border-slate-200 text-slate-700 text-[13px] font-medium px-3 py-1.5 rounded-full">{html.escape(s)}</span>' for s in o.get("services", []))
    docs = "".join(f'<li class="flex items-center gap-2.5 py-2 border-b border-dashed border-slate-100 last:border-0"><span class="w-8 h-8 flex-none rounded-lg grid place-items-center text-white text-xs font-bold" style="background:linear-gradient(135deg,{c1},{c2})">{html.escape("".join(w[0] for w in d.replace("Dr. ","").split()[:2]).upper())}</span><span class="text-[15px]">{html.escape(d)}</span></li>' for d in o.get("dentists", []))
    themes = "".join(f'<li class="flex gap-2.5 py-1.5 text-[15px] text-slate-700"><span class="text-teal-600 mt-1 flex-none">{ICON["chk"]}</span>{html.escape(t)}</li>' for t in o.get("positive_themes", []))
    srcs = "".join(f'<a class="inline-flex items-center gap-1 text-[12.5px] text-slate-500 hover:text-teal-700 bg-white border border-slate-200 rounded-full px-3 py-1" href="{html.escape(u)}" target="_blank" rel="noopener nofollow">{html.escape(urllib.parse.urlparse(u).netloc.replace("www.",""))} {ICON["ext"]}</a>' for u in o.get("source_urls", []))

    socials = ""
    if o.get("facebook"): socials += f'<a class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-teal-700 bg-white border border-slate-200 rounded-lg px-3.5 py-2" href="{html.escape(o["facebook"])}" target="_blank" rel="noopener nofollow">{ICON["fb"]} Facebook</a>'
    if o.get("instagram"): socials += f'<a class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-teal-700 bg-white border border-slate-200 rounded-lg px-3.5 py-2" href="{html.escape(o["instagram"])}" target="_blank" rel="noopener nofollow">{ICON["ig"]} Instagram</a>'

    photos_note = ""
    if o.get("website") or o.get("facebook"):
        links = []
        if o.get("website"): links.append(f'<a class="text-teal-700 font-semibold hover:underline" href="{html.escape(o["website"])}" target="_blank" rel="noopener nofollow">their website</a>')
        if o.get("facebook"): links.append(f'<a class="text-teal-700 font-semibold hover:underline" href="{html.escape(o["facebook"])}" target="_blank" rel="noopener nofollow">their Facebook page</a>')
        photos_note = f'<p class="text-[13px] text-slate-500 mt-3">Office photos belong to the practice — see the real thing on {" and ".join(links)}.</p>'

    low_banner = ""
    if o["data_confidence"] == "low":
        low_banner = '<div class="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3 mb-5">Basic listing compiled from public records — some details may be dated. Own this office? <a class="font-bold underline" href="mailto:hello@premierdentalacademyoflongview.com?subject=Directory%20update%3A%20'+urllib.parse.quote(o["name"])+'">Help us complete it free.</a></div>'

    phone_btn = f'<a href="tel:{re.sub(r"[^0-9+]","",o["phone"])}" class="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-3 rounded-xl shadow transition">{ICON["phone"]} {html.escape(o["phone"])}</a>' if o.get("phone") else ""
    site_btn = f'<a href="{html.escape(o["website"])}" target="_blank" rel="noopener nofollow" class="inline-flex items-center gap-2 bg-white border border-slate-300 hover:border-teal-400 text-slate-800 font-semibold px-5 py-3 rounded-xl transition">{ICON["globe"]} Website {ICON["ext"]}</a>' if o.get("website") else ""
    dir_btn = f'<a href="https://www.google.com/maps/search/?api=1&query={q}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 bg-white border border-slate-300 hover:border-teal-400 text-slate-800 font-semibold px-5 py-3 rounded-xl transition">{ICON["pin"]} Directions {ICON["ext"]}</a>'

    rating = fmt_rating(o)
    rating_block = f'<div class="flex flex-wrap items-center gap-2 mt-2">{rating}</div>' if rating else ""

    return f'''{head(title, desc, canonical, extra)}
{nav("directory")}
<div class="max-w-5xl mx-auto px-4 sm:px-6 pt-5">
  <p class="text-[13px] text-slate-500"><a href="/directory" class="text-teal-700 font-semibold hover:underline">← East Texas Dental Office Directory</a> · {html.escape(o["city"])}, TX</p>
</div>
<header class="max-w-5xl mx-auto px-4 sm:px-6 mt-4">
  <div class="rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-white">
    <div class="h-40 sm:h-52">{cover_svg(o)}</div>
    <div class="px-5 sm:px-8 pb-6">
      <div class="flex items-end gap-4 -mt-10 sm:-mt-12">{avatar(o)}
        <span class="mb-2 inline-flex text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full" style="background:{soft};color:{c2}">{html.escape(spec)}</span>
      </div>
      <h1 class="display text-2xl sm:text-4xl font-bold mt-4 leading-tight">{html.escape(o["name"])}</h1>
      <p class="text-slate-600 mt-1 flex items-center gap-1.5">{ICON["pin"]} {html.escape(addr_line)}</p>
      {rating_block}
      <div class="flex flex-wrap gap-2.5 mt-5">{phone_btn}{site_btn}{dir_btn}</div>
    </div>
  </div>
</header>
<main class="max-w-5xl mx-auto px-4 sm:px-6 mt-6 grid lg:grid-cols-3 gap-5">
  <div class="lg:col-span-2 space-y-5">
    {low_banner}
    {f'<section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"><h2 class="display text-lg font-bold flex items-center gap-2"><span class="text-teal-600">{ICON["heart"]}</span> Why locals like it</h2><ul class="mt-2">{themes}</ul><p class="text-[12px] text-slate-400 mt-3">Summarized from public reviews and the practice&#39;s own materials · verified {VERIFIED}</p></section>' if themes else ''}
    <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 class="display text-lg font-bold">Services</h2>
      <div class="flex flex-wrap gap-2 mt-3">{svcs or '<span class="text-slate-500 text-sm">Call the office for current services.</span>'}</div>
    </section>
    {f'<section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"><h2 class="display text-lg font-bold flex items-center gap-2"><span class="text-teal-600">{ICON["team"]}</span> Doctors</h2><ul class="mt-2">{docs}</ul><p class="text-[12px] text-slate-400 mt-3">Per public listings · staff can change — confirm with the office</p></section>' if docs else ''}
    <section class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <h2 class="display text-lg font-bold px-6 pt-6">Map</h2>
      <div class="px-6 pb-6 pt-3">
        <div class="rounded-xl overflow-hidden border border-slate-200">
          <iframe title="Map to {html.escape(o["name"])}" src="https://maps.google.com/maps?q={q}&output=embed" width="100%" height="280" style="border:0" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
        <p class="text-[13px] text-slate-500 mt-2">If the map doesn&#39;t load, <a class="text-teal-700 font-semibold hover:underline" href="https://www.google.com/maps/search/?api=1&query={q}" target="_blank" rel="noopener">open it on Google Maps</a>.</p>
      </div>
    </section>
  </div>
  <aside class="space-y-5">
    <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 class="display text-lg font-bold flex items-center gap-2"><span class="text-teal-600">{ICON["clock"]}</span> Hours</h2>
      <p class="text-[15px] text-slate-700 mt-2">Hours vary and change seasonally — the fastest ways to check:</p>
      <ul class="mt-3 space-y-2 text-sm">
        {f'<li><a class="inline-flex items-center gap-2 text-teal-700 font-semibold hover:underline" href="tel:{re.sub(r"[^0-9+]","",o["phone"])}">{ICON["phone"]} Call {html.escape(o["phone"])}</a></li>' if o.get("phone") else ''}
        <li><a class="inline-flex items-center gap-2 text-teal-700 font-semibold hover:underline" href="https://www.google.com/maps/search/?api=1&query={q}" target="_blank" rel="noopener">{ICON["pin"]} Live hours on Google Maps {ICON["ext"]}</a></li>
        {f'<li><a class="inline-flex items-center gap-2 text-teal-700 font-semibold hover:underline" href="{html.escape(o["website"])}" target="_blank" rel="noopener nofollow">{ICON["globe"]} Check their website {ICON["ext"]}</a></li>' if o.get("website") else ''}
      </ul>
    </section>
    <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 class="display text-lg font-bold">Contact &amp; social</h2>
      <ul class="mt-3 space-y-2 text-[15px] text-slate-700">
        {f'<li class="flex items-center gap-2">{ICON["phone"]} <a class="hover:text-teal-700" href="tel:{re.sub(r"[^0-9+]","",o["phone"])}">{html.escape(o["phone"])}</a></li>' if o.get("phone") else '<li class="text-slate-500 text-sm">Phone not published — see sources below.</li>'}
        <li class="flex items-start gap-2">{ICON["pin"]} <span>{html.escape(addr_line)}</span></li>
      </ul>
      <div class="flex flex-wrap gap-2 mt-4">{socials or '<span class="text-slate-500 text-sm">No public social pages on record.</span>'}</div>
      {photos_note}
    </section>
    <section class="rounded-2xl p-6 text-white shadow-lg" style="background:linear-gradient(135deg,{c1},{c2})">
      <h2 class="display text-lg font-bold">Work at an office like this?</h2>
      <p class="text-sm mt-1.5 text-white/90">We train dental assistants right here in East Texas — hands-on, on real equipment and real practice software.</p>
      <a href="/#programs" class="inline-block mt-4 bg-white font-bold text-sm px-4 py-2.5 rounded-lg" style="color:{c2}">Explore training →</a>
    </section>
    <section class="bg-white rounded-2xl border border-teal-200 shadow-sm p-6">
      <h2 class="display text-lg font-bold">Is this your office?</h2>
      <p class="text-sm text-slate-600 mt-1.5">Claim this free profile — add photos, hours, staff, and openings. And meet our graduates first when you&#39;re hiring.</p>
      <div class="flex flex-wrap gap-2 mt-4">
        <a href="mailto:hello@premierdentalacademyoflongview.com?subject=Claim%20directory%20profile%3A%20{urllib.parse.quote(o["name"])}" class="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition">Claim / update</a>
        <a href="/hiring-partners" class="border border-slate-300 hover:border-teal-400 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-lg transition">Partner with us</a>
      </div>
    </section>
    <section class="bg-slate-50 rounded-2xl border border-slate-200 p-5">
      <h2 class="text-sm font-bold text-slate-600">Sources · verified {VERIFIED}</h2>
      <div class="flex flex-wrap gap-1.5 mt-2.5">{srcs}</div>
    </section>
  </aside>
</main>
{FOOTER}
</body>
</html>'''

# ---------------------------------------------------------------- index page
def card(o):
    (pname, c1, c2, soft), _ = theme(o["name"])
    rating = ""
    if o.get("google_rating") and o.get("google_reviews"):
        rating = f'<span class="inline-flex items-center gap-1 text-[13px] font-bold text-amber-500">{ICON["star"]}<span class="text-slate-800">{o["google_rating"]}</span><span class="text-slate-400 font-medium">({o["google_reviews"]:,})</span></span>'
    return f'''<a href="/directory/{o["_slug"]}" class="card-lift block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" data-city="{html.escape(o["city"])}" data-spec="{html.escape(o["_spec"])}" data-hay="{html.escape((o["name"]+" "+o["city"]+" "+o["_spec"]+" "+" ".join(o.get("services",[])[:6])+" "+" ".join(o.get("dentists",[])[:4])).lower())}">
  <div class="h-2.5" style="background:linear-gradient(90deg,{c1},{c2})"></div>
  <div class="p-5 flex gap-3.5">
    {avatar(o, size=56, fs=22, ring=False)}
    <div class="min-w-0">
      <h3 class="font-bold text-slate-900 leading-snug">{html.escape(o["name"])}</h3>
      <p class="text-[13px] text-slate-500 mt-0.5 flex items-center gap-1">{ICON["pin"]} {html.escape(o["city"])}, TX</p>
      <div class="flex flex-wrap items-center gap-2 mt-2">
        <span class="text-[11.5px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" style="background:{soft};color:{c2}">{html.escape(o["_spec"])}</span>
        {rating}
      </div>
    </div>
  </div>
</a>'''

def index_html(offices, cities, specs):
    canonical = f"{DOMAIN}/directory"
    schema = {"@context":"https://schema.org","@type":"CollectionPage","name":"East Texas Dental Office Directory",
              "description":f"A free directory of {len(offices)} dental offices within about 50 miles of Longview, Texas.","url":canonical}
    extra = f'<script type="application/ld+json">{json.dumps(schema)}</script>'
    city_counts = {}
    for o in offices: city_counts[o["city"]] = city_counts.get(o["city"],0)+1
    city_chips = "".join(f'<button class="chip flex-none text-[13px] font-semibold px-3.5 py-2 rounded-full border transition bg-white text-slate-600 border-slate-200 hover:border-teal-300" data-city="{html.escape(c)}">{html.escape(c)} <span class="text-slate-400">{city_counts[c]}</span></button>' for c in cities)
    spec_chips = "".join(f'<button class="spec flex-none text-[13px] font-semibold px-3.5 py-2 rounded-full border transition bg-white text-slate-600 border-slate-200 hover:border-teal-300" data-spec="{html.escape(s)}">{html.escape(s)}</button>' for s in specs)
    cards = "\n".join(card(o) for o in offices)
    return f'''{head(f"East Texas Dental Office Directory — every office within 50 miles of Longview, TX",
      f"A free, searchable directory of {len(offices)} dental offices around Longview, Tyler, Marshall, Kilgore, Henderson and across East Texas — services, doctors, contact info, maps, and public review summaries.",
      canonical, extra)}
{nav("directory")}
<header class="relative overflow-hidden">
  <div class="absolute -top-24 -right-20 w-96 h-96 rounded-full bg-teal-300/50 blur-3xl pointer-events-none"></div>
  <div class="absolute top-40 -left-24 w-80 h-80 rounded-full bg-cyan-300/40 blur-3xl pointer-events-none"></div>
  <div class="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-10 sm:pt-16">
    <p class="text-xs uppercase tracking-widest text-teal-700 font-semibold">Free community archive</p>
    <h1 class="display text-4xl sm:text-6xl font-bold mt-3 leading-[1.08] max-w-3xl">The East Texas <span class="gradient-text">Dental Office</span> Directory</h1>
    <p class="text-slate-600 mt-4 max-w-2xl text-lg">Every dental office we could verify within about 50 miles of Longview — {len(offices)} and counting. Each profile has services, doctors, contact info, a map, and where to check live hours. Sourced and dated, updated as offices tell us more.</p>
    <div class="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
      <span class="bg-white/80 border border-teal-200 text-teal-800 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">{ICON["chk"]} Verified {VERIFIED}</span>
      <span class="bg-white/80 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full">{len(offices)} offices · {len(cities)} cities</span>
      <span class="bg-white/80 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full">Free to be listed · no rankings</span>
    </div>
  </div>
  <div class="h-1 bg-gradient-to-r from-teal-600 via-cyan-600 to-amber-500"></div>
</header>
<main class="max-w-7xl mx-auto px-4 sm:px-6">
  <div class="sticky top-16 z-40 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-gradient-to-br from-slate-50 to-cyan-50/40 backdrop-blur border-b border-slate-200/70">
    <div class="flex flex-col gap-2.5">
      <label class="relative block max-w-xl">
        <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input id="q" type="search" placeholder="Search {len(offices)} offices — name, city, doctor, service…" aria-label="Search offices" class="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-[15px] focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400" />
      </label>
      <div class="flex gap-1.5 overflow-x-auto pb-0.5" id="cities"><button class="chip on flex-none text-[13px] font-semibold px-3.5 py-2 rounded-full border transition bg-teal-600 text-white border-teal-600" data-city="All">All cities</button>{city_chips}</div>
      <div class="flex gap-1.5 overflow-x-auto pb-0.5" id="specs"><button class="spec on flex-none text-[13px] font-semibold px-3.5 py-2 rounded-full border transition bg-slate-800 text-white border-slate-800" data-spec="All">All types</button>{spec_chips}</div>
    </div>
  </div>
  <p class="text-[13px] text-slate-500 mt-4" id="count"></p>
  <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3" id="grid">
{cards}
  </div>
  <div class="hidden bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center text-slate-500 text-sm mt-4" id="empty">No matches — try clearing the search or filters.</div>
  <div class="relative overflow-hidden rounded-3xl mt-10 bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-800 text-white p-8 sm:p-10">
    <svg class="absolute -right-10 -top-10 w-64 h-64 text-white/10" viewBox="0 0 100 100" fill="none" aria-hidden="true"><circle cx="50" cy="50" r="48" stroke="currentColor" stroke-width="2"/><circle cx="50" cy="50" r="32" stroke="currentColor" stroke-width="2"/><circle cx="50" cy="50" r="16" stroke="currentColor" stroke-width="2"/></svg>
    <div class="relative max-w-2xl">
      <h2 class="display text-2xl sm:text-3xl font-bold">These offices hire trained assistants.</h2>
      <p class="text-teal-50/90 mt-2">That&#39;s what we do — practical dental assistant training in a real office setting, right here in Longview. Come see the classroom.</p>
      <div class="flex flex-wrap gap-3 mt-6">
        <a href="/#programs" class="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-3 rounded-xl shadow-lg transition">Explore our training →</a>
        <a href="/career-archives" class="border border-white/40 hover:bg-white/10 font-semibold px-5 py-3 rounded-xl transition">See who&#39;s hiring now</a>
      </div>
    </div>
  </div>
  <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
    <div class="flex-1">
      <p class="font-bold text-slate-900">Run a dental office around here?</p>
      <p class="text-sm text-slate-600">Your listing is free. Claim it to add photos, hours, your team, and job openings.</p>
    </div>
    <a href="mailto:hello@premierdentalacademyoflongview.com?subject=Claim%20our%20directory%20profile" class="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition flex-none">Claim your profile</a>
  </div>
</main>
{FOOTER}
<script>
const state = {{ q:"", city:"All", spec:"All" }};
const cards = [...document.querySelectorAll("#grid > a")];
function apply() {{
  let n = 0;
  cards.forEach(c => {{
    const ok = (state.city==="All"||c.dataset.city===state.city)
      && (state.spec==="All"||c.dataset.spec===state.spec)
      && (!state.q||c.dataset.hay.includes(state.q));
    c.classList.toggle("hidden", !ok); if (ok) n++;
  }});
  document.getElementById("count").textContent = n + " of {len(offices)} offices · verified {VERIFIED}";
  document.getElementById("empty").classList.toggle("hidden", n>0);
}}
document.getElementById("q").addEventListener("input", e => {{ state.q = e.target.value.toLowerCase(); apply(); }});
function wire(boxId, key, onCls, offCls) {{
  const box = document.getElementById(boxId);
  box.addEventListener("click", e => {{
    const b = e.target.closest("button"); if (!b) return;
    state[key] = b.dataset[key];
    box.querySelectorAll("button").forEach(x => x.className = offCls);
    b.className = onCls; apply();
  }});
}}
wire("cities","city","chip on flex-none text-[13px] font-semibold px-3.5 py-2 rounded-full border transition bg-teal-600 text-white border-teal-600","chip flex-none text-[13px] font-semibold px-3.5 py-2 rounded-full border transition bg-white text-slate-600 border-slate-200 hover:border-teal-300");
wire("specs","spec","spec on flex-none text-[13px] font-semibold px-3.5 py-2 rounded-full border transition bg-slate-800 text-white border-slate-800","spec flex-none text-[13px] font-semibold px-3.5 py-2 rounded-full border transition bg-white text-slate-600 border-slate-200 hover:border-teal-300");
apply();
</script>
</body>
</html>'''

# ---------------------------------------------------------------- main
def main():
    data = json.load(open(os.path.join(ROOT, "db", "et_dental_directory.json")))
    offices = dedupe(data)
    taken = set()
    for o in offices:
        o["_slug"] = slugify(o["name"], o["city"], taken)
        o["_spec"] = specialty(o)
    city_order = {"Longview":0}
    offices.sort(key=lambda o: (city_order.get(o["city"], 1), o["city"], -(o.get("google_reviews") or 0), o["name"]))
    cities = sorted({o["city"] for o in offices}, key=lambda c: (city_order.get(c,1), c))
    specs = sorted({o["_spec"] for o in offices})

    os.makedirs(OUT_DIR, exist_ok=True)
    for o in offices:
        with open(os.path.join(OUT_DIR, o["_slug"] + ".html"), "w") as f:
            f.write(profile_html(o))
    idx = index_html(offices, cities, specs)
    with open(os.path.join(SITE, "directory.html"), "w") as f:
        f.write(idx)

    # sitemap
    sm_path = os.path.join(SITE, "sitemap.xml")
    sm = open(sm_path).read()
    sm = re.sub(r"\n\s*<url><loc>[^<]*/directory[^<]*</loc>.*?</url>", "", sm)
    entries = [f"  <url><loc>{DOMAIN}/directory</loc><priority>0.9</priority><changefreq>weekly</changefreq></url>"]
    entries += [f"  <url><loc>{DOMAIN}/directory/{o['_slug']}</loc><priority>0.6</priority><changefreq>monthly</changefreq></url>" for o in offices]
    sm = sm.replace("</urlset>", "\n".join(entries) + "\n</urlset>")
    open(sm_path, "w").write(sm)

    print(f"offices after dedupe: {len(offices)} (from {len(data)} records)")
    print(f"cities: {len(cities)} | specialties: {specs}")
    print(f"profiles written: {len(os.listdir(OUT_DIR))}")
    conf = {"high":0,"medium":0,"low":0}
    for o in offices: conf[o["data_confidence"]] += 1
    print("confidence mix:", conf)

if __name__ == "__main__":
    main()
