/**
 * OAMTM Monitoring Dashboard
 * Überwacht Change-Log und Health-Status
 */
import { promises as fs } from 'fs';
// import { exec } from 'child_process';
// import { promisify } from 'util';

// const execAsync = promisify(exec);

interface MonitoringStatus {
  timestamp: string;
  changeLog: {
    totalItems: number;
    lastUpdate: string;
    status: 'healthy' | 'warning' | 'error';
  };
  healthStatus: {
    successRate: number;
    responseTime: number;
    uptime: number;
    status: 'healthy' | 'warning' | 'error';
  };
  systemHealth: 'healthy' | 'warning' | 'error';
}

const readJson = async<T=any>(p:string, d:T): Promise<T> => { 
  try{ 
    return JSON.parse(await fs.readFile(p,'utf8')) 
  }catch{ 
    return d 
  } 
};

export async function generateMonitoringReport(): Promise<MonitoringStatus> {
  const timestamp = new Date().toISOString();
  
  // Change-Log Status
  let changeLogStatus: MonitoringStatus['changeLog'];
  try {
    const fixesTxt = await fs.readFile('audit/fixes.jsonl', 'utf8').catch(() => '');
    const fixes = fixesTxt.split('\n').filter(Boolean);
    const lastFix = fixes[fixes.length - 1];
    const lastUpdate = lastFix ? JSON.parse(lastFix).ts : timestamp;
    
    changeLogStatus = {
      totalItems: fixes.length,
      lastUpdate,
      status: fixes.length > 0 ? 'healthy' : 'warning'
    };
  } catch (error) {
    changeLogStatus = {
      totalItems: 0,
      lastUpdate: timestamp,
      status: 'error'
    };
  }

  // Health Status
  let healthStatus: MonitoringStatus['healthStatus'];
  try {
    const targets = await readJson('status/targets.json', { 
      summary: { successRate: 0 }, 
      results: {} 
    });
    
    const successRate = targets.summary?.successRate || 0;
    const avgResponseTime = targets.results ? 
      Object.values(targets.results).reduce((acc: number, target: any) => 
        acc + (target.responseTime || 0), 0) / Object.keys(targets.results).length : 0;
    
    healthStatus = {
      successRate,
      responseTime: avgResponseTime,
      uptime: 99.5, // Mock data - would come from monitoring
      status: successRate >= 95 && avgResponseTime <= 500 ? 'healthy' : 'warning'
    };
  } catch (error) {
    healthStatus = {
      successRate: 0,
      responseTime: 0,
      uptime: 0,
      status: 'error'
    };
  }

  // Overall System Health
  const systemHealth = 
    changeLogStatus.status === 'healthy' && healthStatus.status === 'healthy' 
      ? 'healthy' 
      : changeLogStatus.status === 'error' || healthStatus.status === 'error'
      ? 'error'
      : 'warning';

  return {
    timestamp,
    changeLog: changeLogStatus,
    healthStatus,
    systemHealth
  };
}

export async function logMonitoringStatus(): Promise<void> {
  const status = await generateMonitoringReport();
  
  console.log('🔍 OAMTM Monitoring Dashboard');
  console.log('==============================');
  console.log(`📊 System Health: ${status.systemHealth.toUpperCase()}`);
  console.log(`📅 Timestamp: ${status.timestamp}`);
  console.log('');
  console.log('📋 Change-Log Status:');
  console.log(`  Items: ${status.changeLog.totalItems}`);
  console.log(`  Last Update: ${status.changeLog.lastUpdate}`);
  console.log(`  Status: ${status.changeLog.status}`);
  console.log('');
  console.log('🏥 Health Status:');
  console.log(`  Success Rate: ${status.healthStatus.successRate}%`);
  console.log(`  Response Time: ${status.healthStatus.responseTime}ms`);
  console.log(`  Uptime: ${status.healthStatus.uptime}%`);
  console.log(`  Status: ${status.healthStatus.status}`);
  console.log('');

  // Log to audit trail
  const logEntry = {
    ts: status.timestamp,
    rule: 'monitoring',
    action: 'dashboard-report',
    detail: status
  };

  await fs.mkdir('audit', { recursive: true });
  await fs.appendFile('audit/fixes.jsonl', JSON.stringify(logEntry) + '\n');
  
  // Generate HTML report
  await generateHTMLReport(status);
}

async function generateHTMLReport(status: MonitoringStatus): Promise<void> {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OAMTM Monitoring Dashboard</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .header { background: #f8f9fa; padding: 2rem; border-radius: 8px; margin-bottom: 2rem; }
        .status { display: inline-block; padding: 0.5rem 1rem; border-radius: 4px; color: white; font-weight: bold; }
        .healthy { background: #28a745; }
        .warning { background: #ffc107; color: #000; }
        .error { background: #dc3545; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        .card { background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 1.5rem; }
        .metric { margin: 1rem 0; }
        .metric-label { font-weight: bold; color: #6c757d; }
        .metric-value { font-size: 1.2rem; color: #495057; }
        .footer { text-align: center; margin-top: 2rem; color: #6c757d; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 OAMTM Monitoring Dashboard</h1>
        <p>System Health: <span class="status ${status.systemHealth}">${status.systemHealth.toUpperCase()}</span></p>
        <p>Last Updated: ${status.timestamp}</p>
    </div>
    
    <div class="grid">
        <div class="card">
            <h2>📋 Change-Log Status</h2>
            <div class="metric">
                <div class="metric-label">Total Items</div>
                <div class="metric-value">${status.changeLog.totalItems}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Last Update</div>
                <div class="metric-value">${status.changeLog.lastUpdate}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Status</div>
                <div class="metric-value"><span class="status ${status.changeLog.status}">${status.changeLog.status.toUpperCase()}</span></div>
            </div>
        </div>
        
        <div class="card">
            <h2>🏥 Health Status</h2>
            <div class="metric">
                <div class="metric-label">Success Rate</div>
                <div class="metric-value">${status.healthStatus.successRate}%</div>
            </div>
            <div class="metric">
                <div class="metric-label">Response Time</div>
                <div class="metric-value">${status.healthStatus.responseTime}ms</div>
            </div>
            <div class="metric">
                <div class="metric-label">Uptime</div>
                <div class="metric-value">${status.healthStatus.uptime}%</div>
            </div>
            <div class="metric">
                <div class="metric-label">Status</div>
                <div class="metric-value"><span class="status ${status.healthStatus.status}">${status.healthStatus.status.toUpperCase()}</span></div>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <p>Generated by OAMTM Monitoring Dashboard</p>
        <p>© 2025 Raymond Demitrio Dr. Tel - TEL1.NL</p>
    </div>
</body>
</html>`;

  await fs.writeFile('docs/monitoring-dashboard.html', html);
  console.log('📊 HTML Report generated: docs/monitoring-dashboard.html');
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  logMonitoringStatus().catch(console.error);
}
