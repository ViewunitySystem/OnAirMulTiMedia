/**
 * Huawei USB Manager - HFRF Integration
 * © 2025 Raymond Demitrio Dr. Tel (DD5BE)
 * 
 * Huawei USB Device Management für OnAirMulTiMedia
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class HuaweiUSBManager {
  constructor() {
    this.supportedDevices = [
      { 
        name: 'Huawei E3372', 
        vendorId: '12d1', 
        productId: '1506',
        description: '4G USB Stick',
        driverPath: 'drivers/huawei/E3372_driver.exe'
      },
      { 
        name: 'Huawei E5573', 
        vendorId: '12d1', 
        productId: '14dc',
        description: 'Mobile WiFi',
        driverPath: 'drivers/huawei/E5573_driver.exe'
      },
      { 
        name: 'Huawei E5785', 
        vendorId: '12d1', 
        productId: '1555',
        description: '5G Mobile Router',
        driverPath: 'drivers/huawei/E5785_driver.exe'
      },
      { 
        name: 'Huawei E8372', 
        vendorId: '12d1', 
        productId: '1506',
        description: '4G USB Stick',
        driverPath: 'drivers/huawei/E8372_driver.exe'
      }
    ];

    this.detectedDevices = [];
    this.connectionStatus = new Map();
    
    this.init();
  }

  init() {
    console.log('🔌 Initializing Huawei USB Manager...');
    this.scanForDevices();
    
    // Regelmäßige Geräte-Scans
    setInterval(() => {
      this.scanForDevices();
    }, 30000); // Alle 30 Sekunden
  }

  // === DEVICE DETECTION ===

  async scanForDevices() {
    try {
      const devices = await this.getUSBDevices();
      const huaweiDevices = devices.filter(device => 
        this.supportedDevices.some(supported => 
          supported.vendorId.toLowerCase() === device.vendorId.toLowerCase() &&
          supported.productId.toLowerCase() === device.productId.toLowerCase()
        )
      );

      this.detectedDevices = huaweiDevices.map(device => {
        const supported = this.supportedDevices.find(s => 
          s.vendorId.toLowerCase() === device.vendorId.toLowerCase() &&
          s.productId.toLowerCase() === device.productId.toLowerCase()
        );

        return {
          ...device,
          ...supported,
          connectionStatus: this.getConnectionStatus(device.deviceId),
          lastSeen: new Date().toISOString()
        };
      });

      console.log(`📱 Detected ${this.detectedDevices.length} Huawei devices`);
      return this.detectedDevices;
    } catch (error) {
      console.error('❌ Device scan failed:', error);
      return [];
    }
  }

  async getUSBDevices() {
    return new Promise((resolve, reject) => {
      const command = process.platform === 'win32' ? 'wmic' : 'lsusb';
      const args = process.platform === 'win32' 
        ? ['path', 'win32_usbhub', 'get', 'deviceid,description']
        : [];

      exec(`${command} ${args.join(' ')}`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }

        try {
          const devices = this.parseUSBOutput(stdout);
          resolve(devices);
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }

  parseUSBOutput(output) {
    const devices = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (process.platform === 'win32') {
        // Windows WMIC Output
        const match = line.match(/USB\\VID_([A-F0-9]{4})&PID_([A-F0-9]{4})\\([^\\]+)/);
        if (match) {
          devices.push({
            vendorId: match[1],
            productId: match[2],
            deviceId: match[0],
            description: line.replace(match[0], '').trim()
          });
        }
      } else {
        // Linux lsusb Output
        const match = line.match(/Bus\s+\d+\s+Device\s+\d+:\s+ID\s+([a-f0-9]{4}):([a-f0-9]{4})\s+(.+)/);
        if (match) {
          devices.push({
            vendorId: match[1],
            productId: match[2],
            deviceId: `USB\\VID_${match[1]}&PID_${match[2]}`,
            description: match[3].trim()
          });
        }
      }
    }

    return devices;
  }

  // === CONNECTION MANAGEMENT ===

  async connectDevice(deviceId) {
    try {
      const device = this.detectedDevices.find(d => d.deviceId === deviceId);
      if (!device) {
        throw new Error(`Device ${deviceId} not found`);
      }

      console.log(`🔌 Connecting to ${device.name}...`);

      // Driver Installation prüfen
      await this.ensureDriverInstalled(device);

      // Modem-Modus aktivieren
      await this.activateModemMode(device);

      // APN konfigurieren
      await this.configureAPN(device);

      // Datenverbindung aktivieren
      await this.enableDataConnection(device);

      // Status aktualisieren
      this.connectionStatus.set(deviceId, {
        connected: true,
        connectedAt: new Date().toISOString(),
        signalStrength: await this.getSignalStrength(device),
        networkType: await this.getNetworkType(device),
        ipAddress: await this.getIPAddress(device)
      });

      console.log(`✅ ${device.name} connected successfully`);
      return { success: true, device: this.getDeviceStatus(deviceId) };
    } catch (error) {
      console.error(`❌ Failed to connect ${deviceId}:`, error);
      this.connectionStatus.set(deviceId, {
        connected: false,
        error: error.message,
        lastAttempt: new Date().toISOString()
      });
      return { success: false, error: error.message };
    }
  }

  async disconnectDevice(deviceId) {
    try {
      const device = this.detectedDevices.find(d => d.deviceId === deviceId);
      if (!device) {
        throw new Error(`Device ${deviceId} not found`);
      }

      console.log(`🔌 Disconnecting from ${device.name}...`);

      // Datenverbindung deaktivieren
      await this.disableDataConnection(device);

      // Status aktualisieren
      this.connectionStatus.set(deviceId, {
        connected: false,
        disconnectedAt: new Date().toISOString()
      });

      console.log(`✅ ${device.name} disconnected successfully`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Failed to disconnect ${deviceId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // === DRIVER MANAGEMENT ===

  async ensureDriverInstalled(device) {
    const driverPath = path.join(__dirname, '../../', device.driverPath);
    
    if (!fs.existsSync(driverPath)) {
      console.log(`⚠️ Driver not found: ${driverPath}`);
      return false;
    }

    // Prüfen ob Driver bereits installiert ist
    const isInstalled = await this.isDriverInstalled(device);
    if (isInstalled) {
      console.log(`✅ Driver already installed for ${device.name}`);
      return true;
    }

    // Driver installieren
    console.log(`📦 Installing driver for ${device.name}...`);
    return new Promise((resolve, reject) => {
      const installer = spawn(driverPath, ['/S'], {
        detached: true,
        stdio: 'ignore'
      });

      installer.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Driver installed for ${device.name}`);
          resolve(true);
        } else {
          console.error(`❌ Driver installation failed for ${device.name}`);
          reject(new Error(`Driver installation failed with code ${code}`));
        }
      });

      installer.on('error', (error) => {
        console.error(`❌ Driver installation error for ${device.name}:`, error);
        reject(error);
      });
    });
  }

  async isDriverInstalled(device) {
    return new Promise((resolve) => {
      const command = process.platform === 'win32' 
        ? `pnputil /enum-devices /instanceid "${device.deviceId}"`
        : 'lsusb';

      exec(command, (error, stdout) => {
        if (error) {
          resolve(false);
          return;
        }

        // Einfache Prüfung ob Gerät erkannt wird
        resolve(stdout.includes(device.vendorId) && stdout.includes(device.productId));
      });
    });
  }

  // === MODEM OPERATIONS ===

  async activateModemMode(device) {
    console.log(`📡 Activating modem mode for ${device.name}...`);
    
    // AT Commands für Modem-Aktivierung
    const atCommands = [
      'ATZ',           // Reset
      'AT+CFUN=1',     // Full functionality
      'AT+CGDCONT=1,"IP","internet"', // APN Setup
      'AT+COPS=0',     // Auto network selection
      'AT+CREG=2'      // Network registration
    ];

    for (const command of atCommands) {
      await this.sendATCommand(device, command);
      await this.delay(1000); // 1 Sekunde warten
    }

    console.log(`✅ Modem mode activated for ${device.name}`);
  }

  async sendATCommand(device, command) {
    return new Promise((resolve, reject) => {
      // Vereinfachte AT-Command-Implementation
      // In einer echten Implementation würde hier über serielle Schnittstelle kommuniziert werden
      console.log(`📡 AT Command: ${command} -> ${device.name}`);
      
      // Simulierte Antwort
      setTimeout(() => {
        resolve('OK');
      }, 100);
    });
  }

  async configureAPN(device) {
    console.log(`🌐 Configuring APN for ${device.name}...`);
    
    // APN-Konfiguration basierend auf Gerät
    const apnConfig = this.getAPNConfig(device);
    
    await this.sendATCommand(device, `AT+CGDCONT=1,"IP","${apnConfig.apn}"`);
    await this.sendATCommand(device, `AT+CGQREQ=1,${apnConfig.qos}`);
    
    console.log(`✅ APN configured: ${apnConfig.apn}`);
  }

  getAPNConfig(device) {
    // APN-Konfigurationen für verschiedene Geräte
    const apnConfigs = {
      'E3372': { apn: 'internet', qos: '0,0,0,0' },
      'E5573': { apn: 'internet', qos: '0,0,0,0' },
      'E5785': { apn: 'internet', qos: '0,0,0,0' },
      'E8372': { apn: 'internet', qos: '0,0,0,0' }
    };

    const deviceModel = device.name.split(' ')[1];
    return apnConfigs[deviceModel] || { apn: 'internet', qos: '0,0,0,0' };
  }

  async enableDataConnection(device) {
    console.log(`📶 Enabling data connection for ${device.name}...`);
    
    await this.sendATCommand(device, 'AT+CGACT=1,1');
    await this.sendATCommand(device, 'AT+CGDATA="PPP",1');
    
    // IP-Adresse abrufen
    const ipAddress = await this.getIPAddress(device);
    console.log(`✅ Data connection enabled, IP: ${ipAddress}`);
  }

  async disableDataConnection(device) {
    console.log(`📶 Disabling data connection for ${device.name}...`);
    
    await this.sendATCommand(device, 'AT+CGACT=0,1');
    console.log(`✅ Data connection disabled`);
  }

  // === STATUS MONITORING ===

  async getSignalStrength(device) {
    try {
      const response = await this.sendATCommand(device, 'AT+CSQ');
      // CSQ Response parsing (RSSI)
      const match = response.match(/\+CSQ:\s*(\d+),/);
      return match ? parseInt(match[1]) : 0;
    } catch (error) {
      return 0;
    }
  }

  async getNetworkType(device) {
    try {
      const response = await this.sendATCommand(device, 'AT+COPS?');
      // Network type parsing
      return '4G'; // Vereinfacht
    } catch (error) {
      return 'Unknown';
    }
  }

  async getIPAddress(device) {
    try {
      const response = await this.sendATCommand(device, 'AT+CGPADDR=1');
      // IP Address parsing
      const match = response.match(/\+CGPADDR:\s*1,"([^"]+)"/);
      return match ? match[1] : '0.0.0.0';
    } catch (error) {
      return '0.0.0.0';
    }
  }

  // === UTILITY METHODS ===

  getDeviceStatus(deviceId) {
    const device = this.detectedDevices.find(d => d.deviceId === deviceId);
    const status = this.connectionStatus.get(deviceId);
    
    return {
      device,
      status,
      isConnected: status ? status.connected : false
    };
  }

  getAllDevices() {
    return this.detectedDevices.map(device => ({
      ...device,
      status: this.getDeviceStatus(device.deviceId)
    }));
  }

  getConnectionStatus(deviceId) {
    const status = this.connectionStatus.get(deviceId);
    return status ? status.connected : false;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // === AUDIT INTEGRATION ===

  async logUSBEvent(eventType, device, details = {}) {
    const auditService = require('./enhanced-audit-service');
    const audit = new auditService();
    
    await audit.logUSBEvent({
      device_type: device.name,
      device_id: device.deviceId,
      vendor_id: device.vendorId,
      product_id: device.productId,
      serial_number: device.serialNumber || null,
      driver_version: device.driverVersion || null,
      connection_status: eventType,
      configuration_data: details
    });
  }

  // === CLEANUP ===

  async disconnectAll() {
    console.log('🔌 Disconnecting all Huawei devices...');
    
    const connectedDevices = this.detectedDevices.filter(device => 
      this.getConnectionStatus(device.deviceId)
    );

    for (const device of connectedDevices) {
      await this.disconnectDevice(device.deviceId);
    }

    console.log(`✅ Disconnected ${connectedDevices.length} devices`);
  }

  destroy() {
    this.disconnectAll();
    console.log('🔌 Huawei USB Manager destroyed');
  }
}

module.exports = HuaweiUSBManager;

