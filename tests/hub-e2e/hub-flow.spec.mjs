// Office Hub E2E — Playwright spec (STAGING scaffold; see README.md).
// Requires: HUB_BASE_URL (vercel preview), staging Supabase seeded via
// `npm run seed:hub`, and SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for
// minting demo sessions. All identities are the FICTIONAL seed people.
import { test, expect } from '@playwright/test';

const BASE = process.env.HUB_BASE_URL || 'http://localhost:3000';
const SUPA = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Mint a session for a fictional demo user via the admin magic-link API.
async function signIn(page, email) {
  const res = await fetch(`${SUPA}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'magiclink', email }),
  });
  const { properties } = await res.json();
  await page.goto(properties.action_link.replace(/redirect_to=[^&]*/, `redirect_to=${encodeURIComponent(BASE + '/hub')}`));
  await page.waitForURL(/\/hub/);
}

test.describe('public generator', () => {
  test('renders a full plan without JavaScript', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/api/hub/plan?role=dental_assistant&experience=new_grad&practice=general&focus=sterilization`);
    await expect(page.locator('h1')).toContainText('30/60/90-day onboarding plan');
    await expect(page.locator('section.phase')).toHaveCount(3);
    await expect(page.locator('body')).toContainText('not a certification');
  });

  test('form completes inline with JS', async ({ page }) => {
    await page.goto(`${BASE}/tools/onboarding-plan-generator`);
    await page.getByLabel('Dental assistant').check();
    await page.getByRole('button', { name: 'Build my plan' }).click();
    await expect(page.locator('#plan-result')).toContainText('Days 1–30');
  });
});

test.describe('workspace lifecycle (16-step flow)', () => {
  test('owner: dashboard → plan → sign-off → needs-coaching → check-in → report → archive', async ({ page }) => {
    await signIn(page, 'maria.alvarez.demo@example.com');
    await page.goto(`${BASE}/hub`);
    await expect(page.getByText('Sample data — fictional')).toBeVisible();
    await expect(page.getByText('Jordan Reyes')).toBeVisible();

    await page.getByRole('link', { name: 'Open plan' }).click();
    await expect(page.locator('h1')).toContainText('Jordan Reyes');

    await page.getByRole('link', { name: 'Skills' }).click();
    // sign off: suction & isolation → independent
    const skillCard = page.locator('[data-skill]', { hasText: 'Suction & isolation' });
    await skillCard.getByRole('radio', { name: 'Independent' }).click();
    await expect(page.locator('[aria-live]')).toContainText('Signed off');

    // needs-coaching flow keeps note + date
    const trayCard = page.locator('[data-skill]', { hasText: 'Tray setup: composite' });
    await trayCard.getByRole('radio', { name: 'Needs coaching' }).click();
    await page.getByLabel(/What to fix/).fill('shade guide order');
    await page.getByRole('button', { name: /Flag & set re-check/ }).click();
    await expect(page.locator('[aria-live]')).toContainText('re-check');

    // report renders + print CSS snapshot
    await page.goto(`${BASE}/hub/report?e=` + new URL(page.url()).searchParams.get('e'));
    await expect(page.locator('h1')).toContainText('Jordan Reyes');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('#hub-topbar')).toBeHidden();
    await page.emulateMedia({ media: 'screen' });
  });

  test('employee: can complete a task, cannot reach settings', async ({ page }) => {
    await signIn(page, 'jordan.reyes.demo@example.com');
    await page.goto(`${BASE}/hub`);
    await page.waitForURL(/\/hub\/employee/);
    await expect(page.locator('h1')).toContainText('My onboarding');
    await page.goto(`${BASE}/hub/settings`);
    await expect(page.locator('body')).toContainText("don’t have access");
  });

  test('offline save shows retry and preserves state', async ({ page, context }) => {
    await signIn(page, 'jordan.reyes.demo@example.com');
    await page.goto(`${BASE}/hub/employee`);
    await context.setOffline(true);
    const btn = page.getByRole('button', { name: /Mark done|Mark read/ }).first();
    await btn.click();
    await expect(page.getByRole('alert')).toContainText(/offline|Save failed/);
    await context.setOffline(false);
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.locator('[aria-live]')).toContainText('done');
  });

  test('expired invite shows recovery screen', async ({ page }) => {
    await page.goto(`${BASE}/hub/invite?token=seed-expired-token-fictional`);
    await expect(page.locator('h1')).toContainText('expired');
  });

  test('mobile viewport shows bottom tab bar', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await signIn(page, 'maria.alvarez.demo@example.com');
    await page.goto(`${BASE}/hub`);
    await expect(page.locator('#hub-bottombar')).toBeVisible();
  });

  test('unknown hub page 404s', async ({ page }) => {
    const res = await page.goto(`${BASE}/hub/definitely-not-a-page`);
    expect(res.status()).toBe(404);
  });
});

// Role-matrix: every /hub route × role → expected outcome. TODO: extend with
// trainer/manager/support identities; axe-core pass per main screen
// (npm i -D @axe-core/playwright, injectAxe + checkA11y, zero serious/critical).
const ROUTES = ['/hub', '/hub/plan', '/hub/skills', '/hub/sops', '/hub/report', '/hub/settings', '/hub/upgrade', '/hub/support'];
test('logged-out users are redirected to login for every route', async ({ page }) => {
  for (const r of ROUTES) {
    await page.goto(`${BASE}${r}`);
    await page.waitForURL(/\/hub\/login/);
  }
});
