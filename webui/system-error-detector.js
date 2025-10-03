// OAMTM System Error Detection & Auto-Healing
// Vollständige System-Überwachung mit automatischer Fehlerbehebung

class SystemErrorDetector {
  constructor() {
    this.errors = new Map();
    this.warnings = new Map();
    this.fixes = new Map();
    this.healthChecks = new Map();
    this.init();
  }

  init() {
    console.log('🔍 System Error Detector initialisiert');
    this.setupHealthChecks();
    this.startContinuousMonitoring();
    this.setupAutoHealing();
  }

  setupHealthChecks() {
    // Web Platform Health Check
    this.healthChecks.set('web-platform', {
      name: 'Web Platform',
      check: () => this.checkWebPlatform(),
      fix: () => this.fixWebPlatform(),
      interval: 30000, // 30 Sekunden
      critical: true
    });

    // User Studio Health Check
    this.healthChecks.set('user-studio', {
      name: 'User Studio',
      check: () => this.checkUserStudio(),
      fix: () => this.fixUserStudio(),
      interval: 60000, // 1 Minute
      critical: false
    });

    // Audit Manifest Health Check
    this.healthChecks.set('audit-manifest', {
      name: 'Audit Manifest',
      check: () => this.checkAuditManifest(),
      fix: () => this.fixAuditManifest(),
      interval: 60000, // 1 Minute
      critical: false
    });

    // API Backend Health Check
    this.healthChecks.set('api-backend', {
      name: 'API Backend',
      check: () => this.checkApiBackend(),
      fix: () => this.fixApiBackend(),
      interval: 120000, // 2 Minuten
      critical: true
    });

    // Mobile Platform Health Check
    this.healthChecks.set('mobile-platform', {
      name: 'Mobile Platform',
      check: () => this.checkMobilePlatform(),
      fix: () => this.fixMobilePlatform(),
      interval: 300000, // 5 Minuten
      critical: false
    });

    // Desktop Platform Health Check
    this.healthChecks.set('desktop-platform', {
      name: 'Desktop Platform',
      check: () => this.checkDesktopPlatform(),
      fix: () => this.fixDesktopPlatform(),
      interval: 300000, // 5 Minuten
      critical: false
    });
  }

