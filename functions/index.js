/**
 * OAMTM Firebase Functions für Cloud SQL + Matrix.org-Style Serverfarm
 * Bietet API-Endpoints für die enhanced-audit.db und öffentliche Medien-Inhalte
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const mysql = require('mysql2/promise');

// Firebase Admin initialisieren
admin.initializeApp();

// Cloud SQL Konfiguration
const dbConfig = {
  host: functions.config().db?.host || process.env.DB_HOST,
  port: functions.config().db?.port || parseInt(process.env.DB_PORT) || 3306,
  user: functions.config().db?.user || process.env.DB_USER,
  password: functions.config().db?.password || process.env.DB_PASSWORD,
  database: functions.config().db?.database || process.env.DB_NAME || 'oamtm_audit',
  ssl: {
    ca: functions.config().db?.ssl_ca || process.env.DB_SSL_CA,
    cert: functions.config().db?.ssl_cert || process.env.DB_SSL_CERT,
    key: functions.config().db?.ssl_key || process.env.DB_SSL_KEY,
  },
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000
};

/**
 * Datenbankverbindung erstellen
 */
async function createConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    return connection;
  } catch (error) {
    console.error('Datenbankverbindung fehlgeschlagen:', error);
    throw error;
  }
}

/**
 * CORS-Header setzen
 */
