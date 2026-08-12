// Minimal static server that mirrors Vercel's cleanUrls behaviour, so the browser tests hit the
// same URLs a visitor would (/toolbox rather than /toolbox.html).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, extname } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const port = parseInt(process.argv[2] || "4321", 10);

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".ics": "text/calendar",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json", ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml" };

const exists = async (p) => { try { return (await stat(p)).isFile(); } catch { return false; } };

createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0].split("#")[0]);
  const rel = url.replace(/^\/+/, "") || "index.html";
  for (const candidate of [join(root, rel), join(root, rel + ".html"), join(root, rel, "index.html")]) {
    if (!candidate.startsWith(root)) continue;
    if (await exists(candidate)) {
      res.writeHead(200, { "Content-Type": TYPES[extname(candidate)] || "application/octet-stream" });
      res.end(await readFile(candidate));
      return;
    }
  }
  res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
  res.end("<h1>404</h1>");
}).listen(port, "127.0.0.1", () => console.log("static server on " + port));
