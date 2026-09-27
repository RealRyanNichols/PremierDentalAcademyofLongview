import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// RETIRED 2026-08-22.
//
// One-time vehicle for the Kajabi -> site student migration (July 2026). It imported
// students as auth users, created their profiles, and emailed set-password invites.
// It was publicly callable (verify_jwt=false), gated only by a shared secret string,
// and ran with the service role — so it could mint accounts on demand.
//
// The migration completed and was verified: 31 paying students imported and active.
// The project notes flagged this function for deletion once that was confirmed.
// Permanent student imports go through `import-students` (v3+), which requires a JWT.

Deno.serve(() =>
  new Response(
    JSON.stringify({
      error: "gone",
      message: "migrate-students-temp was a one-time July 2026 migration tool and was retired on 2026-08-22.",
      use_instead: "import-students",
    }),
    { status: 410, headers: { "content-type": "application/json" } },
  )
);
