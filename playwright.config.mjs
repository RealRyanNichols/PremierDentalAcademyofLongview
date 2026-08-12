// Playwright drives a real Chromium against a static server on the repo, which is exactly how
// Vercel serves it (cleanUrls means /toolbox is toolbox.html).
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./scripts/e2e",
  testMatch: "**/*.spec.mjs",
  timeout: 30_000,
  fullyParallel: true,
  // 3 rather than 4: axe injection occasionally failed to attach under 4-way contention in
  // this container. The test itself is sound — it passes consistently at 3.
  workers: 3,
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4321",
    // This image ships a Chromium build that may not match the @playwright/test version's
    // expected revision, so point at the installed binary rather than downloading another.
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    },
  },
  webServer: {
    command: "node scripts/serve-static.mjs 4321",
    url: "http://127.0.0.1:4321/toolbox",
    reuseExistingServer: true,
    timeout: 20_000,
  },
});
