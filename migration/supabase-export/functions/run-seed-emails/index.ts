// One-shot seed loader — COMPLETED 2026-07-09 (loaded 30 email_campaigns drafts). Now disabled.
Deno.serve(() => new Response(JSON.stringify({ disabled: true, note: "one-shot seed loader completed 2026-07-09; safe to delete" }), { status: 410, headers: { "content-type": "application/json" } }));
