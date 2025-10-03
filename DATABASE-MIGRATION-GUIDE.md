# 🔄 SQLite zu Cloud SQL Migration - Komplettanleitung

## 🎯 Ziel: enhanced-audit.db (232.88 MB) zu Cloud SQL migrieren

### Voraussetzungen
- Cloud SQL Instanz `oamtm-audit-db` erstellt
- MySQL 8.0 Datenbank `oamtm_audit` vorhanden
- Benutzer `oamtm_user` mit Berechtigungen
- SSL-Zertifikate konfiguriert

## 📋 Schritt 1: SQLite-Datenbank analysieren

### 1.1 Datenbank-Struktur prüfen
```bash
# SQLite-Datenbank öffnen
sqlite3 audit/sqlite/enhanced-audit.db

# Tabellen auflisten
.tables

# Schema anzeigen
.schema

# Datenbank-Info
.dbinfo
```

### 1.2 Datenbank-Größe prüfen
```bash
# Dateigröße prüfen
ls -lh audit/sqlite/enhanced-audit.db

# Tabellen-Größen
sqlite3 audit/sqlite/enhanced-audit.db "SELECT name, COUNT(*) as count FROM sqlite_master WHERE type='table' GROUP BY name;"
```

## 📋 Schritt 2: SQLite zu SQL-Dump konvertieren

### 2.1 SQL-Dump erstellen
```bash
# SQLite-Dump erstellen
sqlite3 audit/sqlite/enhanced-audit.db .dump > audit/sqlite/enhanced-audit.sql

# Dump-Größe prüfen
ls -lh audit/sqlite/enhanced-audit.sql
```

### 2.2 SQL-Dump für MySQL anpassen
```bash
# MySQL-spezifische Anpassungen
sed -i 's/AUTOINCREMENT/AUTO_INCREMENT/g' audit/sqlite/enhanced-audit.sql
sed -i 's/INTEGER/INT/g' audit/sqlite/enhanced-audit.sql
sed -i 's/TEXT/VARCHAR(255)/g' audit/sqlite/enhanced-audit.sql
sed -i 's/BLOB/LONGBLOB/g' audit/sqlite/enhanced-audit.sql
sed -i 's/datetime('\''now'\'')/NOW()/g' audit/sqlite/enhanced-audit.sql

# CREATE TABLE Anpassungen
sed -i 's/CREATE TABLE "\([^"]*\)"/CREATE TABLE `\1`/g' audit/sqlite/enhanced-audit.sql
sed -i 's/INSERT INTO "\([^"]*\)"/INSERT INTO `\1`/g' audit/sqlite/enhanced-audit.sql

# Index-Anpassungen
sed -i 's/CREATE INDEX "\([^"]*\)" ON "\([^"]*\)"/CREATE INDEX `\1` ON `\2`/g' audit/sqlite/enhanced-audit.sql
```

### 2.3 MySQL-Header hinzufügen
```bash
# MySQL-Header erstellen
cat > audit/sqlite/mysql-header.sql << 'EOF'
-- MySQL-Dump für OAMTM enhanced-audit.db
-- Generiert: $(date)
-- Quelle: SQLite-Datenbank

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Datenbank erstellen falls nicht vorhanden
CREATE DATABASE IF NOT EXISTS `oamtm_audit` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `oamtm_audit`;

EOF

# Header und Dump zusammenführen
cat audit/sqlite/mysql-header.sql audit/sqlite/enhanced-audit.sql > audit/sqlite/enhanced-audit-mysql.sql
echo "SET FOREIGN_KEY_CHECKS = 1;" >> audit/sqlite/enhanced-audit-mysql.sql
```

## 📋 Schritt 3: Cloud SQL Verbindung testen

### 3.1 Cloud SQL Proxy (empfohlen)
```bash
# Cloud SQL Proxy installieren
curl -o cloud_sql_proxy https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64
chmod +x cloud_sql_proxy

# Verbindung herstellen
./cloud_sql_proxy -instances=tel1nl:europe-west1:oamtm-audit-db=tcp:3306 &
```

