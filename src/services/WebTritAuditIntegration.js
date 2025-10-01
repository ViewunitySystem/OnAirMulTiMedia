import fs from 'node:fs';
import { createHash } from 'crypto';

// WebTrit-Audit-Integration mit bestehendem OAMTM-System
class WebTritAuditIntegration {
  constructor() {
    this.auditDir = 'audit/events';
    this.webtritAuditFile = `${this.auditDir}/webtrit-tokens.jsonl`;
    this.commsAuditFile = `${this.auditDir}/comms-events.jsonl`;
    this.swipeAuditFile = `${this.auditDir}/swipe-events.jsonl`;
    
    this.ensureAuditDirectory();
  }

  ensureAuditDirectory() {
    if (!fs.existsSync(this.auditDir)) {
      fs.mkdirSync(this.auditDir, { recursive: true });
    }
  }

  // Audit-Event in JSONL-Format schreiben
  writeAuditEvent(event, filename) {
    try {
      const auditLine = JSON.stringify({
        ...event,
        hash: this.generateEventHash(event),
        audit_version: '2025.10.01'
      }) + '\n';
      
      fs.appendFileSync(filename, auditLine);
      
      // Console-Log für Development
      console.debug('AUDIT_EVENT:', auditLine.trim());
      
    } catch (error) {
      console.error('Audit write error:', error);
    }
  }

  // Event-Hash für Integrität generieren
  generateEventHash(event) {
    const eventData = {
      event: event.event,
      timestamp: event.timestamp,
      user_id: event.user_id || 'anonymous',
      session_id: event.session_id || 'none'
    };
    
    return createHash('sha256')
      .update(JSON.stringify(eventData))
      .digest('hex')
      .substring(0, 16);
  }

  // WebTrit-Token-Events
  emitTokenEvent(eventType, userId, sessionId, metadata = {}) {
    const event = {
      event: `WEBTRIT_TOKEN_${eventType}`,
      timestamp: new Date().toISOString(),
      user_id: userId,
      session_id: sessionId,
      service: 'webtrit-token-service',
      metadata: {
        ...metadata,
        feature_flag: 'comms_enabled'
      }
    };

    this.writeAuditEvent(event, this.webtritAuditFile);
    return event;
  }

  // Comms-Dock-Events
  emitCommsEvent(eventType, reason, metadata = {}) {
    const event = {
      event: `COMMS_DOCK_${eventType}`,
      timestamp: new Date().toISOString(),
      reason,
      metadata: {
        ...metadata,
        swipe_enhanced: true,
        webtrit_integration: true
      }
    };

    this.writeAuditEvent(event, this.commsAuditFile);
    return event;
  }

  // Swipe-Events
  emitSwipeEvent(gesture, intensity, position, metadata = {}) {
    const event = {
      event: 'SWIPE_DETECTED',
      timestamp: new Date().toISOString(),
      gesture,
      intensity,
      position,
      metadata: {
        ...metadata,
        webtrit_context: true,
        comms_handle: position.x > (window.innerWidth - 64)
      }
    };

    this.writeAuditEvent(event, this.swipeAuditFile);
    return event;
  }

  // WebTrit-Call-Events
  emitCallEvent(eventType, callId, metadata = {}) {
    const event = {
      event: `WEBTRIT_CALL_${eventType}`,
      timestamp: new Date().toISOString(),
      call_id: callId,
      metadata: {
        ...metadata,
        provider: 'webtrit',
        swipe_initiated: metadata.swipe_initiated || false
      }
    };

    this.writeAuditEvent(event, this.commsAuditFile);
    return event;
  }

  // CSP-Violation-Events
  emitCSPViolation(violation, metadata = {}) {
    const event = {
      event: 'CSP_VIOLATION',
      timestamp: new Date().toISOString(),
      violation: {
        blocked_uri: violation.blockedURI,
        violated_directive: violation.violatedDirective,
        document_uri: violation.documentURI,
        referrer: violation.referrer
      },
      metadata: {
        ...metadata,
        webtrit_related: violation.blockedURI?.includes('webtrit') || false
      }
    };

    this.writeAuditEvent(event, `${this.auditDir}/csp-violations.jsonl`);
    return event;
  }

