import { test, expect } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:8080/modules/rf/loopback-node/ui/';

test('Security Status loads & shows cards', async ({ page }) => {
  await page.goto(BASE + 'security-status.html', { waitUntil:'domcontentloaded' });
  await expect(page.locator('#checksum')).toBeVisible();
  await expect(page.locator('#mic')).toBeVisible();
  await expect(page.locator('#rate')).toBeVisible();
});
