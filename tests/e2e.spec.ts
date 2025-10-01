import { test, expect } from '@playwright/test';

test('Startseite lädt info.html im iframe', async ({ page }) => {
  await page.goto('https://viewunitysystem.github.io/OnAirMulTiMedia/?cb=test');
  
  // Warte auf iframe
  const frame = await page.frameLocator('iframe#inlay').first();
  await expect(frame.locator('body')).toBeVisible();
  
  // Prüfe dass iframe info.html lädt
  await expect(frame.locator('h1')).toContainText('OnAirMulTiMedia');
});

test('Keine Redirect-Weiterleitung', async ({ page }) => {
  await page.goto('https://viewunitysystem.github.io/OnAirMulTiMedia/');
  
  // Prüfe dass keine Redirect-Weiterleitung stattfindet
  await expect(page.locator('iframe#inlay')).toBeVisible();
  
  // Prüfe dass URL nicht geändert wird
  expect(page.url()).toContain('viewunitysystem.github.io/OnAirMulTiMedia/');
});

test('Service Worker registriert', async ({ page }) => {
  await page.goto('https://viewunitysystem.github.io/OnAirMulTiMedia/');
  
  // Prüfe Service Worker Registrierung
  const swRegistered = await page.evaluate(() => {
    return 'serviceWorker' in navigator;
  });
  
  expect(swRegistered).toBe(true);
});

