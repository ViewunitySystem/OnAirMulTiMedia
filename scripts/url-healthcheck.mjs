#!/usr/bin/env node
import fs from 'fs/promises';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { URL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const BASES = [
  'https://viewunitysystem.github.io/OnAirMulTiMedia',
  'https://onairmultimedia.web.app',
  'https://onairmultimedia-staging.web.app',
  'https://onairmultimedia-dev.web.app'
];

const PATHS = [
  '/',
  '/info.html',
  '/test.html',
  '/api/health.html',
  '/api/status.html',
  '/api/github/stats.html',
  '/api/contribs.html',
  '/api/modules.html',
  '/blueprints.html',
  '/dashboard.html',
  '/client.html',
  '/regulatory.html',
  '/manifest.html',
  '/overlay.html',
  '/nomadic_swipe_nemo.html',
  '/o22/index.html',
  '/o66/index.html',
  '/settings/settings-panel.html',
  '/telemetry/index.html',
  '/web-remote/index.html'
];

function checkUrl(url) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const req = protocol.request(
      url,
      { method: 'HEAD', timeout: 10000 },
      (res) => {
        resolve({
          url,
          status: res.statusCode,
          ok: res.statusCode >= 200 && res.statusCode < 300,
          error: null,
          timestamp: new Date().toISOString()
        });
      }
    );
    
    req.on('error', (err) => {
      resolve({
        url,
        status: 0,
        ok: false,
        error: err.message,
        timestamp: new Date().toISOString()
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: 0,
        ok: false,
        error: 'Request timeout',
        timestamp: new Date().toISOString()
      });
    });
    
    req.end();
  });
}

async function main() {
  console.log('🔍 Starting URL Health Check...');
  console.log(`📊 Checking ${BASES.length} bases × ${PATHS.length} paths = ${BASES.length * PATHS.length} URLs`);
  
  const results = [];
  let successCount = 0;
  
  for (const base of BASES) {
    console.log(`\n🌐 Checking base: ${base}`);
    
    for (const path of PATHS) {
      const url = base + path;
      process.stdout.write(`  ${path}... `);
      
      const result = await checkUrl(url);
      results.push(result);
      
      if (result.ok) {
        console.log(`✅ ${result.status}`);
        successCount++;
      } else {
        console.log(`❌ ${result.status}${result.error ? ` (${result.error})` : ''}`);
      }
      
      // Small delay to avoid overwhelming servers
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const totalUrls = results.length;
  const successRate = Math.round((successCount / totalUrls) * 100);
  
  console.log(`\n📈 Health Check Summary:`);
  console.log(`   Total URLs: ${totalUrls}`);
  console.log(`   Healthy URLs: ${successCount}`);
  console.log(`   Success Rate: ${successRate}%`);
  
  // Group by base for detailed analysis
  const byBase = {};
  BASES.forEach(base => {
    byBase[base] = results.filter(r => r.url.startsWith(base));
  });
  
  console.log(`\n📊 Results by Environment:`);
  for (const [base, baseResults] of Object.entries(byBase)) {
    const baseSuccess = baseResults.filter(r => r.ok).length;
    const baseRate = Math.round((baseSuccess / baseResults.length) * 100);
    console.log(`   ${base}: ${baseSuccess}/${baseResults.length} (${baseRate}%)`);
  }
  
  // Save results
  const auditDir = join(projectRoot, 'OnAirMulTiMedia', 'audit');
  await fs.mkdir(auditDir, { recursive: true });
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalUrls,
      healthyUrls: successCount,
      successRate,
      byBase: Object.fromEntries(
        Object.entries(byBase).map(([base, results]) => [
          base,
          {
            total: results.length,
            healthy: results.filter(r => r.ok).length,
            successRate: Math.round((results.filter(r => r.ok).length / results.length) * 100)
          }
        ])
      )
    },
    results
  };
  
  await fs.writeFile(
    join(auditDir, 'url-healthcheck.json'),
    JSON.stringify(report, null, 2)
  );
  
  // Create markdown report
  const markdownReport = `# URL Health Check Report

**Generated**: ${report.timestamp}
**Total URLs**: ${totalUrls}
**Healthy URLs**: ${successCount}
**Success Rate**: ${successRate}%

## Summary by Environment

${Object.entries(byBase).map(([base, results]) => {
  const healthy = results.filter(r => r.ok).length;
  const rate = Math.round((healthy / results.length) * 100);
  return `- **${base}**: ${healthy}/${results.length} (${rate}%)`;
}).join('\n')}

## Failed URLs

${results.filter(r => !r.ok).length > 0 ? results.filter(r => !r.ok).map(r => `- ❌ ${r.url} (${r.status}${r.error ? ` - ${r.error}` : ''})`).join('\n') : 'None! 🎉'}

## All Results

| URL | Status | OK |
|-----|--------|----|
${results.map(r => `| ${r.url} | ${r.status} | ${r.ok ? '✅' : '❌'} |`).join('\n')}
`;

  await fs.writeFile(
    join(auditDir, 'url-healthcheck.md'),
    markdownReport
  );
  
  console.log(`\n💾 Reports saved to:`);
  console.log(`   ${join(auditDir, 'url-healthcheck.json')}`);
  console.log(`   ${join(auditDir, 'url-healthcheck.md')}`);
  
  // Exit with error code if success rate is below 100%
  if (successRate < 100) {
    console.log(`\n⚠️  Success rate is ${successRate}% (target: 100%)`);
    process.exit(1);
  } else {
    console.log(`\n🎉 All URLs are healthy! (${successRate}%)`);
    process.exit(0);
  }
}

main().catch(error => {
  console.error('❌ Health check failed:', error);
  process.exit(1);
});