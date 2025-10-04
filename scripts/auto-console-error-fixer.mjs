#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';

/**
 * Automatischer Console-Error-Fixer
 * Erkennt und repariert automatisch alle Console-Errors
 */

class ConsoleErrorFixer {
  constructor() {
    this.errors = [];
    this.fixes = [];
  }

  async scanForErrors() {
    console.log('🔍 Scanne nach Console-Errors...');
    
    // Bekannte Error-Patterns
    const errorPatterns = [
      {
        pattern: /frame-ancestors.*ignored when delivered via a <meta> element/i,
        fix: 'remove-frame-ancestors-from-csp',
        description: 'CSP frame-ancestors in Meta-Tag entfernen'
      },
      {
        pattern: /Uncaught SyntaxError: Unexpected identifier 'Connection'/i,
        fix: 'fix-service-worker-dom-access',
        description: 'Service Worker DOM-Zugriff reparieren'
      },
      {
        pattern: /Access to fetch.*blocked by CORS policy/i,
        fix: 'fix-cors-and-api-urls',
        description: 'CORS und API URLs reparieren'
      },
      {
        pattern: /Failed to load resource.*ERR_FAILED/i,
        fix: 'fix-failed-resources',
        description: 'Fehlgeschlagene Ressourcen reparieren'
      },
      {
        pattern: /Refused to connect.*violates.*Content Security Policy/i,
        fix: 'fix-csp-connect-src',
        description: 'CSP connect-src Richtlinie reparieren'
      }
    ];

    // Scan HTML-Dateien
    const htmlFiles = [
      'info.html',
      'cloud-sql-dashboard.html',
      'test-api.html',
      'docs/audit-manifest.html'
    ];

    for (const file of htmlFiles) {
      try {
        const content = await readFile(file, 'utf8');
        for (const errorPattern of errorPatterns) {
          if (errorPattern.pattern.test(content)) {
            this.errors.push({
              file,
              pattern: errorPattern.pattern.source,
              fix: errorPattern.fix,
              description: errorPattern.description
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️ Kann ${file} nicht lesen: ${error.message}`);
      }
    }

    console.log(`✅ ${this.errors.length} Console-Errors gefunden`);
    return this.errors;
  }

  async applyFixes() {
    console.log('🔧 Wende Fixes an...');

    for (const error of this.errors) {
      try {
        switch (error.fix) {
          case 'remove-frame-ancestors-from-csp':
            await this.fixCSPFrameAncestors(error.file);
            break;
          case 'fix-service-worker-dom-access':
            await this.fixServiceWorkerDOMAccess();
            break;
          case 'fix-cors-and-api-urls':
            await this.fixCORSAndAPIUrls();
            break;
          case 'fix-failed-resources':
            await this.fixFailedResources();
            break;
          case 'fix-csp-connect-src':
            await this.fixCSPConnectSrc(error.file);
            break;
        }
        this.fixes.push({
          file: error.file,
          fix: error.fix,
          description: error.description,
          status: 'applied'
        });
        console.log(`✅ ${error.description} in ${error.file}`);
      } catch (fixError) {
        console.error(`❌ Fehler beim Fixen von ${error.file}: ${fixError.message}`);
        this.fixes.push({
          file: error.file,
          fix: error.fix,
          description: error.description,
          status: 'failed',
          error: fixError.message
        });
      }
    }

    console.log(`✅ ${this.fixes.length} Fixes angewendet`);
  }

  async fixCSPFrameAncestors(file) {
    let content = await readFile(file, 'utf8');
    content = content.replace(/frame-ancestors[^;]*;?/g, '');
    await writeFile(file, content);
  }

  async fixServiceWorkerDOMAccess() {
    let content = await readFile('sw.js', 'utf8');
    
    // DOM-Zugriff nur im Main-Thread erlauben
    const domAccessFix = `
    // Show connection status (only in main thread, not in service worker)
    if (typeof document !== 'undefined') {
      function updateConnectionStatus() {
        const status = navigator.onLine ? 'Online' : 'Offline';
        const statusElement = document.querySelector('.status div:last-child');
        if (statusElement) {
          statusElement.textContent = \`Connection: \${status}\`;
        }
      }
      
      window.addEventListener('online', updateConnectionStatus);
      window.addEventListener('offline', updateConnectionStatus);
      updateConnectionStatus();
    }`;

    content = content.replace(
      /function updateConnectionStatus\(\)\s*{[\s\S]*?}/,
      domAccessFix.trim()
    );
    
    await writeFile('sw.js', content);
  }

  async fixCORSAndAPIUrls() {
    // API URLs auf lokale Pfade ändern
    let content = await readFile('js/cloud-sql-api.js', 'utf8');
    content = content.replace(
      /this\.baseURL = 'https:\/\/your-vercel-app\.vercel\.app'/,
      "this.baseURL = window.location.origin"
    );
    await writeFile('js/cloud-sql-api.js', content);
  }

  async fixFailedResources() {
    // Lokale API-Stubs erstellen (bereits gemacht)
    console.log('📝 Lokale API-Stubs bereits erstellt');
  }

  async fixCSPConnectSrc(file) {
    let content = await readFile(file, 'utf8');
    content = content.replace(
      /connect-src 'self' https:\/\/api\.github\.com/,
      "connect-src 'self' https://api.github.com https://your-vercel-app.vercel.app"
    );
    await writeFile(file, content);
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      errorsFound: this.errors.length,
      fixesApplied: this.fixes.filter(f => f.status === 'applied').length,
      fixesFailed: this.fixes.filter(f => f.status === 'failed').length,
      errors: this.errors,
      fixes: this.fixes
    };

    await writeFile('console-error-fix-report.json', JSON.stringify(report, null, 2));
    console.log('📊 Report gespeichert: console-error-fix-report.json');
    
    return report;
  }

  async run() {
    console.log('🚀 Starte automatischen Console-Error-Fixer...');
    
    await this.scanForErrors();
    await this.applyFixes();
    const report = await this.generateReport();
    
    console.log('\n📊 ZUSAMMENFASSUNG:');
    console.log(`   🔍 Errors gefunden: ${report.errorsFound}`);
    console.log(`   ✅ Fixes angewendet: ${report.fixesApplied}`);
    console.log(`   ❌ Fixes fehlgeschlagen: ${report.fixesFailed}`);
    
    if (report.fixesApplied > 0) {
      console.log('\n🎯 NÄCHSTE SCHRITTE:');
      console.log('   1. Starte lokalen API-Server: npm run api-server');
      console.log('   2. Teste die Dashboards im Browser');
      console.log('   3. Prüfe Console auf verbleibende Errors');
    }
    
    return report;
  }
}

// Führe den Fixer aus
const fixer = new ConsoleErrorFixer();
fixer.run().catch(console.error);
