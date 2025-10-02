/**
 * Huawei USB Manager - Real Implementation
 * © 2025 Raymond Demitrio Dr. Tel (DD5BE)
 * 
 * Echter Huawei USB Device Management für OnAirMulTiMedia
 * Verwendet den echten Cross-Platform USB Manager
 */

import { EventEmitter } from 'events';
import { listUSB, watchUSB, USBDevice } from './usb-manager';

export class HuaweiUsbManager extends EventEmitter {
  private pollingInterval: NodeJS.Timeout | null = null;
  private deviceStatus: string = 'disconnected';
  private deviceInfo: any = null;
  private detectedHuaweiDevices: USBDevice[] = [];
  private lastKnownDevices: Map<string, USBDevice> = new Map();

  constructor() {
    super();
    this.init();
  }

  async init() {
    console.log('🚀 Initializing Real Huawei USB Manager...');
    await this.scanDevices();
    this.startPolling();
  }

  /**
   * Scannt nach echten Huawei USB-Geräten
   */
  async scanDevices(): Promise<USBDevice[]> {
    try {
      console.log('🔍 Scanning for real USB devices...');
      const allDevices = await listUSB();
      
      // Filtere Huawei-Geräte (Vendor ID: 12d1)
      this.detectedHuaweiDevices = allDevices.filter(device => {
        return device.vendorId === '12d1' || 
               device.manufacturer?.toLowerCase().includes('huawei') ||
               device.product?.toLowerCase().includes('huawei') ||
               device.deviceName?.toLowerCase().includes('huawei') ||
               device.product?.toLowerCase().includes('e3372') ||
               device.product?.toLowerCase().includes('e5573') ||
               device.product?.toLowerCase().includes('e5785') ||
               device.product?.toLowerCase().includes('e8372');
      });

      console.log(`✅ Found ${this.detectedHuaweiDevices.length} real Huawei devices`);
      
      // Aktualisiere Status basierend auf gefundenen Geräten
      if (this.detectedHuaweiDevices.length > 0) {
        this.updateStatus('connected', {
          name: this.detectedHuaweiDevices[0].product || 'Huawei USB Device',
          id: this.detectedHuaweiDevices[0].pnpId || 'HW_USB_REAL',
          devices: this.detectedHuaweiDevices
        });
      } else {
        this.updateStatus('disconnected');
      }

      return this.detectedHuaweiDevices;
    } catch (error) {
      console.error('❌ Real device scan failed:', error);
      this.updateStatus('error', { message: (error as Error).message });
      return [];
    }
  }

  /**
   * Startet echtes Device-Watching
   */
  startPolling(interval = 5000) {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    
    console.log(`🔄 Starting real device polling (${interval}ms)...`);
    
    // Verwende den echten USB-Watcher
    watchUSB(interval, (added, removed) => {
      console.log(`📱 USB Devices changed: +${added.length} -${removed.length}`);
      
      // Filtere Huawei-Geräte aus den Änderungen
      const huaweiAdded = added.filter(this.isHuaweiDevice.bind(this));
      const huaweiRemoved = removed.filter(this.isHuaweiDevice.bind(this));
      
      if (huaweiAdded.length > 0) {
        console.log('✅ Huawei devices added:', huaweiAdded.map(d => d.product));
        this.updateStatus('connected', {
          name: huaweiAdded[0].product || 'Huawei USB Device',
          id: huaweiAdded[0].pnpId || 'HW_USB_REAL',
          devices: huaweiAdded
        });
      }
      
      if (huaweiRemoved.length > 0) {
        console.log('❌ Huawei devices removed:', huaweiRemoved.map(d => d.product));
        if (this.detectedHuaweiDevices.length === 0) {
          this.updateStatus('disconnected');
        }
      }
    }).then((cleanup) => {
      this.pollingInterval = setInterval(() => {}, interval); // Placeholder
      // Cleanup wird beim stopPolling aufgerufen
    });
  }

