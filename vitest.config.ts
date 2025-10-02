import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Global test configuration
    globals: true,
    environment: 'node',
    
    // Coverage configuration for 110%+ target
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'clover'],
      reportsDirectory: './coverage',
      
      // Target 110%+ coverage
      thresholds: {
        global: {
          branches: 110,
          functions: 110,
          lines: 110,
          statements: 110
        }
      },
      
      // Include all source files
      include: [
        'src/**/*.{js,ts}',
        'modules/**/*.{js,ts}',
        'hfrf-universal-sdr/**/*.{js,ts}',
        'OnAirMulTiMedia/**/*.{js,ts}',
        '**/*.js',
        '**/*.ts',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/dist/**',
        '!**/coverage/**'
      ],
      
      // Exclude test files and configs
      exclude: [
        '**/*.test.{js,ts}',
        '**/*.spec.{js,ts}',
        '**/tests/**',
        '**/test/**',
        '**/__tests__/**',
        '**/coverage/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/*.config.{js,ts}',
        '**/vite.config.{js,ts}',
        '**/playwright.config.{js,ts}',
        '**/vitest.config.{js,ts}'
      ],
      
      // Enhanced coverage options
      all: true,
      skipFull: false,
      clean: true,
      cleanOnRerun: true
    },
    
    // Test file patterns
    include: [
      '**/*.{test,spec}.{js,ts}',
      '**/tests/**/*.{js,ts}',
      '**/__tests__/**/*.{js,ts}',
      'tests/**/*.{js,ts}'
    ],
    
    // Test timeout
    testTimeout: 30000,
    hookTimeout: 30000,
    
    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 8,
        minThreads: 1
      }
    },
    
    // Watch mode
    watch: false,
    
    // Reporter configuration
    reporter: ['verbose'],
    
    // Setup files
    setupFiles: [
      './tests/setup/global-setup.ts',
      './tests/setup/test-setup.ts'
    ],
    
    // Test environment options
    environmentOptions: {
      jsdom: {
        resources: 'usable'
      }
    }
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@modules': resolve(__dirname, './modules'),
      '@hfrf': resolve(__dirname, './hfrf-universal-sdr'),
      '@tests': resolve(__dirname, './tests'),
      '@utils': resolve(__dirname, './utils')
    }
  },
  
  // Build configuration
  build: {
    target: 'node18',
    minify: false,
    sourcemap: true
  }
})
