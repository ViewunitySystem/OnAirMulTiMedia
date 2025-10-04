// Meta-Reflector: Systemdiagnose & Status-Audit alle 30 Minuten
// Läuft als Cron/Worker für kontinuierliche Systemüberwachung
// Erzeugt meta-reflector.log mit auditierbaren Nachweisen

import fs from 'node:fs/promises';
import path from 'node:path';

interface SystemProbe {
  ts: string;
  contracts: 'ok' | 'warn' | 'bad';
  worm: 'ok' | 'warn' | 'bad';
  tx: 'ok' | 'warn' | 'bad';
  freshness: 'ok' | 'warn' | 'bad';
  security: 'ok' | 'warn' | 'bad';
  performance: 'ok' | 'warn' | 'bad';
  compliance: 'ok' | 'warn' | 'bad';
  details?: Record<string, unknown>;
}

class MetaReflector {
  private logPath: string;
  private isRunning: boolean = false;

  constructor(logPath: string = 'meta-reflector.log') {
    this.logPath = path.resolve(logPath);
  }

  async start(intervalMinutes: number = 30): Promise<void> {
    if (this.isRunning) {
      console.warn('Meta-Reflector is already running');
      return;
    }

    this.isRunning = true;
    console.log(`🔍 Meta-Reflector started (interval: ${intervalMinutes}min)`);

    // Sofortige erste Probe
    await this.probe();

    // Intervall-basierte Proben
    const intervalMs = intervalMinutes * 60 * 1000;
    setInterval(async () => {
      if (this.isRunning) {
        await this.probe();
      }
    }, intervalMs);
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('🔍 Meta-Reflector stopped');
  }

  async probe(): Promise<SystemProbe> {
    const probe: SystemProbe = {
      ts: new Date().toISOString(),
      contracts: await this.checkContracts(),
      worm: await this.checkWormEvidence(),
      tx: await this.checkTxGate(),
      freshness: await this.checkFreshness(),
      security: await this.checkSecurity(),
      performance: await this.checkPerformance(),
      compliance: await this.checkCompliance(),
      details: await this.getSystemDetails()
    };

    await this.logProbe(probe);
    await this.alertIfNeeded(probe);

    return probe;
  }

  private async checkContracts(): Promise<'ok' | 'warn' | 'bad'> {
    try {
      // Simuliere Contract-Validierung
      // In echter Implementation: JSON Schema Validation, CI-Status, etc.
      const contractHealth = Math.random();
      
      if (contractHealth > 0.9) return 'ok';
      if (contractHealth > 0.7) return 'warn';
      return 'bad';
    } catch (error) {
      console.error('Contract check failed:', error);
      return 'bad';
    }
  }

  private async checkWormEvidence(): Promise<'ok' | 'warn' | 'bad'> {
    try {
      // Simuliere WORM (Write Once Read Many) Archiv-Validierung
      // In echter Implementation: Hash-Chain Verification, Archive Integrity
      const wormHealth = Math.random();
      
      if (wormHealth > 0.95) return 'ok';
      if (wormHealth > 0.8) return 'warn';
      return 'bad';
    } catch (error) {
      console.error('WORM evidence check failed:', error);
      return 'bad';
    }
  }

  private async checkTxGate(): Promise<'ok' | 'warn' | 'bad'> {
    try {
      // Simuliere TX-Gate Policy-Validierung
      // In echter Implementation: Policy Export, Hardware Integration, License Check
      const txHealth = Math.random();
      
      if (txHealth > 0.9) return 'ok';
      if (txHealth > 0.7) return 'warn';
      return 'bad';
    } catch (error) {
      console.error('TX-Gate check failed:', error);
      return 'bad';
    }
  }

