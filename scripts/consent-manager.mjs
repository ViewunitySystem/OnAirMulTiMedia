/**
 * OAMTM Consent Manager
 * GDPR-compliant consent management for OS integration capabilities
 */

class ConsentManager {
  constructor() {
    this.consentData = this.loadConsentData();
    this.capabilities = null;
    this.initialize();
  }

  async initialize() {
    // Load capabilities from capabilities.json
    try {
      const response = await fetch('/capabilities.json');
      this.capabilities = await response.json();
    } catch (error) {
      console.warn('Could not load capabilities.json, using defaults');
      this.capabilities = this.getDefaultCapabilities();
    }
  }

  getDefaultCapabilities() {
    return {
      name: "OAMTM Hub",
      scopes: ["camera", "microphone", "contacts", "calendar", "notifications", "location", "storage", "share", "telephony", "sms"],
      purpose: {
        camera: "QR/Video scanning, document capture, video calls",
        microphone: "Voice commands, audio recording, communication",
        contacts: "Meeting autofill, communication integration",
        calendar: "Event scheduling, meeting coordination",
        notifications: "System alerts, mission updates, health monitoring",
        location: "Mission tracking, navigation, geofencing",
        storage: "Data persistence, offline capabilities, backup",
        share: "Content sharing, collaboration, export",
        telephony: "Voice calls, emergency communication",
        sms: "Text messaging, alerts, notifications"
      },
      retention: {
        logs: "30d",
        telemetry: "90d",
        audit: "1y",
        user_data: "until_deleted"
      },
      privacy: {
        gdpr_compliant: true,
        data_minimization: true,
        purpose_limitation: true,
        storage_limitation: true,
        transparency: true,
        user_control: true
      }
    };
  }

  loadConsentData() {
    try {
      const stored = localStorage.getItem('oamtm-consent');
      return stored ? JSON.parse(stored) : {
        version: "1.0.0",
        timestamp: null,
        consent: {},
        preferences: {
          analytics: false,
          marketing: false,
          essential: true
        },
        revoked: []
      };
    } catch (error) {
      console.warn('Could not load consent data, using defaults');
      return {
        version: "1.0.0",
        timestamp: null,
        consent: {},
        preferences: {
          analytics: false,
          marketing: false,
          essential: true
        },
        revoked: []
      };
    }
  }

  saveConsentData() {
    try {
      localStorage.setItem('oamtm-consent', JSON.stringify(this.consentData));
    } catch (error) {
      console.error('Could not save consent data:', error);
    }
  }

  // Check if consent is required for a specific capability
  isConsentRequired(capability) {
    if (!this.capabilities) return false;
    
    // Essential capabilities don't require explicit consent
    const essentialCapabilities = ['storage', 'notifications'];
    if (essentialCapabilities.includes(capability)) {
      return false;
    }

    // Check if capability is in scope
    return this.capabilities.scopes.includes(capability);
  }

  // Check if user has consented to a specific capability
  hasConsent(capability) {
    // Essential capabilities are always consented
    const essentialCapabilities = ['storage', 'notifications'];
    if (essentialCapabilities.includes(capability)) {
      return true;
    }

    // Check if consent was revoked
    if (this.consentData.revoked.includes(capability)) {
      return false;
    }

    // Check explicit consent
    return this.consentData.consent[capability] === true;
  }

  // Grant consent for a specific capability
  grantConsent(capability, purpose = null) {
    if (!this.isConsentRequired(capability)) {
      return true;
    }

    this.consentData.consent[capability] = true;
    this.consentData.timestamp = new Date().toISOString();
    
    // Remove from revoked list if present
    this.consentData.revoked = this.consentData.revoked.filter(c => c !== capability);
    
    this.saveConsentData();
    this.logConsentAction('grant', capability, purpose);
    return true;
  }

  // Revoke consent for a specific capability
  revokeConsent(capability) {
    // Essential capabilities cannot be revoked
    const essentialCapabilities = ['storage', 'notifications'];
    if (essentialCapabilities.includes(capability)) {
      return false;
    }

    this.consentData.consent[capability] = false;
    this.consentData.timestamp = new Date().toISOString();
    
    // Add to revoked list
    if (!this.consentData.revoked.includes(capability)) {
      this.consentData.revoked.push(capability);
    }
    
    this.saveConsentData();
    this.logConsentAction('revoke', capability);
    return true;
  }

  // Get all consented capabilities
  getConsentedCapabilities() {
    const consented = [];
    
    if (this.capabilities) {
      this.capabilities.scopes.forEach(capability => {
        if (this.hasConsent(capability)) {
          consented.push(capability);
        }
      });
    }
    
    return consented;
  }

