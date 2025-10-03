# 🗄️ Cloud SQL Instanz Setup - Schritt für Schritt

## 🎯 Ziel: Cloud SQL Instanz für enhanced-audit.db erstellen

### Voraussetzungen
- Google Cloud Console Zugang
- Firebase Projekt `tel1nl` oder `back-ee052`
- Billing aktiviert (für kostenlose Tier)

## 📋 Schritt 1: Google Cloud Console öffnen

1. **Console öffnen**: [console.cloud.google.com](https://console.cloud.google.com)
2. **Projekt wählen**: `tel1nl` oder `back-ee052`
3. **Navigation**: SQL → Create Instance

## 📋 Schritt 2: Instanz konfigurieren

### 2.1 Allgemeine Einstellungen
- **Instance ID**: `oamtm-audit-db`
- **Database type**: `MySQL`
- **Database version**: `MySQL 8.0`
- **Region**: `europe-west1` (Niederlande)
- **Zone**: `europe-west1-a`

### 2.2 Maschine und Speicher
- **Machine type**: `db-f1-micro` (kostenlos)
- **Storage type**: `SSD`
- **Storage capacity**: `10 GB` (kostenlos)
- **Enable automatic storage increases**: `Ja`

### 2.3 Verbindungen
- **Public IP**: `Ja`
- **Private IP**: `Nein` (für Einfachheit)
- **Authorized networks**: `0.0.0.0/0` (temporär, später einschränken)

## 📋 Schritt 3: Datenbank erstellen

### 3.1 Datenbank
- **Database name**: `oamtm_audit`
- **Character set**: `utf8mb4`
- **Collation**: `utf8mb4_unicode_ci`

### 3.2 Benutzer
- **Username**: `oamtm_user`
- **Password**: `SecurePassword123!` (starkes Passwort)

## 📋 Schritt 4: Backup konfigurieren

### 4.1 Backup-Einstellungen
- **Enable automatic backups**: `Ja`
- **Backup start time**: `03:00` (UTC)
- **Backup retention**: `7 days` (kostenlos)

### 4.2 Point-in-time Recovery
- **Enable point-in-time recovery**: `Ja`
- **Binary logging**: `Ja`

## 📋 Schritt 5: Instanz erstellen

1. **Review**: Einstellungen überprüfen
2. **Create**: Instanz erstellen
3. **Warten**: 5-10 Minuten für Erstellung
4. **Status**: "Ready" abwarten

## 📋 Schritt 6: Verbindung testen

### 6.1 Cloud SQL Proxy (empfohlen)
```bash
# Cloud SQL Proxy installieren
curl -o cloud_sql_proxy https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64
chmod +x cloud_sql_proxy

# Verbindung herstellen
./cloud_sql_proxy -instances=tel1nl:europe-west1:oamtm-audit-db=tcp:3306
```

### 6.2 Direkte Verbindung
```bash
# MySQL Client installieren
sudo apt-get install mysql-client

# Verbindung testen
mysql -h 34.65.123.456 -P 3306 -u oamtm_user -p oamtm_audit
```

## 📋 Schritt 7: SSL-Zertifikate

### 7.1 Server-Zertifikat
```bash
# Server-Zertifikat herunterladen
gcloud sql ssl-certs create client-cert oamtm-audit-db
gcloud sql ssl-certs describe client-cert --instance=oamtm-audit-db
```

### 7.2 Client-Zertifikat
```bash
# Client-Zertifikat herunterladen
gcloud sql ssl-certs describe client-cert --instance=oamtm-audit-db --format="value(cert)" > client-cert.pem
gcloud sql ssl-certs describe client-cert --instance=oamtm-audit-db --format="value(privateKey)" > client-key.pem
```

## 📋 Schritt 8: Firewall-Regeln

### 8.1 Authorized Networks
```bash
# IP-Adresse hinzufügen
gcloud sql instances patch oamtm-audit-db --authorized-networks=YOUR_IP_ADDRESS/32
```

### 8.2 Firebase Functions IP
```bash
# Firebase Functions IP-Bereiche
gcloud sql instances patch oamtm-audit-db --authorized-networks=0.0.0.0/0
```

## 📋 Schritt 9: Environment Variables

### 9.1 Firebase Functions Config
```bash
# In Firebase Functions Console
# Functions → Configuration → Environment Variables
DB_HOST=34.65.123.456
DB_PORT=3306
DB_USER=oamtm_user
DB_PASSWORD=SecurePassword123!
DB_NAME=oamtm_audit
DB_SSL_CA=server-ca.pem
DB_SSL_CERT=client-cert.pem
DB_SSL_KEY=client-key.pem
```

### 9.2 Lokale .env Datei
```bash
# .env Datei erstellen
cp env.example .env
# Werte anpassen
```

## 📋 Schritt 10: Migration ausführen

### 10.1 Migration Script
```bash
# Migration Script ausführen
node scripts/migrate-to-cloud-sql.mjs
```

### 10.2 Manuelle Migration
```bash
# SQLite-Datenbank exportieren
sqlite3 audit/sqlite/enhanced-audit.db .dump > enhanced-audit.sql

# Für MySQL anpassen
sed -i 's/AUTOINCREMENT/AUTO_INCREMENT/g' enhanced-audit.sql
sed -i 's/INTEGER/INT/g' enhanced-audit.sql

# In Cloud SQL importieren
mysql -h 34.65.123.456 -P 3306 -u oamtm_user -p oamtm_audit < enhanced-audit.sql
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

## 🛠️ Troubleshooting

### Häufige Probleme

#### 1. "Connection refused"
```bash
# Firewall-Regeln prüfen
gcloud sql instances patch oamtm-audit-db --authorized-networks=0.0.0.0/0
```

#### 2. "SSL certificate error"
```bash
# Zertifikate aktualisieren
gcloud sql ssl-certs create client-cert oamtm-audit-db
```

#### 3. "Database not found"
```sql
-- Datenbank erstellen
CREATE DATABASE oamtm_audit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 4. "User access denied"
```sql
-- Benutzer erstellen
CREATE USER 'oamtm_user'@'%' IDENTIFIED BY 'SecurePassword123!';
GRANT ALL PRIVILEGES ON oamtm_audit.* TO 'oamtm_user'@'%';
FLUSH PRIVILEGES;
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

## 🚀 Nächste Schritte

1. **Cloud SQL Instanz erstellen** (dieser Guide)
2. **Firebase Functions deployen**
3. **Migration ausführen**
4. **App-Integration testen**
5. **Monitoring einrichten**

---

**© 2025 Raymond Demitrio Dr. Tel - TEL1.NL**
*"Skalierbare Datenbank-Infrastruktur für maximale Performance"*

## 🎯 Status: BEREIT FÜR INSTANZ-ERSTELLUNG
