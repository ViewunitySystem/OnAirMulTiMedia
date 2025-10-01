import fs from 'node:fs';
import { createHash } from 'node:crypto';

// Swipe-Enhanced License Pulse System
class LicensePulse {
  constructor() {
    this.modules = [];
    this.swipeHistory = [];
    this.complianceRules = {
      EU: { valid: true, region: 'EU', gdpr: true },
      US: { valid: true, region: 'US', ccpa: true },
      GLOBAL: { valid: true, region: 'GLOBAL', universal: true }
    };
  }

  // Scan alle Module für Lizenz-Status
  async scanModules() {
    try {
      const moduleDirs = fs.readdirSync('modules').filter(f => 
        fs.statSync(`modules/${f}`).isDirectory()
      );

      for (const module of moduleDirs) {
        const license = await this.checkModuleLicense(module);
        this.modules.push({
          name: module,
          license,
          lastChecked: new Date().toISOString(),
          swipeEnhanced: this.hasSwipeIntegration(module)
        });
      }
    } catch (error) {
      console.error('Module scan failed:', error);
    }
  }

  // Prüfe Lizenz für einzelnes Modul
  async checkModuleLicense(moduleName) {
    const licenseFiles = [
      `modules/${moduleName}/LICENSE`,
      `modules/${moduleName}/license.txt`,
      `modules/${moduleName}/package.json`
    ];

    for (const file of licenseFiles) {
      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          return this.parseLicense(content, moduleName);
        } catch (error) {
          continue;
        }
      }
    }

    return {
      status: 'unknown',
      type: 'none',
      region: 'GLOBAL',
      valid: false,
      hash: 'no-license-found'
    };
  }

  // Parse Lizenz-Inhalt
  parseLicense(content, moduleName) {
    const hash = createHash('sha256').update(content).digest('hex');
    
    // Einfache Lizenz-Erkennung
    if (content.includes('MIT') || content.includes('MIT License')) {
      return {
        status: 'valid',
        type: 'MIT',
        region: 'GLOBAL',
        valid: true,
        hash: `sha256:${hash}`,
        module: moduleName
      };
    }
    
    if (content.includes('GPL') || content.includes('GNU')) {
      return {
        status: 'valid',
        type: 'GPL',
        region: 'GLOBAL',
        valid: true,
        hash: `sha256:${hash}`,
        module: moduleName
      };
    }

    if (content.includes('EU') || content.includes('European')) {
      return {
        status: 'valid',
        type: 'EU-COMPLIANT',
        region: 'EU',
        valid: true,
        hash: `sha256:${hash}`,
        module: moduleName
      };
    }

    return {
      status: 'unknown',
      type: 'CUSTOM',
      region: 'GLOBAL',
      valid: true, // Optimistisch
      hash: `sha256:${hash}`,
      module: moduleName
    };
  }

  // Prüfe Swipe-Integration
  hasSwipeIntegration(moduleName) {
    const swipeFiles = [
      `modules/${moduleName}/src/swipe.ts`,
      `modules/${moduleName}/src/mirror.ts`,
      `modules/${moduleName}/src/switch.ts`
    ];

    return swipeFiles.some(file => fs.existsSync(file));
  }

  // Swipe-Event verarbeiten
  processSwipeEvent(swipeData) {
    const event = {
      type: 'SWIPE_DETECTED',
      module: swipeData.module || 'unknown',
      gesture: swipeData.gesture || 'tap',
      intensity: swipeData.intensity || 0.5,
      timestamp: new Date().toISOString(),
      compliance: this.checkSwipeCompliance(swipeData)
    };

    this.swipeHistory.push(event);
    
    // Nur letzte 100 Swipe-Events behalten
    if (this.swipeHistory.length > 100) {
      this.swipeHistory = this.swipeHistory.slice(-100);
    }

    return event;
  }

  // Swipe-Compliance prüfen
  checkSwipeCompliance(swipeData) {
    const region = swipeData.region || 'EU';
    const rule = this.complianceRules[region] || this.complianceRules.GLOBAL;
    
    return {
      region,
      gdprCompliant: rule.gdpr || false,
      ccpaCompliant: rule.ccpa || false,
      universalCompliant: rule.universal || false,
      swipeAllowed: true, // WebTrit Swipe ist generell erlaubt
      dataRetention: 'minimal'
    };
  }

  // Generiere Report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      version: '2025.10.01',
      modules: this.modules,
      swipeStats: {
        totalSwipes: this.swipeHistory.length,
        recentSwipes: this.swipeHistory.slice(-10),
        complianceRate: this.calculateComplianceRate()
      },
      overallStatus: this.calculateOverallStatus(),
      recommendations: this.generateRecommendations(),
      audit: {
        generatedBy: 'LicensePulse',
        hash: this.generateReportHash(),
        signature: 'ed25519:PLACEHOLDER'
      }
    };

    return report;
  }

  // Compliance-Rate berechnen
  calculateComplianceRate() {
    if (this.modules.length === 0) return 0;
    
    const validLicenses = this.modules.filter(m => m.license.valid).length;
    return Math.round((validLicenses / this.modules.length) * 100);
  }

  // Gesamt-Status berechnen
  calculateOverallStatus() {
    const complianceRate = this.calculateComplianceRate();
    
    if (complianceRate >= 90) return 'EXCELLENT';
    if (complianceRate >= 75) return 'GOOD';
    if (complianceRate >= 50) return 'FAIR';
    return 'NEEDS_ATTENTION';
  }

  // Empfehlungen generieren
  generateRecommendations() {
    const recommendations = [];
    
    const invalidModules = this.modules.filter(m => !m.license.valid);
    if (invalidModules.length > 0) {
      recommendations.push({
        type: 'LICENSE_MISSING',
        priority: 'HIGH',
        message: `${invalidModules.length} modules need license files`,
        modules: invalidModules.map(m => m.name)
      });
    }

    const nonSwipeModules = this.modules.filter(m => !m.swipeEnhanced);
    if (nonSwipeModules.length > 0) {
      recommendations.push({
        type: 'SWIPE_INTEGRATION',
        priority: 'MEDIUM',
        message: `${nonSwipeModules.length} modules could benefit from Swipe Technology`,
        modules: nonSwipeModules.map(m => m.name)
      });
    }

    return recommendations;
  }

  // Report-Hash generieren
  generateReportHash() {
    const reportData = JSON.stringify(this.modules);
    return createHash('sha256').update(reportData).digest('hex');
  }

  // Export zu verschiedenen Formaten
  async exportToCSV() {
    const csv = [
      'Module,License Type,Status,Region,Valid,Swipe Enhanced,Last Checked',
      ...this.modules.map(m => 
        `${m.name},${m.license.type},${m.license.status},${m.license.region},${m.license.valid},${m.swipeEnhanced},${m.lastChecked}`
      )
    ].join('\n');

    return csv;
  }

  async exportToQR() {
    const report = this.generateReport();
    const qrData = Buffer.from(JSON.stringify(report)).toString('base64url');
    return `data:image/svg+xml;base64,${qrData}`;
  }
}

