// Returns HTTP 410 Gone.
//
// /blank was never a real page but it is in Google's index, and a soft 404 keeps it there:
// Google retries 404s for a long time on the assumption the page might come back. 410 says
// "this is permanently gone, drop it", which is what we actually mean and what gets it out of
// the index fastest. Wired up in vercel.json under "rewrites".
export default function handler(req, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.status(410).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>Page removed — Premier Dental Academy of Longview</title>
  <style>
    body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#0f172a;background:#f8fafc;
         display:grid;place-items:center;min-height:100vh;margin:0;padding:2rem;text-align:center}
    a{color:#0f766e;font-weight:600}
  </style>
</head>
<body>
  <main>
    <h1 style="font-size:1.5rem">This page has been removed.</h1>
    <p style="color:#475569;max-width:34rem">It isn't coming back, but everything else is still here.</p>
    <p><a href="/">Go to the homepage</a> &middot; <a href="/classes">See class dates</a> &middot; <a href="/toolbox">Open the toolbox</a></p>
    <p style="color:#475569">Or call us on <a href="tel:+19039136444">(903) 913-6444</a>.</p>
  </main>
</body>
</html>`);
}
