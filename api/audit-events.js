/**
 * Lokaler Audit Events API Stub
 * Für GitHub Pages ohne Backend
 */

export default function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const limit = parseInt(req.query.limit) || 100;
  
  // Mock Audit Events basierend auf dem aktuellen Scan
  const mockEvents = [
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
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 120000).toISOString(),
      type: 'file_watch',
      message: 'Datei-Änderung erkannt',
      details: {
        file: 'scripts/auto-audit-updater.mjs',
        changeType: 'modified'
      },
      status: 'info'
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 180000).toISOString(),
      type: 'console_error_fix',
      message: 'Console-Errors behoben',
      details: {
        fixedErrors: ['CSP frame-ancestors', 'JavaScript syntax', 'API URLs'],
        status: 'resolved'
      },
      status: 'success'
    },
    {
      id: 5,
      timestamp: new Date(Date.now() - 240000).toISOString(),
      type: 'system_health',
      message: 'System-Gesundheitscheck',
      details: {
        allSystems: 'operational',
        moduleCount: 867,
        autoDetector: 'active'
      },
      status: 'success'
    }
  ];

  if (req.method === 'GET') {
    const events = mockEvents.slice(0, limit);
    res.status(200).json({
      events,
      total: mockEvents.length,
      limit,
      timestamp: new Date().toISOString()
    });
  } else if (req.method === 'POST') {
    // Mock für neue Events
    const newEvent = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...req.body
    };
    res.status(201).json(newEvent);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}