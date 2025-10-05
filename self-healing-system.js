// Self-Healing System für OnAirMulTiMedia
// Integriert Cloudflare Worker, WebSocket Recovery und Auto-Recovery
// SICHERHEIT: Nur für autorisierte Benutzer zugänglich

class SelfHealingSystem {
  constructor(config = {}) {
    this.apiBase = config.apiBase || 'https://onair-edge.telcotelekom.workers.dev';
    this.wsBase = config.wsBase || 'wss://onair-edge.telcotelekom.workers.dev/ws';
    this.recoveryLog = [];
    this.isHealthy = true;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.healthCheckInterval = null;
    this.wsConnection = null;

    // SICHERHEIT: Access Control
    this.authorizedUsers = ['gentlyoverdone@outlook.com']; // Nur autorisierte E-Mail
    this.isAuthorized = false;
    this.sessionToken = null;

    // AUTO-BUG-FIX: Automatische Code-Reparatur
    this.autoBugFixEnabled = true;
    this.bugDetectionInterval = null;
    this.fixQueue = [];
    this.serverEndpoints = [
      'https://onair-edge.telcotelekom.workers.dev',
      'https://viewunitysystem.github.io/OnAirMulTiMedia',
      'https://onairmultimedia.web.app'
    ];

    this.init();
  }

  // SICHERHEIT: Zugriffskontrolle
  async checkAuthorization() {
    const storedEmail = localStorage.getItem('onair_authorized_email');
    const storedToken = localStorage.getItem('onair_session_token');

    if (storedEmail && this.authorizedUsers.includes(storedEmail) && storedToken) {
      // Token validieren
      try {
        const response = await fetch(`${this.apiBase}/auth/validate`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${storedToken}` },
          body: JSON.stringify({ email: storedEmail })
        });

        if (response.ok) {
          this.isAuthorized = true;
          this.sessionToken = storedToken;
          return true;
        }
      } catch (error) {
        console.warn('Token validation failed:', error);
      }
    }

    return false;
  }

  async requestAuthorization() {
    const email = prompt('🔐 OnAir Self-Healing System\n\nZugriff nur für autorisierte Benutzer.\n\nE-Mail-Adresse eingeben:');

    if (!email) {
      this.showAccessDenied();
      return false;
    }

    if (!this.authorizedUsers.includes(email)) {
      alert('❌ Zugriff verweigert!\n\nDiese E-Mail-Adresse ist nicht autorisiert.');
      this.showAccessDenied();
      return false;
    }

    // Token anfordern
    try {
      const response = await fetch(`${this.apiBase}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });

      if (response.ok) {
        const data = await response.json();
        this.sessionToken = data.token;
        this.isAuthorized = true;

        // Token speichern
        localStorage.setItem('onair_authorized_email', email);
        localStorage.setItem('onair_session_token', this.sessionToken);

        this.log(`Authorization granted for ${email}`, 'success');
        return true;
      } else {
        throw new Error('Token request failed');
      }
    } catch (error) {
      alert('❌ Authentifizierung fehlgeschlagen!\n\nBitte versuchen Sie es später erneut.');
      this.showAccessDenied();
      return false;
    }
  }

  showAccessDenied() {
    // Alle Self-Healing UI-Elemente ausblenden
    const elements = document.querySelectorAll('[id*="worker-status"], [id*="ws-status"], [id*="recovery-status"], [id*="last-check"]');
    elements.forEach(el => {
      el.textContent = '🔒 Zugriff verweigert';
      el.style.color = '#ef4444';
    });

    // Buttons deaktivieren
    const buttons = document.querySelectorAll('button[onclick*="testSelfHealing"], button[onclick*="showRecoveryLog"]');
    buttons.forEach(btn => {
      btn.disabled = true;
      btn.textContent = '🔒 Nicht autorisiert';
      btn.style.background = '#6b7280';
    });

    this.log('Access denied - unauthorized user', 'error');
  }

