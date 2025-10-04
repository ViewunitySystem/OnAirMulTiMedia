/**
 * OAMTM Audit Statistics API - Vercel Serverless Function
 * Statistiken und Analytics für Audit Events
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

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Gesamtstatistiken
    const [totalCount] = await connection.execute(
      'SELECT COUNT(*) as total FROM audit_events'
    );
    
    // Events nach Typ gruppiert
    const [eventsByType] = await connection.execute(
      'SELECT event_type, COUNT(*) as count FROM audit_events GROUP BY event_type ORDER BY count DESC'
    );
    
    // Events nach User gruppiert
    const [eventsByUser] = await connection.execute(
      'SELECT user_id, COUNT(*) as count FROM audit_events WHERE user_id IS NOT NULL GROUP BY user_id ORDER BY count DESC LIMIT 10'
    );
    
    // Events der letzten 24 Stunden
    const [recentEvents] = await connection.execute(
      'SELECT COUNT(*) as count FROM audit_events WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)'
    );
    
    // Events der letzten 7 Tage
    const [weeklyEvents] = await connection.execute(
      'SELECT COUNT(*) as count FROM audit_events WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );
    
    // Events der letzten 30 Tage
    const [monthlyEvents] = await connection.execute(
      'SELECT COUNT(*) as count FROM audit_events WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );
    
    // Ältestes und neuestes Event
    const [timeRange] = await connection.execute(
      'SELECT MIN(timestamp) as oldest, MAX(timestamp) as newest FROM audit_events'
    );
    
    // Events nach Stunden (letzte 24h)
    const [hourlyStats] = await connection.execute(`
      SELECT 
        HOUR(timestamp) as hour,
        COUNT(*) as count
      FROM audit_events 
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY HOUR(timestamp)
      ORDER BY hour
    `);
    
    // Events nach Tagen (letzte 30 Tage)
    const [dailyStats] = await connection.execute(`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as count
      FROM audit_events 
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(timestamp)
      ORDER BY date
    `);
    
    await connection.end();
    
    const statistics = {
      timestamp: new Date().toISOString(),
      overview: {
        total_events: totalCount[0].total,
        last_24_hours: recentEvents[0].count,
        last_7_days: weeklyEvents[0].count,
        last_30_days: monthlyEvents[0].count
      },
      time_range: {
        oldest_event: timeRange[0].oldest,
        newest_event: timeRange[0].newest
      },
      events_by_type: eventsByType,
      top_users: eventsByUser,
      hourly_distribution: hourlyStats,
      daily_distribution: dailyStats,
      system_info: {
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        version: '1.0.0'
      }
    };
    
    res.status(200).json({
      success: true,
      data: statistics
    });
    
  } catch (error) {
    console.error('Audit Stats Error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
