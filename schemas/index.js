// Schema Router für OnAirMulTiMedia
// Handles /schemas/* requests

import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { method, url } = req;
  const schemaPath = url.replace('/schemas/', '');

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (method !== 'GET') {
    res.status(405).json({
      error: 'Method not allowed',
      allowed: ['GET'],
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Serve schema files
  const schemaFile = path.join(process.cwd(), 'schemas', schemaPath);
  
  if (fs.existsSync(schemaFile) && schemaFile.endsWith('.json')) {
    try {
      const schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(schema);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to parse schema',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  } else {
    res.status(404).json({
      error: 'Schema not found',
      available: ['blueprint.schema.json'],
      timestamp: new Date().toISOString()
    });
  }
}
