// DISABLED. One-shot Career Vault content loader; completed and neutralized 2026-07-14.
// Safe to delete from the dashboard. No longer performs any writes.
Deno.serve(() => new Response(JSON.stringify({ disabled: true, note: 'vault content loader completed; neutralized' }), { status: 410, headers: { 'content-type': 'application/json' } }));
