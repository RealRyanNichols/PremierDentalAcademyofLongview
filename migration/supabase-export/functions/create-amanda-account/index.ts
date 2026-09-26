import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// RETIRED 2026-08-22 — security.
//
// The previous version of this function was publicly callable (verify_jwt=false)
// and guarded only by a hardcoded secret string in its own source. Anyone holding
// that string could create OR TAKE OVER any email address on this project with
// is_admin=true, reset that account's password, and receive the new password in
// the response body. That is a full admin account-takeover path.
//
// Its purpose (standing up the owner's admin account) was a one-time setup task
// that completed long ago. Account creation now goes through the normal signup
// and invite flow; password changes go through Supabase Auth password reset;
// admin rights are granted by setting profiles.is_admin, which the sync_admin_claim
// trigger mirrors into the auth claim.
//
// Left in place as a tombstone rather than silently vanishing, so anyone who finds
// a reference to it understands what happened.

Deno.serve(() =>
  new Response(
    JSON.stringify({
      error: "gone",
      message: "create-amanda-account was retired on 2026-08-22 for security reasons and no longer does anything.",
      use_instead: "Supabase Auth password reset, or set profiles.is_admin for admin rights.",
    }),
    { status: 410, headers: { "content-type": "application/json" } },
  )
);
