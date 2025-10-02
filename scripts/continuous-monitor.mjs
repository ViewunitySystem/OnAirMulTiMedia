#!/usr/bin/env node

import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE = 'https://viewunitysystem.github.io/OnAirMulTiMedia';
const FIREBASE_PROD = 'https://onairmultimedia.web.app';
const FIREBASE_STAGING = 'https://onairmultimedia-staging.web.app';
const FIREBASE_DEV = 'https://onairmultimedia-dev.web.app';

const urls = [
  '/', '/info.html', '/nomadic_swipe_nemo.html', '/test-dashboard.html',
  '/client.html', '/overlay.html', '/blueprints.html', '/manifest.html',
  '/regulatory.html', '/audit-export.html', '/settings/settings-panel.html',
  '/telemetry/telemetry-dashboard.html', '/web-remote/controller.html',
  '/web-remote/display.html', '/test.html', '/docs/index.html', '/o22/', '/o66/'
];

async function checkUrl(url, baseUrl) {
  try {
    const response = await fetch(baseUrl + url);
    return {
      url: url,
      baseUrl: baseUrl,
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
      responseTime: Date.now(),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      url: url,
      baseUrl: baseUrl,
      status: 0,
      ok: false,
      error: error.message,
      responseTime: Date.now(),
      timestamp: new Date().toISOString()
    };
  }
}

async function runContinuousMonitoring() {
  console.log('🔄 Starting Continuous Monitoring...');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  const results = {
    timestamp: new Date().toISOString(),
    monitoring: {
      githubPages: { baseUrl: BASE, results: [] },
      firebaseProd: { baseUrl: FIREBASE_PROD, results: [] },
      firebaseStaging: { baseUrl: FIREBASE_STAGING, results: [] },
      firebaseDev: { baseUrl: FIREBASE_DEV, results: [] }
    },
    summary: {
      totalChecks: 0,
      successCount: 0,
      errorCount: 0,
      successRate: 0
    }
  };

  // Check all deployment targets
  const targets = [
    { name: 'githubPages', baseUrl: BASE },
    { name: 'firebaseProd', baseUrl: FIREBASE_PROD },
    { name: 'firebaseStaging', baseUrl: FIREBASE_STAGING },
    { name: 'firebaseDev', baseUrl: FIREBASE_DEV }
  ];

  for (const target of targets) {
    console.log(`\n🔍 Checking ${target.name}: ${target.baseUrl}`);
    
    for (const url of urls) {
      const result = await checkUrl(url, target.baseUrl);
      results.monitoring[target.name].results.push(result);
      results.summary.totalChecks++;
      
      if (result.ok) {
        results.summary.successCount++;
        console.log(`  ✅ ${url} - ${result.status}`);
      } else {
        results.summary.errorCount++;
        console.log(`  ❌ ${url} - ${result.status} ${result.statusText || result.error}`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  results.summary.successRate = Math.round((results.summary.successCount / results.summary.totalChecks) * 100);

  // Save results
  const auditDir = join(__dirname, '..', 'audit');
  await fs.mkdir(auditDir, { recursive: true });
  
  await fs.writeFile(
    join(auditDir, 'continuous-monitoring.json'),
    JSON.stringify(results, null, 2)
  );

  // Generate alert if errors found
  if (results.summary.errorCount > 0) {
    const alert = {
      timestamp: new Date().toISOString(),
      severity: results.summary.errorCount > 10 ? 'critical' : 'warning',
      message: `${results.summary.errorCount} URLs failed out of ${results.summary.totalChecks}`,
      successRate: results.summary.successRate,
      failedUrls: []
    };

    // Collect failed URLs
    for (const target of Object.values(results.monitoring)) {
      for (const result of target.results) {
        if (!result.ok) {
          alert.failedUrls.push({
            url: result.url,
            baseUrl: result.baseUrl,
            status: result.status,
            error: result.error
          });
        }
      }
    }

    await fs.writeFile(
      join(auditDir, 'monitoring-alert.json'),
      JSON.stringify(alert, null, 2)
    );

    console.log(`\n🚨 ALERT: ${alert.severity.toUpperCase()}`);
    console.log(`📊 Success Rate: ${alert.successRate}%`);
    console.log(`❌ Failed URLs: ${alert.failedUrls.length}`);
  }

  console.log(`\n📊 Continuous Monitoring Summary:`);
  console.log(`✅ Success: ${results.summary.successCount}/${results.summary.totalChecks} (${results.summary.successRate}%)`);
  console.log(`❌ Errors: ${results.summary.errorCount}`);
  console.log(`📁 Results saved to: audit/continuous-monitoring.json`);

  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runContinuousMonitoring().catch(error => {
    console.error('❌ Continuous Monitoring failed:', error);
    process.exit(1);
  });
}

export { runContinuousMonitoring };
