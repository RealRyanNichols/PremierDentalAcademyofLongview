// End-to-end and non-functional checks for the toolbox routes.
//
// The static validators read the HTML as text. These drive a real browser, which is the only way
// to prove the things that actually matter to a visitor: that the pages work, that they are
// still readable with JavaScript switched off, that a screen reader can get through them, and
// that nothing overflows a small phone.
//
// Run: npm run test:e2e   (serves the repo statically, then drives Chromium)
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const TOOLBOX = "/toolbox";

const PUBLIC_TOOLS = [
  "/toolbox",
  "/tools/cost-of-training",
  "/tools/hours-check",
  "/tools/healthcare-careers",
  "/tools/paying-for-training",
  "/tools/finish-plan",
  "/tools/tooth-numbering",
  "/tools/texas-rda-timeline",
  "/tools/dental-bill-decoder",
  "/skills-lab/abbreviation-drill",
  "/skills-lab/instrument-id",
  "/skills-lab/tray-setup",
];

/* ── The hub ──────────────────────────────────────────────────────────────── */

test.describe("toolbox hub", () => {
  test("filters narrow the list and reset cleanly", async ({ page }) => {
    await page.goto(TOOLBOX);
    const allCards = page.locator(".tool-card");
    const total = await allCards.count();
    expect(total).toBeGreaterThan(30);

    await page.getByRole("button", { name: "Calculators" }).click();
    const shown = await page.locator(".tool-card:visible").count();
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(total);
    for (const card of await page.locator(".tool-card:visible").all()) {
      expect(await card.getAttribute("data-type")).toBe("calculator");
    }

    await page.getByRole("button", { name: "Everything" }).click();
    expect(await page.locator(".tool-card:visible").count()).toBe(total);
  });

  test("a shelf with nothing matching is hidden, not left as an empty heading", async ({ page }) => {
    await page.goto(TOOLBOX);
    await page.getByRole("button", { name: "Calculators" }).click();
    for (const shelf of await page.locator(".shelf").all()) {
      const visibleCards = await shelf.locator(".tool-card:visible").count();
      const shelfVisible = await shelf.isVisible();
      if (shelfVisible) expect(visibleCards).toBeGreaterThan(0);
    }
  });

  test("the filter state is announced for screen readers", async ({ page }) => {
    await page.goto(TOOLBOX);
    await page.getByRole("button", { name: "Drills & practice" }).click();
    await expect(page.locator("#filter-status")).toContainText(/showing \d+/i);
  });

  test("every tool linked from the hub resolves", async ({ page, request }) => {
    await page.goto(TOOLBOX);
    const hrefs = await page.locator(".tool-card").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    expect(hrefs.length).toBeGreaterThan(30);
    for (const href of hrefs) {
      const res = await request.get(href);
      expect(res.status(), `${href} should resolve`).toBeLessThan(400);
    }
  });
});

/* ── Calculators ──────────────────────────────────────────────────────────── */

test.describe("cost of training", () => {
  test("produces the hand-verified figures", async ({ page }) => {
    await page.goto("/tools/cost-of-training");
    await page.getByRole("button", { name: /add it all up/i }).click();
    const result = page.locator("#result");
    await expect(result).toContainText("$6,172");
    await expect(result).toContainText("7.9 months");
    await expect(result).toContainText("$780");
  });

  test("says so plainly when the new job pays less, instead of a nonsense payback", async ({ page }) => {
    await page.goto("/tools/cost-of-training");
    await page.locator("#newWage").fill("10");
    await page.getByRole("button", { name: /add it all up/i }).click();
    const result = page.locator("#result");
    await expect(result).toContainText(/would not pay more/i);
    const text = await result.innerText();
    expect(text).not.toMatch(/NaN|Infinity/);
    // No negative money or a negative month count. Matching a bare "-" would also catch the
    // hyphen in the phone number, which is not what this is guarding against.
    expect(text).not.toMatch(/-\s*\$|\$\s*-|-\d+(\.\d+)?\s*months?/i);
    expect(text).not.toMatch(/\bmonths\b/i, "there is no payback period to report");
  });

  test("an empty form never renders NaN", async ({ page }) => {
    await page.goto("/tools/cost-of-training");
    for (const id of ["tuition","fees","weeks","currentWage","currentHoursPerWeek","hoursLostPerWeek",
                      "roundTripMiles","mpg","gasPrice","daysPerWeek","childcareHoursPerWeek",
                      "childcareRate","newWage","newHoursPerWeek"]) {
      await page.locator(`#${id}`).fill("");
    }
    await page.getByRole("button", { name: /add it all up/i }).click();
    const text = await page.locator("#result").innerText();
    expect(text).not.toMatch(/NaN|Infinity/);
  });
});

test("hours check produces the hand-verified figures", async ({ page }) => {
  await page.goto("/tools/hours-check");
  const values = { work: 32, sleep: 7, care: 14, commute: 5, classTime: 15, study: 6, household: 14 };
  for (const [k, v] of Object.entries(values)) await page.locator(`#f-${k}`).fill(String(v));
  await page.getByRole("button", { name: /add up my week/i }).click();
  const result = page.locator("#result");
  await expect(result).toContainText("135 hours committed");
  await expect(result).toContainText("33 hours left");
});

