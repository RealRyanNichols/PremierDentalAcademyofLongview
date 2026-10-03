#!/usr/bin/env python3
"""Guard the approved offer.

The public site must say exactly one thing about tuition:
  in-person RDA program · $3,000 paid in full · $3,500 on the payment plan
  ($500 down + $3,000 balance) · no free or funded enrollment options.

This script fails (exit 1) if retired prices, program names, or funding
wording reappear in the public pages, and if the pages that state tuition
no longer carry the approved figures. Run it after editing copy:

    python3 scripts/check_offer.py

Values live in 05_Live_Site/assets/pda-offer.js; keep static copy in step.
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "05_Live_Site")

# Folders/files that are not public offer copy (generated directory, trainer
# apps, archive of outside job posts).
SKIP_DIRS = {"directory", "tools"}
SKIP_FILES = {"career-archives.html"}

# Retired wording. Any hit outside the allow-list is a failure.
# Patterns are the *offering* phrasings; "no grants, vouchers, scholarships"
# style denials are allowed copy and are not matched.
STALE = [
    r"\$1,995", r"\$3,495", r"\$499", r"\b1995\b", r"\b3495\b", r"1,997",
    r"\bWIOA\b", r"\bTWC\b", r"GI Bill", r"[Vv]eterans benefits accepted", r"Workforce Solutions funding",
    r"0% (interest|in-house)", r"in-house financing", r"out-of-pocket", r"Apply for funding",
    r"Career Track", r"scholarship deadlines", r"\$200 (deposit|down|locks)", r"\bStripe\b",
]

# Known, accepted hits: (file, pattern) -> reason. Reported as notes, not failures.
ALLOW = {
    ("terms.html", r"Career Track"): "legal terms — refund language pending Amanda's review of the signed enrollment agreement",
    ("dashboard.html", r"Career Track"): "internal label for existing student records whose program value is career_track",
    ("privacy.html", r"\bStripe\b"): "privacy policy names Stripe as the card processor; Square is the processor — wording pending Amanda's review",
}

# Pages that state tuition in static copy must carry the approved figures.
REQUIRED = {
    "index.html":  [r"\$3,000", r"\$3,500", r"\$500 down"],
    "enroll.html": [r"\$3,000", r"\$3,500", r"\$500 down"],
    "apply.html":  [r"\$3,000", r"\$3,500"],
}


def public_files():
    for dp, dn, fn in os.walk(SITE):
        rel = os.path.relpath(dp, SITE)
        parts = set(rel.split(os.sep)) if rel != "." else set()
        if parts & SKIP_DIRS:
            continue
        for f in fn:
            if f.endswith((".html", ".js")) and f not in SKIP_FILES:
                yield os.path.join(dp, f)


def main():
    failures, notes = [], []
    for path in public_files():
        rel = os.path.relpath(path, SITE)
        text = open(path, encoding="utf-8", errors="replace").read()
        for pat in STALE:
            for m in re.finditer(pat, text):
                line = text.count("\n", 0, m.start()) + 1
                reason = ALLOW.get((rel, pat))
                snippet = text[max(0, m.start() - 40): m.end() + 40].replace("\n", " ")
                if reason:
                    notes.append(f"{rel}:{line}: '{m.group(0)}' allowed — {reason}")
                else:
                    failures.append(f"{rel}:{line}: stale '{m.group(0)}' … {snippet.strip()}")
    for rel, pats in REQUIRED.items():
        text = open(os.path.join(SITE, rel), encoding="utf-8").read()
        for pat in pats:
            if not re.search(pat, text):
                failures.append(f"{rel}: missing approved figure {pat}")

    for n in notes:
        print("note ", n)
    for f in failures:
        print("FAIL ", f)
    if failures:
        print(f"\n{len(failures)} problem(s). The approved offer is $3,000 in full or $3,500 plan ($500 down + $3,000 balance); no funded options.")
        return 1
    print("ok — public pages match the approved offer")
    return 0


if __name__ == "__main__":
    sys.exit(main())
