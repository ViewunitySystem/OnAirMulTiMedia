import { beforeEach, afterEach, vi } from 'vitest'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import path from 'path'

// Test setup for each test
beforeEach(() => {
  // Reset all mocks
  vi.clearAllMocks()
  vi.resetAllMocks()
  
  // Setup test environment
  process.env.NODE_ENV = 'test'
  process.env.TEST_TIMEOUT = '30000'
  
  // Create test fixtures if needed
  const testFixtures = [
    'tests/fixtures/test-config.json',
    'tests/fixtures/test-data.json',
    'tests/fixtures/test-audit.db',
    'tests/mocks/mock-responses.json'
  ]
  
  testFixtures.forEach(fixture => {
    if (!existsSync(fixture)) {
      const dir = path.dirname(fixture)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      
      // Create default test fixture content
      const content = fixture.includes('.json') 
        ? JSON.stringify({ test: true, timestamp: Date.now() })
        : 'test-content'
      
      writeFileSync(fixture, content)
    }
  })
})

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks()
  
  // Reset environment variables
  delete process.env.TEST_TIMEOUT
  delete process.env.TEST_DATA
})

