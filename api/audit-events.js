/**
 * OAMTM Audit Events API - Vercel Serverless Function
 * Verbindung zu Cloud SQL für Audit Events
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONS Request für CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Cloud SQL Verbindung herstellen
    const connection = await mysql.createConnection(dbConfig);
    
    if (req.method === 'GET') {
      // Audit Events abrufen
      const [rows] = await connection.execute(
        'SELECT * FROM audit_events ORDER BY timestamp DESC LIMIT 100'
      );
      
      await connection.end();
      
      res.status(200).json({
        success: true,
        data: rows,
        count: rows.length,
        timestamp: new Date().toISOString()
      });
      
    } else if (req.method === 'POST') {
      // Neues Audit Event hinzufügen
      const { event_type, event_data, user_id, timestamp } = req.body;
      
      const [result] = await connection.execute(
        'INSERT INTO audit_events (event_type, event_data, user_id, timestamp) VALUES (?, ?, ?, ?)',
        [event_type, JSON.stringify(event_data), user_id, timestamp || new Date()]
      );
      
      await connection.end();
      
      res.status(201).json({
        success: true,
        id: result.insertId,
        message: 'Audit Event erfolgreich hinzugefügt'
      });
      
    } else if (req.method === 'PUT') {
      // Audit Event aktualisieren
      const { id, event_type, event_data, user_id } = req.body;
      
      const [result] = await connection.execute(
        'UPDATE audit_events SET event_type = ?, event_data = ?, user_id = ? WHERE id = ?',
        [event_type, JSON.stringify(event_data), user_id, id]
      );
      
      await connection.end();
      
      res.status(200).json({
        success: true,
        affectedRows: result.affectedRows,
        message: 'Audit Event erfolgreich aktualisiert'
      });
      
    } else if (req.method === 'DELETE') {
      // Audit Event löschen
      const { id } = req.query;
      
      const [result] = await connection.execute(
        'DELETE FROM audit_events WHERE id = ?',
        [id]
      );
      
      await connection.end();
      
      res.status(200).json({
        success: true,
        affectedRows: result.affectedRows,
        message: 'Audit Event erfolgreich gelöscht'
      });
      
    } else {
      res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
    
  } catch (error) {
    console.error('Cloud SQL Error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
