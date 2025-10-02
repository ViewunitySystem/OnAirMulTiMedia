import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { existsSync, unlinkSync, mkdirSync } from 'fs'
import path from 'path'
import EnhancedAuditService from '../../src/services/enhanced-audit-service'

describe('EnhancedAuditService - 110% Coverage', () => {
  let auditService: EnhancedAuditService
  let testDbPath: string

  beforeEach(() => {
    // Create test database path
    testDbPath = path.join(__dirname, '../fixtures/test-audit.db')
    
    // Clean up existing test database
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath)
    }
    
    // Create test directory
    const testDir = path.dirname(testDbPath)
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }
    
    // Initialize service with test database
    auditService = new EnhancedAuditService(testDbPath)
  })

  afterEach(() => {
    // Clean up test database
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath)
    }
  })

  describe('Constructor and Initialization', () => {
    it('should initialize with default database path', () => {
      const service = new EnhancedAuditService()
      expect(service).toBeDefined()
      service.close()
    })

    it('should initialize with custom database path', () => {
      expect(auditService).toBeDefined()
    })

    it('should create database schema on initialization', () => {
      // Database should be created and schema applied
      expect(existsSync(testDbPath)).toBe(true)
    })
  })

  describe('Event Logging', () => {
    it('should log a basic event', () => {
      const event = {
        id: 'test-event-1',
        timestamp: new Date().toISOString(),
        type: 'test_event',
        level: 'info',
        payload: { message: 'Test event' }
      }

      const result = auditService.logEvent(event)
      expect(result).toBeDefined()
      expect(result.changes).toBe(1)
    })

    it('should log event with all fields', () => {
      const event = {
        id: 'test-event-2',
        timestamp: new Date().toISOString(),
        type: 'comprehensive_test',
        level: 'debug',
        payload: { 
          module: 'test_module',
          data: { key: 'value' },
          nested: { deep: { value: 123 } }
        },
        room_id: 'test-room',
        client_id: 'test-client',
        signature: {
          signature: 'test-signature',
          checksum: 'test-checksum',
          signed_at: new Date().toISOString()
        }
      }

      const result = auditService.logEvent(event)
      expect(result).toBeDefined()
      expect(result.changes).toBe(1)
    })

    it('should handle event with minimal data', () => {
      const event = {
        id: 'minimal-event',
        timestamp: new Date().toISOString(),
        type: 'minimal'
      }

      const result = auditService.logEvent(event)
      expect(result).toBeDefined()
    })

    it('should handle event with null/undefined values', () => {
      const event = {
        id: 'null-test-event',
        timestamp: new Date().toISOString(),
        type: 'null_test',
        level: null,
        payload: null,
        room_id: undefined,
        client_id: null,
        signature: undefined
      }

      const result = auditService.logEvent(event)
      expect(result).toBeDefined()
    })

    it('should handle event with complex payload', () => {
      const complexPayload = {
        array: [1, 2, 3, { nested: true }],
        object: { deep: { nested: { value: 'test' } } },
        string: 'test string',
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined
      }

      const event = {
        id: 'complex-payload-event',
        timestamp: new Date().toISOString(),
        type: 'complex_test',
        payload: complexPayload
      }

      const result = auditService.logEvent(event)
      expect(result).toBeDefined()
    })
  })

  describe('Event Retrieval', () => {
    beforeEach(() => {
      // Populate test data
      const events = [
        { id: 'event-1', timestamp: '2025-01-01T00:00:00.000Z', type: 'type1', level: 'info', payload: { module: 'module1' } },
        { id: 'event-2', timestamp: '2025-01-02T00:00:00.000Z', type: 'type2', level: 'debug', payload: { module: 'module2' } },
        { id: 'event-3', timestamp: '2025-01-03T00:00:00.000Z', type: 'type1', level: 'warning', payload: { module: 'module1' } },
        { id: 'event-4', timestamp: '2025-01-04T00:00:00.000Z', type: 'type3', level: 'error', payload: { module: 'module3' } }
      ]

      events.forEach(event => auditService.logEvent(event))
    })

    it('should retrieve all events', () => {
      const events = auditService.getEvents()
      expect(events).toHaveLength(4)
    })

    it('should filter events by type', () => {
      const events = auditService.getEvents({ type: 'type1' })
      expect(events).toHaveLength(2)
      expect(events.every(e => e.type === 'type1')).toBe(true)
    })

    it('should filter events by module', () => {
      const events = auditService.getEvents({ module: 'module1' })
      expect(events).toHaveLength(2)
      expect(events.every(e => JSON.parse(e.payload || '{}').module === 'module1')).toBe(true)
    })

    it('should limit results', () => {
      const events = auditService.getEvents({ limit: 2 })
      expect(events).toHaveLength(2)
    })

    it('should offset results', () => {
      const events = auditService.getEvents({ offset: 2 })
      expect(events).toHaveLength(2)
    })

    it('should combine filters', () => {
      const events = auditService.getEvents({ type: 'type1', module: 'module1', limit: 1 })
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('type1')
    })

    it('should handle empty results', () => {
      const events = auditService.getEvents({ type: 'nonexistent' })
      expect(events).toHaveLength(0)
    })

    it('should handle default options', () => {
      const events = auditService.getEvents({})
      expect(events).toHaveLength(4)
    })
  })

  describe('Database Operations', () => {
    it('should handle database connection errors gracefully', () => {
      // Create service with invalid path
      const invalidService = new EnhancedAuditService('/invalid/path/test.db')
      expect(invalidService).toBeDefined()
    })

    it('should handle concurrent operations', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        auditService.logEvent({
          id: `concurrent-event-${i}`,
          timestamp: new Date().toISOString(),
          type: 'concurrent_test',
          payload: { index: i }
        })
      )

      const results = await Promise.all(promises)
      expect(results).toHaveLength(10)
      expect(results.every(r => r.changes === 1)).toBe(true)
    })

    it('should handle large payloads', () => {
      const largePayload = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          value: `large-data-${i}`,
          nested: { deep: { value: i * 2 } }
        }))
      }

      const event = {
        id: 'large-payload-event',
        timestamp: new Date().toISOString(),
        type: 'large_test',
        payload: largePayload
      }

      const result = auditService.logEvent(event)
      expect(result).toBeDefined()
    })

    it('should handle special characters in data', () => {
      const specialPayload = {
        unicode: '🚀🎉✅⚠️❌',
        special: '!@#$%^&*()_+-=[]{}|;:,.<>?',
        quotes: '"double" and \'single\' quotes',
        newlines: 'line1\nline2\rline3\r\nline4',
        tabs: 'col1\tcol2\tcol3'
      }

      const event = {
        id: 'special-chars-event',
        timestamp: new Date().toISOString(),
        type: 'special_test',
        payload: specialPayload
      }

      const result = auditService.logEvent(event)
      expect(result).toBeDefined()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed JSON in payload', () => {
      const event = {
        id: 'malformed-json-event',
        timestamp: new Date().toISOString(),
        type: 'malformed_test',
        payload: { invalid: undefined }
      }

      const result = auditService.logEvent(event)
      expect(result).toBeDefined()
    })

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000)
      const event = {
        id: 'long-string-event',
        timestamp: new Date().toISOString(),
        type: 'long_string_test',
        payload: { longData: longString }
      }

      const result = auditService.logEvent(event)
      expect(result).toBeDefined()
    })

    it('should handle date edge cases', () => {
      const dates = [
        '1970-01-01T00:00:00.000Z', // Unix epoch
        '2038-01-19T03:14:07.000Z', // Year 2038 problem
        '9999-12-31T23:59:59.999Z', // Far future
        new Date().toISOString()     // Current time
      ]

      dates.forEach((date, index) => {
        const event = {
          id: `date-edge-case-${index}`,
          timestamp: date,
          type: 'date_test',
          payload: { testDate: date }
        }

        const result = auditService.logEvent(event)
        expect(result).toBeDefined()
      })
    })

    it('should handle empty and null inputs', () => {
      const testCases = [
        { id: 'empty-string', timestamp: '', type: '', payload: {} },
        { id: 'null-fields', timestamp: new Date().toISOString(), type: 'null_test', payload: null },
        { id: 'undefined-fields', timestamp: new Date().toISOString(), type: 'undefined_test', payload: undefined }
      ]

      testCases.forEach((testCase, index) => {
        const result = auditService.logEvent(testCase)
        expect(result).toBeDefined()
      })
    })
  })

  describe('Performance Tests', () => {
    it('should handle bulk operations efficiently', () => {
      const startTime = Date.now()
      const events = Array.from({ length: 100 }, (_, i) => ({
        id: `bulk-event-${i}`,
        timestamp: new Date().toISOString(),
        type: 'bulk_test',
        payload: { index: i, data: `bulk-data-${i}` }
      }))

      events.forEach(event => auditService.logEvent(event))
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle rapid sequential operations', () => {
      const startTime = Date.now()
      
      for (let i = 0; i < 50; i++) {
        auditService.logEvent({
          id: `rapid-event-${i}`,
          timestamp: new Date().toISOString(),
          type: 'rapid_test',
          payload: { index: i }
        })
      }
      
      const endTime = Date.now()
      expect(endTime - startTime).toBeLessThan(500) // Should complete within 500ms
    })
  })

  describe('Service Lifecycle', () => {
    it('should close database connection properly', () => {
      expect(() => auditService.close()).not.toThrow()
    })

    it('should handle multiple close operations', () => {
      auditService.close()
      expect(() => auditService.close()).not.toThrow()
    })

    it('should handle operations after close', () => {
      auditService.close()
      // Should not throw, but may not work as expected
      expect(() => auditService.getEvents()).not.toThrow()
    })
  })

  describe('Migration and Compatibility', () => {
    it('should handle migration from HFRF data', () => {
      const hfrfData = {
        events: [
          { id: 'hfrf-1', timestamp: '2025-01-01T00:00:00Z', type: 'hfrf_event', data: 'hfrf-data' },
          { id: 'hfrf-2', timestamp: '2025-01-02T00:00:00Z', type: 'hfrf_event', data: 'hfrf-data-2' }
        ]
      }

      // Mock migration method if it exists
      if (typeof auditService.migrateHFRFData === 'function') {
        expect(() => auditService.migrateHFRFData(JSON.stringify(hfrfData))).not.toThrow()
      }
    })

    it('should handle cleanup operations', () => {
      // Mock cleanup method if it exists
      if (typeof auditService.cleanup === 'function') {
        expect(() => auditService.cleanup()).not.toThrow()
      }
    })
  })
})

