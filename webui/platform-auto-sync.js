// OAMTM Platform Auto-Sync
// Automatische Synchronisation zwischen allen Plattformen (Web, Mobile, Desktop, API)

class PlatformAutoSync {
  constructor() {
    this.platforms = new Map();
    this.syncQueue = [];
    this.syncInterval = 10000; // 10 Sekunden
    this.conflictResolution = 'timestamp'; // 'timestamp', 'priority', 'manual'
    this.init();
  }

  init() {
    console.log('🔄 Platform Auto-Sync initialisiert');
    this.setupPlatforms();
    this.startAutoSync();
    this.setupConflictResolution();
  }

  setupPlatforms() {
    // Web Platform
    this.platforms.set('web', {
      name: 'Web Platform',
      type: 'web',
      url: window.location.origin,
      capabilities: ['user-studio', 'audit-manifest', 'dashboard'],
      syncEnabled: true,
      lastSync: null,
      status: 'active'
    });

    // Mobile Platform (Capacitor)
    this.platforms.set('mobile', {
      name: 'Mobile Platform',
      type: 'mobile',
      url: 'capacitor://localhost',
      capabilities: ['user-studio', 'audit-manifest', 'offline-sync'],
      syncEnabled: true,
      lastSync: null,
      status: 'ready'
    });

    // Desktop Platform (Electron)
    this.platforms.set('desktop', {
      name: 'Desktop Platform',
      type: 'desktop',
      url: 'electron://localhost',
      capabilities: ['user-studio', 'audit-manifest', 'file-system', 'auto-updater'],
      syncEnabled: true,
      lastSync: null,
      status: 'ready'
    });

    // API Backend (Cloudflare Workers)
    this.platforms.set('api', {
      name: 'API Backend',
      type: 'api',
      url: '/api/sync',
      capabilities: ['data-storage', 'user-submissions', 'audit-trail'],
      syncEnabled: true,
      lastSync: null,
      status: 'ready'
    });
  }

  async syncPlatform(platformKey, data) {
    const platform = this.platforms.get(platformKey);
    if (!platform || !platform.syncEnabled) return;

    try {
      console.log(`🔄 Synchronisiere ${platform.name}...`);
      
      const syncResult = await this.performSync(platform, data);
      
      if (syncResult.success) {
        platform.lastSync = new Date().toISOString();
        platform.status = 'synced';
        console.log(`✅ ${platform.name} erfolgreich synchronisiert`);
      } else {
        platform.status = 'error';
        console.error(`❌ ${platform.name} Sync-Fehler:`, syncResult.error);
      }
      
      return syncResult;
      
    } catch (error) {
      platform.status = 'error';
      console.error(`❌ ${platform.name} Sync-Exception:`, error);
      return { success: false, error: error.message };
    }
  }

  async performSync(platform, data) {
    switch (platform.type) {
      case 'web':
        return await this.syncWebPlatform(platform, data);
      case 'mobile':
        return await this.syncMobilePlatform(platform, data);
      case 'desktop':
        return await this.syncDesktopPlatform(platform, data);
      case 'api':
        return await this.syncApiPlatform(platform, data);
      default:
        return { success: false, error: 'Unbekannter Plattform-Typ' };
    }
  }

