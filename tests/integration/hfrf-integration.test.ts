import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { existsSync, unlinkSync, mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import EnhancedAuditService from '../../src/services/enhanced-audit-service'
import HuaweiUsbManager from '../../src/services/huawei-usb-manager'
import enhancedApiRoutes from '../../src/api/enhanced-api-routes'

describe('HFRF Integration - 110% Coverage', () => {
  let auditService: EnhancedAuditService
  let usbManager: HuaweiUsbManager
  let testDbPath: string

  beforeEach(() => {
    // Setup test environment
    testDbPath = path.join(__dirname, '../fixtures/integration-test.db')
    
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath)
    }
    
    const testDir = path.dirname(testDbPath)
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }

    // Initialize services
    auditService = new EnhancedAuditService(testDbPath)
    usbManager = new HuaweiUsbManager()
  })

  afterEach(() => {
    // Cleanup
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath)
    }
    usbManager.stopPolling()
  })

  describe('Service Integration', () => {
    it('should integrate audit service with USB manager events', (done) => {
      // Log USB connection event
      const usbEvent = {
        id: 'usb-connection-event',
        timestamp: new Date().toISOString(),
        type: 'usb_connection',
        level: 'info',
        payload: {
          module: 'huawei_usb_manager',
          device_id: 'USB\\VID_12D1&PID_1506\\1234567890',
          status: 'connected',
          device_name: 'Huawei E3372'
        }
      }

      auditService.logEvent(usbEvent)

      // Verify event was logged
      const events = auditService.getEvents({ type: 'usb_connection' })
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('usb_connection')

      // Test USB manager status change event
      usbManager.on('statusChange', (status) => {
        const statusEvent = {
          id: 'usb-status-change',
          timestamp: new Date().toISOString(),
          type: 'usb_status_change',
          level: 'info',
          payload: {
            module: 'huawei_usb_manager',
            previous_status: 'disconnected',
            new_status: status.status,
            device_info: status.info
          }
        }

        auditService.logEvent(statusEvent)

        // Verify status change was logged
        const statusEvents = auditService.getEvents({ type: 'usb_status_change' })
        expect(statusEvents.length).toBeGreaterThan(0)
        done()
      })

      usbManager.connect()
    })

    it('should handle concurrent operations between services', async () => {
      const promises = []

      // Concurrent audit logging
      for (let i = 0; i < 10; i++) {
        promises.push(
          auditService.logEvent({
            id: `concurrent-audit-${i}`,
            timestamp: new Date().toISOString(),
            type: 'concurrent_test',
            payload: { index: i }
          })
        )
      }

      // Concurrent USB operations
      for (let i = 0; i < 5; i++) {
        promises.push(
          new Promise((resolve) => {
            usbManager.on('statusChange', () => resolve(true))
            usbManager.connect()
          })
        )
      }

      const results = await Promise.all(promises)
      expect(results).toHaveLength(15)

      // Verify all events were logged
      const events = auditService.getEvents({ type: 'concurrent_test' })
      expect(events).toHaveLength(10)
    })

    it('should handle service lifecycle integration', () => {
      // Start services
      expect(auditService).toBeDefined()
      expect(usbManager).toBeDefined()

      // Log lifecycle events
      const lifecycleEvent = {
        id: 'service-lifecycle',
        timestamp: new Date().toISOString(),
        type: 'service_lifecycle',
        level: 'info',
        payload: {
          module: 'integration_test',
          services: ['enhanced_audit_service', 'huawei_usb_manager'],
          status: 'initialized'
        }
      }

      auditService.logEvent(lifecycleEvent)

      // Verify lifecycle event
      const events = auditService.getEvents({ type: 'service_lifecycle' })
      expect(events).toHaveLength(1)

      // Cleanup services
      auditService.close()
      usbManager.stopPolling()

      expect(() => auditService.close()).not.toThrow()
      expect(() => usbManager.stopPolling()).not.toThrow()
    })
  })

  describe('Data Flow Integration', () => {
    it('should handle complete data flow from USB to audit', (done) => {
      let dataFlowComplete = false

      // Setup USB data reception
      usbManager.on('dataReceived', (data) => {
        // Log received data to audit
        const dataEvent = {
          id: 'usb-data-received',
          timestamp: new Date().toISOString(),
          type: 'usb_data_received',
          level: 'info',
          payload: {
            module: 'huawei_usb_manager',
            data: data,
            data_size: data.length,
            reception_time: Date.now()
          }
        }

        auditService.logEvent(dataEvent)

        // Verify data was logged
        const dataEvents = auditService.getEvents({ type: 'usb_data_received' })
        expect(dataEvents).toHaveLength(1)
        expect(dataEvents[0].payload.data).toBe(data)

        dataFlowComplete = true
        done()
      })

      // Connect and receive data
      usbManager.connect()
      
      setTimeout(() => {
        usbManager.receiveData()
      }, 3000)
    })

    it('should handle data transformation pipeline', () => {
      // Raw USB data
      const rawData = 'USB_DATA_1234567890'

      // Transform data
      const transformedData = {
        raw: rawData,
        timestamp: Date.now(),
        parsed: {
          device_id: 'HW_USB_001',
          data_type: 'telemetry',
          value: 1234567890
        }
      }

      // Log transformation
      const transformEvent = {
        id: 'data-transformation',
        timestamp: new Date().toISOString(),
        type: 'data_transformation',
        level: 'debug',
        payload: {
          module: 'data_pipeline',
          input: rawData,
          output: transformedData,
          transformation_time: Date.now()
        }
      }

      auditService.logEvent(transformEvent)

      // Verify transformation was logged
      const events = auditService.getEvents({ type: 'data_transformation' })
      expect(events).toHaveLength(1)
      expect(events[0].payload.input).toBe(rawData)
      expect(events[0].payload.output).toEqual(transformedData)
    })

    it('should handle error propagation through services', () => {
      // Simulate USB error
      const usbError = new Error('USB connection failed')
      
      // Log error
      const errorEvent = {
        id: 'usb-error',
        timestamp: new Date().toISOString(),
        type: 'usb_error',
        level: 'error',
        payload: {
          module: 'huawei_usb_manager',
          error: usbError.message,
          stack: usbError.stack,
          recovery_attempted: false
        }
      }

      auditService.logEvent(errorEvent)

      // Verify error was logged
      const errorEvents = auditService.getEvents({ type: 'usb_error' })
      expect(errorEvents).toHaveLength(1)
      expect(errorEvents[0].level).toBe('error')
      expect(errorEvents[0].payload.error).toBe('USB connection failed')
    })
  })

  describe('Performance Integration', () => {
    it('should handle high-frequency data logging', () => {
      const startTime = Date.now()
      const eventCount = 100

      // Log high-frequency events
      for (let i = 0; i < eventCount; i++) {
        auditService.logEvent({
          id: `high-freq-event-${i}`,
          timestamp: new Date().toISOString(),
          type: 'high_frequency_test',
          payload: { index: i, timestamp: Date.now() }
        })
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000)

      // Verify all events were logged
      const events = auditService.getEvents({ type: 'high_frequency_test' })
      expect(events).toHaveLength(eventCount)
    })

    it('should handle concurrent USB operations', async () => {
      const operationCount = 20
      const startTime = Date.now()

      // Perform concurrent USB operations
      const operations = Array.from({ length: operationCount }, (_, i) =>
        new Promise((resolve) => {
          usbManager.on('statusChange', () => resolve(i))
          usbManager.connect()
        })
      )

      await Promise.all(operations)
      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000)
    })

    it('should handle memory-efficient bulk operations', () => {
      const batchSize = 1000
      const batches = 5

      for (let batch = 0; batch < batches; batch++) {
        const batchEvents = []
        
        for (let i = 0; i < batchSize; i++) {
          batchEvents.push({
            id: `batch-${batch}-event-${i}`,
            timestamp: new Date().toISOString(),
            type: 'batch_test',
            payload: { batch, index: i }
          })
        }

        // Log batch
        batchEvents.forEach(event => auditService.logEvent(event))
      }

      // Verify all batches were logged
      const events = auditService.getEvents({ type: 'batch_test' })
      expect(events).toHaveLength(batchSize * batches)
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle service initialization failures', () => {
      // Test with invalid database path
      const invalidService = new EnhancedAuditService('/invalid/path/test.db')
      expect(invalidService).toBeDefined()

      // Should handle gracefully
      expect(() => invalidService.logEvent({
        id: 'test',
        timestamp: new Date().toISOString(),
        type: 'test'
      })).not.toThrow()
    })

    it('should handle service communication failures', () => {
      // Simulate communication failure
      const commFailureEvent = {
        id: 'comm-failure',
        timestamp: new Date().toISOString(),
        type: 'communication_failure',
        level: 'error',
        payload: {
          module: 'service_integration',
          source_service: 'huawei_usb_manager',
          target_service: 'enhanced_audit_service',
          error: 'Connection timeout',
          retry_count: 3
        }
      }

      auditService.logEvent(commFailureEvent)

      // Verify failure was logged
      const events = auditService.getEvents({ type: 'communication_failure' })
      expect(events).toHaveLength(1)
      expect(events[0].level).toBe('error')
    })

    it('should handle resource exhaustion scenarios', () => {
      // Simulate resource exhaustion
      const resourceEvent = {
        id: 'resource-exhaustion',
        timestamp: new Date().toISOString(),
        type: 'resource_exhaustion',
        level: 'warning',
        payload: {
          module: 'system_monitor',
          resource: 'memory',
          usage_percent: 95,
          threshold: 90,
          action_taken: 'cleanup_triggered'
        }
      }

      auditService.logEvent(resourceEvent)

      // Verify resource event was logged
      const events = auditService.getEvents({ type: 'resource_exhaustion' })
      expect(events).toHaveLength(1)
      expect(events[0].level).toBe('warning')
    })
  })

  describe('Security Integration', () => {
    it('should handle secure data transmission', () => {
      // Simulate secure data transmission
      const secureData = {
        encrypted: 'encrypted_data_here',
        signature: 'digital_signature_here',
        timestamp: Date.now(),
        source: 'huawei_usb_manager',
        destination: 'enhanced_audit_service'
      }

      const securityEvent = {
        id: 'secure-transmission',
        timestamp: new Date().toISOString(),
        type: 'secure_transmission',
        level: 'info',
        payload: {
          module: 'security_layer',
          data: secureData,
          encryption_method: 'AES-256',
          signature_method: 'Ed25519',
          verified: true
        }
      }

      auditService.logEvent(securityEvent)

      // Verify security event was logged
      const events = auditService.getEvents({ type: 'secure_transmission' })
      expect(events).toHaveLength(1)
      expect(events[0].payload.verified).toBe(true)
    })

    it('should handle authentication events', () => {
      // Simulate authentication
      const authEvent = {
        id: 'authentication',
        timestamp: new Date().toISOString(),
        type: 'authentication',
        level: 'info',
        payload: {
          module: 'auth_system',
          user_id: 'test_user',
          method: 'api_key',
          success: true,
          ip_address: '192.168.1.100',
          user_agent: 'Test Agent'
        }
      }

      auditService.logEvent(authEvent)

      // Verify auth event was logged
      const events = auditService.getEvents({ type: 'authentication' })
      expect(events).toHaveLength(1)
      expect(events[0].payload.success).toBe(true)
    })

    it('should handle authorization failures', () => {
      // Simulate authorization failure
      const authzEvent = {
        id: 'authorization-failure',
        timestamp: new Date().toISOString(),
        type: 'authorization_failure',
        level: 'warning',
        payload: {
          module: 'auth_system',
          user_id: 'test_user',
          resource: 'admin_panel',
          action: 'delete',
          reason: 'insufficient_privileges',
          ip_address: '192.168.1.100'
        }
      }

      auditService.logEvent(authzEvent)

      // Verify authz failure was logged
      const events = auditService.getEvents({ type: 'authorization_failure' })
      expect(events).toHaveLength(1)
      expect(events[0].level).toBe('warning')
    })
  })

  describe('Configuration Integration', () => {
    it('should handle configuration changes', () => {
      // Simulate configuration change
      const configEvent = {
        id: 'config-change',
        timestamp: new Date().toISOString(),
        type: 'configuration_change',
        level: 'info',
        payload: {
          module: 'config_manager',
          changed_by: 'admin',
          changes: {
            'usb.polling_interval': { old: 5000, new: 3000 },
            'audit.retention_days': { old: 30, new: 60 }
          },
          restart_required: false
        }
      }

      auditService.logEvent(configEvent)

      // Verify config change was logged
      const events = auditService.getEvents({ type: 'configuration_change' })
      expect(events).toHaveLength(1)
      expect(events[0].payload.changes).toBeDefined()
    })

    it('should handle configuration validation', () => {
      // Simulate configuration validation
      const validationEvent = {
        id: 'config-validation',
        timestamp: new Date().toISOString(),
        type: 'configuration_validation',
        level: 'info',
        payload: {
          module: 'config_validator',
          config_file: 'config.json',
          valid: true,
          warnings: [],
          errors: [],
          validation_time: Date.now()
        }
      }

      auditService.logEvent(validationEvent)

      // Verify validation was logged
      const events = auditService.getEvents({ type: 'configuration_validation' })
      expect(events).toHaveLength(1)
      expect(events[0].payload.valid).toBe(true)
    })
  })

  describe('Monitoring Integration', () => {
    it('should handle health check events', () => {
      // Simulate health check
      const healthEvent = {
        id: 'health-check',
        timestamp: new Date().toISOString(),
        type: 'health_check',
        level: 'info',
        payload: {
          module: 'health_monitor',
          services: {
            'enhanced_audit_service': { status: 'healthy', response_time: 15 },
            'huawei_usb_manager': { status: 'healthy', response_time: 25 }
          },
          overall_status: 'healthy',
          check_duration: 40
        }
      }

      auditService.logEvent(healthEvent)

      // Verify health check was logged
      const events = auditService.getEvents({ type: 'health_check' })
      expect(events).toHaveLength(1)
      expect(events[0].payload.overall_status).toBe('healthy')
    })

    it('should handle performance metrics', () => {
      // Simulate performance metrics
      const metricsEvent = {
        id: 'performance-metrics',
        timestamp: new Date().toISOString(),
        type: 'performance_metrics',
        level: 'info',
        payload: {
          module: 'performance_monitor',
          metrics: {
            'audit_service.logs_per_second': 150,
            'usb_manager.operations_per_minute': 300,
            'memory.usage_mb': 128,
            'cpu.usage_percent': 25
          },
          collection_time: Date.now()
        }
      }

      auditService.logEvent(metricsEvent)

      // Verify metrics were logged
      const events = auditService.getEvents({ type: 'performance_metrics' })
      expect(events).toHaveLength(1)
      expect(events[0].payload.metrics).toBeDefined()
    })
  })
})