### 3.2 Direkte Verbindung
```bash
# MySQL Client installieren
sudo apt-get install mysql-client

# Verbindung testen
mysql -h 34.65.123.456 -P 3306 -u oamtm_user -p oamtm_audit
```

### 3.3 Verbindungstest
```sql
-- Verbindung testen
SELECT 1 as test, NOW() as timestamp;

-- Datenbank-Info
SHOW DATABASES;
USE oamtm_audit;
SHOW TABLES;
```

## 📋 Schritt 4: Datenbank-Import

### 4.1 Kleine Dateien (< 100 MB)
```bash
# Direkter Import
mysql -h 34.65.123.456 -P 3306 -u oamtm_user -p oamtm_audit < audit/sqlite/enhanced-audit-mysql.sql
```

### 4.2 Große Dateien (> 100 MB)
```bash
# Cloud Storage Upload
gsutil cp audit/sqlite/enhanced-audit-mysql.sql gs://your-bucket/enhanced-audit-mysql.sql

# Cloud SQL Import
gcloud sql import sql oamtm-audit-db gs://your-bucket/enhanced-audit-mysql.sql --database=oamtm_audit
```

### 4.3 Chunked Import (für sehr große Dateien)
```bash
# Datei in Chunks aufteilen
split -l 1000 audit/sqlite/enhanced-audit-mysql.sql audit/sqlite/chunk_

# Chunks importieren
for chunk in audit/sqlite/chunk_*; do
  echo "Importing $chunk..."
  mysql -h 34.65.123.456 -P 3306 -u oamtm_user -p oamtm_audit < "$chunk"
done
```

## 📋 Schritt 5: Datenbank-Validierung

### 5.1 Tabellen prüfen
```sql
-- Tabellen auflisten
SHOW TABLES;

-- Tabellen-Struktur prüfen
DESCRIBE audit_events;
DESCRIBE users;
DESCRIBE sessions;
```

### 5.2 Daten prüfen
```sql
-- Datensätze zählen
SELECT COUNT(*) FROM audit_events;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM sessions;

-- Beispiel-Daten
SELECT * FROM audit_events LIMIT 5;
SELECT * FROM users LIMIT 5;
```

### 5.3 Indexe prüfen
```sql
-- Indexe auflisten
SHOW INDEX FROM audit_events;
SHOW INDEX FROM users;
SHOW INDEX FROM sessions;
```

## 📋 Schritt 6: Performance-Optimierung

### 6.1 Indexe erstellen
```sql
-- Performance-Indexe
CREATE INDEX idx_audit_events_timestamp ON audit_events(timestamp);
CREATE INDEX idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX idx_audit_events_event_type ON audit_events(event_type);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
```

### 6.2 Tabellen-Optimierung
```sql
-- Tabellen optimieren
OPTIMIZE TABLE audit_events;
OPTIMIZE TABLE users;
OPTIMIZE TABLE sessions;

-- Tabellen-Status
SHOW TABLE STATUS;
```

### 6.3 Konfiguration anpassen
```sql
-- MySQL-Konfiguration
SET GLOBAL innodb_buffer_pool_size = 1073741824; -- 1GB
SET GLOBAL max_connections = 100;
SET GLOBAL query_cache_size = 67108864; -- 64MB
```

## 📋 Schritt 7: Backup erstellen

### 7.1 Lokales Backup
```bash
# Backup-Verzeichnis erstellen
mkdir -p backups/cloud-sql-migration/$(date +%Y%m%d_%H%M%S)

# SQLite-Datenbank kopieren
cp audit/sqlite/enhanced-audit.db backups/cloud-sql-migration/$(date +%Y%m%d_%H%M%S)/

# SQL-Dumps kopieren
cp audit/sqlite/enhanced-audit.sql backups/cloud-sql-migration/$(date +%Y%m%d_%H%M%S)/
cp audit/sqlite/enhanced-audit-mysql.sql backups/cloud-sql-migration/$(date +%Y%m%d_%H%M%S)/
```

