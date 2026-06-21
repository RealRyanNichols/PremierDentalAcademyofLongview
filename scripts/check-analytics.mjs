// Smoke test for assets/pda-analytics.js: it must define window.PDA.track and run
// without throwing in a minimal stubbed browser environment (no provider = no-op).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "assets/pda-analytics.js"), "utf8");

// Minimal DOM/window stubs.
const store = {};
globalThis.window = {};
globalThis.document = {
  readyState: "complete",
  referrer: "",
  addEventListener: () => {}
};
globalThis.location = { search: "?utm_source=test&utm_medium=cpc", pathname: "/" };
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); }
};
// URLSearchParams is global in Node already.

let ok = true;
try {
  (0, eval)(src);
  const PDA = globalThis.window.PDA;
  if (!PDA || typeof PDA.track !== "function") { console.error("✗ window.PDA.track missing"); ok = false; }
  if (typeof PDA.attribution !== "function") { console.error("✗ window.PDA.attribution missing"); ok = false; }
  // Must not throw with no provider configured.
  PDA.track("test_event", { a: 1 });
  PDA.track();                       // tolerate missing name
  const attr = PDA.attribution();
  if (!attr || attr.utm_source !== "test") { console.error("✗ UTM capture failed"); ok = false; }
} catch (e) {
  console.error("✗ pda-analytics.js threw: " + e.message);
  ok = false;
}

if (!ok) process.exit(1);
console.log("✓ pda-analytics.js: API present, UTM captured, no-op safe (no throw)");
