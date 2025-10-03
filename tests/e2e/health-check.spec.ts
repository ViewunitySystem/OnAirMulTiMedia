import { test, expect } from '@playwright/test'

// Health Check URLs für alle Deployment-Targets
const DEPLOYMENT_URLS = [
  {
    name: 'GitHub Pages',
    url: 'https://viewunitysystem.github.io/OnAirMulTiMedia/',
    expected: 200
  },
  {
    name: 'Firebase Production (tel1nl)',
    url: 'https://tel1nl.web.app/',
    expected: 200
  },
  {
    name: 'Firebase Backup (back-ee052)',
    url: 'https://back-ee052.web.app/',
    expected: 200
  }
]

// Test für alle Deployment-URLs
test.describe('Deployment Health Checks', () => {
  for (const target of DEPLOYMENT_URLS) {
    test(`${target.name} - HTTP Status Check`, async ({ page }) => {
      // Navigiere zur URL
      const response = await page.goto(target.url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })
      
      // Überprüfe HTTP Status
      expect(response?.status()).toBe(target.expected)
      
      // Überprüfe dass die Seite geladen wurde
      await expect(page).toHaveTitle(/OAMTM|OnAirMulTiMedia/)
      
      console.log(`✅ ${target.name}: ${target.url} - Status: ${response?.status()}`)
    })

    test(`${target.name} - Content Security Policy Check`, async ({ page }) => {
      const consoleMessages: string[] = []
      
      // Console-Messages sammeln
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleMessages.push(msg.text())
        }
      })
      
      // Navigiere zur URL
      await page.goto(target.url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })
      
      // Warte kurz für alle Console-Messages
      await page.waitForTimeout(2000)
      
      // Überprüfe auf CSP-Fehler
      const cspErrors = consoleMessages.filter(msg => 
        msg.includes('Content Security Policy') || 
        msg.includes('CSP') ||
        msg.includes('blocked')
      )
      
      expect(cspErrors).toHaveLength(0)
      
      if (cspErrors.length > 0) {
        console.warn(`⚠️ CSP Errors on ${target.name}:`, cspErrors)
      } else {
        console.log(`✅ ${target.name}: No CSP errors detected`)
      }
    })

    test(`${target.name} - Service Worker Check`, async ({ page }) => {
      // Navigiere zur URL
      await page.goto(target.url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })
      
      // Überprüfe Service Worker
      const swRegistered = await page.evaluate(() => {
        return 'serviceWorker' in navigator
      })
      
      expect(swRegistered).toBe(true)
      
      // Überprüfe ob Service Worker aktiv ist
      const swActive = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration()
          return registration !== undefined
        }
        return false
      })
      
      console.log(`✅ ${target.name}: Service Worker registered: ${swActive}`)
    })

    test(`${target.name} - Offline Fallback Check`, async ({ page, context }) => {
      // Navigiere zur URL
      await page.goto(target.url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })
      
      // Simuliere Offline-Modus
      await context.setOffline(true)
      
      // Versuche Seite zu aktualisieren
      await page.reload({ waitUntil: 'domcontentloaded' })
      
      // Überprüfe ob Offline-Fallback funktioniert
      const offlineContent = await page.textContent('body')
      expect(offlineContent).toBeTruthy()
      
      // Wieder online
      await context.setOffline(false)
      
      console.log(`✅ ${target.name}: Offline fallback working`)
    })

    test(`${target.name} - Performance Check`, async ({ page }) => {
      // Navigiere zur URL
      const startTime = Date.now()
      
      await page.goto(target.url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })
      
      const loadTime = Date.now() - startTime
      
      // Überprüfe Ladezeit (sollte unter 5 Sekunden sein)
      expect(loadTime).toBeLessThan(5000)
      
      // Überprüfe Core Web Vitals
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        return {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        }
      })
      
      console.log(`✅ ${target.name}: Load time: ${loadTime}ms`)
      console.log(`📊 Performance metrics:`, performanceMetrics)
      
      // Überprüfe dass First Contentful Paint unter 2 Sekunden ist
      if (performanceMetrics.firstContentfulPaint > 0) {
        expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2000)
      }
    })

    test(`${target.name} - Mobile Responsiveness Check`, async ({ page }) => {
      // Setze Mobile Viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Navigiere zur URL
      await page.goto(target.url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })
      
      // Überprüfe dass die Seite responsive ist
      const bodyWidth = await page.evaluate(() => {
        return document.body.scrollWidth
      })
      
      expect(bodyWidth).toBeLessThanOrEqual(375)
      
      // Überprüfe dass keine horizontalen Scrollbars existieren
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth
      })
      
      expect(hasHorizontalScroll).toBe(false)
      
      console.log(`✅ ${target.name}: Mobile responsive (width: ${bodyWidth}px)`)
    })
  }
})

// Cross-Origin Tests
test.describe('Cross-Origin Health Checks', () => {
  test('All deployments should return same content', async ({ page }) => {
    const contents: { [key: string]: string } = {}
    
    for (const target of DEPLOYMENT_URLS) {
      await page.goto(target.url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })
      
      // Extrahiere Hauptinhalt (ohne dynamische Elemente)
      const content = await page.textContent('body')
      contents[target.name] = content || ''
      
      console.log(`📄 ${target.name}: Content length: ${content?.length || 0} chars`)
    }
    
    // Überprüfe dass alle Deployment-Targets ähnlichen Inhalt haben
    const contentLengths = Object.values(contents).map(c => c.length)
    const minLength = Math.min(...contentLengths)
    const maxLength = Math.max(...contentLengths)
    
    // Unterschied sollte nicht mehr als 10% sein
    const difference = (maxLength - minLength) / minLength
    expect(difference).toBeLessThan(0.1)
    
    console.log(`✅ Content consistency: ${(difference * 100).toFixed(2)}% difference`)
  })
})

// Security Tests
test.describe('Security Health Checks', () => {
  for (const target of DEPLOYMENT_URLS) {
    test(`${target.name} - HTTPS Check`, async ({ page }) => {
      // Navigiere zur URL
      await page.goto(target.url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })
      
      // Überprüfe dass HTTPS verwendet wird
      expect(page.url()).toMatch(/^https:/)
      
      // Überprüfe Security Headers
      const response = await page.goto(target.url)
      const headers = response?.headers() || {}
      
      // Überprüfe wichtige Security Headers
      expect(headers['strict-transport-security']).toBeTruthy()
      expect(headers['x-content-type-options']).toBeTruthy()
      expect(headers['x-frame-options']).toBeTruthy()
      
      console.log(`✅ ${target.name}: HTTPS and security headers OK`)
    })

    test(`${target.name} - No Mixed Content`, async ({ page }) => {
      const mixedContentErrors: string[] = []
      
      // Console-Messages für Mixed Content sammeln
      page.on('console', msg => {
        if (msg.type() === 'error' && msg.text().includes('Mixed Content')) {
          mixedContentErrors.push(msg.text())
        }
      })
      
      // Navigiere zur URL
      await page.goto(target.url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })
      
      // Warte kurz für alle Console-Messages
      await page.waitForTimeout(2000)
      
      expect(mixedContentErrors).toHaveLength(0)
      
      if (mixedContentErrors.length > 0) {
        console.warn(`⚠️ Mixed Content on ${target.name}:`, mixedContentErrors)
      } else {
        console.log(`✅ ${target.name}: No mixed content detected`)
      }
    })
  }
})

