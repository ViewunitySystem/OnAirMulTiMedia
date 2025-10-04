/**
 * NASA Space Weather Connector
 * Real connector for space weather alerts and data
 */

import { BaseConnector } from '../sdk';
import fetch from 'node-fetch';
import { createHash, createHmac } from 'crypto';

interface NASASpaceConfig {
  apiKey?: string;
  endpoint: string;
  intervalSec: number;
  timeoutMs: number;
  retryAttempts: number;
  retryDelayMs: number;
  alertTypes: string[];
}

interface NASASpaceAlert {
  id: string;
  timestamp: string;
  severity: 'info' | 'watch' | 'warning' | 'critical';
  category: string;
  message: string;
  details: {
    affectedRegion?: string;
    startTime?: string;
    endTime?: string;
    confidence: number;
    impact: {
      satellites: string;
      aviation: string;
      powerGrids: string;
      communications: string;
    };
    metrics: {
      kpIndex?: number;
      dstIndex?: number;
      flux?: number;
      xrayClass?: string;
    };
  };
}

interface NASAResponse {
  success: boolean;
  alerts: NASASpaceAlert[];
  timestamp: string;
  source: string;
}

export class NASASpaceConnector extends BaseConnector<NASASpaceConfig> {
  private intervalHandle?: NodeJS.Timeout;
  private lastFetchTime?: Date;
  private processedAlerts = new Set<string>();
  
  constructor() {
    super('nasa-space', 'NASA Space Weather', '1.0.0');
  }
  
  async validateConfig(config: NASASpaceConfig): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];
    
    if (!config.endpoint) {
      errors.push('Endpoint is required');
    }
    
    if (config.intervalSec && (config.intervalSec < 300 || config.intervalSec > 3600)) {
      errors.push('Interval must be between 300 and 3600 seconds (space data changes slowly)');
    }
    
    if (config.timeoutMs && (config.timeoutMs < 5000 || config.timeoutMs > 60000)) {
      errors.push('Timeout must be between 5000 and 60000 milliseconds');
    }
    
    if (!config.alertTypes || config.alertTypes.length === 0) {
      errors.push('At least one alert type must be specified');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
  
  protected async onStart(): Promise<void> {
    const config = this.currentConfig!;
    const interval = config.intervalSec * 1000;
    
    // Initial fetch
    await this.fetchAndEmit();
    
    // Set up interval
    this.intervalHandle = setInterval(async () => {
      try {
        await this.fetchAndEmit();
      } catch (error) {
        console.error(`[${this.id}] Error in interval fetch:`, error);
        this.errorCount++;
      }
    }, interval);
  }
  
  protected async onStop(): Promise<void> {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = undefined;
    }
  }
  
  private async fetchAndEmit(): Promise<void> {
    const config = this.currentConfig!;
    
    try {
      const spaceData = await this.fetchSpaceData(config);
      const newAlerts = this.filterNewAlerts(spaceData.alerts);
      
      for (const alert of newAlerts) {
        const normalizedAlert = this.normalizeSpaceAlert(alert);
        await this.emit(`space.alert.v1.${alert.category}`, normalizedAlert);
        this.processedAlerts.add(alert.id);
      }
      
      this.lastFetchTime = new Date();
      console.log(`[${this.id}] Successfully processed ${newAlerts.length} new space alerts`);
      
    } catch (error) {
      this.errorCount++;
      console.error(`[${this.id}] Failed to fetch space data:`, error);
      throw error;
    }
  }
  
  private async fetchSpaceData(config: NASASpaceConfig): Promise<NASAResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);
    
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'LiveDataPlatform/1.0.0',
        'Content-Type': 'application/json'
      };
      
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }
      
      const alertTypesParam = config.alertTypes.join(',');
      const response = await fetch(`${config.endpoint}/space-weather/alerts?types=${alertTypesParam}`, {
        method: 'GET',
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as NASAResponse;
      
      if (!data.success) {
        throw new Error('NASA API returned error');
      }
      
      return data;
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  private filterNewAlerts(alerts: NASASpaceAlert[]): NASASpaceAlert[] {
    return alerts.filter(alert => !this.processedAlerts.has(alert.id));
  }
  
  private normalizeSpaceAlert(nasaAlert: NASASpaceAlert): any {
    const issuedAt = new Date().toISOString();
    const alertId = this.generateAlertId(nasaAlert);
    
    const normalizedAlert = {
      provider: 'nasa',
      issuedAt,
      alertId,
      severity: nasaAlert.severity,
      category: nasaAlert.category,
      message: nasaAlert.message,
      details: nasaAlert.details,
      signature: this.createSignature({
        provider: 'nasa',
        issuedAt,
        alertId,
        severity: nasaAlert.severity,
        category: nasaAlert.category,
        message: nasaAlert.message
      })
    };
    
    return normalizedAlert;
  }
  
  private generateAlertId(alert: NASASpaceAlert): string {
    const timestamp = new Date(alert.timestamp).toISOString().replace(/[-:]/g, '').split('.')[0];
    const category = alert.category.toUpperCase().replace('_', '-');
    const hash = createHash('md5').update(alert.id).digest('hex').substring(0, 4);
    return `${category}-${timestamp}-${hash}`;
  }
  
  private createSignature(data: any): any {
    const timestamp = new Date().toISOString();
    const payload = JSON.stringify(data);
    const hash = createHash('sha256').update(payload).digest('hex');
    
    // In a real implementation, this would use proper cryptographic signing
    const signature = createHmac('sha256', 'secret-key').update(hash).digest('base64');
    
    return {
      alg: 'HS256',
      value: signature,
      timestamp,
      keyId: 'nasa-key-1'
    };
  }
}

// Factory function for creating NASA space connector
export function createNASASpaceConnector(): NASASpaceConnector {
  return new NASASpaceConnector();
}
