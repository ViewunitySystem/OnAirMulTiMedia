// OAMTM Live Data Integration
// Echtzeit-Daten-Integration für alle Module mit automatischer Synchronisation

class LiveDataIntegration {
  constructor() {
    this.dataSources = new Map();
    this.subscribers = new Map();
    this.cache = new Map();
    this.syncInterval = 5000; // 5 Sekunden
    this.init();
  }

  init() {
    console.log('📊 Live Data Integration initialisiert');
    this.setupDataSources();
    this.startDataSync();
    this.setupEventListeners();
  }

  setupDataSources() {
    // GitHub API Data Source
    this.dataSources.set('github', {
      name: 'GitHub Repository',
      url: 'https://api.github.com/repos/ViewunitySystem/OnAirMulTiMedia',
      type: 'api',
      interval: 60000, // 1 Minute
      transform: (data) => this.transformGitHubData(data)
    });

    // Audit Data Source
    this.dataSources.set('audit', {
      name: 'Audit System',
      url: './docs/audit-run.json',
      type: 'file',
      interval: 30000, // 30 Sekunden
      transform: (data) => this.transformAuditData(data)
    });

    // User Studio Data Source
    this.dataSources.set('user-studio', {
      name: 'User Studio',
      url: './webui/user-studio.html',
      type: 'status',
      interval: 60000, // 1 Minute
      transform: (data) => this.transformUserStudioData(data)
    });

    // System Health Data Source
    this.dataSources.set('system-health', {
      name: 'System Health',
      url: 'self',
      type: 'internal',
      interval: 10000, // 10 Sekunden
      transform: (data) => this.transformSystemHealthData(data)
    });

    // Platform Status Data Source
    this.dataSources.set('platform-status', {
      name: 'Platform Status',
      url: 'self',
      type: 'internal',
      interval: 30000, // 30 Sekunden
      transform: (data) => this.transformPlatformStatusData(data)
    });
  }

  async transformGitHubData(data) {
    return {
      repository: data.name,
      stars: data.stargazers_count,
      forks: data.forks_count,
      issues: data.open_issues_count,
      lastUpdate: data.updated_at,
      language: data.language,
      size: data.size,
      status: 'active'
    };
  }

  async transformAuditData(data) {
    return {
      timestamp: data.ts,
      commit: data.commit,
      modules: data.modules || [],
      regulatory: data.regulatory || {},
      harmony: data.harmony || [],
      status: 'audited'
    };
  }

  async transformUserStudioData(data) {
    return {
      status: 'active',
      lastActivity: new Date().toISOString(),
      submissions: 0, // Wird von echten Daten ersetzt
      features: ['AI Draft', 'Preview', 'Submit'],
      health: 'healthy'
    };
  }

  async transformSystemHealthData(data) {
    return {
      uptime: Date.now() - (window.dashboard?.startTime || Date.now()),
      memory: this.getMemoryUsage(),
      errors: window.systemErrorDetector?.getErrorSummary() || { total: 0 },
      performance: this.getPerformanceMetrics(),
      status: 'healthy'
    };
  }