function setCorsHeaders(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Audit Events abrufen
 */
exports.getAuditEvents = functions.https.onRequest(async (req, res) => {
  // CORS-Header setzen
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.status(200).send('');
    return;
  }

  setCorsHeaders(res);

  try {
    const connection = await createConnection();
    
    // Parameter aus Query-String
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const eventType = req.query.event_type;
    const userId = req.query.user_id;
    
    // SQL-Query aufbauen
    let query = 'SELECT * FROM audit_events WHERE 1=1';
    const params = [];
    
    if (eventType) {
      query += ' AND event_type = ?';
      params.push(eventType);
    }
    
    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await connection.execute(query, params);
    await connection.end();
    
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Audit Events:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Audit Event hinzufügen
 */
exports.addAuditEvent = functions.https.onRequest(async (req, res) => {
  // CORS-Header setzen
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.status(200).send('');
    return;
  }

  setCorsHeaders(res);

  try {
    const { event_type, event_data, user_id, description } = req.body;
    
    // Validierung
    if (!event_type) {
      return res.status(400).json({
        success: false,
        error: 'event_type ist erforderlich'
      });
    }
    
    const connection = await createConnection();
    
    const [result] = await connection.execute(
      'INSERT INTO audit_events (event_type, event_data, user_id, description, timestamp) VALUES (?, ?, ?, ?, NOW())',
      [
        event_type,
        event_data ? JSON.stringify(event_data) : null,
        user_id || null,
        description || null
      ]
    );
    
    await connection.end();
    
    res.json({
      success: true,
      id: result.insertId,
      message: 'Audit Event erfolgreich hinzugefügt'
    });
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Audit Events:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Audit Event aktualisieren
 */
exports.updateAuditEvent = functions.https.onRequest(async (req, res) => {
  // CORS-Header setzen
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.status(200).send('');
    return;
  }

  setCorsHeaders(res);

  try {
    const { id } = req.params;
    const { event_type, event_data, user_id, description } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID ist erforderlich'
      });
    }
    
    const connection = await createConnection();
    
    const [result] = await connection.execute(
      'UPDATE audit_events SET event_type = COALESCE(?, event_type), event_data = COALESCE(?, event_data), user_id = COALESCE(?, user_id), description = COALESCE(?, description) WHERE id = ?',
      [
        event_type || null,
        event_data ? JSON.stringify(event_data) : null,
        user_id || null,
        description || null,
        id
      ]
    );
    
    await connection.end();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Audit Event nicht gefunden'
      });
    }
    
    res.json({
      success: true,
      message: 'Audit Event erfolgreich aktualisiert'
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Audit Events:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Audit Event löschen
 */
exports.deleteAuditEvent = functions.https.onRequest(async (req, res) => {
  // CORS-Header setzen
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.status(200).send('');
    return;
  }

  setCorsHeaders(res);

  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID ist erforderlich'
      });
    }
    
    const connection = await createConnection();
    
    const [result] = await connection.execute(
      'DELETE FROM audit_events WHERE id = ?',
      [id]
    );
    
    await connection.end();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Audit Event nicht gefunden'
      });
    }
    
    res.json({
      success: true,
      message: 'Audit Event erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('Fehler beim Löschen des Audit Events:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Audit Events nach Typ gruppiert
 */
exports.getAuditEventsByType = functions.https.onRequest(async (req, res) => {
  // CORS-Header setzen
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.status(200).send('');
    return;
  }

  setCorsHeaders(res);

  try {
    const connection = await createConnection();
    
    const [rows] = await connection.execute(
      'SELECT event_type, COUNT(*) as count, MAX(timestamp) as last_event FROM audit_events GROUP BY event_type ORDER BY count DESC'
    );
    
    await connection.end();
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der gruppierten Audit Events:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Audit Events Statistiken
 */
exports.getAuditStats = functions.https.onRequest(async (req, res) => {
  // CORS-Header setzen
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.status(200).send('');
    return;
  }

  setCorsHeaders(res);

  try {
    const connection = await createConnection();
    
    // Gesamtanzahl
    const [totalRows] = await connection.execute('SELECT COUNT(*) as total FROM audit_events');
    
    // Events heute
    const [todayRows] = await connection.execute(
      'SELECT COUNT(*) as today FROM audit_events WHERE DATE(timestamp) = CURDATE()'
    );
    
    // Events diese Woche
    const [weekRows] = await connection.execute(
      'SELECT COUNT(*) as week FROM audit_events WHERE WEEK(timestamp) = WEEK(NOW())'
    );
    
    // Events diesen Monat
    const [monthRows] = await connection.execute(
      'SELECT COUNT(*) as month FROM audit_events WHERE MONTH(timestamp) = MONTH(NOW())'
    );
    
    // Top Event Types
    const [typeRows] = await connection.execute(
      'SELECT event_type, COUNT(*) as count FROM audit_events GROUP BY event_type ORDER BY count DESC LIMIT 10'
    );
    
    await connection.end();
    
    res.json({
      success: true,
      data: {
        total: totalRows[0].total,
        today: todayRows[0].today,
        week: weekRows[0].week,
        month: monthRows[0].month,
        top_event_types: typeRows
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Audit Statistiken:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Datenbankverbindung testen
 */
exports.testConnection = functions.https.onRequest(async (req, res) => {
  // CORS-Header setzen
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.status(200).send('');
    return;
  }

  setCorsHeaders(res);

  try {
    const connection = await createConnection();
    
    // Einfache Abfrage zum Testen
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as timestamp');
    await connection.end();
    
    res.json({
      success: true,
      message: 'Datenbankverbindung erfolgreich',
      data: rows[0]
    });
  } catch (error) {
    console.error('Datenbankverbindungstest fehlgeschlagen:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health Check
 */
exports.healthCheck = functions.https.onRequest(async (req, res) => {
  setCorsHeaders(res);
  
  try {
    const connection = await createConnection();
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM audit_events');
    await connection.end();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      total_events: rows[0].count
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

/**
 * Matrix.org-Style Serverfarm Endpunkte
 */

/**
 * Öffentliche Räume abrufen (ohne Account)
 */
exports.getPublicRooms = functions.https.onRequest(async (req, res) => {
  setCorsHeaders(res);
  
  try {
    const rooms = [
      {
        id: 'firebase-info-global',
        name: '🌍 Firebase Global Information',
        description: 'Weltweite Nachrichten über Firebase Serverfarm',
        category: 'info',
        memberCount: 0,
        public: true,
        topics: ['firebase', 'news', 'cloud', 'serverfarm']
      },
      {
        id: 'firebase-tech-innovation',
        name: '🚀 Firebase Tech Innovation',
        description: 'Neueste Firebase Features und Cloud-Technologien',
        category: 'technology',
        memberCount: 0,
        public: true,
        topics: ['firebase', 'cloud', 'serverless', 'innovation']
      },
      {
        id: 'firebase-science-data',
        name: '🔬 Firebase Science & Data',
        description: 'Wissenschaftliche Daten und Analysen',
        category: 'science',
        memberCount: 0,
        public: true,
        topics: ['data', 'analytics', 'research', 'science']
      }
    ];

    res.json({
      success: true,
      rooms,
      total: rooms.length,
      publicAccess: true,
      message: 'Firebase Serverfarm - Öffentliche Räume ohne Account',
      serverfarm: 'firebase'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Raum-Inhalte abrufen
 */
exports.getRoomContent = functions.https.onRequest(async (req, res) => {
  setCorsHeaders(res);
  
  try {
    const roomId = req.query.roomId;
    
    if (!roomId) {
      return res.status(400).json({
        success: false,
        error: 'roomId ist erforderlich'
      });
    }

    const roomContent = {
      'firebase-info-global': {
        id: 'firebase-info-global',
        name: '🌍 Firebase Global Information',
        messages: [
          {
            id: 'firebase-msg-1',
            sender: 'FirebaseBot',
            timestamp: new Date().toISOString(),
            content: 'Firebase Serverfarm läuft stabil - Alle Services online',
            type: 'text',
            public: true
          },
          {
            id: 'firebase-msg-2',
            sender: 'CloudBot',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            content: 'Cloud SQL Performance: Optimal - 99.9% Uptime',
            type: 'text',
            public: true
          }
        ],
        media: [
          {
            id: 'firebase-media-1',
            title: 'Firebase Serverfarm Status Report',
            type: 'video',
            url: 'https://firebase.example.com/status-report.mp4',
            duration: '4:20',
            public: true
          }
        ]
      },
      'firebase-tech-innovation': {
        id: 'firebase-tech-innovation',
        name: '🚀 Firebase Tech Innovation',
        messages: [
          {
            id: 'firebase-msg-3',
            sender: 'TechBot',
            timestamp: new Date().toISOString(),
            content: 'Neue Firebase Functions verfügbar - Matrix.org-Style Integration',
            type: 'text',
            public: true
          }
        ],
        media: [
          {
            id: 'firebase-media-2',
            title: 'Firebase Tech Demo',
            type: 'video',
            url: 'https://firebase.example.com/tech-demo.mp4',
            duration: '6:15',
            public: true
          }
        ]
      }
    };

    const content = roomContent[roomId] || {
      id: roomId,
      name: 'Unknown Room',
      messages: [],
      media: [],
      error: 'Raum nicht gefunden'
    };

    res.json({
      success: true,
      room: content,
      publicAccess: true,
      serverfarm: 'firebase'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Medien-Inhalte suchen
 */
exports.searchMediaContent = functions.https.onRequest(async (req, res) => {
  setCorsHeaders(res);
  
  try {
    const query = req.query.q || '';
    const category = req.query.category || 'all';
    
    const mediaResults = [
      {
        id: 'firebase-search-1',
        title: `Firebase Suchergebnis für "${query}"`,
        category: category,
        type: 'video',
        url: 'https://firebase.example.com/search-result.mp4',
        duration: '3:30',
        description: `Firebase-relevanter Inhalt zu ${query} in Kategorie ${category}`,
        public: true,
        downloadUrl: `https://firebase.example.com/download/${query}.mp4`,
        serverfarm: 'firebase'
      }
    ];

    res.json({
      success: true,
      query,
      category,
      results: mediaResults,
      total: mediaResults.length,
      publicAccess: true,
      message: 'Firebase Serverfarm - Öffentliche Medien ohne Account',
      serverfarm: 'firebase'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Medien-Kategorien abrufen
 */
exports.getMediaCategories = functions.https.onRequest(async (req, res) => {
  setCorsHeaders(res);
  
  try {
    const categories = [
      { id: 'firebase-info', name: 'Firebase Information', icon: '🌍', count: 75 },
      { id: 'firebase-tech', name: 'Firebase Technology', icon: '🚀', count: 120 },
      { id: 'firebase-science', name: 'Firebase Science', icon: '🔬', count: 45 },
      { id: 'firebase-cloud', name: 'Cloud Computing', icon: '☁️', count: 89 },
      { id: 'firebase-data', name: 'Data Analytics', icon: '📊', count: 67 },
      { id: 'firebase-serverless', name: 'Serverless', icon: '⚡', count: 34 }
    ];

    res.json({
      success: true,
      categories,
      total: categories.reduce((sum, cat) => sum + cat.count, 0),
      publicAccess: true,
      serverfarm: 'firebase'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Medien-Item abrufen
 */
exports.getMediaItem = functions.https.onRequest(async (req, res) => {
  setCorsHeaders(res);
  
  try {
    const mediaId = req.query.mediaId;
    
    if (!mediaId) {
      return res.status(400).json({
        success: false,
        error: 'mediaId ist erforderlich'
      });
    }

    const mediaItem = {
      id: mediaId,
      title: 'Firebase Media Item',
      description: 'Beschreibung des Firebase Medien-Inhalts',
      type: 'video',
      url: `https://firebase.example.com/media/${mediaId}.mp4`,
      duration: '5:30',
      category: 'firebase-info',
      public: true,
      downloadUrl: `https://firebase.example.com/download/${mediaId}.mp4`,
      streamUrl: `https://firebase.example.com/stream/${mediaId}.m3u8`,
      serverfarm: 'firebase'
    };

    res.json({
      success: true,
      media: mediaItem,
      publicAccess: true,
      message: 'Firebase Serverfarm - Öffentlicher Zugang verfügbar',
      serverfarm: 'firebase'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