  private async checkFreshness(): Promise<'ok' | 'warn' | 'bad'> {
    try {
      // Simuliere Data Freshness SLO Check
      // In echter Implementation: Observability Metrics, Lag Monitoring
      const freshnessHealth = Math.random();
      
      if (freshnessHealth > 0.85) return 'ok';
      if (freshnessHealth > 0.6) return 'warn';
      return 'bad';
    } catch (error) {
      console.error('Freshness check failed:', error);
      return 'bad';
    }
  }

  private async checkSecurity(): Promise<'ok' | 'warn' | 'bad'> {
    try {
      // Simuliere Security Assessment
      // In echter Implementation: Vulnerability Scans, Security Headers, Access Control
      const securityHealth = Math.random();
      
      if (securityHealth > 0.9) return 'ok';
      if (securityHealth > 0.7) return 'warn';
      return 'bad';
    } catch (error) {
      console.error('Security check failed:', error);
      return 'bad';
    }
  }

  private async checkPerformance(): Promise<'ok' | 'warn' | 'bad'> {
    try {
      // Simuliere Performance Monitoring
      // In echter Implementation: Response Times, Throughput, Error Rates
      const performanceHealth = Math.random();
      
      if (performanceHealth > 0.8) return 'ok';
      if (performanceHealth > 0.6) return 'warn';
      return 'bad';
    } catch (error) {
      console.error('Performance check failed:', error);
      return 'bad';
    }
  }

  private async checkCompliance(): Promise<'ok' | 'warn' | 'bad'> {
    try {
      // Simuliere Compliance Check
      // In echter Implementation: GDPR, Regulatory, Audit Trail Validation
      const complianceHealth = Math.random();
      
      if (complianceHealth > 0.9) return 'ok';
      if (complianceHealth > 0.7) return 'warn';
      return 'bad';
    } catch (error) {
      console.error('Compliance check failed:', error);
      return 'bad';
    }
  }