  async init() {
    console.log('🔧 Self-Healing System initializing...');

    // SICHERHEIT: Erst Autorisierung prüfen
    const authorized = await this.checkAuthorization();
    if (!authorized) {
      const requested = await this.requestAuthorization();
      if (!requested) {
        this.showAccessDenied();
        return;
      }
    }

    await this.startHealthMonitoring();
    await this.setupWebSocketRecovery();
    
    // AUTO-BUG-FIX: Starte automatische Bug-Detection
    if (this.autoBugFixEnabled) {
      await this.startBugDetection();
    }
    
    this.log('Self-Healing System initialized with authorization', 'success');
  }


  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    this.recoveryLog.push({ timestamp, message, type });
    console.log(`[Self-Healing ${type.toUpperCase()}] ${message}`);
  }

  async startHealthMonitoring() {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // Every 30 seconds

    // Initial health check
    await this.performHealthCheck();
  }

  async performHealthCheck() {
    if (!this.isAuthorized) {
      this.log('Health check blocked - not authorized', 'error');
      return;
    }

    try {
      const response = await fetch(`${this.apiBase}/health`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
        headers: this.sessionToken ? { 'Authorization': `Bearer ${this.sessionToken}` } : {}
      });

      const data = await response.json();

      if (data.ok) {
        this.isHealthy = true;
        this.reconnectAttempts = 0;
        this.updateHealthStatus('healthy');
        this.log('Health check passed');
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      this.isHealthy = false;
      this.updateHealthStatus('unhealthy');
      this.log(`Health check failed: ${error.message}`, 'warn');
      await this.attemptRecovery();
    }
  }

  async attemptRecovery() {
    if (!this.isAuthorized) {
      this.log('Recovery blocked - not authorized', 'error');
      return false;
    }

    this.log('Starting recovery attempt...', 'warn');

    const endpoints = ['/health', '/status', '/metrics'];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${this.apiBase}${endpoint}`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
          headers: this.sessionToken ? { 'Authorization': `Bearer ${this.sessionToken}` } : {}
        });

        if (response.ok) {
          this.log(`Recovery successful via ${endpoint}`, 'success');
          this.isHealthy = true;
          this.updateHealthStatus('recovered');
          return true;
        }
      } catch (error) {
        this.log(`Recovery failed via ${endpoint}: ${error.message}`, 'error');
      }
    }

    this.log('All recovery attempts failed', 'error');
    return false;
  }

  updateHealthStatus(status) {
    // Update UI elements if they exist
    const statusElements = {
      'worker-status': document.getElementById('worker-status'),
      'ws-status': document.getElementById('ws-status'),
      'recovery-status': document.getElementById('recovery-status'),
      'last-check': document.getElementById('last-check')
    };

    const statusConfig = {
      healthy: { color: '#22c55e', text: 'Online' },
      unhealthy: { color: '#ef4444', text: 'Offline' },
      recovered: { color: '#eab308', text: 'Recovered' }
    };

    const config = statusConfig[status] || statusConfig.unhealthy;

    Object.entries(statusElements).forEach(([id, element]) => {
      if (element) {
        element.style.color = config.color;
        if (id === 'worker-status') element.textContent = config.text;
        if (id === 'last-check') element.textContent = new Date().toLocaleTimeString();
      }
    });
  }

  async setupWebSocketRecovery() {
    try {
      await this.connectWebSocket();
    } catch (error) {
      this.log(`WebSocket initial connection failed: ${error.message}`, 'warn');
      this.scheduleWebSocketReconnect();
    }
  }

  async connectWebSocket(room = 'global') {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${this.wsBase}?room=${encodeURIComponent(room)}`;
        this.wsConnection = new WebSocket(wsUrl);

        this.wsConnection.onopen = () => {
          this.log('WebSocket connected', 'success');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.wsConnection.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
          } catch (error) {
            this.log(`WebSocket message parse error: ${error.message}`, 'warn');
          }
        };

        this.wsConnection.onclose = (event) => {
          this.log(`WebSocket closed: ${event.code} ${event.reason}`, 'warn');
          this.scheduleWebSocketReconnect();
        };

        this.wsConnection.onerror = (error) => {
          this.log(`WebSocket error: ${error.message || 'Unknown error'}`, 'error');
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  scheduleWebSocketReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log('Max WebSocket reconnection attempts reached', 'error');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    this.log(`Scheduling WebSocket reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`, 'warn');

    setTimeout(async () => {
      try {
        await this.connectWebSocket();
      } catch (error) {
        this.log(`WebSocket reconnect attempt ${this.reconnectAttempts} failed: ${error.message}`, 'error');
        this.scheduleWebSocketReconnect();
      }
    }, delay);
  }

  handleWebSocketMessage(data) {
    // Handle different message types
    switch (data.type) {
      case 'hello':
        this.log('Received WebSocket hello', 'info');
        break;
      case 'status':
        this.log(`Received status update: ${JSON.stringify(data)}`, 'info');
        break;
      case 'error':
        this.log(`WebSocket error message: ${data.message}`, 'error');
        break;
      default:
        this.log(`Unknown WebSocket message type: ${data.type}`, 'warn');
    }
  }

  sendWebSocketMessage(message) {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify(message));
      return true;
    } else {
      this.log('WebSocket not connected, cannot send message', 'warn');
      return false;
    }
  }

  getRecoveryLog() {
    return this.recoveryLog;
  }

  testSelfHealing() {
    this.log('Manual self-healing test initiated', 'info');

    // Simulate a failure
    this.isHealthy = false;
    this.updateHealthStatus('unhealthy');

    // Attempt recovery after a short delay
    setTimeout(async () => {
      await this.attemptRecovery();
    }, 2000);
  }

  // AUTO-BUG-FIX: Automatische Bug-Detection starten
  async startBugDetection() {
    this.log('Starting automatic bug detection across servers', 'info');
    
    // Bug-Detection alle 60 Sekunden
    this.bugDetectionInterval = setInterval(async () => {
      await this.detectAndFixBugs();
    }, 60000);
    
    // Sofortige erste Prüfung
    await this.detectAndFixBugs();
  }

  // AUTO-BUG-FIX: Bugs zwischen Servern erkennen und reparieren
  async detectAndFixBugs() {
    if (!this.isAuthorized) {
      this.log('Bug detection blocked - not authorized', 'error');
      return;
    }

    this.log('Scanning servers for bugs...', 'info');
    
    for (const server of this.serverEndpoints) {
      try {
        const bugs = await this.scanServerForBugs(server);
        if (bugs.length > 0) {
          this.log(`Found ${bugs.length} bugs on ${server}`, 'warn');
          await this.fixBugsOnServer(server, bugs);
        }
      } catch (error) {
        this.log(`Bug detection failed for ${server}: ${error.message}`, 'error');
      }
    }
  }

  // AUTO-BUG-FIX: Server auf Bugs scannen
  async scanServerForBugs(serverUrl) {
    const bugs = [];
    
    try {
      // JavaScript-Fehler prüfen
      const jsResponse = await fetch(`${serverUrl}/js-errors`, {
        headers: this.sessionToken ? { 'Authorization': `Bearer ${this.sessionToken}` } : {}
      });
      
      if (jsResponse.ok) {
        const jsErrors = await jsResponse.json();
        bugs.push(...jsErrors.map(error => ({
          type: 'javascript',
          message: error.message,
          file: error.file,
          line: error.line,
          server: serverUrl
        })));
      }
      
      // CSS-Probleme prüfen
      const cssResponse = await fetch(`${serverUrl}/css-issues`, {
        headers: this.sessionToken ? { 'Authorization': `Bearer ${this.sessionToken}` } : {}
      });
      
      if (cssResponse.ok) {
        const cssIssues = await cssResponse.json();
        bugs.push(...cssIssues.map(issue => ({
          type: 'css',
          message: issue.message,
          selector: issue.selector,
          server: serverUrl
        })));
      }
      
      // API-Fehler prüfen
      const apiResponse = await fetch(`${serverUrl}/api-errors`, {
        headers: this.sessionToken ? { 'Authorization': `Bearer ${this.sessionToken}` } : {}
      });
      
      if (apiResponse.ok) {
        const apiErrors = await apiResponse.json();
        bugs.push(...apiErrors.map(error => ({
          type: 'api',
          endpoint: error.endpoint,
          status: error.status,
          message: error.message,
          server: serverUrl
        })));
      }
      
    } catch (error) {
      this.log(`Server scan failed for ${serverUrl}: ${error.message}`, 'error');
    }
    
    return bugs;
  }

  // AUTO-BUG-FIX: Bugs auf Server reparieren
  async fixBugsOnServer(serverUrl, bugs) {
    this.log(`Applying ${bugs.length} fixes to ${serverUrl}`, 'info');
    
    for (const bug of bugs) {
      try {
        const fix = await this.generateFix(bug);
        if (fix) {
          await this.applyFix(serverUrl, fix);
          this.log(`Fixed ${bug.type} bug: ${bug.message}`, 'success');
        }
      } catch (error) {
        this.log(`Failed to fix bug: ${error.message}`, 'error');
      }
    }
  }

  // AUTO-BUG-FIX: Fix für Bug generieren
  async generateFix(bug) {
    const fixTemplates = {
      javascript: {
        'process is not defined': {
          fix: 'if (typeof process !== \'undefined\') { /* process code */ }',
          type: 'conditional-check'
        },
        'addAll failed': {
          fix: 'Promise.allSettled(resources.map(r => cache.put(r, fetch(r))))',
          type: 'promise-handling'
        }
      },
      css: {
        'missing property': {
          fix: '/* Add missing CSS property */',
          type: 'property-addition'
        }
      },
      api: {
        '404': {
          fix: 'Add missing endpoint or redirect',
          type: 'endpoint-creation'
        },
        '500': {
          fix: 'Add error handling and fallback',
          type: 'error-handling'
        }
      }
    };
    
    const bugType = fixTemplates[bug.type];
    if (bugType) {
      for (const [pattern, fix] of Object.entries(bugType)) {
        if (bug.message.toLowerCase().includes(pattern.toLowerCase())) {
          return {
            ...fix,
            bug: bug,
            timestamp: new Date().toISOString()
          };
        }
      }
    }
    
    return null;
  }

  // AUTO-BUG-FIX: Fix auf Server anwenden
  async applyFix(serverUrl, fix) {
    try {
      const response = await fetch(`${serverUrl}/apply-fix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.sessionToken ? { 'Authorization': `Bearer ${this.sessionToken}` } : {})
        },
        body: JSON.stringify(fix)
      });
      
      if (response.ok) {
        this.log(`Fix applied successfully: ${fix.type}`, 'success');
        return true;
      } else {
        throw new Error(`Fix application failed: ${response.status}`);
      }
    } catch (error) {
      this.log(`Failed to apply fix: ${error.message}`, 'error');
      return false;
    }
  }

  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.bugDetectionInterval) {
      clearInterval(this.bugDetectionInterval);
    }
    
    if (this.wsConnection) {
      this.wsConnection.close();
    }
    
    this.log('Self-Healing System destroyed', 'info');
  }
}

// Export für Module-System
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SelfHealingSystem;
} else if (typeof window !== 'undefined') {
  window.SelfHealingSystem = SelfHealingSystem;
}

// Auto-Initialize wenn im Browser
if (typeof window !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.selfHealingSystem = new SelfHealingSystem();
  });
} else if (typeof window !== 'undefined') {
  window.selfHealingSystem = new SelfHealingSystem();
}
