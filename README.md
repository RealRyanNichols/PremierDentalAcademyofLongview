# Premier Dental Academy of Longview

Website + student tools for Premier Dental Academy of Longview, an RDA
training program in East Texas.

## Layout

```
05_Live_Site/
  tools/                     student practice-management trainers
    practice-pro.html        Practice management trainer (PDA Practice Pro)
    eaglenest.html           Clinical workflow trainer (PDA EagleNest)
  assets/                    shared JS modules
  auth.js                    Supabase auth shim (window.PDA)
db/migrations/               SQL migrations (apply via Supabase dashboard)
```

## Stack

- Vanilla HTML + Tailwind CDN + plain JS — every tool ships as one
  deployable `.html` file.
- Supabase for persistence (project `lmbsuwslsycukynzpzik`).
- Vercel for hosting.
