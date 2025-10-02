// API Router für OnAirMulTiMedia
// Handles /api/* requests

import health from './health.js';
import status from './status.js';

export default function handler(req, res) {
  const { method, url } = req;
  const path = url.replace('/api/', '');

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Route handling
  switch (path) {
    case 'health':
      return health(req, res);
    case 'status':
      return status(req, res);
    default:
      res.status(404).json({
        error: 'API endpoint not found',
        available: ['/api/health', '/api/status'],
        timestamp: new Date().toISOString()
      });
  }
}
