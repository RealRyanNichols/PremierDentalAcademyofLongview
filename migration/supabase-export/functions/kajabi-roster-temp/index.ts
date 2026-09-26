import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// RETIRED 2026-08-22.
//
// One-time vehicle for the Kajabi -> site student migration (July 2026). It proxied the
// Kajabi API using the stored client credentials and classified the contact roster by
// which paid offers each contact owned. It was publicly callable (verify_jwt=false) and
// gated only by a shared secret string, which meant that secret was the only thing
// standing between the open internet and the full customer roster.
//
// The migration completed and was verified. The project notes flagged this function for
// deletion once that was confirmed.

Deno.serve(() =>
  new Response(
    JSON.stringify({
      error: "gone",
      message: "kajabi-roster-temp was a one-time July 2026 migration tool and was retired on 2026-08-22.",
    }),
    { status: 410, headers: { "content-type": "application/json" } },
  )
);
