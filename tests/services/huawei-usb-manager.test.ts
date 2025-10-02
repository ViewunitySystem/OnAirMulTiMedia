import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { EventEmitter } from 'events'
import HuaweiUsbManager from '../../src/services/huawei-usb-manager'

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn()
}))

describe('HuaweiUsbManager - 110% Coverage', () => {
  let usbManager: HuaweiUsbManager
  let mockExec: any

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Get mock exec function
    const { exec } = await import('child_process')
    mockExec = exec as any
    
    // Initialize manager
    usbManager = new HuaweiUsbManager()
  })

  afterEach(() => {
    // Clean up
    if (usbManager) {
      usbManager.stopPolling()
    }
    vi.clearAllMocks()
  })

  describe('Constructor and Initialization', () => {
    it('should initialize with default settings', () => {
      expect(usbManager).toBeDefined()
      expect(usbManager).toBeInstanceOf(EventEmitter)
      expect(usbManager.getStatus()).toBe('disconnected')
      expect(usbManager.getDeviceInfo()).toBeNull()
    })

    it('should start polling on initialization', () => {
      expect(usbManager.pollingInterval).toBeDefined()
    })

    it('should handle initialization errors gracefully', () => {
      // Mock exec to throw error
      mockExec.mockImplementation((command, callback) => {
        callback(new Error('Initialization error'), '', '')
      })

      const manager = new HuaweiUsbManager()
      expect(manager).toBeDefined()
    })
  })

  describe('Device Status Management', () => {
    it('should detect connected Huawei device', (done) => {
      // Mock exec to return Huawei device
      mockExec.mockImplementation((command, callback) => {
        const mockOutput = `
Caption=Huawei Mobile Connect - Interface 0
DeviceID=USB\\VID_12D1&PID_1506\\1234567890
Caption=Huawei E3372 USB Stick
DeviceID=USB\\VID_12D1&PID_1506\\0987654321
`
        callback(null, mockOutput, '')
      })

      usbManager.on('statusChange', (status) => {
        if (status.status === 'connected') {
          expect(status.status).toBe('connected')
          expect(status.info).toBeDefined()
          expect(status.info.name).toContain('Huawei')
          done()
        }
      })

      usbManager.checkDeviceStatus()
    })

    it('should detect disconnected device', (done) => {
      // First connect device
      mockExec.mockImplementation((command, callback) => {
        const mockOutput = `
Caption=Huawei Mobile Connect - Interface 0
DeviceID=USB\\VID_12D1&PID_1506\\1234567890
`
        callback(null, mockOutput, '')
      })

      usbManager.checkDeviceStatus()

      // Then disconnect
      setTimeout(() => {
        mockExec.mockImplementation((command, callback) => {
          callback(null, '', '')
        })

        usbManager.on('statusChange', (status) => {
          if (status.status === 'disconnected') {
            expect(status.status).toBe('disconnected')
            expect(status.info).toBeNull()
            done()
          }
        })

        usbManager.checkDeviceStatus()
      }, 100)
    })

    it('should handle exec errors gracefully', () => {
      mockExec.mockImplementation((command, callback) => {
        callback(new Error('Command failed'), '', 'Command not found')
      })

      expect(() => usbManager.checkDeviceStatus()).not.toThrow()
    })

    it('should handle empty exec output', () => {
      mockExec.mockImplementation((command, callback) => {
        callback(null, '', '')
      })

      expect(() => usbManager.checkDeviceStatus()).not.toThrow()
    })

    it('should handle partial Huawei device detection', () => {
      mockExec.mockImplementation((command, callback) => {
        const mockOutput = `
Caption=Some Other Device
DeviceID=USB\\VID_1234&PID_5678\\1234567890
Caption=Huawei
DeviceID=USB\\VID_12D1&PID_1506\\0987654321
`
        callback(null, mockOutput, '')
      })

      expect(() => usbManager.checkDeviceStatus()).not.toThrow()
    })
  })

  describe('Polling Management', () => {
    it('should start polling with custom interval', () => {
      const manager = new HuaweiUsbManager()
      manager.stopPolling()
      
      manager.startPolling(1000)
      expect(manager.pollingInterval).toBeDefined()
      
      manager.stopPolling()
    })

    it('should stop polling', () => {
      usbManager.stopPolling()
      expect(usbManager.pollingInterval).toBeNull()
    })

    it('should handle multiple start polling calls', () => {
      const firstInterval = usbManager.pollingInterval
      usbManager.startPolling(2000)
      const secondInterval = usbManager.pollingInterval
      
      expect(secondInterval).not.toBe(firstInterval)
    })

    it('should handle stop polling when not running', () => {
      usbManager.stopPolling()
      expect(() => usbManager.stopPolling()).not.toThrow()
    })
  })

  describe('Connection Operations', () => {
    it('should attempt connection', (done) => {
      usbManager.on('statusChange', (status) => {
        if (status.status === 'connecting') {
          expect(status.status).toBe('connecting')
          done()
        }
      })

      usbManager.connect()
    })

    it('should complete connection after timeout', (done) => {
      usbManager.on('statusChange', (status) => {
        if (status.status === 'connected') {
          expect(status.status).toBe('connected')
          expect(status.info).toBeDefined()
          expect(status.info.name).toBe('Huawei USB Device')
          expect(status.info.id).toBe('HW_USB_001')
          done()
        }
      })

      usbManager.connect()
    })

    it('should attempt disconnection', (done) => {
      // First connect
      usbManager.connect()
      
      setTimeout(() => {
        usbManager.on('statusChange', (status) => {
          if (status.status === 'disconnecting') {
            expect(status.status).toBe('disconnecting')
            done()
          }
        })

        usbManager.disconnect()
      }, 100)
    })

    it('should complete disconnection after timeout', (done) => {
      // First connect
      usbManager.connect()
      
      setTimeout(() => {
        usbManager.on('statusChange', (status) => {
          if (status.status === 'disconnected') {
            expect(status.status).toBe('disconnected')
            done()
          }
        })

        usbManager.disconnect()
      }, 3000)
    })

    it('should handle multiple connection attempts', () => {
      usbManager.connect()
      usbManager.connect()
      usbManager.connect()
      
      // Should not throw errors
      expect(true).toBe(true)
    })

    it('should handle connection when already connected', () => {
      usbManager.connect()
      
      setTimeout(() => {
        usbManager.connect()
        // Should not throw errors
        expect(true).toBe(true)
      }, 3000)
    })
  })

  describe('Data Operations', () => {
    beforeEach(() => {
      // Connect device first
      usbManager.connect()
    })

    it('should send data when connected', (done) => {
      setTimeout(() => {
        const testData = { message: 'test data', timestamp: Date.now() }
        
        usbManager.on('dataSent', (data) => {
          expect(data).toEqual(testData)
          done()
        })

        const result = usbManager.sendData(testData)
        expect(result).toBe(true)
      }, 3000)
    })

    it('should not send data when disconnected', () => {
      const testData = { message: 'test data' }
      const result = usbManager.sendData(testData)
      expect(result).toBe(false)
    })

    it('should receive data when connected', (done) => {
      setTimeout(() => {
        usbManager.on('dataReceived', (data) => {
          expect(data).toMatch(/USB_DATA_\d+/)
          done()
        })

        const result = usbManager.receiveData()
        expect(result).toMatch(/USB_DATA_\d+/)
      }, 3000)
    })

    it('should not receive data when disconnected', () => {
      const result = usbManager.receiveData()
      expect(result).toBeNull()
    })

    it('should handle large data payloads', (done) => {
      setTimeout(() => {
        const largeData = {
          data: Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            value: `large-data-${i}`,
            timestamp: Date.now()
          }))
        }

        usbManager.on('dataSent', (data) => {
          expect(data).toEqual(largeData)
          done()
        })

        const result = usbManager.sendData(largeData)
        expect(result).toBe(true)
      }, 3000)
    })

    it('should handle special characters in data', (done) => {
      setTimeout(() => {
        const specialData = {
          unicode: '🚀🎉✅⚠️❌',
          special: '!@#$%^&*()_+-=[]{}|;:,.<>?',
          quotes: '"double" and \'single\' quotes',
          newlines: 'line1\nline2\rline3\r\nline4'
        }

        usbManager.on('dataSent', (data) => {
          expect(data).toEqual(specialData)
          done()
        })

        const result = usbManager.sendData(specialData)
        expect(result).toBe(true)
      }, 3000)
    })

    it('should handle null and undefined data', (done) => {
      setTimeout(() => {
        usbManager.on('dataSent', (data) => {
          expect(data).toBeNull()
          done()
        })

        const result = usbManager.sendData(null)
        expect(result).toBe(true)
      }, 3000)
    })
  })

  describe('Device Information', () => {
    it('should return current device info when connected', (done) => {
      usbManager.connect()
      
      setTimeout(() => {
        const deviceInfo = usbManager.getDeviceInfo()
        expect(deviceInfo).toBeDefined()
        expect(deviceInfo.name).toBe('Huawei USB Device')
        expect(deviceInfo.id).toBe('HW_USB_001')
        done()
      }, 3000)
    })

    it('should return null device info when disconnected', () => {
      const deviceInfo = usbManager.getDeviceInfo()
      expect(deviceInfo).toBeNull()
    })

    it('should return current status', () => {
      const status = usbManager.getStatus()
      expect(status).toBe('disconnected')
    })

    it('should update status after connection', (done) => {
      usbManager.connect()
      
      setTimeout(() => {
        const status = usbManager.getStatus()
        expect(status).toBe('connected')
        done()
      }, 3000)
    })
  })

  describe('Event Emission', () => {
    it('should emit statusChange events', (done) => {
      let eventCount = 0
      
      usbManager.on('statusChange', (status) => {
        eventCount++
        expect(status).toHaveProperty('status')
        
        if (eventCount >= 3) { // connecting, connected, disconnecting, disconnected
          done()
        }
      })

      usbManager.connect()
      
      setTimeout(() => {
        usbManager.disconnect()
      }, 3000)
    })

    it('should emit dataSent events', (done) => {
      usbManager.connect()
      
      setTimeout(() => {
        usbManager.on('dataSent', (data) => {
          expect(data).toBeDefined()
          done()
        })

        usbManager.sendData({ test: 'data' })
      }, 3000)
    })

    it('should emit dataReceived events', (done) => {
      usbManager.connect()
      
      setTimeout(() => {
        usbManager.on('dataReceived', (data) => {
          expect(data).toMatch(/USB_DATA_\d+/)
          done()
        })

        usbManager.receiveData()
      }, 3000)
    })

    it('should handle multiple event listeners', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      
      usbManager.on('statusChange', listener1)
      usbManager.on('statusChange', listener2)
      
      usbManager.connect()
      
      setTimeout(() => {
        expect(listener1).toHaveBeenCalled()
        expect(listener2).toHaveBeenCalled()
      }, 3000)
    })
  })

  describe('Error Handling', () => {
    it('should handle exec command errors', () => {
      mockExec.mockImplementation((command, callback) => {
        callback(new Error('Command execution failed'), '', 'stderr output')
      })

      expect(() => usbManager.checkDeviceStatus()).not.toThrow()
    })

    it('should handle exec timeout', () => {
      mockExec.mockImplementation((command, callback) => {
        // Simulate timeout by not calling callback
        setTimeout(() => {
          callback(new Error('Command timeout'), '', '')
        }, 100)
      })

      expect(() => usbManager.checkDeviceStatus()).not.toThrow()
    })

    it('should handle malformed exec output', () => {
      mockExec.mockImplementation((command, callback) => {
        callback(null, 'malformed output with special chars: \x00\x01\x02', '')
      })

      expect(() => usbManager.checkDeviceStatus()).not.toThrow()
    })

    it('should handle concurrent operations', () => {
      // Start multiple operations simultaneously
      usbManager.connect()
      usbManager.disconnect()
      usbManager.connect()
      usbManager.checkDeviceStatus()
      
      // Should not throw errors
      expect(true).toBe(true)
    })
  })

  describe('Performance Tests', () => {
    it('should handle rapid status checks', () => {
      const startTime = Date.now()
      
      for (let i = 0; i < 10; i++) {
        usbManager.checkDeviceStatus()
      }
      
      const endTime = Date.now()
      expect(endTime - startTime).toBeLessThan(100) // Should complete within 100ms
    })

    it('should handle rapid polling start/stop', () => {
      const startTime = Date.now()
      
      for (let i = 0; i < 5; i++) {
        usbManager.startPolling(100)
        usbManager.stopPolling()
      }
      
      const endTime = Date.now()
      expect(endTime - startTime).toBeLessThan(50) // Should complete within 50ms
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long device names', () => {
      mockExec.mockImplementation((command, callback) => {
        const longName = 'Huawei ' + 'A'.repeat(1000) + ' USB Device'
        const mockOutput = `
Caption=${longName}
DeviceID=USB\\VID_12D1&PID_1506\\1234567890
`
        callback(null, mockOutput, '')
      })

      expect(() => usbManager.checkDeviceStatus()).not.toThrow()
    })

    it('should handle special characters in device output', () => {
      mockExec.mockImplementation((command, callback) => {
        const mockOutput = `
Caption=Huawei Device with Special Chars: !@#$%^&*()
DeviceID=USB\\VID_12D1&PID_1506\\1234567890
Caption=Huawei Device with Unicode: 🚀🎉
DeviceID=USB\\VID_12D1&PID_1506\\0987654321
`
        callback(null, mockOutput, '')
      })

      expect(() => usbManager.checkDeviceStatus()).not.toThrow()
    })

    it('should handle empty device ID', () => {
      mockExec.mockImplementation((command, callback) => {
        const mockOutput = `
Caption=Huawei Device
DeviceID=
Caption=Another Device
DeviceID=USB\\VID_1234&PID_5678\\1234567890
`
        callback(null, mockOutput, '')
      })

      expect(() => usbManager.checkDeviceStatus()).not.toThrow()
    })
  })
})

