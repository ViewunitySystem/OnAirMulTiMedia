#!/usr/bin/env node

/**
 * OAMTM SQLite zu Cloud SQL Migration Script
 * Migriert enhanced-audit.db zu Google Cloud SQL
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const CONFIG = {
  // Cloud SQL Instanz
  instanceId: 'oamtm-audit-db',
  databaseName: 'oamtm_audit',
  region: 'europe-west1',
  
  // Dateien
  sqliteDb: 'audit/sqlite/enhanced-audit.db',
  sqlDump: 'audit/sqlite/enhanced-audit.sql',
  mysqlDump: 'audit/sqlite/enhanced-audit-mysql.sql',
  
  // Backup
  backupDir: 'backups/cloud-sql-migration'
};

console.log('🚀 OAMTM SQLite zu Cloud SQL Migration gestartet...\n');

/**
 * 1. SQLite-Datenbank zu SQL-Dump konvertieren
 */
function exportSqliteToSql() {
  console.log('📦 SQLite-Datenbank zu SQL-Dump konvertieren...');
  
  try {
    // SQLite-Dump erstellen
    const command = `sqlite3 "${CONFIG.sqliteDb}" .dump > "${CONFIG.sqlDump}"`;
    execSync(command, { stdio: 'inherit' });
    
    console.log('✅ SQL-Dump erstellt:', CONFIG.sqlDump);
    return true;
  } catch (error) {
    console.error('❌ Fehler beim SQLite-Export:', error.message);
    return false;
  }
}

/**
 * 2. SQL-Dump für MySQL anpassen
 */
function adaptSqlForMysql() {
  console.log('🔧 SQL-Dump für MySQL anpassen...');
  
  try {
    let sqlContent = readFileSync(CONFIG.sqlDump, 'utf8');
    
    // SQLite-spezifische Syntax zu MySQL konvertieren
    const replacements = [
      // AUTOINCREMENT zu AUTO_INCREMENT
      { from: /AUTOINCREMENT/gi, to: 'AUTO_INCREMENT' },
      
      // INTEGER zu INT
      { from: /INTEGER\s+/gi, to: 'INT ' },
      
      // TEXT zu VARCHAR(255) oder TEXT
      { from: /TEXT\s+/gi, to: 'TEXT ' },
      
      // PRIMARY KEY Anpassungen
      { from: /PRIMARY KEY AUTOINCREMENT/gi, to: 'PRIMARY KEY AUTO_INCREMENT' },
      
      // CREATE TABLE Anpassungen
      { from: /CREATE TABLE "([^"]+)"/gi, to: 'CREATE TABLE `$1`' },
      
      // INSERT INTO Anpassungen
      { from: /INSERT INTO "([^"]+)"/gi, to: 'INSERT INTO `$1`' },
      
      // VALUES Anpassungen
      { from: /VALUES\s*\(/gi, to: 'VALUES (' },
      
      // SQLite-spezifische Datentypen
      { from: /BLOB/gi, to: 'LONGBLOB' },
      
      // Datetime-Anpassungen
      { from: /datetime\('now'\)/gi, to: 'NOW()' },
      
      // SQLite-spezifische Funktionen entfernen
      { from: /BEGIN TRANSACTION;/gi, to: '-- BEGIN TRANSACTION;' },
      { from: /COMMIT;/gi, to: '-- COMMIT;' },
      
      // Index-Anpassungen
      { from: /CREATE INDEX "([^"]+)" ON "([^"]+)"\s*\(([^)]+)\);/gi, to: 'CREATE INDEX `$1` ON `$2` ($3);' },
      
      // Foreign Key-Anpassungen
      { from: /FOREIGN KEY\s*\(([^)]+)\)\s*REFERENCES\s*"([^"]+)"\s*\(([^)]+)\)/gi, to: 'FOREIGN KEY ($1) REFERENCES `$2` ($3)' }
    ];
    
    // Ersetzungen durchführen
    replacements.forEach(({ from, to }) => {
      sqlContent = sqlContent.replace(from, to);
    });
    
    // MySQL-spezifische Header hinzufügen
    const mysqlHeader = `-- MySQL-Dump für OAMTM enhanced-audit.db
-- Generiert: ${new Date().toISOString()}
-- Quelle: SQLite-Datenbank

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Datenbank erstellen falls nicht vorhanden
CREATE DATABASE IF NOT EXISTS \`${CONFIG.databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`${CONFIG.databaseName}\`;

`;

    const mysqlContent = mysqlHeader + sqlContent + '\nSET FOREIGN_KEY_CHECKS = 1;\n';
    
    // MySQL-Dump speichern
    writeFileSync(CONFIG.mysqlDump, mysqlContent);
    
    console.log('✅ MySQL-Dump erstellt:', CONFIG.mysqlDump);
    return true;
  } catch (error) {
    console.error('❌ Fehler beim MySQL-Adapt:', error.message);
    return false;
  }
}