  // Get consent status for all capabilities
  getConsentStatus() {
    const status = {};
    
    if (this.capabilities) {
      this.capabilities.scopes.forEach(capability => {
        status[capability] = {
          required: this.isConsentRequired(capability),
          granted: this.hasConsent(capability),
          purpose: this.capabilities.purpose[capability] || 'OS integration',
          retention: this.capabilities.retention.logs || '30d'
        };
      });
    }
    
    return status;
  }

  // Request consent for multiple capabilities
  async requestConsent(capabilities, options = {}) {
    const requiredCapabilities = capabilities.filter(cap => this.isConsentRequired(cap));
    
    if (requiredCapabilities.length === 0) {
      return { granted: true, capabilities: [] };
    }

    // Show consent UI
    const result = await this.showConsentUI(requiredCapabilities, options);
    
    if (result.granted) {
      result.capabilities.forEach(capability => {
        this.grantConsent(capability, options.purpose);
      });
    }
    
    return result;
  }

  // Show consent UI (to be implemented by UI layer)
  async showConsentUI(capabilities, options = {}) {
    // This would typically show a modal or consent banner
    // For now, return a promise that resolves with user choice
    return new Promise((resolve) => {
      // In a real implementation, this would show a UI
      // For demo purposes, we'll auto-grant after a delay
      setTimeout(() => {
        resolve({
          granted: true,
          capabilities: capabilities
        });
      }, 1000);
    });
  }

  // Log consent actions for audit trail
  logConsentAction(action, capability, purpose = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: action,
      capability: capability,
      purpose: purpose,
      userAgent: navigator.userAgent,
      version: this.consentData.version
    };

    // Store in audit trail
    try {
      const auditTrail = JSON.parse(localStorage.getItem('oamtm-audit-trail') || '[]');
      auditTrail.push(logEntry);
      
      // Keep only last 1000 entries
      if (auditTrail.length > 1000) {
        auditTrail.splice(0, auditTrail.length - 1000);
      }
      
      localStorage.setItem('oamtm-audit-trail', JSON.stringify(auditTrail));
    } catch (error) {
      console.error('Could not log consent action:', error);
    }
  }

  // Export consent data for user
  exportConsentData() {
    const exportData = {
      consent: this.consentData,
      capabilities: this.capabilities,
      status: this.getConsentStatus(),
      auditTrail: JSON.parse(localStorage.getItem('oamtm-audit-trail') || '[]'),
      exported: new Date().toISOString()
    };

    return exportData;
  }

  // Generate consent report
  generateConsentReport() {
    const status = this.getConsentStatus();
    const consented = Object.values(status).filter(s => s.granted).length;
    const total = Object.keys(status).length;
    
    return {
      summary: {
        total: total,
        consented: consented,
        pending: total - consented,
        compliance: this.capabilities?.privacy?.gdpr_compliant || false
      },
      details: status,
      timestamp: new Date().toISOString()
    };
  }

  // Reset all consent (for testing/debugging)
  resetConsent() {
    this.consentData = {
      version: "1.0.0",
      timestamp: null,
      consent: {},
      preferences: {
        analytics: false,
        marketing: false,
        essential: true
      },
      revoked: []
    };
    this.saveConsentData();
    this.logConsentAction('reset', 'all');
  }

  // Check if consent is up to date
  isConsentUpToDate() {
    if (!this.consentData.timestamp) {
      return false;
    }

    // Check if consent is older than 1 year
    const consentDate = new Date(this.consentData.timestamp);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    return consentDate > oneYearAgo;
  }

  // Request re-consent if needed
  async requestReConsentIfNeeded() {
    if (!this.isConsentUpToDate()) {
      const allCapabilities = this.capabilities?.scopes || [];
      return await this.requestConsent(allCapabilities, {
        purpose: 'Consent renewal required',
        force: true
      });
    }
    return { granted: true, capabilities: [] };
  }
}

// Export for use in other modules
export { ConsentManager };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const consentManager = new ConsentManager();
  
  console.log('🔒 OAMTM Consent Manager');
  console.log('=======================');
  console.log('');
  
  // Wait for initialization
  setTimeout(() => {
    const status = consentManager.getConsentStatus();
    const report = consentManager.generateConsentReport();
    
    console.log('Consent Status:');
    console.log(JSON.stringify(status, null, 2));
    console.log('');
    console.log('Consent Report:');
    console.log(JSON.stringify(report, null, 2));
    console.log('');
    console.log('Consented Capabilities:');
    console.log(consentManager.getConsentedCapabilities());
  }, 1000);
}
