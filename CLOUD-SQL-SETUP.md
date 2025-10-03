# 🗄️ Cloud SQL Setup für OAMTM enhanced-audit.db

## Übersicht

Dieses Dokument beschreibt die Einrichtung von Google Cloud SQL für die große SQLite-Datenbank `enhanced-audit.db` (232.88 MB), die nicht auf Firebase Hosting passt.

## 🎯 Ziele

- **Cloud SQL Instanz** für enhanced-audit.db erstellen
- **Kostenlose Tier** (10 GB) nutzen
- **SQLite-Datenbank** importieren
- **App-Integration** mit Cloud SQL
- **Firebase Hosting** für Frontend

## 📋 Schritt-für-Schritt Anleitung

### 1. Cloud SQL Instanz erstellen

#### 1.1 Google Cloud Console öffnen
1. Gehe zu [console.cloud.google.com](https://console.cloud.google.com)
2. Wähle das Projekt **`tel1nl`** oder **`back-ee052`**
3. Gehe zu **SQL** → **Create Instance**

#### 1.2 Instanz konfigurieren
**Allgemeine Einstellungen:**
- **Instance ID**: `oamtm-audit-db`
- **Database type**: `MySQL` (empfohlen für SQLite-Migration)
- **Region**: `europe-west1` (Niederlande)
- **Zone**: `europe-west1-a`

**Maschine und Speicher:**
- **Machine type**: `db-f1-micro` (kostenlos)
- **Storage type**: `SSD`
- **Storage capacity**: `10 GB` (kostenlos)
- **Enable automatic storage increases**: `Ja`

**Verbindungen:**
- **Public IP**: `Ja`
- **Private IP**: `Nein` (für Einfachheit)

#### 1.3 Datenbank erstellen
- **Database name**: `oamtm_audit`
- **Character set**: `utf8mb4`
- **Collation**: `utf8mb4_unicode_ci`

### 2. SQLite zu MySQL Migration

#### 2.1 SQLite-Datenbank exportieren
```bash
# SQLite-Datenbank zu SQL-Dump konvertieren
sqlite3 enhanced-audit.db .dump > enhanced-audit.sql
```

#### 2.2 SQL-Dump für MySQL anpassen
```sql
-- MySQL-spezifische Anpassungen
-- SQLite-spezifische Syntax entfernen
-- AUTOINCREMENT zu AUTO_INCREMENT
-- INTEGER zu INT
-- TEXT zu VARCHAR oder TEXT
```

#### 2.3 Datenbank importieren
```bash
# SQL-Dump in Cloud SQL importieren
gcloud sql import sql oamtm-audit-db gs://your-bucket/enhanced-audit.sql --database=oamtm_audit
```

### 3. Verbindung konfigurieren

#### 3.1 Connection String
```
mysql://username:password@34.65.123.456:3306/oamtm_audit
```

#### 3.2 SSL-Zertifikat
```bash
# SSL-Zertifikat herunterladen
gcloud sql ssl-certs create client-cert oamtm-audit-db
gcloud sql ssl-certs describe client-cert --instance=oamtm-audit-db
```

### 4. App-Integration

#### 4.1 MySQL-Client installieren
```bash
npm install mysql2
```

#### 4.2 Datenbankverbindung
```javascript
// config/database.js
const mysql = require('mysql2/promise');

const dbConfig = {
  host: '34.65.123.456',
  port: 3306,
  user: 'oamtm_user',
  password: process.env.DB_PASSWORD,
  database: 'oamtm_audit',
  ssl: {
    ca: fs.readFileSync('path/to/server-ca.pem'),
    cert: fs.readFileSync('path/to/client-cert.pem'),
    key: fs.readFileSync('path/to/client-key.pem')
  }
};

const connection = mysql.createConnection(dbConfig);
```

#### 4.3 API-Endpoints
```javascript
// api/audit.js
app.get('/api/audit/events', async (req, res) => {
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM audit_events ORDER BY timestamp DESC LIMIT 100'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🔒 Sicherheit

### SSL/TLS
- **SSL-Verbindung** erforderlich
- **Client-Zertifikate** für Authentifizierung
- **Verschlüsselte Übertragung**

### Zugriffskontrolle
- **IP-Whitelist** für Firebase Functions
- **Benutzerkonten** mit minimalen Berechtigungen
- **Passwort-Rotation** regelmäßig

### Backup
- **Automatische Backups** (7 Tage)
- **Point-in-time Recovery**
- **Export zu Cloud Storage**

## 💰 Kosten

### Kostenlose Tier
- **db-f1-micro**: 0€/Monat
- **10 GB SSD**: 0€/Monat
- **Backups**: 0€/Monat
- **Egress**: 1 GB/Monat kostenlos

### Bezahlte Tier (bei Bedarf)
- **db-g1-small**: $7.67/Monat
- **Zusätzlicher Speicher**: $0.17/GB/Monat
- **Egress**: $0.12/GB

## 🚀 Deployment

### 1. Firebase Functions
```javascript
// functions/index.js
const functions = require('firebase-functions');
const mysql = require('mysql2/promise');

exports.getAuditEvents = functions.https.onRequest(async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.execute('SELECT * FROM audit_events');
  res.json(rows);
});
```

### 2. Environment Variables
```bash
# .env
DB_HOST=34.65.123.456
DB_PORT=3306
DB_USER=oamtm_user
DB_PASSWORD=secure_password
DB_NAME=oamtm_audit
```

### 3. Firebase Config
```json
// firebase.json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  },
  "hosting": {
    "public": "OnAirMulTiMedia",
    "ignore": [
      "audit/sqlite/enhanced-audit.db",
      "**/*.db"
    ]
  }
}
```

## 📊 Monitoring

### Cloud SQL Insights
- **Performance-Metriken**
- **Abfrage-Analyse**
- **Verbindungs-Überwachung**
- **Speicher-Nutzung**

### Logging
- **Slow Query Log**
- **Error Log**
- **General Log**
- **Audit Log**

## 🔄 Migration

### 1. Datenbank-Migration
```bash
# SQLite-Datenbank exportieren
sqlite3 enhanced-audit.db .dump > enhanced-audit.sql