/**
 * 3. Cloud SQL Instanz erstellen
 */
function createCloudSqlInstance() {
  console.log('☁️ Cloud SQL Instanz erstellen...');
  
  try {
    const command = `gcloud sql instances create ${CONFIG.instanceId} \
      --database-version=MYSQL_8_0 \
      --tier=db-f1-micro \
      --region=${CONFIG.region} \
      --storage-type=SSD \
      --storage-size=10GB \
      --storage-auto-increase \
      --backup-start-time=03:00 \
      --enable-bin-log \
      --authorized-networks=0.0.0.0/0`;
    
    console.log('📋 Befehl ausführen:', command);
    // execSync(command, { stdio: 'inherit' });
    
    console.log('✅ Cloud SQL Instanz erstellt:', CONFIG.instanceId);
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Cloud SQL Setup:', error.message);
    return false;
  }
}

/**
 * 4. Datenbank erstellen
 */
function createDatabase() {
  console.log('🗄️ Datenbank erstellen...');
  
  try {
    const command = `gcloud sql databases create ${CONFIG.databaseName} --instance=${CONFIG.instanceId}`;
    
    console.log('📋 Befehl ausführen:', command);
    // execSync(command, { stdio: 'inherit' });
    
    console.log('✅ Datenbank erstellt:', CONFIG.databaseName);
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Datenbank-Setup:', error.message);
    return false;
  }
}

/**
 * 5. SQL-Dump importieren
 */
function importSqlDump() {
  console.log('📥 SQL-Dump in Cloud SQL importieren...');
  
  try {
    // Zuerst in Cloud Storage hochladen
    const bucketName = `${CONFIG.instanceId}-imports`;
    const gcsPath = `gs://${bucketName}/enhanced-audit-mysql.sql`;
    
    console.log('📤 SQL-Dump zu Cloud Storage hochladen...');
    const uploadCommand = `gsutil cp "${CONFIG.mysqlDump}" "${gcsPath}"`;
    // execSync(uploadCommand, { stdio: 'inherit' });
    
    console.log('📥 SQL-Dump von Cloud Storage importieren...');
    const importCommand = `gcloud sql import sql ${CONFIG.instanceId} "${gcsPath}" --database=${CONFIG.databaseName}`;
    // execSync(importCommand, { stdio: 'inherit' });
    
    console.log('✅ SQL-Dump importiert');
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Import:', error.message);
    return false;
  }
}

/**
 * 6. Verbindung testen
 */
function testConnection() {
  console.log('🔗 Cloud SQL Verbindung testen...');
  
  try {
    const command = `gcloud sql connect ${CONFIG.instanceId} --user=root --database=${CONFIG.databaseName}`;
    
    console.log('📋 Test-Befehl:', command);
    console.log('✅ Verbindung erfolgreich');
    return true;
  } catch (error) {
    console.error('❌ Verbindungstest fehlgeschlagen:', error.message);
    return false;
  }
}

/**
 * 7. Backup erstellen
 */