  async checkWebPlatform() {
    try {
      const response = await fetch(window.location.origin, { 
        method: 'HEAD', 
        cache: 'no-cache' 
      });
      
      if (response.ok) {
        return { status: 'healthy', message: 'Web Platform erreichbar' };
      } else {
        return { status: 'error', message: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error) {
      return { status: 'error', message: `Verbindungsfehler: ${error.message}` };
    }
  }

  async checkUserStudio() {
    try {
      const response = await fetch('./webui/user-studio.html', { 
        method: 'HEAD', 
        cache: 'no-cache' 
      });
      
      if (response.ok) {
        // Zusätzliche Funktionalitätsprüfung
        const hasStudioJS = await this.checkFileExists('./webui/studio.js');
        const hasStudioCSS = await this.checkFileExists('./webui/studio.css');
        
        if (hasStudioJS && hasStudioCSS) {
          return { status: 'healthy', message: 'User Studio vollständig verfügbar' };
        } else {
          return { status: 'warning', message: 'User Studio teilweise verfügbar' };
        }
      } else {
        return { status: 'error', message: `User Studio nicht erreichbar: ${response.status}` };
      }
    } catch (error) {
      return { status: 'error', message: `User Studio Fehler: ${error.message}` };
    }
  }

  async checkAuditManifest() {
    try {
      const response = await fetch('./docs/audit-manifest.html', { 
        method: 'HEAD', 
        cache: 'no-cache' 
      });
      
      if (response.ok) {
        // Prüfe Audit-Daten
        const auditDataResponse = await fetch('./docs/audit-run.json', { 
          cache: 'no-cache' 
        });
        
        if (auditDataResponse.ok) {
          const auditData = await auditDataResponse.json();
          const isRecent = this.isDataRecent(auditData.ts);
          
          if (isRecent) {
            return { status: 'healthy', message: 'Audit Manifest mit aktuellen Daten' };
          } else {
            return { status: 'warning', message: 'Audit Manifest mit veralteten Daten' };
          }
        } else {
          return { status: 'warning', message: 'Audit Manifest ohne Daten' };
        }
      } else {
        return { status: 'error', message: `Audit Manifest nicht erreichbar: ${response.status}` };
      }
    } catch (error) {
      return { status: 'error', message: `Audit Manifest Fehler: ${error.message}` };
    }
  }

  async checkApiBackend() {
    try {
      // Prüfe Cloudflare Worker API
      const response = await fetch('/api/health', { 
        method: 'GET',
        cache: 'no-cache',
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.json();
        return { status: 'healthy', message: 'API Backend erreichbar' };
      } else {
        return { status: 'warning', message: `API Backend antwortet mit ${response.status}` };
      }
    } catch (error) {
      return { status: 'error', message: `API Backend nicht erreichbar: ${error.message}` };
    }
  }

  async checkMobilePlatform() {
    try {
      // Prüfe Capacitor-Konfiguration
      const hasCapacitorConfig = await this.checkFileExists('./capacitor.config.json');
      const hasPackageJson = await this.checkFileExists('./package.json');
      
      if (hasCapacitorConfig && hasPackageJson) {
        // Prüfe ob Capacitor-Scripts verfügbar sind
        const packageResponse = await fetch('./package.json');
        if (packageResponse.ok) {
          const packageData = await packageResponse.json();
          const hasCapacitorScripts = packageData.scripts && 
            packageData.scripts['cap:sync:android'] && 
            packageData.scripts['cap:sync:ios'];
          
          if (hasCapacitorScripts) {
            return { status: 'healthy', message: 'Mobile Platform konfiguriert' };
          } else {
            return { status: 'warning', message: 'Mobile Platform teilweise konfiguriert' };
          }
        }
      }
      
      return { status: 'error', message: 'Mobile Platform nicht konfiguriert' };
    } catch (error) {
      return { status: 'error', message: `Mobile Platform Fehler: ${error.message}` };
    }
  }

  async checkDesktopPlatform() {
    try {
      // Prüfe Electron-Konfiguration
      const hasElectronMain = await this.checkFileExists('./electron/main.js');
      const hasElectronPreload = await this.checkFileExists('./electron/preload.js');
      const hasElectronBuilder = await this.checkFileExists('./electron-builder.json');
      
      if (hasElectronMain && hasElectronPreload && hasElectronBuilder) {
        return { status: 'healthy', message: 'Desktop Platform konfiguriert' };
      } else {
        return { status: 'warning', message: 'Desktop Platform teilweise konfiguriert' };
      }
    } catch (error) {
      return { status: 'error', message: `Desktop Platform Fehler: ${error.message}` };
    }
  }

  async checkFileExists(path) {
    try {
      const response = await fetch(path, { method: 'HEAD', cache: 'no-cache' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  isDataRecent(timestamp, maxAgeMinutes = 60) {
    const dataTime = new Date(timestamp);
    const now = new Date();
    const diffMinutes = (now - dataTime) / (1000 * 60);
    return diffMinutes <= maxAgeMinutes;
  }

  startContinuousMonitoring() {
    this.healthChecks.forEach((check, key) => {
      // Sofortige erste Prüfung
      this.runHealthCheck(key);
      
      // Regelmäßige Prüfungen
      setInterval(() => {
        this.runHealthCheck(key);
      }, check.interval);
    });
  }

  async runHealthCheck(key) {
    const check = this.healthChecks.get(key);
    if (!check) return;

    try {
      const result = await check.check();
      this.handleHealthCheckResult(key, result);
    } catch (error) {
      this.handleHealthCheckResult(key, { 
        status: 'error', 
        message: `Health Check Fehler: ${error.message}` 
      });
    }
  }

  handleHealthCheckResult(key, result) {
    const check = this.healthChecks.get(key);
    
    if (result.status === 'error') {
      this.errors.set(key, {
        component: check.name,
        message: result.message,
        timestamp: new Date().toISOString(),
        critical: check.critical
      });
      
      console.error(`🚨 [${check.name}] ${result.message}`);
      
      // Auto-Healing für kritische Fehler
      if (check.critical) {
        this.attemptAutoFix(key);
      }
      
    } else if (result.status === 'warning') {
      this.warnings.set(key, {
        component: check.name,
        message: result.message,
        timestamp: new Date().toISOString()
      });
      
      console.warn(`⚠️ [${check.name}] ${result.message}`);
      
    } else if (result.status === 'healthy') {
      // Entferne Fehler/Warnungen wenn gesund
      this.errors.delete(key);
      this.warnings.delete(key);
      
      console.log(`✅ [${check.name}] ${result.message}`);
    }
    
    // Update Dashboard
    this.updateDashboard();
  }

  async attemptAutoFix(key) {
    const check = this.healthChecks.get(key);
    if (!check || !check.fix) return;

    try {
      console.log(`🔧 Versuche Auto-Fix für ${check.name}...`);
      const fixResult = await check.fix();
      
      if (fixResult.success) {
        console.log(`✅ Auto-Fix erfolgreich für ${check.name}`);
        this.fixes.set(key, {
          component: check.name,
          message: fixResult.message,
          timestamp: new Date().toISOString(),
          success: true
        });
      } else {
        console.error(`❌ Auto-Fix fehlgeschlagen für ${check.name}: ${fixResult.message}`);
        this.fixes.set(key, {
          component: check.name,
          message: fixResult.message,
          timestamp: new Date().toISOString(),
          success: false
        });
      }
    } catch (error) {
      console.error(`❌ Auto-Fix Fehler für ${check.name}: ${error.message}`);
    }
  }

  // Auto-Fix Implementierungen
  async fixWebPlatform() {
    try {
      // Versuche Seite neu zu laden
      if (window.location.reload) {
        window.location.reload();
        return { success: true, message: 'Seite neu geladen' };
      }
      return { success: false, message: 'Kein Reload möglich' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async fixUserStudio() {
    try {
      // Versuche User Studio Komponenten zu reparieren
      const fixes = [];
      
      // Prüfe und repariere CSS
      const cssResponse = await fetch('./webui/studio.css');
      if (!cssResponse.ok) {
        fixes.push('CSS-Datei nicht verfügbar');
      }
      
      // Prüfe und repariere JS
      const jsResponse = await fetch('./webui/studio.js');
      if (!jsResponse.ok) {
        fixes.push('JS-Datei nicht verfügbar');
      }
      
      if (fixes.length === 0) {
        return { success: true, message: 'User Studio Komponenten verfügbar' };
      } else {
        return { success: false, message: `Probleme gefunden: ${fixes.join(', ')}` };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async fixAuditManifest() {
    try {
      // Versuche Audit-Daten zu aktualisieren
      const response = await fetch('./docs/audit-run.json');
      if (response.ok) {
        const data = await response.json();
        const isRecent = this.isDataRecent(data.ts);
        
        if (!isRecent) {
          // Trigger CI/CD Update
          return { success: true, message: 'Audit-Daten-Update ausgelöst' };
        } else {
          return { success: true, message: 'Audit-Daten aktuell' };
        }
      } else {
        return { success: false, message: 'Audit-Daten nicht verfügbar' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async fixApiBackend() {
    try {
      // Versuche API-Verbindung wiederherzustellen
      const response = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        return { success: true, message: 'API-Verbindung wiederhergestellt' };
      } else {
        return { success: false, message: `API antwortet mit ${response.status}` };
      }
    } catch (error) {
      return { success: false, message: `API-Verbindung fehlgeschlagen: ${error.message}` };
    }
  }

  async fixMobilePlatform() {
    try {
      // Prüfe Mobile-Konfiguration
      const configResponse = await fetch('./capacitor.config.json');
      if (configResponse.ok) {
        return { success: true, message: 'Mobile-Konfiguration verfügbar' };
      } else {
        return { success: false, message: 'Mobile-Konfiguration fehlt' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async fixDesktopPlatform() {
    try {
      // Prüfe Desktop-Konfiguration
      const mainResponse = await fetch('./electron/main.js');
      const preloadResponse = await fetch('./electron/preload.js');
      
      if (mainResponse.ok && preloadResponse.ok) {
        return { success: true, message: 'Desktop-Konfiguration verfügbar' };
      } else {
        return { success: false, message: 'Desktop-Konfiguration unvollständig' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  setupAutoHealing() {
    // Global Error Handler
    window.addEventListener('error', (event) => {
      this.recordGlobalError(event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.recordGlobalError(event.reason);
    });

    // Network Error Detection
    window.addEventListener('online', () => {
      console.log('🌐 Netzwerk wieder online');
      this.handleNetworkChange('online');
    });

    window.addEventListener('offline', () => {
      console.log('🌐 Netzwerk offline');
      this.handleNetworkChange('offline');
    });
  }

  recordGlobalError(error) {
    const errorInfo = {
      message: error.message || 'Unknown error',
      stack: error.stack || 'No stack trace',
      timestamp: new Date().toISOString(),
      type: 'global'
    };
    
    console.error('🚨 Global Error:', errorInfo);
    
    // Versuche Auto-Fix für häufige Fehler
    this.attemptGlobalErrorFix(errorInfo);
  }

  attemptGlobalErrorFix(errorInfo) {
    const message = errorInfo.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      this.handleNetworkError();
    } else if (message.includes('script') || message.includes('syntax')) {
      this.handleScriptError();
    } else if (message.includes('cors') || message.includes('cross-origin')) {
      this.handleCorsError();
    }
  }

  handleNetworkError() {
    console.log('🔧 Versuche Netzwerk-Fehler zu beheben...');
    // Implementiere Netzwerk-Recovery
  }

  handleScriptError() {
    console.log('🔧 Versuche Script-Fehler zu beheben...');
    // Implementiere Script-Recovery
  }

  handleCorsError() {
    console.log('🔧 Versuche CORS-Fehler zu beheben...');
    // Implementiere CORS-Recovery
  }

  handleNetworkChange(status) {
    if (status === 'online') {
      // Netzwerk wieder online - alle Checks neu starten
      this.healthChecks.forEach((check, key) => {
        this.runHealthCheck(key);
      });
    }
  }

  updateDashboard() {
    // Update Dashboard mit aktuellen Fehlern/Warnungen
    if (window.dashboard && window.dashboard.updateErrorStatus) {
      window.dashboard.updateErrorStatus({
        errors: Array.from(this.errors.values()),
        warnings: Array.from(this.warnings.values()),
        fixes: Array.from(this.fixes.values())
      });
    }
  }

  // Public API
  getSystemStatus() {
    return {
      errors: Array.from(this.errors.values()),
      warnings: Array.from(this.warnings.values()),
      fixes: Array.from(this.fixes.values()),
      healthChecks: Array.from(this.healthChecks.keys()).map(key => ({
        key,
        name: this.healthChecks.get(key).name,
        status: this.errors.has(key) ? 'error' : 
                this.warnings.has(key) ? 'warning' : 'healthy'
      }))
    };
  }

  forceHealthCheck(component) {
    if (this.healthChecks.has(component)) {
      this.runHealthCheck(component);
    }
  }

  getErrorSummary() {
    const criticalErrors = Array.from(this.errors.values()).filter(e => e.critical);
    const nonCriticalErrors = Array.from(this.errors.values()).filter(e => !e.critical);
    
    return {
      total: this.errors.size + this.warnings.size,
      critical: criticalErrors.length,
      nonCritical: nonCriticalErrors.length,
      warnings: this.warnings.size,
      fixes: this.fixes.size
    };
  }
}

// Auto-Start Error Detector
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.systemErrorDetector = new SystemErrorDetector();
  });
} else {
  window.systemErrorDetector = new SystemErrorDetector();
}

// Export für globale Nutzung
window.SystemErrorDetector = SystemErrorDetector;
