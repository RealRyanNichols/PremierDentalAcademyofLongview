#!/usr/bin/env python3
"""One-time data enrichment, verified 2026-07-31 from each office's own website."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, "db", "et_dental_directory.json")
d = json.load(open(P))
UPD = {
  "Dolive & Acres Dentistry": {
    "hours": ["Mon–Wed: 8:00 AM – 5:00 PM", "Thu: 7:00 AM – 2:00 PM", "Fri–Sun: Closed"],
    "hours_source": "https://doliveacresdentistry.com/contact/", "hours_verified": "July 31, 2026",
    "phone": "(903) 753-7553",
  },
  "Guttry Dental (Robert B. Guttry, DDS)": {
    "hours": ["Mon–Thu: 8:00 AM – 5:00 PM", "Fri–Sun: Closed"],
    "hours_source": "https://www.guttrydental.com/", "hours_verified": "July 31, 2026",
    "email": "office@guttrydental.com",
  },
  "Affordable Dentist Near Me of Longview": {
    "hours": ["Mon–Fri: 9:00 AM – 6:00 PM", "Sat–Sun: Closed"],
    "hours_source": "https://affordabledentistnearme.com/locations/longview/", "hours_verified": "July 31, 2026",
  },
}
n = 0
for o in d:
    if o["name"] in UPD:
        u = dict(UPD[o["name"]])
        if "phone" in u and o.get("phone"):
            u.pop("phone")  # never overwrite an existing phone
        o.update(u)
        src = u.get("hours_source")
        if src and src not in o.get("source_urls", []):
            o["source_urls"].append(src)
        n += 1
json.dump(d, open(P, "w"), indent=1, ensure_ascii=False)
print(f"updated {n} records")
