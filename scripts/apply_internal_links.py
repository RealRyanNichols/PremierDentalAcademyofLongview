#!/usr/bin/env python3
"""Apply audited topic->asset links as one tasteful 'More that can help' line
per post, inserted before </main>. Idempotent. Dry-run unless --write.
Max 3 links per post, prioritised by business value."""
import os, re, json, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WRITE = "--write" in sys.argv
MARK = 'data-pda-related'

LABEL = {
    "/career-vault":            "Career Vault",
    "/tuition":                 "Tuition — every number",
    "/exam-prep-course":        "RDA Exam-Prep Course",
    "/study-pack":              "Study Pack",
    "/tools/state-board-prep":  "One-on-one State Board prep",
    "/online":                  "The online program (self-paced)",
    "/tools/funding-finder":    "Funding Finder (free)",
    "/tools/resource-hub":      "Student Life Resource Hub (free)",
    "/tools/schedule-planner":  "Schedule Planner (free)",
    "/tools/family-talk":       "Family Talk script (free)",
    "/tools/practice-exam":     "Free RDA practice exam",
    "/salary":                  "East Texas pay",
}
PRIORITY = ["/career-vault", "/tuition", "/exam-prep-course", "/study-pack",
            "/tools/state-board-prep", "/online", "/tools/funding-finder",
            "/tools/resource-hub", "/tools/schedule-planner",
            "/tools/family-talk", "/tools/practice-exam", "/salary"]
MAX_PER_POST = 3

rows = json.load(open(os.path.join(ROOT, "scripts", "_link_audit.json")))
by_slug = {}
for r in rows:
    by_slug.setdefault(r["slug"], []).append(r)

def resolves(p):
    q = p.strip("/")
    return os.path.exists(os.path.join(ROOT, q + ".html")) or \
           os.path.exists(os.path.join(ROOT, q, "index.html"))

changed = skipped = links_added = 0
for slug, items in sorted(by_slug.items()):
    f = os.path.join(ROOT, "blog", slug + ".html")
    html = open(f, encoding="utf-8").read()
    if MARK in html:
        skipped += 1; continue
    if "</main>" not in html:
        print("  ! no </main>, skipped:", slug); skipped += 1; continue
    paths = [r["path"] for r in items if resolves(r["path"])]
    paths = sorted(set(paths), key=lambda p: PRIORITY.index(p) if p in PRIORITY else 99)[:MAX_PER_POST]
    if not paths:
        skipped += 1; continue
    links = " · ".join(
        '<a href="%s" data-event="blog_related_click" class="text-teal-700 font-semibold">%s</a>'
        % (p, LABEL[p]) for p in paths)
    block = ('\n  <p %s class="text-sm text-slate-500 mt-4 max-w-3xl mx-auto px-4 sm:px-6">'
             'More that can help: %s</p>\n' % (MARK, links))
    i = html.rindex("</main>")
    out = html[:i] + block + html[i:]
    if WRITE:
        open(f, "w", encoding="utf-8").write(out)
    changed += 1; links_added += len(paths)
    if changed <= 8:
        print("  %-56s + %s" % (slug[:56], ", ".join(paths)))

print("\n%s" % ("WROTE" if WRITE else "DRY RUN — no files changed"))
print("posts updated: %d | links added: %d | skipped: %d" % (changed, links_added, skipped))
