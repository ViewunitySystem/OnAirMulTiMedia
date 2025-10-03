/**
 * OnAirMulTiMedia - Echtzeit Backup System
 * Automatische Spiegelung und Wiederherstellung
 */

class BackupSystem {
  constructor() {
    this.config = {
      primary: 'https://viewunitysystem.github.io/OnAirMulTiMedia/',
      backup: [
        'https://onairmultimedia.web.app/',
        'https://back-ee052.web.app/'
      ],
      checkInterval: 30000, // 30 Sekunden
      maxRetries: 3,
      versionControl: true,
      realTimeSync: true
    };
    this.status = {
      lastCheck: null,
      health: {},
      versions: [],
      syncStatus: 'idle'
    };
    this.init();
  }

  async init() {
    console.log('🔄 Backup System initialisiert');
    await this.checkHealth();
    if (this.config.realTimeSync) {
      this.startRealTimeSync();
    }
  }

  async checkHealth() {
    const timestamp = new Date().toISOString();
    console.log(`🏥 Health Check gestartet: ${timestamp}`);
    
    // Prüfe Hauptsystem
    const primaryHealth = await this.pingEndpoint(this.config.primary);
    this.status.health.primary = {
      url: this.config.primary,
      status: primaryHealth.status,
      responseTime: primaryHealth.responseTime,
      lastCheck: timestamp
    };

    // Prüfe Backup-Systeme
    for (let i = 0; i < this.config.backup.length; i++) {
      const backupUrl = this.config.backup[i];
      const backupHealth = await this.pingEndpoint(backupUrl);
      this.status.health[`backup_${i}`] = {
        url: backupUrl,
        status: backupHealth.status,
        responseTime: backupHealth.responseTime,
        lastCheck: timestamp
      };
    }

    this.status.lastCheck = timestamp;
    this.logHealthStatus();
    return this.status.health;
  }

  async pingEndpoint(url) {
    const startTime = Date.now();
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      const responseTime = Date.now() - startTime;
      return {
        status: 'healthy',
        responseTime: responseTime,
        httpStatus: response.status || 'unknown'
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'error',
        responseTime: responseTime,
        error: error.message
      };
    }
  }

  logHealthStatus() {
    console.log('📊 Health Status:');
    Object.entries(this.status.health).forEach(([key, health]) => {
      const status = health.status === 'healthy' ? '✅' : '❌';
      console.log(`  ${status} ${key}: ${health.url} (${health.responseTime}ms)`);
    });
  }

  startRealTimeSync() {
    console.log('🔄 Echtzeit-Synchronisation gestartet');
    this.status.syncStatus = 'active';
    
    setInterval(async () => {
      await this.checkHealth();
      await this.syncVersions();
    }, this.config.checkInterval);
  }

  async syncVersions() {
    if (!this.config.versionControl) return;
    
    try {
      // Lade Version-Info vom Hauptsystem
      const versionInfo = await this.fetchVersionInfo();
      
      if (versionInfo) {
        this.status.versions.unshift({
          timestamp: new Date().toISOString(),
          commit: versionInfo.commit,
          build: versionInfo.build,
          status: 'synced'
        });
        
        // Behalte nur die letzten 10 Versionen
        if (this.status.versions.length > 10) {
          this.status.versions = this.status.versions.slice(0, 10);
        }
        
        console.log(`📦 Version sync: ${versionInfo.commit}`);
      }
    } catch (error) {
      console.error('❌ Version sync fehlgeschlagen:', error);
    }
  }

  async fetchVersionInfo() {
    try {
      const response = await fetch(`${this.config.primary}/backup/build-info.json`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Version info nicht verfügbar:', error.message);
    }
    return null;
  }

  async restoreFromBackup(backupIndex = 0) {
    if (backupIndex >= this.config.backup.length) {
      throw new Error('Ungültiger Backup-Index');
    }

    const backupUrl = this.config.backup[backupIndex];
    console.log(`🔄 Wiederherstellung von Backup ${backupIndex}: ${backupUrl}`);
    
    try {
      // Prüfe Backup-Verfügbarkeit
      const health = await this.pingEndpoint(backupUrl);
      if (health.status !== 'healthy') {
        throw new Error(`Backup nicht verfügbar: ${health.error}`);
      }

      // Logge Wiederherstellung
      this.logRestore(backupIndex, backupUrl);
      
      // Leite zu Backup weiter
      window.location.href = backupUrl;
      
    } catch (error) {
      console.error('❌ Wiederherstellung fehlgeschlagen:', error);
      throw error;
    }
  }

  logRestore(backupIndex, backupUrl) {
    const restoreLog = {
      timestamp: new Date().toISOString(),
      action: 'restore',
      backupIndex: backupIndex,
      backupUrl: backupUrl,
      userAgent: navigator.userAgent
    };
    
    // Speichere in localStorage für Debugging
    try {
      const logs = JSON.parse(localStorage.getItem('oamtm:backup:logs') || '[]');
      logs.unshift(restoreLog);
      localStorage.setItem('oamtm:backup:logs', JSON.stringify(logs.slice(0, 50)));
    } catch (error) {
      console.warn('Log-Speicherung fehlgeschlagen:', error);
    }
  }

  getStatus() {
    return {
      ...this.status,
      config: this.config,
      uptime: Date.now() - this.startTime
    };
  }

  exportBackupLog() {
    const logs = JSON.parse(localStorage.getItem('oamtm:backup:logs') || '[]');
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-log-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Globale Instanz
window.BackupSystem = BackupSystem;

// Auto-Start wenn DOM geladen
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.backupSystem = new BackupSystem();
  });
} else {
  window.backupSystem = new BackupSystem();
}
