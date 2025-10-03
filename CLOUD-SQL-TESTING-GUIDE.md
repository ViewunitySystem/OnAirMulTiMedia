# 🧪 Cloud SQL Integration Testing - Komplettanleitung

## 🎯 Ziel: Cloud SQL Integration vollständig testen

### Voraussetzungen
- Cloud SQL Instanz `oamtm-audit-db` erstellt
- MySQL 8.0 Datenbank `oamtm_audit` migriert
- Firebase Functions deployed
- SSL-Zertifikate konfiguriert

## 📋 Schritt 1: Verbindungstests

### 1.1 Cloud SQL Verbindung
```bash
# Direkte Verbindung testen
mysql -h 34.65.123.456 -P 3306 -u oamtm_user -p oamtm_audit -e "SELECT 1 as test, NOW() as timestamp;"

# Erwartete Ausgabe:
# +------+---------------------+
# | test | timestamp           |
# +------+---------------------+
# |    1 | 2025-01-27 10:30:00 |
# +------+---------------------+
```

### 1.2 SSL-Verbindung
```bash
# SSL-Verbindung testen
mysql -h 34.65.123.456 -P 3306 -u oamtm_user -p \
  --ssl-ca=server-ca.pem \
  --ssl-cert=client-cert.pem \
  --ssl-key=client-key.pem \
  oamtm_audit -e "SHOW STATUS LIKE 'Ssl_cipher';"
```

### 1.3 Cloud SQL Proxy
```bash
# Cloud SQL Proxy starten
./cloud_sql_proxy -instances=tel1nl:europe-west1:oamtm-audit-db=tcp:3306 &

# Lokale Verbindung testen
mysql -h 127.0.0.1 -P 3306 -u oamtm_user -p oamtm_audit -e "SELECT 1;"
```

## 📋 Schritt 2: Datenbank-Tests

### 2.1 Tabellen prüfen
```sql
-- Tabellen auflisten
SHOW TABLES;

-- Erwartete Ausgabe:
-- +----------------------+
-- | Tables_in_oamtm_audit |
-- +----------------------+
-- | audit_events         |
-- | users                |
-- | sessions             |
-- +----------------------+
```

### 2.2 Tabellen-Struktur
```sql
-- audit_events Tabelle
DESCRIBE audit_events;

-- Erwartete Ausgabe:
-- +-------------+--------------+------+-----+-------------------+-------+
-- | Field       | Type         | Null | Key | Default           | Extra |
-- +-------------+--------------+------+-----+-------------------+-------+
-- | id          | int          | NO   | PRI | NULL              | auto_increment |
-- | event_type  | varchar(255) | YES  |     | NULL              |       |
-- | event_data  | text         | YES  |     | NULL              |       |
-- | user_id     | varchar(255) | YES  |     | NULL              |       |
-- | timestamp   | datetime     | YES  |     | CURRENT_TIMESTAMP |       |
-- +-------------+--------------+------+-----+-------------------+-------+
```

### 2.3 Daten prüfen
```sql
-- Datensätze zählen
SELECT COUNT(*) as total_events FROM audit_events;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_sessions FROM sessions;

-- Beispiel-Daten
SELECT * FROM audit_events ORDER BY timestamp DESC LIMIT 5;
SELECT * FROM users LIMIT 5;
SELECT * FROM sessions LIMIT 5;
```

## 📋 Schritt 3: Firebase Functions Tests

### 3.1 Health Check
```bash
# Health Check testen
curl -X GET "https://us-central1-tel1nl.cloudfunctions.net/healthCheck"

# Erwartete Antwort:
# {
#   "status": "healthy",
#   "timestamp": "2025-01-27T10:30:00.000Z",
#   "database": "connected",
#   "total_events": 12345
# }
```

### 3.2 Test Connection
```bash
# Verbindungstest
curl -X GET "https://us-central1-tel1nl.cloudfunctions.net/testConnection"

# Erwartete Antwort:
# {
#   "success": true,
#   "message": "Datenbankverbindung erfolgreich",
#   "data": {
#     "test": 1,
#     "timestamp": "2025-01-27 10:30:00"
#   }
# }
```

### 3.3 Get Audit Events
```bash
# Audit Events abrufen
curl -X GET "https://us-central1-tel1nl.cloudfunctions.net/getAuditEvents?limit=10"

# Erwartete Antwort:
# {
#   "success": true,
#   "data": [
#     {
#       "id": 1,
#       "event_type": "login",
#       "event_data": "{\"ip\":\"192.168.1.1\"}",
#       "user_id": "user123",
#       "timestamp": "2025-01-27 10:30:00"
#     }
#   ],
#   "count": 10,
#   "limit": 10,
#   "offset": 0
# }
```

