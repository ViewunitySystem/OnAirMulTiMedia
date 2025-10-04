/**
 * Monitoring Report Generator
 * Generates comprehensive reports from Tree Monitor data
 */

import { promises as fs } from 'fs';

interface MonitoringData {
  timestamp: string;
  sessionId: string;
  config: any;
  status: any;
  treeSnapshot: [string, string][];
  recentUrlTests: any[];
  recentHealthChecks: any[];
  learningPatterns: any[];
}

export class MonitoringReportGenerator {
  private data: MonitoringData | null = null;

  async loadData(): Promise<void> {
    try {
      // Try to load from monitoring directory
      const dataFile = 'monitoring/monitoring-data.json';
      const content = await fs.readFile(dataFile, 'utf8');
      this.data = JSON.parse(content);
      console.log('[monitoring-report] Loaded monitoring data');
    } catch (error) {
      console.warn('[monitoring-report] No monitoring data found, generating sample report');
      this.data = this.generateSampleData();
    }
  }

  private generateSampleData(): MonitoringData {
    return {
      timestamp: new Date().toISOString(),
      sessionId: 'sample_session_123',
      config: {
        scanInterval: 30000,
        urlTestInterval: 60000,
        healthCheckInterval: 120000,
        learningEnabled: true,
        maxHistorySize: 1000
      },
      status: {
        isRunning: true,
        treeSnapshotSize: 150,
        urlHistorySize: 50,
        healthHistorySize: 25,
        learningPatternsCount: 8
      },
      treeSnapshot: [],
      recentUrlTests: [
        {
          url: 'https://viewunitysystem.github.io/OnAirMulTiMedia/',
          status: 200,
          responseTime: 1250,
          timestamp: new Date().toISOString()
        },
        {
          url: 'https://viewunitysystem.github.io/OnAirMulTiMedia/docs/',
          status: 404,
          responseTime: 800,
          timestamp: new Date().toISOString()
        }
      ],
      recentHealthChecks: [
        {
          timestamp: new Date().toISOString(),
          status: 'healthy',
          component: 'system',
          message: 'System health check passed',
          learningFactor: 0.95
        },
        {
          timestamp: new Date().toISOString(),
          status: 'warning',
          component: 'url-tester',
          message: '404 error detected',
          learningFactor: 0.75
        }
      ],
      learningPatterns: [
        {
          pattern: 'file_modified:.html:docs',
          frequency: 5,
          confidence: 0.8,
          lastSeen: new Date().toISOString(),
          suggestions: ['Update documentation', 'Test affected functionality'],
          fixes: ['Fix broken links', 'Update references']
        }
      ]
    };
  }

  async generateReport(): Promise<void> {
    if (!this.data) {
      await this.loadData();
    }

    const report = {
      timestamp: new Date().toISOString(),
      sessionId: this.data!.sessionId,
      summary: this.calculateSummary(),
      urlTests: this.data!.recentUrlTests,
      healthChecks: this.data!.recentHealthChecks,
      learningPatterns: this.data!.learningPatterns,
      recommendations: this.generateRecommendations()
    };

    // Save report
    await fs.mkdir('monitoring', { recursive: true });
    await fs.writeFile('monitoring/monitoring-report.json', JSON.stringify(report, null, 2));

    console.log('[monitoring-report] Generated monitoring report');
  }

  private calculateSummary(): any {
    const urlTests = this.data!.recentUrlTests;
    const healthChecks = this.data!.recentHealthChecks;

    const totalTests = urlTests.length;
    const errorTests = urlTests.filter(test => test.status >= 400);
    const avgResponseTime = totalTests > 0 ? urlTests.reduce((sum, test) => sum + test.responseTime, 0) / totalTests : 0;
    const errorRate = totalTests > 0 ? (errorTests.length / totalTests) * 100 : 0;
    const availability = totalTests > 0 ? ((totalTests - errorTests.length) / totalTests) * 100 : 100;

    const healthSummary = {
      healthy: healthChecks.filter(h => h.status === 'healthy').length,
      warning: healthChecks.filter(h => h.status === 'warning').length,
      critical: healthChecks.filter(h => h.status === 'critical').length
    };

    return {
      totalTests,
      errorRate: Math.round(errorRate * 100) / 100,
      availability: Math.round(availability * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      healthSummary
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const urlTests = this.data!.recentUrlTests;
    const healthChecks = this.data!.recentHealthChecks;

    // Analyze 404 errors
    const notFoundErrors = urlTests.filter(test => test.status === 404);
    if (notFoundErrors.length > 0) {
      recommendations.push(`Fix ${notFoundErrors.length} 404 errors: ${notFoundErrors.map(test => test.url).join(', ')}`);
    }

    // Analyze server errors
    const serverErrors = urlTests.filter(test => test.status >= 500);
    if (serverErrors.length > 0) {
      recommendations.push(`Investigate ${serverErrors.length} server errors`);
    }

    // Analyze slow responses
    const slowResponses = urlTests.filter(test => test.responseTime > 2000);
    if (slowResponses.length > 0) {
      recommendations.push(`Optimize ${slowResponses.length} slow responses`);
    }

    // Analyze critical health checks
    const criticalHealthChecks = healthChecks.filter(h => h.status === 'critical');
    if (criticalHealthChecks.length > 0) {
      recommendations.push(`Address ${criticalHealthChecks.length} critical health issues`);
    }

    // Learning-based recommendations
    const frequentPatterns = this.data!.learningPatterns.filter(p => p.frequency > 5);
    if (frequentPatterns.length > 0) {
      recommendations.push(`Review ${frequentPatterns.length} frequent change patterns for automation opportunities`);
    }

    return recommendations;
  }
}

// CLI usage
if (typeof window === 'undefined') {
  const generator = new MonitoringReportGenerator();
  
  console.log('📊 Monitoring Report Generator');
  console.log('==============================');
  console.log('');
  
  generator.generateReport().then(() => {
    console.log('Monitoring report generated successfully');
    process.exit(0);
  }).catch(error => {
    console.error('Failed to generate monitoring report:', error);
    process.exit(1);
  });
}