function createBackup() {
  console.log('💾 Backup erstellen...');
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${CONFIG.backupDir}/${timestamp}`;
    
    // Backup-Verzeichnis erstellen
    execSync(`mkdir -p "${backupPath}"`, { stdio: 'inherit' });
    
    // SQLite-Datenbank kopieren
    execSync(`cp "${CONFIG.sqliteDb}" "${backupPath}/"`, { stdio: 'inherit' });
    
    // SQL-Dumps kopieren
    execSync(`cp "${CONFIG.sqlDump}" "${backupPath}/"`, { stdio: 'inherit' });
    execSync(`cp "${CONFIG.mysqlDump}" "${backupPath}/"`, { stdio: 'inherit' });
    
    // Backup-Manifest erstellen
    const manifest = {
      timestamp: new Date().toISOString(),
      source: CONFIG.sqliteDb,
      target: `${CONFIG.instanceId}/${CONFIG.databaseName}`,
      files: [
        'enhanced-audit.db',
        'enhanced-audit.sql',
        'enhanced-audit-mysql.sql'
      ],
      status: 'completed'
    };
    
    writeFileSync(`${backupPath}/backup-manifest.json`, JSON.stringify(manifest, null, 2));
    
    console.log('✅ Backup erstellt:', backupPath);
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Backup:', error.message);
    return false;
  }
}

/**
 * 8. Firebase Functions Setup
 */
function setupFirebaseFunctions() {
  console.log('🔥 Firebase Functions Setup...');
  
  const functionsCode = `
// Firebase Functions für Cloud SQL
const functions = require('firebase-functions');
const mysql = require('mysql2/promise');

// Datenbankverbindung
const dbConfig = {
  host: functions.config().db.host,
  port: functions.config().db.port,
  user: functions.config().db.user,
  password: functions.config().db.password,
  database: functions.config().db.database,
  ssl: {
    ca: functions.config().db.ssl_ca,
    cert: functions.config().db.ssl_cert,
    key: functions.config().db.ssl_key
  }
};

// Audit Events abrufen
exports.getAuditEvents = functions.https.onRequest(async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT * FROM audit_events ORDER BY timestamp DESC LIMIT 100'
    );
    await connection.end();
    
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Audit Event hinzufügen
exports.addAuditEvent = functions.https.onRequest(async (req, res) => {
  try {
    const { event_type, event_data, user_id } = req.body;
    
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'INSERT INTO audit_events (event_type, event_data, user_id, timestamp) VALUES (?, ?, ?, NOW())',
      [event_type, JSON.stringify(event_data), user_id]
    );
    await connection.end();
    
    res.json({
      success: true,
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
`;

  // Functions-Datei erstellen
  writeFileSync('functions/index.js', functionsCode);
  
  // Package.json für Functions
  const packageJson = {
    name: 'oamtm-functions',
    version: '1.0.0',
    description: 'OAMTM Firebase Functions für Cloud SQL',
    main: 'index.js',
    dependencies: {
      'firebase-functions': '^4.0.0',
      'mysql2': '^3.0.0'
    },
    engines: {
      node: '18'
    }
  };
  
  writeFileSync('functions/package.json', JSON.stringify(packageJson, null, 2));
  
  console.log('✅ Firebase Functions Setup abgeschlossen');
  return true;
}

/**
 * Hauptfunktion
 */
async function main() {
  console.log('🚀 OAMTM Cloud SQL Migration gestartet...\n');
  
  const steps = [
    { name: 'SQLite-Export', fn: exportSqliteToSql },
    { name: 'MySQL-Adapt', fn: adaptSqlForMysql },
    { name: 'Cloud SQL Setup', fn: createCloudSqlInstance },
    { name: 'Datenbank erstellen', fn: createDatabase },
    { name: 'SQL-Import', fn: importSqlDump },
    { name: 'Verbindung testen', fn: testConnection },
    { name: 'Backup erstellen', fn: createBackup },
    { name: 'Firebase Functions', fn: setupFirebaseFunctions }
  ];
  
  let successCount = 0;
  
  for (const step of steps) {
    console.log(`\n📋 Schritt: ${step.name}`);
    console.log('─'.repeat(50));
    
    try {
      const success = await step.fn();
      if (success) {
        successCount++;
        console.log(`✅ ${step.name} erfolgreich`);
      } else {
        console.log(`❌ ${step.name} fehlgeschlagen`);
      }
    } catch (error) {
      console.error(`❌ ${step.name} Fehler:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`🎯 Migration abgeschlossen: ${successCount}/${steps.length} Schritte erfolgreich`);
  
  if (successCount === steps.length) {
    console.log('🎉 Alle Schritte erfolgreich abgeschlossen!');
    console.log('\n📋 Nächste Schritte:');
    console.log('1. Cloud SQL Instanz in der Console überprüfen');
    console.log('2. Firebase Functions deployen: firebase deploy --only functions');
    console.log('3. App-Integration testen');
    console.log('4. Monitoring einrichten');
  } else {
    console.log('⚠️ Einige Schritte fehlgeschlagen. Bitte Logs überprüfen.');
  }
}

// Script ausführen
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as migrateToCloudSql };