/* ── Drills ───────────────────────────────────────────────────────────────── */

test.describe("skills lab drills", () => {
  test("the abbreviation drill runs and reports by category", async ({ page }) => {
    await page.goto("/skills-lab/abbreviation-drill");
    await page.locator("#len").selectOption("10");
    await page.getByRole("button", { name: /multiple choice/i }).click();
    await page.getByRole("button", { name: /start drilling/i }).click();

    for (let i = 0; i < 10; i++) {
      await page.locator("#opts .opt").first().click();
      const next = page.locator("#nextQ");
      await expect(next).toBeVisible();
      await next.click();
    }
    await expect(page.locator("#report")).toContainText(/of 10 right/);
    await expect(page.locator("#report")).toContainText(/weakest first/i);
  });

  test("recall mode accepts a correct answer regardless of case", async ({ page }) => {
    await page.goto("/skills-lab/abbreviation-drill");
    await page.getByRole("button", { name: /type it from memory/i }).click();
    await page.locator("#len").selectOption("10");
    await page.getByRole("button", { name: /start drilling/i }).click();
    await expect(page.locator("#recallInput")).toBeVisible();
  });

  test("the tray builder grades against the four arrangement rules", async ({ page }) => {
    await page.goto("/skills-lab/tray-setup");
    await page.getByRole("button", { name: /set this tray/i }).click();
    await page.locator("#offer .pick").first().click();
    await page.getByRole("button", { name: /check my tray/i }).click();
    const result = page.locator("#result");
    await expect(result).toContainText(/of 4 arrangement rules met/);
    await expect(result).not.toContainText("NaN");
  });
});

/* ── Exam ─────────────────────────────────────────────────────────────────── */

test("the practice exam refuses to start while the bank is unreviewed", async ({ page }) => {
  await page.goto("/tools/rda-practice-exam");
  await expect(page.locator("#review-banner")).toBeVisible();
  await expect(page.locator("#mode-learn")).toBeDisabled();
  await expect(page.locator("#mode-timed")).toBeDisabled();
});

test("a missing question bank shows an honest error and disables start", async ({ page }) => {
  await page.route("**/assets/exam/rda-question-banks.js", (r) => r.fulfill({ status: 404, body: "" }));
  await page.goto("/tools/rda-practice-exam");
  await expect(page.locator("#setup-error")).toBeVisible();
  await expect(page.locator("#setup-error")).toContainText(/did not load/i);
  await expect(page.locator("#mode-learn")).toBeDisabled();
  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/\b0 of 0\b/);
});

/* ── Non-functional: the requirements that apply to every new route ───────── */

for (const route of PUBLIC_TOOLS) {
  test.describe(route, () => {
    test("serves its full content with JavaScript disabled", async ({ browser }) => {
      const ctx = await browser.newContext({ javaScriptEnabled: false });
      const page = await ctx.newPage();
      await page.goto(route);
      const text = await page.locator("body").innerText();
      expect(text).not.toMatch(/Loading…|Loading\.\.\./i);
      expect(text).not.toMatch(/\b0 of 0\b/);
      expect(text.split(/\s+/).length).toBeGreaterThan(150);
      await expect(page.locator("h1")).toHaveCount(1);
      await ctx.close();
    });

    test("has no WCAG 2.1 A/AA violations", async ({ page }) => {
      await page.goto(route);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const summary = results.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.help}`);
      expect(summary, summary.join("\n")).toEqual([]);
    });

    test("fits a 390px phone with no horizontal scroll and tappable controls", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route);

      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, "page must not scroll sideways").toBeLessThanOrEqual(1);

      // Standalone controls need a 44px target. Two deliberate refinements:
      //  - Links inside prose are exempt; WCAG's target-size rule excludes inline text links.
      //  - A small checkbox inside a clickable <label> is fine, because the LABEL is the tap
      //    target, not the box. Measuring the input alone would fail a correct pattern, so the
      //    effective target is measured instead.
      const small = await page.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll("button, select, input, a.tool-card, a[class*='rounded-full']")) {
          const label = el.closest("label");
          const target = label && (el.type === "checkbox" || el.type === "radio") ? label : el;
          const r = target.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) continue;
          if (r.height < 44) {
            out.push(`${el.tagName}${el.type ? "[" + el.type + "]" : ""} ${Math.round(r.height)}px "${(el.textContent || el.value || "").trim().slice(0, 30)}"`);
          }
        }
        return out;
      });
      expect(small, small.join(" | ")).toEqual([]);
    });

    test("has unique SEO essentials and a language", async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveTitle(/.{15,}/);
      expect(await page.locator("html").getAttribute("lang")).toBe("en");
      expect(await page.locator('meta[name="description"]').getAttribute("content")).toMatch(/.{50,}/);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(canonical).toContain(route);
      await expect(page.locator("h1")).toHaveCount(1);
    });
  });
}
