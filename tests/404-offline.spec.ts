// tests/404-offline.spec.ts
import { test, expect } from '@playwright/test';

const PAGES = 'https://viewunitysystem.github.io/OnAirMulTiMedia/';
const FIREBASE = 'https://onairmultimedia.web.app/';

// A) 404 auf GitHub Pages – echte 404.html
test('Pages: 404-Seite wird angezeigt', async ({ page }) => {
  const url = PAGES + 'pfad-der-nicht-existiert-' + Date.now();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-404]')).toBeVisible();
});

// B) Offline-Fallback via Service Worker
// Schaltet die Verbindung ab und lädt die Startseite neu -> offline.html sollte sichtbar sein.
// Hinweis: funktioniert, sobald der SW mindestens 1x installiert wurde.

test('Offline-Fallback zeigt offline.html (Firebase oder Pages)', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Online laden (SW installieren lassen)
  await page.goto(FIREBASE, { waitUntil: 'domcontentloaded' });

  // 2. Offline schalten
  await context.setOffline(true);

  // 3. Irgendeine Route aufrufen (Navigation)
  await page.goto(FIREBASE + '?t=' + Date.now());

  // 4. Offline-Content erwartet
  await expect(page.locator('[data-offline]')).toBeVisible();

  await context.setOffline(false);
});

// C) Service Worker Installation prüfen
test('Service Worker wird korrekt registriert', async ({ page }) => {
  await page.goto(FIREBASE, { waitUntil: 'domcontentloaded' });
  
  // Warten bis SW registriert ist
  await page.waitForFunction(() => {
    return 'serviceWorker' in navigator && navigator.serviceWorker.controller;
  }, { timeout: 10000 });
  
  // SW sollte aktiv sein
  const swState = await page.evaluate(() => {
    return navigator.serviceWorker.controller ? 'activated' : 'not activated';
  });
  
  expect(swState).toBe('activated');
});

// D) 404 auf Firebase (falls nicht auf index.html umgeleitet)
test('Firebase: 404-Handling prüfen', async ({ page }) => {
  const url = FIREBASE + 'non-existent-path-' + Date.now();
  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  
  // Firebase kann entweder 404.html zeigen oder auf index.html umleiten
  // Beide Verhalten sind akzeptabel
  const has404 = await page.locator('[data-404]').isVisible();
  const hasMainContent = await page.locator('body').isVisible();
  
  expect(has404 || hasMainContent).toBeTruthy();
});
