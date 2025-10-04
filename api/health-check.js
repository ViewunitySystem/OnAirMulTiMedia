/**
 * OAMTM Health Check API - Vercel Serverless Function
 * System-Status und Verbindungstest
 */

const mysql = require('mysql2/promise');

// Cloud SQL Verbindungskonfiguration
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
};

export default async function handler(req, res) {
  // CORS Headers setzen
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONS Request für CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
    return;
  }

  const healthStatus = {
    timestamp: new Date().toISOString(),
    system: 'OAMTM Cloud SQL API',
    version: '1.0.0',
    status: 'healthy',
    services: {}
  };

  try {
    // Cloud SQL Verbindungstest
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT 1 as test');
    await connection.end();
    
    healthStatus.services.cloud_sql = {
      status: 'healthy',
      response_time: Date.now(),
      test_query: 'successful'
    };
    
  } catch (error) {
    healthStatus.status = 'degraded';
    healthStatus.services.cloud_sql = {
      status: 'error',
      error: error.message
    };
  }

  // Environment Variables Check
  const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    healthStatus.status = 'degraded';
    healthStatus.services.environment = {
      status: 'error',
      missing_variables: missingVars
    };
  } else {
    healthStatus.services.environment = {
      status: 'healthy',
      variables_configured: requiredEnvVars.length
    };
  }

  // API Endpoints Check
  healthStatus.services.api_endpoints = {
    status: 'healthy',
    available_endpoints: [
      '/api/audit-events',
      '/api/health-check',
      '/api/audit-stats'
    ]
  };

  // System Resources
  healthStatus.services.system = {
    status: 'healthy',
    uptime: process.uptime(),
    memory_usage: process.memoryUsage(),
    node_version: process.version
  };

  const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json(healthStatus);
}