# MySQL-spezifische Anpassungen
sed -i 's/AUTOINCREMENT/AUTO_INCREMENT/g' enhanced-audit.sql
sed -i 's/INTEGER/INT/g' enhanced-audit.sql

# In Cloud SQL importieren
gcloud sql import sql oamtm-audit-db gs://bucket/enhanced-audit.sql
```

### 2. App-Migration
```javascript
// Vorher: SQLite
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('enhanced-audit.db');

// Nachher: MySQL
const mysql = require('mysql2/promise');
const connection = await mysql.createConnection(dbConfig);
```

## 🛠️ Troubleshooting

### Häufige Probleme

#### 1. "Connection refused"
**Lösung**: Firewall-Regeln prüfen
```bash
gcloud sql instances patch oamtm-audit-db --authorized-networks=0.0.0.0/0
```

#### 2. "SSL certificate error"
**Lösung**: Zertifikate aktualisieren
```bash
gcloud sql ssl-certs create client-cert oamtm-audit-db
```

#### 3. "Database not found"
**Lösung**: Datenbank erstellen
```sql
CREATE DATABASE oamtm_audit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 📞 Support

Bei Problemen:
1. **Cloud SQL Logs** überprüfen
2. **Firebase Functions Logs** analysieren
3. **Verbindung testen**
4. **Maintainer kontaktieren**: Raymond Demitrio Dr. Tel

---

**© 2025 Raymond Demitrio Dr. Tel - TEL1.NL**
*"Skalierbare Datenbank-Infrastruktur für maximale Performance"*