### 7.2 Cloud SQL Backup
```bash
# Cloud SQL Backup erstellen
gcloud sql backups create --instance=oamtm-audit-db --description="Migration backup $(date)"
```

### 7.3 Export zu Cloud Storage
```bash
# Datenbank exportieren
gcloud sql export sql oamtm-audit-db gs://your-bucket/oamtm_audit_backup.sql --database=oamtm_audit
```

## 📋 Schritt 8: App-Integration

### 8.1 Environment Variables
```bash
# .env Datei aktualisieren
DB_HOST=34.65.123.456
DB_PORT=3306
DB_USER=oamtm_user
DB_PASSWORD=SecurePassword123!
DB_NAME=oamtm_audit
DB_SSL_CA=server-ca.pem
DB_SSL_CERT=client-cert.pem
DB_SSL_KEY=client-key.pem
```

### 8.2 Firebase Functions
```bash
# Firebase Functions deployen
cd functions
npm install
firebase deploy --only functions
```

### 8.3 API-Tests
```bash
# Health Check
curl https://us-central1-tel1nl.cloudfunctions.net/healthCheck

# Audit Events abrufen
curl https://us-central1-tel1nl.cloudfunctions.net/getAuditEvents

# Verbindung testen
curl https://us-central1-tel1nl.cloudfunctions.net/testConnection
```

## 📋 Schritt 9: Monitoring einrichten

### 9.1 Cloud SQL Insights
- Performance-Metriken überwachen
- Abfrage-Analyse aktivieren
- Verbindungs-Überwachung einrichten
- Speicher-Nutzung überwachen

### 9.2 Firebase Functions Logs
- Request-Logs überwachen
- Error-Logs analysieren
- Performance-Metriken prüfen
- Invocation-Counts verfolgen

### 9.3 Alerts konfigurieren
```bash
# Cloud SQL Alerts
gcloud alpha monitoring policies create --policy-from-file=cloud-sql-alerts.yaml

# Firebase Functions Alerts
gcloud alpha monitoring policies create --policy-from-file=functions-alerts.yaml
```

## 🛠️ Troubleshooting

### Häufige Probleme

#### 1. "Table doesn't exist"
```sql
-- Tabellen prüfen
SHOW TABLES;

-- Schema prüfen
DESCRIBE table_name;
```

#### 2. "Connection timeout"
```bash
# Verbindungstest
mysql -h 34.65.123.456 -P 3306 -u oamtm_user -p oamtm_audit -e "SELECT 1;"

# Cloud SQL Proxy verwenden
./cloud_sql_proxy -instances=tel1nl:europe-west1:oamtm-audit-db=tcp:3306
```

#### 3. "SSL certificate error"
```bash
# Zertifikate prüfen
openssl x509 -in client-cert.pem -text -noout

# SSL-Verbindung testen
mysql -h 34.65.123.456 -P 3306 -u oamtm_user -p --ssl-ca=server-ca.pem --ssl-cert=client-cert.pem --ssl-key=client-key.pem
```

#### 4. "Import failed"
```bash
# Fehler-Logs prüfen
gcloud sql operations list --instance=oamtm-audit-db

# Import-Status prüfen
gcloud sql operations describe OPERATION_ID --instance=oamtm-audit-db
```

## 📊 Migration-Status

### Erfolgreiche Migration
- ✅ SQLite-Datenbank exportiert
- ✅ MySQL-Dump erstellt
- ✅ Cloud SQL Import erfolgreich
- ✅ Datenbank-Validierung bestanden
- ✅ Performance-Optimierung abgeschlossen
- ✅ Backup erstellt
- ✅ App-Integration funktioniert
- ✅ Monitoring eingerichtet

### Nächste Schritte
1. **Produktions-Tests** durchführen
2. **Performance-Monitoring** aktivieren
3. **Backup-Strategie** implementieren
4. **Skalierung** planen

---

**© 2025 Raymond Demitrio Dr. Tel - TEL1.NL**
*"Skalierbare Datenbank-Infrastruktur für maximale Performance"*

## 🎯 Status: BEREIT FÜR MIGRATION