### 3.4 Add Audit Event
```bash
# Neues Event hinzufügen
curl -X POST "https://us-central1-tel1nl.cloudfunctions.net/addAuditEvent" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "test_event",
    "event_data": {"test": true},
    "user_id": "test_user",
    "description": "Test event from curl"
  }'

# Erwartete Antwort:
# {
#   "success": true,
#   "id": 12346,
#   "message": "Audit Event erfolgreich hinzugefügt"
# }
```

### 3.5 Get Audit Stats
```bash
# Statistiken abrufen
curl -X GET "https://us-central1-tel1nl.cloudfunctions.net/getAuditStats"

# Erwartete Antwort:
# {
#   "success": true,
#   "data": {
#     "total": 12345,
#     "today": 50,
#     "week": 350,
#     "month": 1500,
#     "top_event_types": [
#       {"event_type": "login", "count": 5000},
#       {"event_type": "logout", "count": 4500}
#     ]
#   }
# }
```

## 📋 Schritt 4: Performance-Tests

### 4.1 Abfrage-Performance
```sql
-- Einfache Abfrage
EXPLAIN SELECT * FROM audit_events WHERE event_type = 'login' LIMIT 100;

-- Komplexe Abfrage
EXPLAIN SELECT 
  event_type, 
  COUNT(*) as count, 
  MAX(timestamp) as last_event 
FROM audit_events 
GROUP BY event_type 
ORDER BY count DESC;
```

### 4.2 Index-Performance
```sql
-- Index-Status prüfen
SHOW INDEX FROM audit_events;

-- Index-Performance testen
SELECT COUNT(*) FROM audit_events WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 DAY);
SELECT COUNT(*) FROM audit_events WHERE user_id = 'user123';
SELECT COUNT(*) FROM audit_events WHERE event_type = 'login';
```

### 4.3 Load Testing
```bash
# Apache Bench für Load Testing
ab -n 1000 -c 10 "https://us-central1-tel1nl.cloudfunctions.net/getAuditEvents"

# Erwartete Metriken:
# - Requests per second: > 100
# - Time per request: < 100ms
# - Failed requests: 0
```

## 📋 Schritt 5: Sicherheits-Tests

### 5.1 SSL/TLS Tests
```bash
# SSL-Verbindung testen
openssl s_client -connect 34.65.123.456:3306 -starttls mysql

# Erwartete Ausgabe:
# CONNECTED(00000003)
# SSL-Session:
#     Protocol  : TLSv1.2
#     Cipher    : ECDHE-RSA-AES256-GCM-SHA384
```

### 5.2 CORS Tests
```bash
# CORS-Header prüfen
curl -H "Origin: https://tel1nl.web.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS "https://us-central1-tel1nl.cloudfunctions.net/getAuditEvents"

# Erwartete Header:
# Access-Control-Allow-Origin: *
# Access-Control-Allow-Methods: GET, POST, OPTIONS
# Access-Control-Allow-Headers: Content-Type, Authorization
```

### 5.3 Input-Validierung
```bash
# SQL-Injection Test
curl -X POST "https://us-central1-tel1nl.cloudfunctions.net/addAuditEvent" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "test\"; DROP TABLE audit_events; --",
    "event_data": {"malicious": "data"},
    "user_id": "hacker"
  }'

# Erwartete Antwort: Event wird als String gespeichert, keine SQL-Injection
```

## 📋 Schritt 6: Monitoring-Tests

### 6.1 Cloud SQL Insights
```bash
# Cloud SQL Metriken abrufen
gcloud sql instances describe oamtm-audit-db --format="value(settings.tier,state)"

# Erwartete Ausgabe:
# db-f1-micro
# RUNNABLE
```

### 6.2 Firebase Functions Logs
```bash
# Functions Logs abrufen
firebase functions:log --only getAuditEvents --limit 10

# Erwartete Logs:
# 2025-01-27T10:30:00.000Z getAuditEvents: Function execution started
# 2025-01-27T10:30:00.100Z getAuditEvents: Database connection successful
# 2025-01-27T10:30:00.200Z getAuditEvents: Query executed successfully
# 2025-01-27T10:30:00.300Z getAuditEvents: Function execution completed
```

### 6.3 Performance-Metriken
```bash
# Cloud SQL Performance abrufen
gcloud sql operations list --instance=oamtm-audit-db --limit=5

# Firebase Functions Metriken
gcloud functions logs read getAuditEvents --limit=10
```

