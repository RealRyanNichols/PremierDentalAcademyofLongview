# Premier Dental Academy of Longview: agent instructions

## Hosting and platforms (owner decision, Sept 26, 2026)

This applies to every project: Premier Dental Academy of Longview and The LeadFlow Pro.

- **DigitalOcean droplet:** everything runs on the LeadFlow DigitalOcean droplet (`leadflow-web`). A full switchover is in progress.
- **GitHub:** still used for source code, issues, and pull requests.
- **Vercel:** no longer used. Do not deploy to Vercel. Do not add Vercel projects, settings, integrations, or anything new that depends on Vercel.
- **Supabase:** no longer used. Do not add Supabase tables, auth, storage, functions, or anything new that depends on Supabase.
- **Code that still references Vercel or Supabase** (for example `vercel.json`) is legacy that is being moved to the droplet. Don't build on it. Don't remove it without the owner's go-ahead, because the switchover is being done on purpose, in order.
- **Changes on the droplet** stay approval-gated: services, Caddy sites, DNS, and anything production.
