// Neutralized after use. Was a one-time secret-gated student-creation batch.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
Deno.serve(() => new Response(JSON.stringify({ error: "gone", note: "one-time student creation completed and retired" }), { status: 410, headers: { "content-type": "application/json" } }));