  async syncWebPlatform(platform, data) {
    try {
      // Web Platform Sync - Update localStorage und Session Storage
      if (data.userStudio) {
        localStorage.setItem('userStudioData', JSON.stringify(data.userStudio));
      }
      
      if (data.auditManifest) {
        localStorage.setItem('auditManifestData', JSON.stringify(data.auditManifest));
      }
      
      if (data.dashboard) {
        sessionStorage.setItem('dashboardData', JSON.stringify(data.dashboard));
      }
      
      // Trigger Custom Event für andere Web-Komponenten
      window.dispatchEvent(new CustomEvent('platformSync', {
        detail: { platform: 'web', data, timestamp: new Date().toISOString() }
      }));
      
      return { success: true, message: 'Web Platform synchronisiert' };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async syncMobilePlatform(platform, data) {
    try {
      // Mobile Platform Sync - Capacitor Storage
      if (window.Capacitor && window.Capacitor.Storage) {
        if (data.userStudio) {
          await window.Capacitor.Storage.set({
            key: 'userStudioData',
            value: JSON.stringify(data.userStudio)
          });
        }
        
        if (data.auditManifest) {
          await window.Capacitor.Storage.set({
            key: 'auditManifestData',
            value: JSON.stringify(data.auditManifest)
          });
        }
        
        return { success: true, message: 'Mobile Platform synchronisiert' };
      } else {
        // Fallback zu localStorage wenn Capacitor nicht verfügbar
        return await this.syncWebPlatform(platform, data);
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async syncDesktopPlatform(platform, data) {
    try {
      // Desktop Platform Sync - Electron IPC
      if (window.electronAPI) {
        // Sende Daten an Main Process
        await window.electronAPI.syncData({
          platform: 'desktop',
          data,
          timestamp: new Date().toISOString()
        });
        
        return { success: true, message: 'Desktop Platform synchronisiert' };
      } else {
        // Fallback zu localStorage wenn Electron nicht verfügbar
        return await this.syncWebPlatform(platform, data);
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async syncApiPlatform(platform, data) {
    try {
      // API Platform Sync - Cloudflare Workers
      const response = await fetch(`${platform.url}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: 'api',
          data,
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        return { success: true, message: 'API Platform synchronisiert', result };
      } else {
        return { success: false, error: `API Sync Fehler: ${response.status}` };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async syncAllPlatforms(data) {
    console.log('🔄 Synchronisiere alle Plattformen...');
    
    const syncPromises = Array.from(this.platforms.keys()).map(platformKey => 
      this.syncPlatform(platformKey, data)
    );
    
    const results = await Promise.allSettled(syncPromises);
    
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const totalCount = results.length;
    
    console.log(`✅ Platform Sync abgeschlossen: ${successCount}/${totalCount} erfolgreich`);
    
    return {
      success: successCount === totalCount,
      results: results.map((r, i) => ({
        platform: Array.from(this.platforms.keys())[i],
        success: r.status === 'fulfilled' && r.value.success,
        error: r.status === 'rejected' ? r.reason : r.value.error
      }))
    };
  }

  startAutoSync() {
    // Regelmäßige Auto-Sync alle 10 Sekunden
    setInterval(async () => {
      await this.performAutoSync();
    }, this.syncInterval);
    
    // Initiale Sync
    setTimeout(() => {
      this.performAutoSync();
    }, 2000);
  }

  async performAutoSync() {
    try {
      // Sammle aktuelle Daten von allen Quellen
      const syncData = await this.collectSyncData();
      
      if (Object.keys(syncData).length > 0) {
        await this.syncAllPlatforms(syncData);
        this.updateSyncStatus();
      }
      
    } catch (error) {
      console.error('Auto-Sync Fehler:', error);
    }
  }

  async collectSyncData() {
    const syncData = {};
    
    try {
      // Sammle User Studio Daten
      if (window.userStudioTester) {
        syncData.userStudio = {
          testResults: window.userStudioTester.getTestResults(),
          performanceMetrics: window.userStudioTester.getPerformanceMetrics(),
          timestamp: new Date().toISOString()
        };
      }
      
      // Sammle Audit Manifest Daten
      if (window.liveDataIntegration) {
        const auditData = window.liveDataIntegration.cache.get('audit');
        if (auditData) {
          syncData.auditManifest = auditData.data;
        }
      }
      
      // Sammle Dashboard Daten
      if (window.dashboard) {
        syncData.dashboard = {
          uptime: Date.now() - window.dashboard.startTime,
          errorCount: window.dashboard.errorCount,
          warningCount: window.dashboard.warningCount,
          lastUpdate: window.dashboard.lastUpdate,
          timestamp: new Date().toISOString()
        };
      }
      
      // Sammle System Health Daten
      if (window.systemErrorDetector) {
        syncData.systemHealth = window.systemErrorDetector.getSystemStatus();
      }
      
    } catch (error) {
      console.error('Fehler beim Sammeln der Sync-Daten:', error);
    }
    
    return syncData;
  }

  updateSyncStatus() {
    // Update Dashboard mit Sync-Status
    if (window.dashboard && window.dashboard.updateSyncStatus) {
      const syncStatus = this.getSyncStatus();
      window.dashboard.updateSyncStatus(syncStatus);
    }
  }

  getSyncStatus() {
    const status = {
      totalPlatforms: this.platforms.size,
      syncedPlatforms: 0,
      errorPlatforms: 0,
      lastSync: null,
      platforms: {}
    };
    
    this.platforms.forEach((platform, key) => {
      status.platforms[key] = {
        name: platform.name,
        status: platform.status,
        lastSync: platform.lastSync,
        capabilities: platform.capabilities
      };
      
      if (platform.status === 'synced') {
        status.syncedPlatforms++;
      } else if (platform.status === 'error') {
        status.errorPlatforms++;
      }
      
      if (platform.lastSync && (!status.lastSync || platform.lastSync > status.lastSync)) {
        status.lastSync = platform.lastSync;
      }
    });
    
    return status;
  }

  setupConflictResolution() {
    // Setup für Konfliktlösung zwischen Plattformen
    window.addEventListener('platformSyncConflict', (event) => {
      this.resolveSyncConflict(event.detail);
    });
  }

  async resolveSyncConflict(conflict) {
    console.log('⚠️ Sync-Konflikt erkannt:', conflict);
    
    switch (this.conflictResolution) {
      case 'timestamp':
        return this.resolveByTimestamp(conflict);
      case 'priority':
        return this.resolveByPriority(conflict);
      case 'manual':
        return this.resolveManually(conflict);
      default:
        return this.resolveByTimestamp(conflict);
    }
  }

  resolveByTimestamp(conflict) {
    // Löse Konflikt basierend auf Zeitstempel
    const newerData = conflict.data1.timestamp > conflict.data2.timestamp ? 
      conflict.data1 : conflict.data2;
    
    console.log('🕐 Konflikt gelöst durch Zeitstempel:', newerData.timestamp);
    return newerData;
  }

  resolveByPriority(conflict) {
    // Löse Konflikt basierend auf Plattform-Priorität
    const priorities = { 'api': 4, 'desktop': 3, 'mobile': 2, 'web': 1 };
    const priority1 = priorities[conflict.platform1] || 0;
    const priority2 = priorities[conflict.platform2] || 0;
    
    const winnerData = priority1 > priority2 ? conflict.data1 : conflict.data2;
    console.log('🎯 Konflikt gelöst durch Priorität');
    return winnerData;
  }

  resolveManually(conflict) {
    // Manuelle Konfliktlösung - zeige Dialog
    console.log('👤 Manuelle Konfliktlösung erforderlich');
    // Hier könnte ein UI-Dialog implementiert werden
    return conflict.data1; // Fallback
  }

  // Public API
  forceSync(platformKey = null) {
    if (platformKey) {
      return this.syncPlatform(platformKey, this.collectSyncData());
    } else {
      return this.syncAllPlatforms(this.collectSyncData());
    }
  }

  getPlatformStatus(platformKey) {
    const platform = this.platforms.get(platformKey);
    return platform ? {
      name: platform.name,
      status: platform.status,
      lastSync: platform.lastSync,
      capabilities: platform.capabilities
    } : null;
  }

  getAllPlatformStatus() {
    const status = {};
    this.platforms.forEach((platform, key) => {
      status[key] = this.getPlatformStatus(key);
    });
    return status;
  }

  enablePlatformSync(platformKey) {
    const platform = this.platforms.get(platformKey);
    if (platform) {
      platform.syncEnabled = true;
      console.log(`✅ ${platform.name} Sync aktiviert`);
    }
  }

  disablePlatformSync(platformKey) {
    const platform = this.platforms.get(platformKey);
    if (platform) {
      platform.syncEnabled = false;
      console.log(`❌ ${platform.name} Sync deaktiviert`);
    }
  }

  setConflictResolution(method) {
    if (['timestamp', 'priority', 'manual'].includes(method)) {
      this.conflictResolution = method;
      console.log(`🔧 Konfliktlösung geändert zu: ${method}`);
    }
  }
}

// Auto-Start Platform Auto-Sync
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.platformAutoSync = new PlatformAutoSync();
  });
} else {
  window.platformAutoSync = new PlatformAutoSync();
}

// Export für globale Nutzung
window.PlatformAutoSync = PlatformAutoSync;