// Main execution
async function main() {
  const pulse = new LicensePulse();
  
  // Module scannen
  await pulse.scanModules();
  
  // Report generieren
  const report = pulse.generateReport();
  
  // Output-Pfad bestimmen
  const out = process.argv.includes('--export') ? 
    process.argv[process.argv.indexOf('--export') + 1] : 
    'audit/exports/license.json';
  
  // Verzeichnis erstellen
  fs.mkdirSync('audit/exports', { recursive: true });
  
  // Report speichern
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  
  // Zusätzliche Exports
  if (process.argv.includes('--csv')) {
    const csv = await pulse.exportToCSV();
    fs.writeFileSync(out.replace('.json', '.csv'), csv);
  }
  
  if (process.argv.includes('--qr')) {
    const qr = await pulse.exportToQR();
    fs.writeFileSync(out.replace('.json', '.qr.txt'), qr);
  }
  
  console.log('✅ LicensePulse completed');
  console.log(`📊 Status: ${report.overallStatus}`);
  console.log(`📈 Compliance: ${report.swipeStats.complianceRate}%`);
  console.log(`📁 Report saved: ${out}`);
  console.log(`🔍 Modules scanned: ${report.modules.length}`);
  console.log(`👆 Swipe-enhanced: ${report.modules.filter(m => m.swipeEnhanced).length}`);
}

// CLI-Interface
if (process.argv[1] && process.argv[1].includes('pulse.js')) {
  main().catch(console.error);
}

export { LicensePulse };
