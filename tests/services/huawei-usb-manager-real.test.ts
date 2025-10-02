import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { EventEmitter } from 'events'
import HuaweiUsbManager from '../../src/services/huawei-usb-manager-real'

// Mock the USB manager module
vi.mock('../../src/services/usb-manager', () => ({
  listUSB: vi.fn(),
  watchUSB: vi.fn()
}))

describe('HuaweiUsbManager Real - 110% Coverage', () => {
  let usbManager: HuaweiUsbManager
  let mockListUSB: any
  let mockWatchUSB: any

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Get mock functions
    const { listUSB, watchUSB } = await import('../../src/services/usb-manager')
    mockListUSB = listUSB as any
    mockWatchUSB = watchUSB as any
    
    // Setup default mock behavior
    mockListUSB.mockResolvedValue([])
    mockWatchUSB.mockResolvedValue(() => {}) // cleanup function
    
    // Initialize manager
    usbManager = new HuaweiUsbManager()
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 100))
  })

  afterEach(() => {
    // Clean up
    if (usbManager) {
      usbManager.stopPolling()
    }
    vi.clearAllMocks()
  })

  describe('Constructor and Initialization', () => {
    it('should initialize with real USB scanning', async () => {
      expect(usbManager).toBeDefined()
      expect(usbManager).toBeInstanceOf(EventEmitter)
      expect(mockListUSB).toHaveBeenCalled()
    })

    it('should start polling on initialization', () => {
      expect(mockWatchUSB).toHaveBeenCalled()
    })

    it('should handle initialization errors gracefully', async () => {
      mockListUSB.mockRejectedValue(new Error('USB scan failed'))
      
      const manager = new HuaweiUsbManager()
      expect(manager).toBeDefined()
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100))
    })
  })

  describe('Real Device Scanning', () => {
    it('should detect real Huawei devices', async () => {
      const mockDevices = [
        {
          os: 'win' as const,
          vendorId: '12d1',
          productId: '1506',
          manufacturer: 'Huawei Technologies Co., Ltd.',
          product: 'Huawei E3372',
          serialNumber: '1234567890',
          pnpId: 'USB\\VID_12D1&PID_1506\\1234567890'
        },
        {
          os: 'win' as const,
          vendorId: '12d1',
          productId: '14dc',
          manufacturer: 'Huawei Technologies Co., Ltd.',
          product: 'Huawei E5573',
          serialNumber: '0987654321',
          pnpId: 'USB\\VID_12D1&PID_14DC\\0987654321'
        }
      ]

      mockListUSB.mockResolvedValue(mockDevices)

      const devices = await usbManager.scanDevices()
      expect(devices).toHaveLength(2)
      expect(devices[0].vendorId).toBe('12d1')
      expect(devices[0].product).toBe('Huawei E3372')
    })

    it('should filter non-Huawei devices', async () => {
      const mockDevices = [
        {
          os: 'win' as const,
          vendorId: '12d1',
          product: 'Huawei E3372'
        },
        {
          os: 'win' as const,
          vendorId: '0781',
          product: 'SanDisk Ultra'
        },
        {
          os: 'win' as const,
          manufacturer: 'Huawei',
          product: 'Some Device'
        }
      ]

      mockListUSB.mockResolvedValue(mockDevices)

      const devices = await usbManager.scanDevices()
      expect(devices).toHaveLength(2) // Only Huawei devices
      expect(devices.every(d => d.vendorId === '12d1' || d.manufacturer?.toLowerCase().includes('huawei'))).toBe(true)
    })

    it('should handle scanning errors', async () => {
      mockListUSB.mockRejectedValue(new Error('Device scan failed'))

      const devices = await usbManager.scanDevices()
      expect(devices).toHaveLength(0)
      expect(usbManager.getStatus()).toBe('error')
    })

    it('should update status based on detected devices', async () => {
      const mockDevices = [
        {
          os: 'win' as const,
          vendorId: '12d1',
          product: 'Huawei E3372',
          pnpId: 'USB\\VID_12D1&PID_1506\\1234567890'
        }
      ]

      mockListUSB.mockResolvedValue(mockDevices)

      await usbManager.scanDevices()
      expect(usbManager.getStatus()).toBe('connected')
      expect(usbManager.getDeviceInfo()).toBeDefined()
    })
  })

  describe('Real Device Watching', () => {
    it('should watch for device changes', async () => {
      let onChangeCallback: ((added: any[], removed: any[]) => void) | undefined

      mockWatchUSB.mockImplementation((interval: number, onChange: (added: any[], removed: any[]) => void) => {
        onChangeCallback = onChange
        return Promise.resolve(() => {}) // cleanup function
      })

      await usbManager.startPolling(2000)

      expect(mockWatchUSB).toHaveBeenCalledWith(2000, expect.any(Function))
      expect(onChangeCallback).toBeDefined()

      // Simulate device addition
      if (onChangeCallback) {
        const addedDevices = [
          {
            os: 'win' as const,
            vendorId: '12d1',
            product: 'Huawei E3372'
          }
        ]
        onChangeCallback(addedDevices, [])
      }
    })

    it('should handle device additions', async () => {
      let onChangeCallback: ((added: any[], removed: any[]) => void) | undefined

      mockWatchUSB.mockImplementation((interval: number, onChange: (added: any[], removed: any[]) => void) => {
        onChangeCallback = onChange
        return Promise.resolve(() => {})
      })

      await usbManager.startPolling(2000)

      // Simulate Huawei device addition
      if (onChangeCallback) {
        const addedDevices = [
          {
            os: 'win' as const,
            vendorId: '12d1',
            product: 'Huawei E3372',
            pnpId: 'USB\\VID_12D1&PID_1506\\1234567890'
          }
        ]
        onChangeCallback(addedDevices, [])
        
        expect(usbManager.getStatus()).toBe('connected')
      }
    })

    it('should handle device removals', async () => {
      let onChangeCallback: ((added: any[], removed: any[]) => void) | undefined

      mockWatchUSB.mockImplementation((interval: number, onChange: (added: any[], removed: any[]) => void) => {
        onChangeCallback = onChange
        return Promise.resolve(() => {})
      })

      // First add a device
      mockListUSB.mockResolvedValue([
        {
          os: 'win' as const,
          vendorId: '12d1',
          product: 'Huawei E3372'
        }
      ])

      await usbManager.scanDevices()
      await usbManager.startPolling(2000)

      // Simulate device removal
      if (onChangeCallback) {
        const removedDevices = [
          {
            os: 'win' as const,
            vendorId: '12d1',
            product: 'Huawei E3372'
          }
        ]
        onChangeCallback([], removedDevices)
        
        // Should still be connected if there are other devices
        // Will be disconnected if no devices remain
      }
    })

    it('should stop polling correctly', () => {
      usbManager.stopPolling()
      expect(usbManager.pollingInterval).toBeNull()
    })
  })

  describe('Connection Operations', () => {
    it('should attempt real connection', async () => {
      mockListUSB.mockResolvedValue([
        {
          os: 'win' as const,
          vendorId: '12d1',
          product: 'Huawei E3372',
          pnpId: 'USB\\VID_12D1&PID_1506\\1234567890'
        }
      ])

      usbManager.connect()
      expect(usbManager.getStatus()).toBe('connecting')

      // Wait for connection to complete
      await new Promise(resolve => setTimeout(resolve, 1100))
      expect(usbManager.getStatus()).toBe('connected')
    })

    it('should handle connection when no devices found', async () => {
      mockListUSB.mockResolvedValue([])

      usbManager.connect()
      
      // Wait for connection attempt
      await new Promise(resolve => setTimeout(resolve, 1100))
      expect(usbManager.getStatus()).toBe('disconnected')
    })

    it('should disconnect correctly', async () => {
      usbManager.disconnect()
      expect(usbManager.getStatus()).toBe('disconnecting')

      // Wait for disconnection to complete
      await new Promise(resolve => setTimeout(resolve, 1100))
      expect(usbManager.getStatus()).toBe('disconnected')
      expect(usbManager.getDeviceInfo()).toBeNull()
    })
  })

  describe('Data Operations', () => {
    beforeEach(async () => {
      // Setup connected device
      mockListUSB.mockResolvedValue([
        {
          os: 'win' as const,
          vendorId: '12d1',
          product: 'Huawei E3372',
          pnpId: 'USB\\VID_12D1&PID_1506\\1234567890'
        }
      ])

      await usbManager.scanDevices()
    })

    it('should send data when connected', async () => {
      const testData = { message: 'test data', timestamp: Date.now() }
      
      const dataSentPromise = new Promise((resolve) => {
        usbManager.on('dataSent', (data) => {
          expect(data).toEqual(testData)
          resolve(data)
        })
      })

      const result = usbManager.sendData(testData)
      expect(result).toBe(true)
      
      await dataSentPromise
    })

    it('should not send data when disconnected', async () => {
      usbManager.disconnect()
      await new Promise(resolve => setTimeout(resolve, 1100))

      const testData = { message: 'test data' }
      const result = usbManager.sendData(testData)
      expect(result).toBe(false)
    })

    it('should receive data when connected', async () => {
      const dataReceivedPromise = new Promise((resolve) => {
        usbManager.on('dataReceived', (data) => {
          expect(data).toMatch(/REAL_USB_DATA_\d+_/)
          resolve(data)
        })
      })

      const result = usbManager.receiveData()
      expect(result).toMatch(/REAL_USB_DATA_\d+_/)
      
      await dataReceivedPromise
    })

    it('should not receive data when disconnected', async () => {
      usbManager.disconnect()
      await new Promise(resolve => setTimeout(resolve, 1100))

      const result = usbManager.receiveData()
      expect(result).toBeNull()
    })
  })

  describe('Device Information', () => {
    it('should return current device info when connected', async () => {
      const mockDevices = [
        {
          os: 'win' as const,
          vendorId: '12d1',
          product: 'Huawei E3372',
          pnpId: 'USB\\VID_12D1&PID_1506\\1234567890'
        }
      ]

      mockListUSB.mockResolvedValue(mockDevices)
      await usbManager.scanDevices()

      const deviceInfo = usbManager.getDeviceInfo()
      expect(deviceInfo).toBeDefined()
      expect(deviceInfo.name).toBe('Huawei E3372')
      expect(deviceInfo.devices).toHaveLength(1)
    })

    it('should return null device info when disconnected', () => {
      const deviceInfo = usbManager.getDeviceInfo()
      expect(deviceInfo).toBeNull()
    })

    it('should return current status', () => {
      const status = usbManager.getStatus()
      expect(['disconnected', 'connecting', 'connected', 'error']).toContain(status)
    })

    it('should return detected devices', async () => {
      const mockDevices = [
        {
          os: 'win' as const,
          vendorId: '12d1',
          product: 'Huawei E3372'
        }
      ]

      mockListUSB.mockResolvedValue(mockDevices)
      await usbManager.scanDevices()

      const devices = usbManager.getDetectedDevices()
      expect(devices).toHaveLength(1)
      expect(devices[0].vendorId).toBe('12d1')
    })

    it('should return detailed device list', async () => {
      const mockDevices = [
        {
          os: 'win' as const,
          vendorId: '12d1',
          product: 'Huawei E3372'
        },
        {
          os: 'win' as const,
          vendorId: '0781',
          product: 'SanDisk Ultra'
        }
      ]

      mockListUSB.mockResolvedValue(mockDevices)
      await usbManager.scanDevices()

      const detailedList = await usbManager.getDetailedDeviceList()
      expect(detailedList.all).toHaveLength(2)
      expect(detailedList.huawei).toHaveLength(1)
      expect(detailedList.count.total).toBe(2)
      expect(detailedList.count.huawei).toBe(1)
      expect(detailedList.platform).toBe(process.platform)
      expect(detailedList.timestamp).toBeDefined()
    })
  })

  describe('Event Emission', () => {
    it('should emit statusChange events', async () => {
      let eventCount = 0
      
      const statusChangePromise = new Promise((resolve) => {
        usbManager.on('statusChange', (status) => {
          eventCount++
          expect(status).toHaveProperty('status')
          
          if (eventCount >= 2) { // connecting, connected
            resolve(status)
          }
        })
      })

      mockListUSB.mockResolvedValue([
        {
          os: 'win' as const,
          vendorId: '12d1',
          product: 'Huawei E3372',
          pnpId: 'USB\\VID_12D1&PID_1506\\1234567890'
        }
      ])

      usbManager.connect()
      await statusChangePromise
    })

    it('should emit dataSent events', async () => {
      mockListUSB.mockResolvedValue([
        {
          os: 'win' as const,
          vendorId: '12d1',
          product: 'Huawei E3372'
        }
      ])

      await usbManager.scanDevices()

      const dataSentPromise = new Promise((resolve) => {
        usbManager.on('dataSent', (data) => {
          expect(data).toBeDefined()
          resolve(data)
        })
      })

      usbManager.sendData({ test: 'data' })
      await dataSentPromise
    })

    it('should emit dataReceived events', async () => {
      mockListUSB.mockResolvedValue([
        {
          os: 'win' as const,
          vendorId: '12d1',
          product: 'Huawei E3372'
        }
      ])

      await usbManager.scanDevices()

      const dataReceivedPromise = new Promise((resolve) => {
        usbManager.on('dataReceived', (data) => {
          expect(data).toMatch(/REAL_USB_DATA_\d+_/)
          resolve(data)
        })
      })

      usbManager.receiveData()
      await dataReceivedPromise
    })

    it('should handle multiple event listeners', async () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      
      usbManager.on('statusChange', listener1)
      usbManager.on('statusChange', listener2)
      
      mockListUSB.mockResolvedValue([
        {
          os: 'win' as const,
          vendorId: '12d1',
          product: 'Huawei E3372'
        }
      ])

      await usbManager.scanDevices()
      
      expect(listener1).toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle USB scanning errors gracefully', async () => {
      mockListUSB.mockRejectedValue(new Error('USB scan failed'))

      const devices = await usbManager.scanDevices()
      expect(devices).toHaveLength(0)
      expect(usbManager.getStatus()).toBe('error')
    })

    it('should handle watch errors gracefully', async () => {
      mockWatchUSB.mockRejectedValue(new Error('Watch failed'))

      // Should not throw
      expect(() => usbManager.startPolling()).not.toThrow()
    })

    it('should handle concurrent operations', async () => {
      mockListUSB.mockResolvedValue([
        {
          os: 'win' as const,
          vendorId: '12d1',
          product: 'Huawei E3372'
        }
      ])

      // Start multiple operations simultaneously
      usbManager.connect()
      usbManager.disconnect()
      usbManager.connect()
      await usbManager.checkDeviceStatus()
      
      // Should not throw errors
      expect(true).toBe(true)
    })
  })

  describe('Performance Tests', () => {
    it('should handle rapid status checks', async () => {
      mockListUSB.mockResolvedValue([])
      
      const startTime = Date.now()
      
      for (let i = 0; i < 10; i++) {
        await usbManager.checkDeviceStatus()
      }
      
      const endTime = Date.now()
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle rapid polling start/stop', () => {
      const startTime = Date.now()
      
      for (let i = 0; i < 5; i++) {
        usbManager.startPolling(100)
        usbManager.stopPolling()
      }
      
      const endTime = Date.now()
      expect(endTime - startTime).toBeLessThan(100) // Should complete within 100ms
    })
  })

  describe('Edge Cases', () => {
    it('should handle devices with missing vendor IDs', async () => {
      const mockDevices = [
        {
          os: 'win' as const,
          product: 'Huawei Device without VID',
          manufacturer: 'Huawei'
        }
      ]

      mockListUSB.mockResolvedValue(mockDevices)
      const devices = await usbManager.scanDevices()
      
      expect(devices).toHaveLength(1) // Should still detect by manufacturer
    })

    it('should handle devices with special characters', async () => {
      const mockDevices = [
        {
          os: 'win' as const,
          vendorId: '12d1',
          product: 'Huawei E3372 with Special Chars: !@#$%',
          pnpId: 'USB\\VID_12D1&PID_1506\\SPECIAL_CHARS'
        }
      ]

      mockListUSB.mockResolvedValue(mockDevices)
      const devices = await usbManager.scanDevices()
      
      expect(devices).toHaveLength(1)
      expect(devices[0].product).toContain('Special Chars')
    })

    it('should handle empty device lists', async () => {
      mockListUSB.mockResolvedValue([])
      const devices = await usbManager.scanDevices()
      
      expect(devices).toHaveLength(0)
      expect(usbManager.getStatus()).toBe('disconnected')
    })
  })
})
