import { test, expect } from '@playwright/test'

test.describe('OnAirMulTiMedia E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main page
    await page.goto('/')
  })

  test('should load the main page', async ({ page }) => {
    // Check if the page loads successfully
    await expect(page).toHaveTitle(/OnAirMulTiMedia/)
    
    // Check if the iframe is present
    const iframe = page.locator('#inlay')
    await expect(iframe).toBeVisible()
    
    // Check if the iframe has the correct source
    await expect(iframe).toHaveAttribute('src', './info.html')
  })

  test('should load info.html in iframe', async ({ page }) => {
    // Wait for iframe to load
    await page.waitForLoadState('networkidle')
    
    // Check if iframe content is loaded
    const iframe = page.frameLocator('#inlay')
    await expect(iframe.locator('body')).toBeVisible()
  })

  test('should have proper security headers', async ({ page }) => {
    // Check for CSP header
    const response = await page.goto('/')
    const csp = response?.headers()['content-security-policy']
    expect(csp).toBeTruthy()
    
    // Check for other security headers
    const xFrameOptions = response?.headers()['x-frame-options']
    const xContentTypeOptions = response?.headers()['x-content-type-options']
    
    expect(xFrameOptions).toBeTruthy()
    expect(xContentTypeOptions).toBeTruthy()
  })

  test('should work offline with service worker', async ({ page, context }) => {
    // Wait for service worker to register
    await page.waitForLoadState('networkidle')
    
    // Simulate offline mode
    await context.setOffline(true)
    
    // Try to reload the page
    await page.reload()
    
    // Page should still be accessible (cached by SW)
    await expect(page.locator('#inlay')).toBeVisible()
  })

  test('should handle navigation errors gracefully', async ({ page }) => {
    // Navigate to a non-existent page
    await page.goto('/nonexistent')
    
    // Should redirect to index.html
    await expect(page).toHaveURL(/\/$/)
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check if iframe is still visible
    const iframe = page.locator('#inlay')
    await expect(iframe).toBeVisible()
    
    // Check if iframe takes full width
    const iframeBox = await iframe.boundingBox()
    expect(iframeBox?.width).toBeGreaterThan(300)
  })

  test('should load all required resources', async ({ page }) => {
    const requests: string[] = []
    
    // Track all network requests
    page.on('request', request => {
      requests.push(request.url())
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check if main resources are loaded
    expect(requests.some(url => url.includes('info.html'))).toBeTruthy()
    expect(requests.some(url => url.includes('sw.js'))).toBeTruthy()
  })

  test('should have proper accessibility', async ({ page }) => {
    // Check for proper HTML structure
    const html = page.locator('html')
    await expect(html).toHaveAttribute('lang', 'en')
    
    // Check if iframe has proper attributes
    const iframe = page.locator('#inlay')
    await expect(iframe).toHaveAttribute('loading', 'lazy')
    await expect(iframe).toHaveAttribute('referrerpolicy', 'no-referrer')
  })

  test('should handle iframe errors', async ({ page }) => {
    // Mock iframe error
    await page.addInitScript(() => {
      const iframe = document.getElementById('inlay')
      if (iframe) {
        iframe.addEventListener('error', () => {
          document.body.innerHTML = '<div>Loading Error</div>'
        })
      }
    })
    
    // Simulate iframe error
    await page.evaluate(() => {
      const iframe = document.getElementById('inlay')
      if (iframe) {
        iframe.dispatchEvent(new Event('error'))
      }
    })
    
    // Check if error is handled
    await expect(page.locator('text=Loading Error')).toBeVisible()
  })
})
