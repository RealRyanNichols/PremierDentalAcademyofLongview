// test-html — RETIRED 2026-08-22.
// This was demo scaffolding: a hello-world page that rendered styled HTML so someone could
// eyeball whether the content-type header was being applied. It had no authentication of any
// kind and was publicly reachable on the internet. It served no production purpose, so the
// body has been replaced with a 410 tombstone and verify_jwt has been turned on.
// Safe to delete outright once logs show nothing is calling it.

Deno.serve(() => {
  return new Response(JSON.stringify({
    error: 'gone',
    message: 'test-html was demo scaffolding (a content-type test page) and was retired on 2026-08-22. This endpoint is permanently gone and has no replacement.'
  }), {
    status: 410,
    headers: new Headers({ 'Content-Type': 'application/json; charset=utf-8' })
  });
});
