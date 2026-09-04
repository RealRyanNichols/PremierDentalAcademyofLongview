#!/usr/bin/env python3
"""Audit blog posts for topic->tool/product link mismatches.
Reports posts whose CONTENT clearly matches an asset they never link to.
Read-only. Stdlib only."""
import os, re, glob, json, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# target: (path, [strong signals], min_hits, label)
TARGETS = [
    ("/online",                 [r"\bonline (?:program|course|option|training)\b", r"self-paced"], 2, "Online program ($997, no seat cap)"),
    ("/career-vault",           [r"\bjob search\b", r"\bresume\b", r"\binterview\b", r"\bget hired\b", r"\bjob hunt"], 3, "Career Vault (paid)"),
    ("/tuition",                [r"\btuition\b", r"\bpayment plan\b", r"\bcost of\b", r"\bafford"], 3, "Tuition page"),
    ("/study-pack",             [r"\bstudy\b", r"\bcheat sheet", r"\btray setup", r"\bmemoriz"], 3, "Study Pack (paid)"),
    ("/exam-prep-course",       [r"\bstate board\b", r"\bRDA exam\b", r"\bexam prep\b"], 2, "Exam-Prep Mini-Course (paid)"),
    ("/tools/state-board-prep", [r"\bstate board\b", r"\bfailed\b", r"\bstudy plan\b", r"\btutor"], 2, "1-on-1 State Board Prep"),
    ("/tools/family-talk",      [r"\bfamily\b", r"\bhusband\b", r"\bwife\b", r"\bparents\b", r"\bsupport(?:ive)? (?:of|from)"], 3, "Family Talk tool"),
    ("/tools/resource-hub",     [r"\bchildcare\b", r"\bbabysit", r"\bbills\b", r"\brent\b", r"\bgroceries\b", r"\bfood bank"], 2, "Student Life Resource Hub"),
    ("/tools/schedule-planner", [r"\bwork full[- ]time\b", r"\bfit (?:it |school )?(?:in|around)\b", r"\bbusy\b", r"\bshift work"], 2, "Schedule Planner"),
    ("/tools/funding-finder",   [r"\bWIOA\b", r"\bworkforce\b", r"\bfunding\b", r"\bgrant\b"], 2, "Funding Finder"),
    ("/tools/practice-exam",    [r"\bpractice (?:test|exam)\b", r"\bRDA exam\b"], 2, "Free RDA Practice Exam"),
    ("/salary",                 [r"\bpay\b", r"\bsalary\b", r"\bhow much.{0,20}make\b", r"\bwage"], 3, "Salary page"),
]

def body_text(html):
    m = re.search(r'<main.*?</main>', html, re.S)
    seg = m.group(0) if m else html
    seg = re.sub(r'<script.*?</script>', ' ', seg, flags=re.S)
    return re.sub(r'<[^>]+>', ' ', seg)

rows = []
for f in sorted(glob.glob(os.path.join(ROOT, "blog", "*.html"))):
    slug = os.path.basename(f)[:-5]
    html = open(f, encoding="utf-8").read()
    text = body_text(html)
    for path, sigs, need, label in TARGETS:
        if re.search(r'href="%s[/"?#]' % re.escape(path), html) or ('href="%s"' % path) in html:
            continue
        hits = [s for s in sigs if re.search(s, text, re.I)]
        if len(hits) >= need:
            strength = len(hits)
            rows.append({"slug": slug, "path": path, "label": label,
                         "signals": len(hits), "strength": strength})

by_target = {}
for r in rows:
    by_target.setdefault(r["path"], []).append(r)

print("=" * 68)
print("INTERNAL LINK AUDIT — posts that discuss a topic but never link the asset")
print("=" * 68)
for path, items in sorted(by_target.items(), key=lambda kv: -len(kv[1])):
    lbl = items[0]["label"]
    print("\n%-26s %3d posts missing this link   (%s)" % (path, len(items), lbl))
    for it in sorted(items, key=lambda x: -x["strength"])[:6]:
        print("      %-58s sig:%d" % (it["slug"][:58], it["signals"]))
    if len(items) > 6:
        print("      … and %d more" % (len(items) - 6))

print("\n" + "=" * 68)
print("TOTAL missing-link opportunities:", len(rows))
print("Posts affected:", len({r['slug'] for r in rows}))
json.dump(rows, open(os.path.join(ROOT, "scripts", "_link_audit.json"), "w"), indent=1)
print("Detail written to scripts/_link_audit.json")