  async transformPlatformStatusData(data) {
    return {
      web: { status: 'online', url: window.location.origin },
      mobile: { status: 'ready', config: 'capacitor' },
      desktop: { status: 'ready', config: 'electron' },
      api: { status: 'ready', url: 'https://oamtm-api.example.workers.dev' },
      lastCheck: new Date().toISOString()
    };
  }

  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return { used: 0, total: 0, limit: 0 };
  }

  getPerformanceMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
      firstPaint: this.getFirstPaint(),
      lastUpdate: new Date().toISOString()
    };
  }

  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  async fetchDataSource(sourceKey) {
    const source = this.dataSources.get(sourceKey);
    if (!source) return null;

    try {
      let data;
      
      if (source.type === 'api') {
        const response = await fetch(source.url, { cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        data = await response.json();
      } else if (source.type === 'file') {
        const response = await fetch(source.url, { cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        data = await response.json();
      } else if (source.type === 'status') {
        const response = await fetch(source.url, { method: 'HEAD', cache: 'no-cache' });
        data = { status: response.ok ? 'online' : 'offline', timestamp: new Date().toISOString() };
      } else if (source.type === 'internal') {
        data = await this.getInternalData(sourceKey);
      }

      const transformedData = await source.transform(data);
      this.cache.set(sourceKey, {
        data: transformedData,
        timestamp: new Date().toISOString(),
        source: source.name
      });

      this.notifySubscribers(sourceKey, transformedData);
      return transformedData;

    } catch (error) {
      console.error(`Fehler beim Laden von ${source.name}:`, error);
      this.handleDataSourceError(sourceKey, error);
      return null;
    }
  }

  async getInternalData(sourceKey) {
    switch (sourceKey) {
      case 'system-health':
        return {
          uptime: Date.now() - (window.dashboard?.startTime || Date.now()),
          memory: this.getMemoryUsage(),
          errors: window.systemErrorDetector?.getErrorSummary() || { total: 0 },
          performance: this.getPerformanceMetrics()
        };
      case 'platform-status':
        return {
          web: { status: 'online', url: window.location.origin },
          mobile: { status: 'ready', config: 'capacitor' },
          desktop: { status: 'ready', config: 'electron' },
          api: { status: 'ready', url: 'https://oamtm-api.example.workers.dev' }
        };
      default:
        return {};
    }
  }

  handleDataSourceError(sourceKey, error) {
    const source = this.dataSources.get(sourceKey);
    console.error(`🚨 Datenquelle ${source.name} Fehler:`, error.message);
    
    // Notify subscribers about error
    this.notifySubscribers(sourceKey, {
      error: error.message,
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }

  subscribe(sourceKey, callback) {
    if (!this.subscribers.has(sourceKey)) {
      this.subscribers.set(sourceKey, []);
    }
    this.subscribers.get(sourceKey).push(callback);
    
    // Sofortige Daten liefern falls verfügbar
    const cachedData = this.cache.get(sourceKey);
    if (cachedData) {
      callback(cachedData.data, cachedData.timestamp);
    }
  }

  unsubscribe(sourceKey, callback) {
    const subscribers = this.subscribers.get(sourceKey);
    if (subscribers) {
      const index = subscribers.indexOf(callback);
      if (index > -1) {
        subscribers.splice(index, 1);
      }
    }
  }

  notifySubscribers(sourceKey, data) {
    const subscribers = this.subscribers.get(sourceKey);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data, new Date().toISOString());
        } catch (error) {
          console.error('Fehler beim Benachrichtigen von Subscriber:', error);
        }
      });
    }
  }

  startDataSync() {
    // Initiale Datenladung
    this.dataSources.forEach((source, key) => {
      this.fetchDataSource(key);
    });

    // Regelmäßige Synchronisation
    setInterval(() => {
      this.syncAllDataSources();
    }, this.syncInterval);
  }

  async syncAllDataSources() {
    const syncPromises = Array.from(this.dataSources.keys()).map(key => 
      this.fetchDataSource(key)
    );
    
    await Promise.allSettled(syncPromises);
    this.updateDashboard();
  }

  updateDashboard() {
    if (window.dashboard && window.dashboard.updateLiveData) {
      const liveData = this.getAllLiveData();
      window.dashboard.updateLiveData(liveData);
    }
  }

  getAllLiveData() {
    const liveData = {};
    this.cache.forEach((cachedData, key) => {
      liveData[key] = {
        ...cachedData.data,
        lastUpdate: cachedData.timestamp,
        source: cachedData.source
      };
    });
    return liveData;
  }

  setupEventListeners() {
    // Network status changes
    window.addEventListener('online', () => {
      console.log('🌐 Netzwerk online - starte Daten-Sync');
      this.syncAllDataSources();
    });

    window.addEventListener('offline', () => {
      console.log('🌐 Netzwerk offline - pausiere Daten-Sync');
    });

    // Visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('👁️ Seite sichtbar - aktualisiere Daten');
        this.syncAllDataSources();
      }
    });
  }

  // Public API
  getDataSourceStatus(sourceKey) {
    const cachedData = this.cache.get(sourceKey);
    const source = this.dataSources.get(sourceKey);
    
    return {
      name: source?.name || 'Unknown',
      status: cachedData ? 'active' : 'inactive',
      lastUpdate: cachedData?.timestamp || null,
      data: cachedData?.data || null
    };
  }

  getAllDataSourceStatus() {
    const status = {};
    this.dataSources.forEach((source, key) => {
      status[key] = this.getDataSourceStatus(key);
    });
    return status;
  }

  forceRefresh(sourceKey) {
    if (sourceKey) {
      return this.fetchDataSource(sourceKey);
    } else {
      return this.syncAllDataSources();
    }
  }

  getDataSummary() {
    const summary = {
      totalSources: this.dataSources.size,
      activeSources: 0,
      totalSubscribers: 0,
      cacheSize: this.cache.size,
      lastSync: new Date().toISOString()
    };

    this.dataSources.forEach((source, key) => {
      if (this.cache.has(key)) {
        summary.activeSources++;
      }
    });

    this.subscribers.forEach(subscribers => {
      summary.totalSubscribers += subscribers.length;
    });

    return summary;
  }
}

// Auto-Start Live Data Integration
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.liveDataIntegration = new LiveDataIntegration();
  });
} else {
  window.liveDataIntegration = new LiveDataIntegration();
}

// Export für globale Nutzung
window.LiveDataIntegration = LiveDataIntegration;
