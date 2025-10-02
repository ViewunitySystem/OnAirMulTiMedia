#!/usr/bin/env node

import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function analyzeFollowupErrors() {
  console.log('🔍 Starting Follow-up Error Detection...');
  
  const auditDir = join(__dirname, '..', 'audit');
  const results = {
    timestamp: new Date().toISOString(),
    analysis: {
      continuousMonitoring: null,
      urlHealthcheck: null,
      selfhealReports: null,
      followupErrors: [],
      recommendations: []
    }
  };

  try {
    // Load continuous monitoring results
    try {
      const continuousData = await fs.readFile(join(auditDir, 'continuous-monitoring.json'), 'utf8');
      results.analysis.continuousMonitoring = JSON.parse(continuousData);
    } catch (error) {
      console.log('⚠️ No continuous monitoring data found');
    }

    // Load URL healthcheck results
    try {
      const healthcheckData = await fs.readFile(join(auditDir, 'url-healthcheck.json'), 'utf8');
      results.analysis.urlHealthcheck = JSON.parse(healthcheckData);
    } catch (error) {
      console.log('⚠️ No URL healthcheck data found');
    }

    // Load self-healing reports
    try {
      const selfhealData = await fs.readFile(join(auditDir, '..', 'selfheal-reports', 'selfheal-report.json'), 'utf8');
      results.analysis.selfhealReports = JSON.parse(selfhealData);
    } catch (error) {
      console.log('⚠️ No self-healing reports found');
    }

    // Analyze patterns and detect follow-up errors
    await analyzeErrorPatterns(results);
    await generateRecommendations(results);

    // Save analysis
    await fs.writeFile(
      join(auditDir, 'followup-error-analysis.json'),
      JSON.stringify(results, null, 2)
    );

    console.log(`\n📊 Follow-up Error Analysis Complete:`);
    console.log(`🔍 Follow-up Errors Found: ${results.analysis.followupErrors.length}`);
    console.log(`💡 Recommendations: ${results.analysis.recommendations.length}`);
    console.log(`📁 Analysis saved to: audit/followup-error-analysis.json`);

    return results;

  } catch (error) {
    console.error('❌ Follow-up Error Detection failed:', error);
    throw error;
  }
}

async function analyzeErrorPatterns(results) {
  console.log('🔍 Analyzing error patterns...');

  // Check for recurring errors
  if (results.analysis.continuousMonitoring) {
    const monitoring = results.analysis.continuousMonitoring;
    
    for (const [targetName, targetData] of Object.entries(monitoring.monitoring)) {
      const failedUrls = targetData.results.filter(r => !r.ok);
      
      if (failedUrls.length > 0) {
        results.analysis.followupErrors.push({
          type: 'recurring_failures',
          target: targetName,
          count: failedUrls.length,
          urls: failedUrls.map(f => f.url),
          severity: failedUrls.length > 5 ? 'critical' : 'warning',
          message: `${failedUrls.length} URLs consistently failing on ${targetName}`
        });
      }
    }
  }

  // Check for performance degradation
  if (results.analysis.urlHealthcheck) {
    const healthcheck = results.analysis.urlHealthcheck;
    
    if (healthcheck.successRate < 95) {
      results.analysis.followupErrors.push({
        type: 'performance_degradation',
        severity: 'warning',
        message: `Success rate dropped to ${healthcheck.successRate}%`,
        recommendation: 'Investigate network issues or server problems'
      });
    }
  }

  // Check for self-healing issues
  if (results.analysis.selfhealReports) {
    const selfheal = results.analysis.selfhealReports;
    
    if (selfheal.summary.errors > 0) {
      results.analysis.followupErrors.push({
        type: 'selfheal_failures',
        severity: 'critical',
        message: `${selfheal.summary.errors} self-healing rules failed`,
        recommendation: 'Review and fix self-healing rule configurations'
      });
    }

    if (selfheal.summary.warnings > 5) {
      results.analysis.followupErrors.push({
        type: 'excessive_warnings',
        severity: 'warning',
        message: `${selfheal.summary.warnings} warnings in self-healing system`,
        recommendation: 'Address warning conditions to prevent future failures'
      });
    }
  }

  // Check for deployment inconsistencies
  if (results.analysis.continuousMonitoring) {
    const monitoring = results.analysis.continuousMonitoring;
    const targets = Object.keys(monitoring.monitoring);
    
    if (targets.length > 1) {
      const successRates = targets.map(target => {
        const targetData = monitoring.monitoring[target];
        const successCount = targetData.results.filter(r => r.ok).length;
        return { target, successRate: Math.round((successCount / targetData.results.length) * 100) };
      });

      const maxRate = Math.max(...successRates.map(s => s.successRate));
      const minRate = Math.min(...successRates.map(s => s.successRate));
      
      if (maxRate - minRate > 10) {
        results.analysis.followupErrors.push({
          type: 'deployment_inconsistency',
          severity: 'warning',
          message: `Success rate variance: ${minRate}% - ${maxRate}%`,
          recommendation: 'Synchronize deployment configurations across targets'
        });
      }
    }
  }
}

async function generateRecommendations(results) {
  console.log('💡 Generating recommendations...');

  // Auto-fix recommendations
  for (const error of results.analysis.followupErrors) {
    switch (error.type) {
      case 'recurring_failures':
        results.analysis.recommendations.push({
          type: 'auto_fix',
          priority: 'high',
          action: 'run_selfheal',
          description: `Run self-healing system to fix recurring failures on ${error.target}`,
          command: 'npm run selfheal'
        });
        break;

      case 'performance_degradation':
        results.analysis.recommendations.push({
          type: 'investigation',
          priority: 'medium',
          action: 'check_network',
          description: 'Investigate network connectivity and server performance',
          command: 'npm run audit:urls'
        });
        break;

      case 'selfheal_failures':
        results.analysis.recommendations.push({
          type: 'manual_fix',
          priority: 'critical',
          action: 'fix_selfheal_rules',
          description: 'Review and fix self-healing rule configurations',
          command: 'npm run selfheal:config'
        });
        break;

      case 'deployment_inconsistency':
        results.analysis.recommendations.push({
          type: 'sync',
          priority: 'medium',
          action: 'sync_deployments',
          description: 'Synchronize deployment configurations',
          command: 'npm run deploy:pages'
        });
        break;
    }
  }

  // Proactive recommendations
  if (results.analysis.followupErrors.length === 0) {
    results.analysis.recommendations.push({
      type: 'maintenance',
      priority: 'low',
      action: 'routine_check',
      description: 'System is healthy - continue routine monitoring',
      command: 'npm run monitor:continuous'
    });
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeFollowupErrors().catch(error => {
    console.error('❌ Follow-up Error Detection failed:', error);
    process.exit(1);
  });
}

export { analyzeFollowupErrors };