  // Feature-Flag-Events
  emitFeatureFlagEvent(flagName, enabled, reason, metadata = {}) {
    const event = {
      event: 'FEATURE_FLAG_TOGGLE',
      timestamp: new Date().toISOString(),
      flag: flagName,
      enabled,
      reason,
      metadata: {
        ...metadata,
        environment: process.env.NODE_ENV || 'development',
        url_parameter: reason === 'url_parameter'
      }
    };

    this.writeAuditEvent(event, `${this.auditDir}/feature-flags.jsonl`);
    return event;
  }

  // Audit-Report generieren
  generateAuditReport() {
    const report = {
      timestamp: new Date().toISOString(),
      report_type: 'webtrit_integration',
      files: [
        this.webtritAuditFile,
        this.commsAuditFile,
        this.swipeAuditFile,
        `${this.auditDir}/csp-violations.jsonl`,
        `${this.auditDir}/feature-flags.jsonl`
      ],
      summary: this.generateSummary()
    };

    return report;
  }

  // Zusammenfassung der Audit-Events
  generateSummary() {
    const summary = {
      total_events: 0,
      event_types: {},
      time_range: { start: null, end: null },
      webtrit_integration: {
        token_events: 0,
        comms_events: 0,
        swipe_events: 0,
        csp_violations: 0,
        feature_flag_toggles: 0
      }
    };

    // Dateien durchgehen und Events zählen
    const files = [
      this.webtritAuditFile,
      this.commsAuditFile,
      this.swipeAuditFile,
      `${this.auditDir}/csp-violations.jsonl`,
      `${this.auditDir}/feature-flags.jsonl`
    ];

    files.forEach(file => {
      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const lines = content.trim().split('\n').filter(line => line.trim());
          
          lines.forEach(line => {
            try {
              const event = JSON.parse(line);
              summary.total_events++;
              
              // Event-Type zählen
              summary.event_types[event.event] = (summary.event_types[event.event] || 0) + 1;
              
              // Zeitraum aktualisieren
              if (!summary.time_range.start || event.timestamp < summary.time_range.start) {
                summary.time_range.start = event.timestamp;
              }
              if (!summary.time_range.end || event.timestamp > summary.time_range.end) {
                summary.time_range.end = event.timestamp;
              }
              
              // WebTrit-spezifische Events zählen
              if (event.event.includes('WEBTRIT_TOKEN')) {
                summary.webtrit_integration.token_events++;
              } else if (event.event.includes('COMMS_DOCK')) {
                summary.webtrit_integration.comms_events++;
              } else if (event.event.includes('SWIPE_DETECTED')) {
                summary.webtrit_integration.swipe_events++;
              } else if (event.event.includes('CSP_VIOLATION')) {
                summary.webtrit_integration.csp_violations++;
              } else if (event.event.includes('FEATURE_FLAG')) {
                summary.webtrit_integration.feature_flag_toggles++;
              }
              
            } catch (e) {
              console.warn('Invalid JSON in audit file:', line);
            }
          });
        } catch (e) {
          console.warn('Error reading audit file:', file);
        }
      }
    });

    return summary;
  }
}

// Singleton Instance
export const webTritAudit = new WebTritAuditIntegration();

// Convenience Functions für einfache Verwendung
export function emitTokenAudit(eventType, userId, sessionId, metadata) {
  return webTritAudit.emitTokenEvent(eventType, userId, sessionId, metadata);
}

export function emitCommsAudit(eventType, reason, metadata) {
  return webTritAudit.emitCommsEvent(eventType, reason, metadata);
}

export function emitSwipeAudit(gesture, intensity, position, metadata) {
  return webTritAudit.emitSwipeEvent(gesture, intensity, position, metadata);
}

export function emitCallAudit(eventType, callId, metadata) {
  return webTritAudit.emitCallEvent(eventType, callId, metadata);
}

export function emitCSPAudit(violation, metadata) {
  return webTritAudit.emitCSPViolation(violation, metadata);
}

export function emitFeatureFlagAudit(flagName, enabled, reason, metadata) {
  return webTritAudit.emitFeatureFlagEvent(flagName, enabled, reason, metadata);
}

