/**
 * Lokaler API Server für GitHub Pages
 * Simuliert die Vercel API Endpoints lokal
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;

// Mock API Responses
const mockResponses = {
  '/api/health-check': {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    modules: {
      total: 867,
      active: 867,
      apps: 49,
      tools: 106,
      programs: 21,
      configs: 401,
      docs: 164,
      resources: 6,
      containers: 1,
      special: 119
    },
    uptime: '100%',
    lastScan: new Date().toISOString()
  },
  '/api/audit-events': {
    events: [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        type: 'module_scan',
        message: 'Vollständiger Modul-Scan durchgeführt',
        details: {
          totalModules: 867,
          newModules: 4,
          activeModules: 867
        },
        status: 'success'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 60000).toISOString(),
        type: 'auto_update',
        message: 'Automatisches Update durchgeführt',
        details: {
          updatedFiles: ['docs/audit-run.json', 'info.html'],
          scanDuration: '892ms'
        },
        status: 'success'
      }
    ],
    total: 2,
    limit: 100,
    timestamp: new Date().toISOString()
  },
  '/api/audit-stats': {
    timestamp: new Date().toISOString(),
    overview: {
      totalModules: 867,
      activeModules: 867,
      inactiveModules: 0,
      healthScore: 100,
      lastScan: new Date().toISOString(),
      autoDetectorStatus: 'active'
    },
    byType: {
      apps: 49,
      tools: 106,
      programs: 21,
      configs: 401,
      docs: 164,
      resources: 6,
      containers: 1,
      special: 119
    },
    byCategory: {
      'Configuration': 396,
      'Documentation': 164,
      'Web App': 49,
      'TypeScript Tool': 45,
      'JavaScript Tool': 42,
      'Readme': 25,
      'ES Module': 19,
      'Homepage': 14,
      'Node.js Package': 10,
      'Bash Script': 9
    },
    trends: {
      moduleGrowth: '+4 (letzte Stunde)',
      scanFrequency: 'alle 2 Sekunden',
      errorRate: '0%',
      autoFixRate: '100%'
    },
    performance: {
      avgScanTime: '900ms',
      fileWatchLatency: '<100ms',
      updateFrequency: 'kontinuierlich',
      systemUptime: '100%'
    }
  }
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API Endpoints
  if (mockResponses[pathname]) {
    res.writeHead(200);
    res.end(JSON.stringify(mockResponses[pathname], null, 2));
    return;
  }

  // Fallback für andere Pfade
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`🚀 Lokaler API Server läuft auf http://localhost:${PORT}`);
  console.log(`📊 Verfügbare Endpoints:`);
  console.log(`   GET /api/health-check`);
  console.log(`   GET /api/audit-events`);
  console.log(`   GET /api/audit-stats`);
  console.log(`🌐 Für GitHub Pages: Ändere baseURL in cloud-sql-api.js zu http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Server wird beendet...');
  server.close(() => {
    console.log('✅ Server beendet');
    process.exit(0);
  });
});