  private async getSystemDetails(): Promise<Record<string, unknown>> {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      timestamp: new Date().toISOString(),
      pid: process.pid,
      cwd: process.cwd()
    };
  }

  private async logProbe(probe: SystemProbe): Promise<void> {
    try {
      const logEntry = JSON.stringify(probe) + '\n';
      await fs.appendFile(this.logPath, logEntry);
      
      console.log(`📊 Meta-Reflector probe logged: ${probe.ts}`);
      console.log(`   Contracts: ${probe.contracts}, WORM: ${probe.worm}, TX: ${probe.tx}`);
      console.log(`   Freshness: ${probe.freshness}, Security: ${probe.security}`);
      console.log(`   Performance: ${probe.performance}, Compliance: ${probe.compliance}`);
      
    } catch (error) {
      console.error('Failed to log probe:', error);
    }
  }

  private async alertIfNeeded(probe: SystemProbe): Promise<void> {
    const criticalComponents = ['contracts', 'worm', 'tx', 'security', 'compliance'];
    const warnings = criticalComponents.filter(component => 
      probe[component as keyof SystemProbe] === 'warn' || 
      probe[component as keyof SystemProbe] === 'bad'
    );

    if (warnings.length > 0) {
      console.warn(`⚠️  Meta-Reflector Alert: ${warnings.join(', ')} need attention`);
      
      // In echter Implementation: Pager, Email, Slack, etc.
      await this.sendAlert(warnings, probe);
    }
  }

  private async sendAlert(warnings: string[], probe: SystemProbe): Promise<void> {
    // Simuliere Alert-Versand
    // In echter Implementation: Integration mit Alerting-System
    const alert = {
      type: 'meta-reflector-alert',
      timestamp: probe.ts,
      severity: warnings.length > 2 ? 'critical' : 'warning',
      components: warnings,
      details: probe.details
    };

    console.log('🚨 Alert sent:', JSON.stringify(alert, null, 2));
  }

  async getLatestProbe(): Promise<SystemProbe | null> {
    try {
      const logContent = await fs.readFile(this.logPath, 'utf-8');
      const lines = logContent.trim().split('\n').filter(line => line.trim());
      
      if (lines.length === 0) return null;
      
      const lastLine = lines[lines.length - 1];
      return JSON.parse(lastLine) as SystemProbe;
      
    } catch (error) {
      console.error('Failed to read latest probe:', error);
      return null;
    }
  }

  async getProbeHistory(hours: number = 24): Promise<SystemProbe[]> {
    try {
      const logContent = await fs.readFile(this.logPath, 'utf-8');
      const lines = logContent.trim().split('\n').filter(line => line.trim());
      
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const probes = lines
        .map(line => {
          try {
            return JSON.parse(line) as SystemProbe;
          } catch {
            return null;
          }
        })
        .filter((probe): probe is SystemProbe => probe !== null)
        .filter(probe => new Date(probe.ts) >= cutoffTime);
      
      return probes;
      
    } catch (error) {
      console.error('Failed to read probe history:', error);
      return [];
    }
  }

  async generateReport(): Promise<string> {
    const latestProbe = await this.getLatestProbe();
    const history = await this.getProbeHistory(24);
    
    if (!latestProbe) {
      return 'No probe data available';
    }

    const totalProbes = history.length;
    const okProbes = history.filter(p => 
      ['contracts', 'worm', 'tx', 'freshness', 'security', 'performance', 'compliance']
        .every(component => p[component as keyof SystemProbe] === 'ok')
    ).length;
    
    const healthPercentage = totalProbes > 0 ? Math.round((okProbes / totalProbes) * 100) : 0;

    return `
# Meta-Reflector System Report
Generated: ${new Date().toISOString()}

## Current Status
- Contracts: ${latestProbe.contracts}
- WORM Evidence: ${latestProbe.worm}
- TX-Gate: ${latestProbe.tx}
- Freshness: ${latestProbe.freshness}
- Security: ${latestProbe.security}
- Performance: ${latestProbe.performance}
- Compliance: ${latestProbe.compliance}

## 24h Health Score
- Total Probes: ${totalProbes}
- Healthy Probes: ${okProbes}
- Health Percentage: ${healthPercentage}%

## System Details
- Node Version: ${latestProbe.details?.nodeVersion}
- Platform: ${latestProbe.details?.platform}
- Uptime: ${Math.round((latestProbe.details?.uptime as number) || 0)}s
- Memory Usage: ${JSON.stringify(latestProbe.details?.memoryUsage)}
`;
  }
}

// CLI Interface
async function main() {
  const reflector = new MetaReflector();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      const interval = parseInt(process.argv[3]) || 30;
      await reflector.start(interval);
      break;
      
    case 'probe':
      const probe = await reflector.probe();
      console.log('Probe result:', JSON.stringify(probe, null, 2));
      break;
      
    case 'latest':
      const latest = await reflector.getLatestProbe();
      console.log('Latest probe:', JSON.stringify(latest, null, 2));
      break;
      
    case 'history':
      const hours = parseInt(process.argv[3]) || 24;
      const history = await reflector.getProbeHistory(hours);
      console.log(`History (${hours}h):`, JSON.stringify(history, null, 2));
      break;
      
    case 'report':
      const report = await reflector.generateReport();
      console.log(report);
      break;
      
    default:
      console.log(`
Usage: ts-node meta-reflector.ts <command> [options]

Commands:
  start [interval]    Start continuous monitoring (default: 30 minutes)
  probe              Run single probe
  latest             Show latest probe result
  history [hours]    Show probe history (default: 24 hours)
  report             Generate system report

Examples:
  ts-node meta-reflector.ts start 15    # Start with 15-minute interval
  ts-node meta-reflector.ts probe       # Run single probe
  ts-node meta-reflector.ts history 48  # Show 48-hour history
  ts-node meta-reflector.ts report      # Generate report
`);
  }
}

// Export für Module-Usage
export { MetaReflector, SystemProbe };

// CLI ausführen wenn direkt gestartet
if (require.main === module) {
  main().catch(console.error);
}
