// Test setup file for Vitest
import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'

// Mock node:fs/promises properly
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    appendFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue('{}'),
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
    stat: vi.fn().mockResolvedValue({ isFile: () => true, isDirectory: () => false }),
    readdir: vi.fn().mockResolvedValue([])
  }
})

// Global test setup
beforeAll(() => {
  console.log('🧪 Setting up test environment...')
  
  // Mock global objects if needed
  global.fetch = global.fetch || (() => Promise.resolve(new Response()))
  
  // Set up test environment variables
  process.env.NODE_ENV = 'test'
  process.env.VITE_APP_ENV = 'test'
})

afterAll(() => {
  console.log('🧹 Cleaning up test environment...')
})

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks()
})

afterEach(() => {
  // Cleanup after each test
})

// Mock Service Worker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: () => Promise.resolve(),
    ready: Promise.resolve(),
    controller: null
  },
  writable: true
})

// Mock localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true
})

// Mock console methods for cleaner test output
const originalConsole = { ...console }
beforeAll(() => {
  console.log = () => {}
  console.warn = () => {}
  console.error = () => {}
})

afterAll(() => {
  console.log = originalConsole.log
  console.warn = originalConsole.warn
  console.error = originalConsole.error
})
