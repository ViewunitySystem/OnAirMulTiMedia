/**
 * OAMTM Cloud SQL API Client
 * Client-Side Integration für GitHub Pages
 */

class CloudSQLAPI {
  constructor() {
    // Lokale API URLs für Entwicklung
    this.baseURL = 'http://localhost:3001';
    this.endpoints = {
      auditEvents: '/api/audit-events',
      healthCheck: '/api/health-check',
      auditStats: '/api/audit-stats'
    };
  }

  /**
   * Audit Events abrufen
   */
  async getAuditEvents(limit = 100) {
    try {
      const response = await fetch(`${this.baseURL}${this.endpoints.auditEvents}?limit=${limit}`);
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          data: data.data,
          count: data.count
        };
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fetching audit events:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Neues Audit Event hinzufügen
   */
  async addAuditEvent(eventData) {
    try {
      const response = await fetch(`${this.baseURL}${this.endpoints.auditEvents}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error adding audit event:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * System Health Check
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}${this.endpoints.healthCheck}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Audit Statistiken abrufen
   */
  async getAuditStats() {
    try {
      const response = await fetch(`${this.baseURL}${this.endpoints.auditStats}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * API Status Dashboard
   */
  async getStatusDashboard() {
    const [health, stats] = await Promise.all([
      this.healthCheck(),
      this.getAuditStats()
    ]);

    return {
      health,
      stats,
      timestamp: new Date().toISOString(),
      api_version: '1.0.0'
    };
  }
}

// Globale API-Instanz erstellen
window.cloudSQLAPI = new CloudSQLAPI();

// Demo-Funktionen für sofortige Nutzung
window.testCloudSQLAPI = async function() {
  console.log('🧪 Testing Cloud SQL API...');
  
  const api = new CloudSQLAPI();
  
  // Health Check
  const health = await api.healthCheck();
  console.log('🏥 Health Check:', health);
  
  // Audit Events
  const events = await api.getAuditEvents(10);
  console.log('📊 Audit Events:', events);
  
  // Statistiken
  const stats = await api.getAuditStats();
  console.log('📈 Statistics:', stats);
  
  return { health, events, stats };
};

// Auto-Initialize beim Laden der Seite
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 OAMTM Cloud SQL API loaded');
  
  // API Status in der Konsole anzeigen
  if (window.cloudSQLAPI) {
    console.log('✅ Cloud SQL API ready');
    console.log('💡 Use testCloudSQLAPI() to test the API');
  }
});