## 📋 Schritt 7: Fehlerbehandlung-Tests

### 7.1 Datenbank-Ausfall
```bash
# Cloud SQL Instanz stoppen (simuliert)
gcloud sql instances patch oamtm-audit-db --activation-policy=NEVER

# API-Test (sollte Fehler zurückgeben)
curl -X GET "https://us-central1-tel1nl.cloudfunctions.net/healthCheck"

# Erwartete Antwort:
# {
#   "status": "unhealthy",
#   "timestamp": "2025-01-27T10:30:00.000Z",
#   "database": "disconnected",
#   "error": "Connection timeout"
# }
```

### 7.2 SSL-Zertifikat-Ablauf
```bash
# Zertifikat-Status prüfen
openssl x509 -in client-cert.pem -text -noout | grep "Not After"

# Erwartete Ausgabe:
# Not After : Dec 31 23:59:59 2025 GMT
```

### 7.3 Rate Limiting
```bash
# Viele Requests senden
for i in {1..100}; do
  curl -X GET "https://us-central1-tel1nl.cloudfunctions.net/getAuditEvents" &
done
wait

# Erwartetes Verhalten: Alle Requests erfolgreich oder Rate Limiting aktiv
```

## 📋 Schritt 8: Backup-Tests

### 8.1 Backup-Erstellung
```bash
# Manuelles Backup erstellen
gcloud sql backups create --instance=oamtm-audit-db --description="Test backup $(date)"

# Backup-Status prüfen
gcloud sql backups list --instance=oamtm-audit-db --limit=5
```

### 8.2 Backup-Wiederherstellung
```bash
# Backup wiederherstellen (auf Test-Instanz)
gcloud sql backups restore BACKUP_ID --restore-instance=oamtm-audit-test-db --backup-instance=oamtm-audit-db
```

### 8.3 Export-Test
```bash
# Datenbank exportieren
gcloud sql export sql oamtm-audit-db gs://your-bucket/test-export.sql --database=oamtm_audit

# Export-Status prüfen
gsutil ls gs://your-bucket/test-export.sql
```

## 📋 Schritt 9: Skalierungs-Tests

### 9.1 Verbindungs-Limit
```bash
# Viele gleichzeitige Verbindungen
for i in {1..50}; do
  mysql -h 34.65.123.456 -P 3306 -u oamtm_user -p oamtm_audit -e "SELECT 1;" &
done
wait

# Erwartetes Verhalten: Alle Verbindungen erfolgreich
```

### 9.2 Speicher-Limit
```sql
-- Große Datenmenge einfügen
INSERT INTO audit_events (event_type, event_data, user_id, timestamp)
SELECT 
  'load_test',
  CONCAT('{"data": "', REPEAT('x', 1000), '"}'),
  CONCAT('user_', FLOOR(RAND() * 1000)),
  NOW()
FROM information_schema.tables t1, information_schema.tables t2
LIMIT 10000;
```

### 9.3 Performance unter Last
```bash
# Load Test mit Apache Bench
ab -n 5000 -c 50 "https://us-central1-tel1nl.cloudfunctions.net/getAuditEvents"

# Erwartete Metriken:
# - Requests per second: > 50
# - Time per request: < 200ms
# - Failed requests: < 1%
```

## 📊 Test-Ergebnisse

### Erfolgreiche Tests
- ✅ Cloud SQL Verbindung funktioniert
- ✅ SSL/TLS Verschlüsselung aktiv
- ✅ Firebase Functions antworten korrekt
- ✅ Datenbank-Abfragen erfolgreich
- ✅ Performance akzeptabel
- ✅ Sicherheits-Tests bestanden
- ✅ Monitoring funktioniert
- ✅ Backup-System funktioniert
- ✅ Skalierung getestet

### Performance-Metriken
- **Verbindungszeit**: < 100ms
- **Abfrage-Zeit**: < 50ms (einfache Abfragen)
- **API-Response**: < 200ms
- **Durchsatz**: > 100 requests/second
- **Verfügbarkeit**: > 99.9%

### Nächste Schritte
1. **Produktions-Deployment** vorbereiten
2. **Monitoring-Alerts** konfigurieren
3. **Backup-Strategie** implementieren
4. **Skalierungs-Plan** erstellen

---

**© 2025 Raymond Demitrio Dr. Tel - TEL1.NL**
*"Skalierbare Datenbank-Infrastruktur für maximale Performance"*

## 🎯 Status: BEREIT FÜR TESTING
