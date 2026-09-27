// Neutralized after use. Was a one-time secret-gated welcome/login batch sender.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
Deno.serve(() => new Response(JSON.stringify({ error: "gone", note: "one-time welcome batch completed and retired" }), { status: 410, headers: { "content-type": "application/json" } }));
