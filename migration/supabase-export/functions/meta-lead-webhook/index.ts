import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// RETIRED 2026-08-22 — consolidated into `meta-leadgen`.
//
// This function was a second, parallel implementation of the Facebook Lead Ads bridge.
// It had the BETTER security model (it verified X-Hub-Signature-256 and failed closed),
// but it was never switched on: it looks for secrets named META_APP_SECRET, META_PAGE_TOKEN
// and KAJABI_FB_FORM_URL, and none of those exist on this project. The real page token is
// stored as FB_PAGE_TOKEN, so even with an app secret this function could not have fetched
// a lead. Meanwhile `meta-leadgen` — the one Meta actually points at — carried the live
// traffic with no signature check at all.
//
// Two endpoints doing the same job, with different secret names and different security
// postures, is how the gap survived. So: the signature verification from this file was
// ported INTO `meta-leadgen` (v4, 2026-08-22), and this one is retired. One lead path now.
//
// If you ever need the reference implementation, it is in this function's version history
// (v2) and, in its ported form, in the current source of `meta-leadgen`.

Deno.serve(() =>
  new Response(
    JSON.stringify({
      error: "gone",
      message: "meta-lead-webhook was retired on 2026-08-22. Its signature verification was ported into meta-leadgen, which is the single live Facebook Lead Ads endpoint.",
      use_instead: "meta-leadgen",
    }),
    { status: 410, headers: { "content-type": "application/json" } },
  )
);