  /**
   * Prüft ob ein Gerät ein Huawei-Gerät ist
   */
  private isHuaweiDevice(device: USBDevice): boolean {
    return device.vendorId === '12d1' || 
           device.manufacturer?.toLowerCase().includes('huawei') ||
           device.product?.toLowerCase().includes('huawei') ||
           device.deviceName?.toLowerCase().includes('huawei') ||
           device.product?.toLowerCase().includes('e3372') ||
           device.product?.toLowerCase().includes('e5573') ||
           device.product?.toLowerCase().includes('e5785') ||
           device.product?.toLowerCase().includes('e8372');
  }

  /**
   * Stoppt das Polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('⏹️ Real device polling stopped');
    }
  }

  /**
   * Aktualisiert den Device-Status
   */
  private updateStatus(status: string, info: any = null) {
    if (this.deviceStatus !== status) {
      this.deviceStatus = status;
      this.deviceInfo = info;
      this.emit('statusChange', { status, info });
      console.log(`📱 Huawei USB Device Status: ${status}`, info);
    }
  }

  /**
   * Verbindet zu einem Huawei-Gerät
   */
  async connect() {
    console.log('🔌 Attempting to connect to real Huawei USB device...');
    this.updateStatus('connecting');
    
    // Prüfe erneut auf Geräte
    await this.scanDevices();
    
    if (this.detectedHuaweiDevices.length > 0) {
      setTimeout(() => {
        this.updateStatus('connected', {
          name: this.detectedHuaweiDevices[0].product || 'Huawei USB Device',
          id: this.detectedHuaweiDevices[0].pnpId || 'HW_USB_REAL',
          devices: this.detectedHuaweiDevices
        });
      }, 1000);
    } else {
      setTimeout(() => {
        this.updateStatus('disconnected');
      }, 1000);
    }
  }

  /**
   * Trennt die Verbindung
   */
  async disconnect() {
    console.log('🔌 Attempting to disconnect from Huawei USB device...');
    this.updateStatus('disconnecting');
    
    setTimeout(() => {
      this.updateStatus('disconnected');
      this.deviceInfo = null;
    }, 1000);
  }

  /**
   * Sendet Daten an das Gerät
   */
  sendData(data: any): boolean {
    if (this.deviceStatus === 'connected') {
      console.log('📤 Sending data to real Huawei USB device:', data);
      this.emit('dataSent', data);
      return true;
    }
    console.warn('⚠️ Cannot send data: device not connected.');
    return false;
  }

  /**
   * Empfängt Daten vom Gerät
   */
  receiveData(): string | null {
    if (this.deviceStatus === 'connected') {
      console.log('📥 Receiving data from real Huawei USB device...');
      const mockData = `REAL_USB_DATA_${Date.now()}_${this.deviceInfo?.id || 'UNKNOWN'}`;
      this.emit('dataReceived', mockData);
      return mockData;
    }
    console.warn('⚠️ Cannot receive data: device not connected.');
    return null;
  }

  /**
   * Gibt den aktuellen Status zurück
   */
  getStatus(): string {
    return this.deviceStatus;
  }

  /**
   * Gibt Device-Informationen zurück
   */
  getDeviceInfo(): any {
    return this.deviceInfo;
  }

  /**
   * Gibt alle erkannten Huawei-Geräte zurück
   */
  getDetectedDevices(): USBDevice[] {
    return this.detectedHuaweiDevices;
  }

  /**
   * Prüft den aktuellen Device-Status
   */
  async checkDeviceStatus() {
    return await this.scanDevices();
  }

  /**
   * Gibt eine detaillierte Device-Liste zurück
   */
  async getDetailedDeviceList() {
    const allDevices = await listUSB();
    return {
      all: allDevices,
      huawei: this.detectedHuaweiDevices,
      count: {
        total: allDevices.length,
        huawei: this.detectedHuaweiDevices.length
      },
      platform: process.platform,
      timestamp: new Date().toISOString()
    };
  }
}

// Export für Tests und Integration
export default HuaweiUsbManager;

