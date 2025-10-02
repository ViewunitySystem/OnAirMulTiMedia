#!/usr/bin/env node

import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DeepAuditSystem {
  constructor() {
    this.auditResults = {
      timestamp: new Date().toISOString(),
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      errors: [],
      warnings: [],
      recommendations: [],
      expansionPoints: [],
      growthMetrics: {}
    };
    
    this.baseUrls = {
      githubPages: 'https://viewunitysystem.github.io/OnAirMulTiMedia',
      firebaseProd: 'https://onairmultimedia.web.app',
      firebaseStaging: 'https://onairmultimedia-staging.web.app',
      firebaseDev: 'https://onairmultimedia-dev.web.app'
    };
    
    this.auditPaths = [
      // Hauptseiten
      '/', '/info.html', '/manifest.html', '/regulatory.html',
      '/blueprints.html', '/test-dashboard.html', '/client.html',
      '/overlay.html', '/audit-export.html', '/test.html',
      
      // Settings & Telemetry
      '/settings/settings-panel.html',
      '/telemetry/telemetry-dashboard.html',
      
      // WebRTC
      '/web-remote/controller.html',
      '/web-remote/display.html',
      
      // Docs & Protected
      '/docs/index.html',
      '/o22/', '/o66/',
      
      // API Endpoints
      '/api/health', '/api/status',
      '/api/github/stats', '/api/contribs', '/api/modules',
      
      // Schemas
      '/schemas/blueprint.schema.json',
      
      // Module Paths (Tiefe 1-3)
      '/modules/GlobalMeetingClock/',
      '/modules/CanvasSwipe/',
      '/modules/NEMO_PATHFINDER/',
      '/modules/RFValidationEngine/',
      '/modules/SignalMirror/',
      
      // Deep Module Paths (Tiefe 4-7)
      '/modules/GlobalMeetingClock/docs/',
      '/modules/GlobalMeetingClock/docs/audit_checklist.md',
      '/modules/CanvasSwipe/styles/swipe.css',
      '/modules/NEMO_PATHFINDER/data/coordinates.json',
      '/modules/RFValidationEngine/logs/license_status.json',
      '/modules/SignalMirror/exports/mirror_log.json',
      
      // Expansion Paths (Tiefe 8-10)
      '/modules/GlobalMeetingClock/docs/expansion/',
      '/modules/CanvasSwipe/styles/expansion/',
      '/modules/NEMO_PATHFINDER/data/expansion/',
      '/modules/RFValidationEngine/logs/expansion/',
      '/modules/SignalMirror/exports/expansion/'
    ];
  }

  async checkUrl(baseUrl, path) {
    try {
      const url = baseUrl + path;
      const response = await fetch(url, { 
        method: 'HEAD',
        timeout: 10000,
        headers: {
          'User-Agent': 'OnAirMulTiMedia-DeepAudit/1.0'
        }
      });
      
      return {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        success: response.status >= 200 && response.status < 400
      };
    } catch (error) {
      return {
        url: baseUrl + path,
        status: 0,
        statusText: 'ERROR',
        error: error.message,
        success: false
      };
    }
  }

  async auditAllTargets() {
    console.log('🔍 Starting Deep Audit System...');
    console.log(`📊 Checking ${Object.keys(this.baseUrls).length} targets`);
    console.log(`📋 Testing ${this.auditPaths.length} paths per target`);
    
    for (const [targetName, baseUrl] of Object.entries(this.baseUrls)) {
      console.log(`\n🌐 Auditing ${targetName}: ${baseUrl}`);
      
      const targetResults = {
        target: targetName,
        baseUrl,
        checks: [],
        summary: { total: 0, passed: 0, failed: 0 }
      };
      
      for (const path of this.auditPaths) {
        this.auditResults.totalChecks++;
        targetResults.summary.total++;
        
        const result = await this.checkUrl(baseUrl, path);
        targetResults.checks.push(result);
        
        if (result.success) {
          this.auditResults.passedChecks++;
          targetResults.summary.passed++;
          console.log(`  ✅ ${path} → ${result.status}`);
        } else {
          this.auditResults.failedChecks++;
          targetResults.summary.failed++;
          console.log(`  ❌ ${path} → ${result.status} ${result.statusText}`);
          
          this.auditResults.errors.push({
            target: targetName,
            path,
            status: result.status,
            error: result.error || result.statusText
          });
        }
        
        // Expansion Analysis
        if (path.includes('/expansion/')) {
          this.analyzeExpansionPoint(targetName, path, result);
        }
        
        // Growth Metrics
        this.updateGrowthMetrics(targetName, path, result);
      }
      
      this.auditResults[targetName] = targetResults;
    }
  }

  analyzeExpansionPoint(target, path, result) {
    const expansionPoint = {
      target,
      path,
      status: result.status,
      timestamp: new Date().toISOString(),
      expansionPotential: result.success ? 'READY' : 'NEEDS_SETUP'
    };
    
    this.auditResults.expansionPoints.push(expansionPoint);
    
    if (!result.success) {
      this.auditResults.recommendations.push({
        type: 'EXPANSION_SETUP',
        target,
        path,
        action: 'Create expansion directory structure',
        priority: 'MEDIUM'
      });
    }
  }

  updateGrowthMetrics(target, path, result) {
    if (!this.auditResults.growthMetrics[target]) {
      this.auditResults.growthMetrics[target] = {
        totalPaths: 0,
        workingPaths: 0,
        expansionPaths: 0,
        apiPaths: 0,
        modulePaths: 0
      };
    }
    
    const metrics = this.auditResults.growthMetrics[target];
    metrics.totalPaths++;
    
    if (result.success) metrics.workingPaths++;
    if (path.includes('/expansion/')) metrics.expansionPaths++;
    if (path.includes('/api/')) metrics.apiPaths++;
    if (path.includes('/modules/')) metrics.modulePaths++;
  }

  generateExpansionRecommendations() {
    console.log('\n🚀 Generating Expansion Recommendations...');
    
    // System Growth Analysis
    const totalWorkingPaths = Object.values(this.auditResults.growthMetrics)
      .reduce((sum, metrics) => sum + metrics.workingPaths, 0);
    
    const totalExpansionPaths = Object.values(this.auditResults.growthMetrics)
      .reduce((sum, metrics) => sum + metrics.expansionPaths, 0);
    
    const expansionRatio = totalExpansionPaths / totalWorkingPaths;
    
    if (expansionRatio < 0.1) {
      this.auditResults.recommendations.push({
        type: 'SYSTEM_EXPANSION',
        action: 'Increase expansion path coverage',
        currentRatio: expansionRatio,
        targetRatio: 0.2,
        priority: 'HIGH'
      });
    }
    
    // Module Expansion Analysis
    const moduleTargets = Object.keys(this.auditResults.growthMetrics);
    for (const target of moduleTargets) {
      const metrics = this.auditResults.growthMetrics[target];
      const moduleRatio = metrics.modulePaths / metrics.totalPaths;
      
      if (moduleRatio < 0.3) {
        this.auditResults.recommendations.push({
          type: 'MODULE_EXPANSION',
          target,
          action: 'Add more module paths',
          currentRatio: moduleRatio,
          targetRatio: 0.4,
          priority: 'MEDIUM'
        });
      }
    }
  }

  generateTestGrowthOrgan() {
    console.log('\n🧬 Generating Test Growth Organ...');
    
    const growthOrgan = {
      name: 'OnAirMulTiMedia-GrowthOrgan',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      capabilities: [
        'Automatic path discovery',
        'Expansion point detection',
        'Growth metric tracking',
        'System health monitoring',
        'Error pattern analysis'
      ],
      expansionStrategies: [
        {
          name: 'Horizontal Expansion',
          description: 'Add new modules and features',
          trigger: 'moduleRatio < 0.4',
          action: 'createNewModule'
        },
        {
          name: 'Vertical Expansion',
          description: 'Deepen existing module paths',
          trigger: 'expansionRatio < 0.2',
          action: 'createExpansionPaths'
        },
        {
          name: 'API Expansion',
          description: 'Add new API endpoints',
          trigger: 'apiRatio < 0.1',
          action: 'createApiEndpoints'
        }
      ],
      monitoring: {
        interval: '5 minutes',
        depth: '10 levels',
        targets: Object.keys(this.baseUrls),
        alerts: ['404 errors', 'expansion opportunities', 'growth stagnation']
      }
    };
    
    this.auditResults.growthOrgan = growthOrgan;
  }

  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `audit/deep-audit-${timestamp}.json`;
    
    await fs.mkdir('audit', { recursive: true });
    await fs.writeFile(filename, JSON.stringify(this.auditResults, null, 2));
    
    console.log(`\n💾 Audit results saved to: ${filename}`);
    
    // Generate summary report
    const summary = {
      timestamp: this.auditResults.timestamp,
      totalChecks: this.auditResults.totalChecks,
      successRate: ((this.auditResults.passedChecks / this.auditResults.totalChecks) * 100).toFixed(2) + '%',
      errors: this.auditResults.errors.length,
      warnings: this.auditResults.warnings.length,
      recommendations: this.auditResults.recommendations.length,
      expansionPoints: this.auditResults.expansionPoints.length,
      growthMetrics: this.auditResults.growthMetrics
    };
    
    const summaryFilename = `audit/audit-summary-${timestamp}.json`;
    await fs.writeFile(summaryFilename, JSON.stringify(summary, null, 2));
    
    console.log(`📊 Summary report saved to: ${summaryFilename}`);
    
    return { filename, summaryFilename };
  }

  async run() {
    try {
      await this.auditAllTargets();
      this.generateExpansionRecommendations();
      this.generateTestGrowthOrgan();
      const files = await this.saveResults();
      
      console.log('\n🎯 Deep Audit Complete!');
      console.log(`📈 Success Rate: ${((this.auditResults.passedChecks / this.auditResults.totalChecks) * 100).toFixed(2)}%`);
      console.log(`🔍 Total Checks: ${this.auditResults.totalChecks}`);
      console.log(`✅ Passed: ${this.auditResults.passedChecks}`);
      console.log(`❌ Failed: ${this.auditResults.failedChecks}`);
      console.log(`🚀 Expansion Points: ${this.auditResults.expansionPoints.length}`);
      console.log(`💡 Recommendations: ${this.auditResults.recommendations.length}`);
      
      return this.auditResults;
    } catch (error) {
      console.error('❌ Deep Audit failed:', error);
      throw error;
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const auditSystem = new DeepAuditSystem();
  auditSystem.run().catch(error => {
    console.error('❌ Deep Audit System failed:', error);
    process.exit(1);
  });
}

export { DeepAuditSystem };
