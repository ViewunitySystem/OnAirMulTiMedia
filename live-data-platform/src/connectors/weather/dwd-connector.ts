/**
 * Deutscher Wetterdienst (DWD) Weather Connector
 * Real connector for German weather data
 */

import { BaseConnector } from '../sdk';
import fetch from 'node-fetch';
import { createHash, createHmac } from 'crypto';

interface DWDConfig {
  apiKey?: string;
  region: string;
  endpoint: string;
  intervalSec: number;
  timeoutMs: number;
  retryAttempts: number;
  retryDelayMs: number;
}

interface DWDWeatherData {
  timestamp: string;
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  cloudCover: number;
  visibility: number;
  lat: number;
  lon: number;
  stationId: string;
  stationName: string;
}

interface DWDResponse {
  success: boolean;
  data: DWDWeatherData[];
  timestamp: string;
  region: string;
  source: string;
}

export class DWDWeatherConnector extends BaseConnector<DWDConfig> {
  private intervalHandle?: NodeJS.Timeout;
  private lastFetchTime?: Date;
  
  constructor() {
    super('dwd-weather', 'Deutscher Wetterdienst Weather', '1.0.0');
  }
  
  async validateConfig(config: DWDConfig): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];
    
    if (!config.region) {
      errors.push('Region is required');
    }
    
    if (!config.endpoint) {
      errors.push('Endpoint is required');
    }
    
    if (config.intervalSec && (config.intervalSec < 60 || config.intervalSec > 3600)) {
      errors.push('Interval must be between 60 and 3600 seconds');
    }
    
    if (config.timeoutMs && (config.timeoutMs < 1000 || config.timeoutMs > 30000)) {
      errors.push('Timeout must be between 1000 and 30000 milliseconds');
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
    const startTime = Date.now();
    
    try {
      const weatherData = await this.fetchWeatherData(config);
      const normalizedData = this.normalizeWeatherData(weatherData, config.region);
      
      await this.emit(`weather.nowcast.v1.${config.region}`, normalizedData);
      
      this.lastFetchTime = new Date();
      console.log(`[${this.id}] Successfully fetched and emitted weather data for ${config.region}`);
      
    } catch (error) {
      this.errorCount++;
      console.error(`[${this.id}] Failed to fetch weather data:`, error);
      throw error;
    }
  }
  
  private async fetchWeatherData(config: DWDConfig): Promise<DWDResponse> {
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
      
      const response = await fetch(`${config.endpoint}/weather/${config.region}`, {
        method: 'GET',
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as DWDResponse;
      
      if (!data.success) {
        throw new Error('DWD API returned error');
      }
      
      return data;
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  private normalizeWeatherData(dwdData: DWDResponse, region: string): any {
    const issuedAt = new Date().toISOString();
    const points = dwdData.data.map(point => ({
      lat: point.lat,
      lon: point.lon,
      time: point.timestamp,
      tempC: point.temperature,
      windMS: point.windSpeed,
      precipMMph: point.precipitation,
      humidity: point.humidity,
      pressure: point.pressure,
      quality: this.calculateQualityScore(point)
    }));
    
    const signature = this.createSignature({
      provider: 'dwd',
      issuedAt,
      region,
      points
    });
    
    return {
      provider: 'dwd',
      issuedAt,
      region,
      unitSystem: 'SI',
      points,
      metadata: {
        resolution: '1km',
        forecastHours: 0,
        source: 'dwd-radar',
        stationCount: points.length
      },
      signature
    };
  }
  
  private calculateQualityScore(point: DWDWeatherData): number {
    let score = 1.0;
    
    // Check for missing or invalid data
    if (point.temperature < -50 || point.temperature > 60) score -= 0.3;
    if (point.humidity < 0 || point.humidity > 100) score -= 0.2;
    if (point.pressure < 800 || point.pressure > 1200) score -= 0.2;
    if (point.windSpeed < 0 || point.windSpeed > 150) score -= 0.1;
    if (point.precipitation < 0 || point.precipitation > 500) score -= 0.1;
    
    // Check data freshness
    const dataAge = Date.now() - new Date(point.timestamp).getTime();
    if (dataAge > 300000) score -= 0.2; // 5 minutes
    if (dataAge > 900000) score -= 0.3; // 15 minutes
    
    return Math.max(0, score);
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
      keyId: 'dwd-key-1'
    };
  }
}

// Factory function for creating DWD connector
export function createDWDWeatherConnector(): DWDWeatherConnector {
  return new DWDWeatherConnector();
}
