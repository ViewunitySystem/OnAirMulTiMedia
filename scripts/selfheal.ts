import { globby } from 'globby';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import * as cheerio from 'cheerio';

const CHANGED_MARKER = '.selfheal-changed';
const REPORTS_DIR = 'selfheal-reports';

let changed = false;
let reportData: any = {
  timestamp: new Date().toISOString(),
  rules: {},
  summary: {
    totalRules: 0,
    enabledRules: 0,
    fixedIssues: 0,
    warnings: 0,
    errors: 0
  }
};

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

(async () => {
  try {
    console.log('🧠 Starting Self-Healing Orchestrator...');
    
    const cfg = JSON.parse(fs.readFileSync('selfheal.config.json', 'utf8'));
    const rules = await import('./rules');
    
    reportData.summary.totalRules = Object.keys(rules.default).length;
    
    for (const [ruleName, rule] of Object.entries(rules.default)) {
      const ruleConfig = cfg.rules[ruleName];
      
      if (!ruleConfig?.enabled) {
        console.log(`⏭️ Skipping disabled rule: ${ruleName}`);
        continue;
      }
      
      reportData.summary.enabledRules++;
      console.log(`🔧 Running rule: ${ruleName}`);
      
      try {
        const result = await (rule as any).run(cfg);
        
        if (result?.changed) {
          changed = true;
          reportData.summary.fixedIssues++;
          console.log(`✅ Fixed issues in rule: ${ruleName}`);
        }
        
        if (result?.warnings) {
          reportData.summary.warnings += result.warnings;
        }
        
        if (result?.errors) {
          reportData.summary.errors += result.errors;
        }
        
        reportData.rules[ruleName] = {
          status: result?.changed ? 'fixed' : 'clean',
          issues: result?.issues || 0,
          warnings: result?.warnings || 0,
          errors: result?.errors || 0,
          details: result?.details || null
        };
        
      } catch (error) {
        console.error(`❌ Error in rule ${ruleName}:`, error);
        reportData.rules[ruleName] = {
          status: 'error',
          error: error.message
        };
      }
    }
    
    // Generate reports
    await generateReports();
    
    // Mark changes if any
    if (changed) {
      fs.writeFileSync(CHANGED_MARKER, new Date().toISOString());
      console.log('🔧 SELFHEAL: Changes written - PR will be created');
    } else {
      console.log('✅ SELFHEAL: Repository is clean - no changes needed');
    }
    
    // Cleanup old reports
    await cleanupOldReports();
    
  } catch (error) {
    console.error('❌ Self-Healing Orchestrator failed:', error);
    process.exit(1);
  }
})();

async function generateReports() {
  console.log('📊 Generating reports...');
  
  // JSON Report
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'selfheal-report.json'),
    JSON.stringify(reportData, null, 2)
  );
  
  // HTML Report
  const htmlReport = generateHTMLReport(reportData);
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'selfheal-report.html'),
    htmlReport
  );
  
  // Markdown Report
  const markdownReport = generateMarkdownReport(reportData);
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'selfheal-report.md'),
    markdownReport
  );
  
  console.log('📊 Reports generated successfully');
}

function generateHTMLReport(data: any): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Self-Healing Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 20px; }
        .metric { text-align: center; padding: 15px; border-radius: 8px; }
        .metric.success { background: #d4edda; color: #155724; }
        .metric.warning { background: #fff3cd; color: #856404; }
        .metric.error { background: #f8d7da; color: #721c24; }
        .rules { padding: 20px; }
        .rule { margin: 10px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #ddd; }
        .rule.fixed { border-left-color: #28a745; background: #d4edda; }
        .rule.clean { border-left-color: #17a2b8; background: #d1ecf1; }
        .rule.error { border-left-color: #dc3545; background: #f8d7da; }
        .timestamp { color: #6c757d; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧠 Self-Healing Report</h1>
            <p class="timestamp">Generated: ${data.timestamp}</p>
        </div>
        
        <div class="summary">
            <div class="metric success">
                <h3>${data.summary.enabledRules}</h3>
                <p>Rules Executed</p>
            </div>
            <div class="metric success">
                <h3>${data.summary.fixedIssues}</h3>
                <p>Issues Fixed</p>
            </div>
            <div class="metric warning">
                <h3>${data.summary.warnings}</h3>
                <p>Warnings</p>
            </div>
            <div class="metric error">
                <h3>${data.summary.errors}</h3>
                <p>Errors</p>
            </div>
        </div>
        
        <div class="rules">
            <h2>Rule Results</h2>
            ${Object.entries(data.rules).map(([ruleName, ruleData]: [string, any]) => `
                <div class="rule ${ruleData.status}">
                    <h3>${ruleName}</h3>
                    <p>Status: ${ruleData.status}</p>
                    ${ruleData.issues ? `<p>Issues: ${ruleData.issues}</p>` : ''}
                    ${ruleData.warnings ? `<p>Warnings: ${ruleData.warnings}</p>` : ''}
                    ${ruleData.errors ? `<p>Errors: ${ruleData.errors}</p>` : ''}
                    ${ruleData.error ? `<p>Error: ${ruleData.error}</p>` : ''}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
}

function generateMarkdownReport(data: any): string {
  return `# 🧠 Self-Healing Report

**Generated:** ${data.timestamp}

## 📊 Summary

- **Rules Executed:** ${data.summary.enabledRules}
- **Issues Fixed:** ${data.summary.fixedIssues}
- **Warnings:** ${data.summary.warnings}
- **Errors:** ${data.summary.errors}

## 🔧 Rule Results

${Object.entries(data.rules).map(([ruleName, ruleData]: [string, any]) => `
### ${ruleName}
- **Status:** ${ruleData.status}
- **Issues:** ${ruleData.issues || 0}
- **Warnings:** ${ruleData.warnings || 0}
- **Errors:** ${ruleData.errors || 0}
${ruleData.error ? `- **Error:** ${ruleData.error}` : ''}
`).join('')}

---
*Report generated by OnAirMulTiMedia Self-Healing System*
`;
}

async function cleanupOldReports() {
  const retentionDays = 30;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  try {
    const files = await globby([path.join(REPORTS_DIR, '*.json'), path.join(REPORTS_DIR, '*.html'), path.join(REPORTS_DIR, '*.md')]);
    
    for (const file of files) {
      const stats = fs.statSync(file);
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(file);
        console.log(`🗑️ Cleaned up old report: ${file}`);
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not cleanup old reports:', error.message);
  }
}