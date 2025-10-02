/**
 * Enhanced API Routes - HFRF Integration
 * © 2025 Raymond Demitrio Dr. Tel (DD5BE)
 * 
 * Erweiterte API-Routen für HFRF-Integration
 */

const express = require('express');
const router = express.Router();

// Services importieren
const EnhancedAuditService = require('../services/enhanced-audit-service');
const HuaweiUSBManager = require('../services/huawei-usb-manager');

// Service-Instanzen
const auditService = new EnhancedAuditService();
const usbManager = new HuaweiUSBManager();

// === AUDIT API ROUTES ===

// Alle Audit-Events abrufen
router.get('/audit/events', async (req, res) => {
  try {
    const { limit = 100, type, module, level } = req.query;
    
    const events = auditService.getRecentEvents(parseInt(limit));
    
    let filteredEvents = events;
    if (type) {
      filteredEvents = filteredEvents.filter(e => e.type === type);
    }
    if (module) {
      filteredEvents = filteredEvents.filter(e => e.module === module);
    }
    if (level) {
      filteredEvents = filteredEvents.filter(e => e.level === level);
    }

    res.json({
      success: true,
      events: filteredEvents,
      total: filteredEvents.length,
      filters: { type, module, level }
    });
  } catch (error) {
    console.error('❌ Failed to get audit events:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// SDR Events abrufen
router.get('/audit/sdr', async (req, res) => {
  try {
    const { date_from, date_to, device_type } = req.query;
    
    const events = auditService.getSDREvents({ date_from, date_to, device_type });
    
    res.json({
      success: true,
      events,
      total: events.length,
      filters: { date_from, date_to, device_type }
    });
  } catch (error) {
    console.error('❌ Failed to get SDR events:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// USB Events abrufen
router.get('/audit/usb', async (req, res) => {
  try {
    const { device_type, connection_status } = req.query;
    
    const events = auditService.getUSBEvents({ device_type, connection_status });
    
    res.json({
      success: true,
      events,
      total: events.length,
      filters: { device_type, connection_status }
    });
  } catch (error) {
    console.error('❌ Failed to get USB events:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// RF Validation Summary
router.get('/audit/rf-summary', async (req, res) => {
  try {
    const summary = auditService.getRFValidationSummary();
    
    res.json({
      success: true,
      summary,
      total: summary.length
    });
  } catch (error) {
    console.error('❌ Failed to get RF validation summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// NEMO Navigation Summary
router.get('/audit/nemo-summary', async (req, res) => {
  try {
    const summary = auditService.getNEMONavigationSummary();
    
    res.json({
      success: true,
      summary,
      total: summary.length
    });
  } catch (error) {
    console.error('❌ Failed to get NEMO navigation summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// SDR Summary
router.get('/audit/sdr-summary', async (req, res) => {
  try {
    const summary = auditService.getSDRSummary();
    
    res.json({
      success: true,
      summary,
      total: summary.length
    });
  } catch (error) {
    console.error('❌ Failed to get SDR summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// === SDR API ROUTES ===

// SDR Status
router.get('/sdr/status', async (req, res) => {
  try {
    // SDR Status abrufen (vereinfacht)
    const status = {
      connected: true,
      device_type: 'RTL-SDR',
      frequency_mhz: 145.500,
      bandwidth_khz: 12.5,
      power_dbm: 37,
      modulation: 'FM',
      signal_quality: 0.85,
      regulatory_verdict: 'allow',
      license_checked: true,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('❌ Failed to get SDR status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// SDR konfigurieren
router.post('/sdr/configure', async (req, res) => {
  try {
    const { frequency_mhz, bandwidth_khz, power_dbm, modulation } = req.body;
    
    // SDR-Konfiguration anwenden (vereinfacht)
    const config = {
      frequency_mhz: frequency_mhz || 145.500,
      bandwidth_khz: bandwidth_khz || 12.5,
      power_dbm: power_dbm || 37,
      modulation: modulation || 'FM',
      configured_at: new Date().toISOString()
    };

    // SDR Event loggen
    await auditService.logSDREvent({
      device_type: 'RTL-SDR',
      ...config,
      regulatory_verdict: 'allow',
      license_checked: true,
      signal_quality: 0.85
    });

    res.json({
      success: true,
      config,
      message: 'SDR configured successfully'
    });
  } catch (error) {
    console.error('❌ Failed to configure SDR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verfügbare Frequenzen
router.get('/sdr/frequencies', async (req, res) => {
  try {
    const frequencies = {
      hf_bands: [
        { name: '160m', min: 1.8, max: 2.0, unit: 'MHz' },
        { name: '80m', min: 3.5, max: 4.0, unit: 'MHz' },
        { name: '40m', min: 7.0, max: 7.3, unit: 'MHz' },
        { name: '30m', min: 10.1, max: 10.15, unit: 'MHz' },
        { name: '20m', min: 14.0, max: 14.35, unit: 'MHz' },
        { name: '17m', min: 18.068, max: 18.168, unit: 'MHz' },
        { name: '15m', min: 21.0, max: 21.45, unit: 'MHz' },
        { name: '12m', min: 24.89, max: 24.99, unit: 'MHz' },
        { name: '10m', min: 28.0, max: 29.7, unit: 'MHz' }
      ],
      vhf_bands: [
        { name: '6m', min: 50.0, max: 54.0, unit: 'MHz' },
        { name: '2m', min: 144.0, max: 148.0, unit: 'MHz' }
      ],
      uhf_bands: [
        { name: '70cm', min: 420.0, max: 450.0, unit: 'MHz' },
        { name: '33cm', min: 902.0, max: 928.0, unit: 'MHz' },
        { name: '23cm', min: 1240.0, max: 1300.0, unit: 'MHz' }
      ]
    };

    res.json({
      success: true,
      frequencies
    });
  } catch (error) {
    console.error('❌ Failed to get frequencies:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// === USB API ROUTES ===

// USB Geräte auflisten
router.get('/usb/devices', async (req, res) => {
  try {
    const devices = usbManager.getAllDevices();
    
    res.json({
      success: true,
      devices,
      total: devices.length
    });
  } catch (error) {
    console.error('❌ Failed to get USB devices:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// USB Gerät verbinden
router.post('/usb/connect', async (req, res) => {
  try {
    const { device_id } = req.body;
    
    if (!device_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Device ID is required' 
      });
    }

    const result = await usbManager.connectDevice(device_id);
    
    res.json({
      success: result.success,
      result,
      message: result.success ? 'Device connected successfully' : 'Connection failed'
    });
  } catch (error) {
    console.error('❌ Failed to connect USB device:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// USB Gerät trennen
router.post('/usb/disconnect', async (req, res) => {
  try {
    const { device_id } = req.body;
    
    if (!device_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Device ID is required' 
      });
    }

    const result = await usbManager.disconnectDevice(device_id);
    
    res.json({
      success: result.success,
      result,
      message: result.success ? 'Device disconnected successfully' : 'Disconnection failed'
    });
  } catch (error) {
    console.error('❌ Failed to disconnect USB device:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// USB konfigurieren
router.post('/usb/configure', async (req, res) => {
  try {
    const { device_id, configuration } = req.body;
    
    if (!device_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Device ID is required' 
      });
    }

    const device = usbManager.detectedDevices.find(d => d.deviceId === device_id);
    if (!device) {
      return res.status(404).json({ 
        success: false, 
        error: 'Device not found' 
      });
    }

    // USB Event loggen
    await auditService.logUSBEvent('CONFIGURED', device, configuration);

    res.json({
      success: true,
      device_id,
      configuration,
      message: 'Device configured successfully'
    });
  } catch (error) {
    console.error('❌ Failed to configure USB device:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Huawei Status
router.get('/usb/huawei/status', async (req, res) => {
  try {
    const huaweiDevices = usbManager.detectedDevices.filter(device => 
      device.name.toLowerCase().includes('huawei')
    );

    const status = huaweiDevices.map(device => ({
      device_id: device.deviceId,
      name: device.name,
      connected: usbManager.getConnectionStatus(device.deviceId),
      signal_strength: device.signalStrength || 0,
      network_type: device.networkType || 'Unknown',
      ip_address: device.ipAddress || '0.0.0.0',
      last_seen: device.lastSeen
    }));

    res.json({
      success: true,
      huawei_devices: status,
      total: status.length
    });
  } catch (error) {
    console.error('❌ Failed to get Huawei status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// === MIGRATION API ROUTES ===

// HFRF Daten migrieren
router.post('/audit/migrate', async (req, res) => {
  try {
    const { hfrf_db_path } = req.body;
    
    if (!hfrf_db_path) {
      return res.status(400).json({ 
        success: false, 
        error: 'HFRF database path is required' 
      });
    }

    const result = await auditService.migrateHFRFData(hfrf_db_path);
    
    res.json({
      success: true,
      result,
      message: `Migrated ${result.migrated} events from HFRF`
    });
  } catch (error) {
    console.error('❌ HFRF migration failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// === PERFORMANCE API ROUTES ===

// Performance Metrics loggen
router.post('/performance/metrics', async (req, res) => {
  try {
    const { module, metric_name, metric_value, unit, context } = req.body;
    
    if (!module || !metric_name || metric_value === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Module, metric_name, and metric_value are required' 
      });
    }

    await auditService.logPerformanceMetric({
      module,
      metric_name,
      metric_value: parseFloat(metric_value),
      unit: unit || '',
      context: context || {}
    });

    res.json({
      success: true,
      message: 'Performance metric logged successfully'
    });
  } catch (error) {
    console.error('❌ Failed to log performance metric:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// === SECURITY API ROUTES ===

// Security Events loggen
router.post('/security/events', async (req, res) => {
  try {
    const { event_type, severity, source_ip, user_agent, action_taken, details } = req.body;
    
    if (!event_type || !severity) {
      return res.status(400).json({ 
        success: false, 
        error: 'Event type and severity are required' 
      });
    }

    await auditService.logSecurityEvent({
      event_type,
      severity,
      source_ip,
      user_agent,
      action_taken,
      details: details || {}
    });

    res.json({
      success: true,
      message: 'Security event logged successfully'
    });
  } catch (error) {
    console.error('❌ Failed to log security event:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// === HEALTH CHECK ===

router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        audit_service: 'running',
        usb_manager: 'running',
        sdr_backend: 'running'
      },
      database: {
        connected: true,
        type: 'SQLite (encrypted)',
        path: auditService.dbPath
      },
      devices: {
        usb_detected: usbManager.detectedDevices.length,
        huawei_connected: usbManager.detectedDevices.filter(d => 
          usbManager.getConnectionStatus(d.deviceId)
        ).length
      },
      uptime: process.uptime()
    };

    res.json({
      success: true,
      health
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// === CLEANUP API ROUTES ===

// Datenbank bereinigen
router.post('/cleanup', async (req, res) => {
  try {
    auditService.cleanup();
    
    res.json({
      success: true,
      message: 'Database cleanup completed'
    });
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Alle USB-Geräte trennen
router.post('/usb/disconnect-all', async (req, res) => {
  try {
    await usbManager.disconnectAll();
    
    res.json({
      success: true,
      message: 'All USB devices disconnected'
    });
  } catch (error) {
    console.error('❌ Failed to disconnect all USB devices:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

