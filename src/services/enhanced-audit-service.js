/**
 * Enhanced Audit Service - HFRF Integration
 * © 2025 Raymond Demitrio Dr. Tel (DD5BE)
 * 
 * Erweiterte Audit-Services mit SQLite, SDR, USB und Ed25519 Integration
 */

const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');

class EnhancedAuditService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../audit/sqlite/enhanced-audit.db');
    this.db = new Database(this.dbPath);
    this.keyPair = null;
    
    this.initializeDatabase();
    this.loadOrGenerateKeys();
  }

  initializeDatabase() {
    try {
      // Verschlüsselte SQLite-Datenbank
      this.db.pragma('key = "oamtm-2025-security-key"');
      this.db.pragma('cipher_page_size = 4096');
      this.db.pragma('kdf_iter = 64000');
      
      // Schema laden
      const schemaPath = path.join(__dirname, '../../audit/sqlite/enhanced-audit-schema.sql');
      const schema = require('fs').readFileSync(schemaPath, 'utf8');
      this.db.exec(schema);
      
      console.log('✅ Enhanced Audit Database initialized');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
    }
  }

  loadOrGenerateKeys() {
    try {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });
      
      this.keyPair = { publicKey, privateKey };
      console.log('✅ Ed25519 keys loaded/generated');
    } catch (error) {
      console.error('❌ Key generation failed:', error);
    }
  }

  // === AUDIT EVENT MANAGEMENT ===

  async logEvent(event) {
    const auditEvent = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...event
    };

    // Signatur erstellen falls verfügbar
    if (this.keyPair) {
      const signature = this.signData(auditEvent);
      auditEvent.signature = signature.signature;
      auditEvent.checksum = signature.checksum;
      auditEvent.key_id = 'oamtm-2025';
    }

    try {
      const stmt = this.db.prepare(`
        INSERT INTO enhanced_audit_events 
        (id, timestamp, type, level, payload, module, room_id, signature, checksum, key_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        auditEvent.id,
        auditEvent.timestamp,
        auditEvent.type,
        auditEvent.level || 'info',
        JSON.stringify(auditEvent.payload || {}),
        auditEvent.module || null,
        auditEvent.room_id || null,
        auditEvent.signature || null,
        auditEvent.checksum || null,
        auditEvent.key_id || null
      );

      return auditEvent;
    } catch (error) {
      console.error('❌ Failed to log audit event:', error);
      throw error;
    }
  }

  // === SDR EVENTS ===

  async logSDREvent(sdrData) {
    const event = {
      id: `sdr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...sdrData
    };

    try {
      const stmt = this.db.prepare(`
        INSERT INTO sdr_events 
        (id, timestamp, device_type, frequency_mhz, bandwidth_khz, power_dbm, 
         modulation, signal_quality, regulatory_verdict, license_checked)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        event.id,
        event.timestamp,
        event.device_type || 'unknown',
        event.frequency_mhz || 0,
        event.bandwidth_khz || 0,
        event.power_dbm || 0,
        event.modulation || 'unknown',
        event.signal_quality || 0,
        event.regulatory_verdict || 'unknown',
        event.license_checked || false
      );

      // Hauptaudit-Event loggen
      await this.logEvent({
        type: 'SDR_EVENT',
        level: 'info',
        module: 'SDR_BACKEND',
        payload: sdrData
      });

      return event;
    } catch (error) {
      console.error('❌ Failed to log SDR event:', error);
      throw error;
    }
  }

  // === USB EVENTS ===

  async logUSBEvent(usbData) {
    const event = {
      id: `usb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...usbData
    };

    try {
      const stmt = this.db.prepare(`
        INSERT INTO usb_events 
        (id, timestamp, device_type, device_id, vendor_id, product_id, 
         serial_number, driver_version, connection_status, configuration_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        event.id,
        event.timestamp,
        event.device_type || 'unknown',
        event.device_id || '',
        event.vendor_id || '',
        event.product_id || '',
        event.serial_number || null,
        event.driver_version || null,
        event.connection_status || 'unknown',
        JSON.stringify(event.configuration_data || {})
      );

      // Hauptaudit-Event loggen
      await this.logEvent({
        type: 'USB_EVENT',
        level: 'info',
        module: 'USB_MANAGER',
        payload: usbData
      });

      return event;
    } catch (error) {
      console.error('❌ Failed to log USB event:', error);
      throw error;
    }
  }

  // === NEMO PATHFINDER EVENTS ===

  async logNEMOEvent(nemoData) {
    const event = {
      id: `nemo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...nemoData
    };

    try {
      const stmt = this.db.prepare(`
        INSERT INTO nemo_events 
        (id, timestamp, waypoint_from, waypoint_to, heading_deg, eta_iso, 
         status, advisory, comm_status, signal_quality, license)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        event.id,
        event.timestamp,
        event.waypoint_from || null,
        event.waypoint_to || null,
        event.heading_deg || 0,
        event.eta_iso || new Date().toISOString(),
        event.status || 'unknown',
        event.advisory || '',
        event.comm_status || 'unknown',
        event.signal_quality || 0,
        event.license || null
      );

      // Hauptaudit-Event loggen
      await this.logEvent({
        type: 'NEMO_EVENT',
        level: 'info',
        module: 'NEMO_PATHFINDER',
        payload: nemoData
      });

      return event;
    } catch (error) {
      console.error('❌ Failed to log NEMO event:', error);
      throw error;
    }
  }

  // === RF VALIDATION EVENTS ===

  async logRFValidationEvent(rfData) {
    const event = {
      id: `rf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...rfData
    };

    try {
      const stmt = this.db.prepare(`
        INSERT INTO rf_validation_events 
        (id, timestamp, frequency_mhz, bandwidth_khz, power_dbm, country, 
         license, modulation, verdict, rationale, band, regulatory_ref)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        event.id,
        event.timestamp,
        event.frequency_mhz || 0,
        event.bandwidth_khz || 0,
        event.power_dbm || 0,
        event.country || 'unknown',
        event.license || '',
        event.modulation || 'unknown',
        event.verdict || 'unknown',
        event.rationale || '',
        event.band || null,
        event.regulatory_ref || null
      );

      // Hauptaudit-Event loggen
      await this.logEvent({
        type: 'RF_VALIDATION',
        level: rfData.verdict === 'deny' ? 'warn' : 'info',
        module: 'RF_VALIDATION_ENGINE',
        payload: rfData
      });

      return event;
    } catch (error) {
      console.error('❌ Failed to log RF validation event:', error);
      throw error;
    }
  }

  // === CANVAS SWIPE EVENTS ===

  async logCanvasSwipeEvent(swipeData) {
    const event = {
      id: `swipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...swipeData
    };

    try {
      const stmt = this.db.prepare(`
        INSERT INTO canvas_swipe_events 
        (id, timestamp, gesture_type, direction, start_x, start_y, 
         end_x, end_y, velocity, action, target, processed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        event.id,
        event.timestamp,
        event.gesture_type || 'swipe',
        event.direction || 'unknown',
        event.start_x || 0,
        event.start_y || 0,
        event.end_x || 0,
        event.end_y || 0,
        event.velocity || 0,
        event.action || 'unknown',
        event.target || null,
        event.processed || false
      );

      // Hauptaudit-Event loggen
      await this.logEvent({
        type: 'CANVAS_SWIPE',
        level: 'info',
        module: 'CANVAS_SWIPE',
        payload: swipeData
      });

      return event;
    } catch (error) {
      console.error('❌ Failed to log canvas swipe event:', error);
      throw error;
    }
  }

  // === MEETING EVENTS ===

  async logMeetingEvent(meetingData) {
    const event = {
      id: `meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...meetingData
    };

    try {
      const stmt = this.db.prepare(`
        INSERT INTO meeting_events 
        (id, timestamp, meeting_title, start_time, duration_minutes, timezone, 
         participants, meeting_id, qr_code_url, join_url, local_time, license)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        event.id,
        event.timestamp,
        event.meeting_title || '',
        event.start_time || new Date().toISOString(),
        event.duration_minutes || 0,
        event.timezone || 'UTC',
        JSON.stringify(event.participants || []),
        event.meeting_id || '',
        event.qr_code_url || null,
        event.join_url || null,
        event.local_time || new Date().toISOString(),
        event.license || null
      );

      // Hauptaudit-Event loggen
      await this.logEvent({
        type: 'MEETING_EVENT',
        level: 'info',
        module: 'GLOBAL_MEETING_CLOCK',
        payload: meetingData
      });

      return event;
    } catch (error) {
      console.error('❌ Failed to log meeting event:', error);
      throw error;
    }
  }

  // === PERFORMANCE METRICS ===

  async logPerformanceMetric(metricData) {
    const event = {
      id: `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...metricData
    };

    try {
      const stmt = this.db.prepare(`
        INSERT INTO performance_metrics 
        (id, timestamp, module, metric_name, metric_value, unit, context)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        event.id,
        event.timestamp,
        event.module || 'unknown',
        event.metric_name || '',
        event.metric_value || 0,
        event.unit || '',
        JSON.stringify(event.context || {})
      );

      return event;
    } catch (error) {
      console.error('❌ Failed to log performance metric:', error);
      throw error;
    }
  }

  // === SECURITY EVENTS ===

  async logSecurityEvent(securityData) {
    const event = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...securityData
    };

    try {
      const stmt = this.db.prepare(`
        INSERT INTO security_events 
        (id, timestamp, event_type, severity, source_ip, user_agent, action_taken, details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        event.id,
        event.timestamp,
        event.event_type || 'unknown',
        event.severity || 'info',
        event.source_ip || null,
        event.user_agent || null,
        event.action_taken || null,
        JSON.stringify(event.details || {})
      );

      // Hauptaudit-Event loggen
      await this.logEvent({
        type: 'SECURITY_EVENT',
        level: event.severity || 'info',
        module: 'SECURITY',
        payload: securityData
      });

      return event;
    } catch (error) {
      console.error('❌ Failed to log security event:', error);
      throw error;
    }
  }

  // === QUERY METHODS ===

  getRecentEvents(limit = 100) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM recent_audit_events 
        ORDER BY timestamp DESC 
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (error) {
      console.error('❌ Failed to get recent events:', error);
      return [];
    }
  }

  getSDREvents(filters = {}) {
    try {
      let query = 'SELECT * FROM sdr_events';
      const conditions = [];
      const params = [];

      if (filters.date_from) {
        conditions.push('datetime(timestamp) >= datetime(?)');
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        conditions.push('datetime(timestamp) <= datetime(?)');
        params.push(filters.date_to);
      }

      if (filters.device_type) {
        conditions.push('device_type = ?');
        params.push(filters.device_type);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY timestamp DESC LIMIT 1000';

      const stmt = this.db.prepare(query);
      return stmt.all(...params);
    } catch (error) {
      console.error('❌ Failed to get SDR events:', error);
      return [];
    }
  }

  getUSBEvents(filters = {}) {
    try {
      let query = 'SELECT * FROM usb_events';
      const conditions = [];
      const params = [];

      if (filters.device_type) {
        conditions.push('device_type = ?');
        params.push(filters.device_type);
      }

      if (filters.connection_status) {
        conditions.push('connection_status = ?');
        params.push(filters.connection_status);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY timestamp DESC LIMIT 1000';

      const stmt = this.db.prepare(query);
      return stmt.all(...params);
    } catch (error) {
      console.error('❌ Failed to get USB events:', error);
      return [];
    }
  }

  getRFValidationSummary() {
    try {
      const stmt = this.db.prepare('SELECT * FROM rf_compliance_summary');
      return stmt.all();
    } catch (error) {
      console.error('❌ Failed to get RF validation summary:', error);
      return [];
    }
  }

  getNEMONavigationSummary() {
    try {
      const stmt = this.db.prepare('SELECT * FROM nemo_navigation_summary LIMIT 30');
      return stmt.all();
    } catch (error) {
      console.error('❌ Failed to get NEMO navigation summary:', error);
      return [];
    }
  }

  getSDRSummary() {
    try {
      const stmt = this.db.prepare('SELECT * FROM sdr_summary LIMIT 30');
      return stmt.all();
    } catch (error) {
      console.error('❌ Failed to get SDR summary:', error);
      return [];
    }
  }

  // === SIGNATURE METHODS ===

  signData(data) {
    if (!this.keyPair) {
      throw new Error('No key pair available for signing');
    }

    const sign = crypto.createSign('SHA256');
    sign.update(JSON.stringify(data));
    sign.end();
    const signature = sign.sign(this.keyPair.privateKey, 'base64');

    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    const checksum = hash.digest('hex');

    return { signature, checksum };
  }

  getPublicKey() {
    return this.keyPair ? this.keyPair.publicKey : null;
  }

  // === MIGRATION METHODS ===

  async migrateHFRFData(hfrfDbPath) {
    try {
      const hfrfDb = new Database(hfrfDbPath);
      
      const events = hfrfDb.prepare('SELECT * FROM audit_events').all();
      
      for (const event of events) {
        await this.logEvent({
          type: event.type,
          level: event.level,
          module: event.module,
          room_id: event.room_id,
          payload: JSON.parse(event.payload || '{}')
        });
      }

      hfrfDb.close();
      console.log(`✅ Migrated ${events.length} events from HFRF`);
      
      return { migrated: events.length };
    } catch (error) {
      console.error('❌ HFRF migration failed:', error);
      throw error;
    }
  }

  // === CLEANUP METHODS ===

  cleanup() {
    try {
      // Alte Daten löschen (älter als 1 Monat)
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - 1);
      
      const tables = [
        'enhanced_audit_events',
        'sdr_events',
        'usb_events',
        'nemo_events',
        'rf_validation_events',
        'canvas_swipe_events',
        'meeting_events',
        'performance_metrics',
        'security_events'
      ];

      for (const table of tables) {
        const stmt = this.db.prepare(`DELETE FROM ${table} WHERE datetime(timestamp) < datetime(?)`);
        const result = stmt.run(cutoffDate.toISOString());
        console.log(`🧹 Cleaned ${result.changes} old records from ${table}`);
      }

      // VACUUM für Optimierung
      this.db.exec('VACUUM');
      this.db.exec('ANALYZE');
      
      console.log('✅ Database cleanup completed');
    } catch (error) {
      console.error('❌ Database cleanup failed:', error);
    }
  }

  close() {
    if (this.db) {
      this.db.close();
      console.log('✅ Database connection closed');
    }
  }
}

module.exports = EnhancedAuditService;

