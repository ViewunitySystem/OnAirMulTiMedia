/**
 * Node.js Client for Live Data Platform
 * Provides server-side client for Node.js applications
 */

import WebSocket from 'ws';
import fetch from 'node-fetch';
import { EventEmitter } from 'events';

export interface NodeClientConfig {
  baseUrl: string;
  apiKey?: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  enableCaching: boolean;
  cacheExpiry: number; // milliseconds
  userAgent: string;
}

export interface WeatherData {
  provider: string;
  issuedAt: string;
  region: string;
  unitSystem: string;
  points: WeatherPoint[];
  metadata?: any;
  signature?: any;
}

export interface WeatherPoint {
  lat: number;
  lon: number;
  time: string;
  tempC: number;
  windMS: number;
  precipMMph: number;
  humidity: number;
  pressure: number;
  quality?: number;
}

export interface SpaceAlert {
  provider: string;
  issuedAt: string;
  alertId: string;
  severity: 'info' | 'watch' | 'warning' | 'critical';
  category: string;
  message: string;
  details?: any;
  signature?: any;
}

export class NodeLiveDataClient extends EventEmitter {
  private config: NodeClientConfig;
  private ws?: WebSocket;
  private reconnectAttempts = 0;
  private isConnected = false;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private reconnectTimer?: NodeJS.Timeout;
  
  constructor(config: NodeClientConfig) {
    super();
    this.config = config;
  }
  
  // REST API Methods
  
  async getCurrentWeather(region: string, options?: { lat?: number; lon?: number; radius?: number }): Promise<WeatherData> {
    const cacheKey = `weather_current_${region}_${options?.lat}_${options?.lon}_${options?.radius}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }
    
    const url = new URL(`${this.config.baseUrl}/api/v1/weather/current/${region}`);
    if (options?.lat) url.searchParams.set('lat', options.lat.toString());
    if (options?.lon) url.searchParams.set('lon', options.lon.toString());
    if (options?.radius) url.searchParams.set('radius', options.radius.toString());
    
    const response = await this.makeRequest(url.toString());
    const data = await response.json() as WeatherData;
    
    // Cache the result
    this.setCache(cacheKey, data);
    
    return data;
  }
  
  async getWeatherForecast(region: string, hours = 24): Promise<any> {
    const cacheKey = `weather_forecast_${region}_${hours}`;
    
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }
    
    const url = `${this.config.baseUrl}/api/v1/weather/forecast/${region}?hours=${hours}`;
    const response = await this.makeRequest(url);
    const data = await response.json();
    
    this.setCache(cacheKey, data);
    
    return data;
  }
  
  async getWeatherHistory(region: string, options?: { limit?: number; startTime?: string; endTime?: string }): Promise<any> {
    const url = new URL(`${this.config.baseUrl}/api/v1/weather/history/${region}`);
    if (options?.limit) url.searchParams.set('limit', options.limit.toString());
    if (options?.startTime) url.searchParams.set('startTime', options.startTime);
    if (options?.endTime) url.searchParams.set('endTime', options.endTime);
    
    const response = await this.makeRequest(url.toString());
    return response.json();
  }
  
  async getSpaceAlerts(options?: { severity?: string; limit?: number }): Promise<any> {
    const url = new URL(`${this.config.baseUrl}/api/v1/space/alerts`);
    if (options?.severity) url.searchParams.set('severity', options.severity);
    if (options?.limit) url.searchParams.set('limit', options.limit.toString());
    
    const response = await this.makeRequest(url.toString());
    return response.json();
  }
  
  async getSpaceAlertsByCategory(category: string, limit = 50): Promise<any> {
    const url = `${this.config.baseUrl}/api/v1/space/alerts/${category}?limit=${limit}`;
    const response = await this.makeRequest(url);
    return response.json();
  }
  
  async getCurrentSpaceWeather(): Promise<any> {
    const cacheKey = 'space_current';
    
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }
    
    const url = `${this.config.baseUrl}/api/v1/space/current`;
    const response = await this.makeRequest(url);
    const data = await response.json();
    
    this.setCache(cacheKey, data);
    
    return data;
  }
  
  async getWeatherQuality(region: string): Promise<any[]> {
    const url = `${this.config.baseUrl}/api/v1/quality/weather/${region}`;
    const response = await this.makeRequest(url);
    const data = await response.json();
    return data.qualityHistory || [];
  }
  
  async getSpaceQuality(category: string): Promise<any[]> {
    const url = `${this.config.baseUrl}/api/v1/quality/space/${category}`;
    const response = await this.makeRequest(url);
    const data = await response.json();
    return data.qualityHistory || [];
  }
  
  // WebSocket Streaming Methods
  
  connectToWeatherNowcast(region: string): void {
    this.connectToStream(`weather.nowcast.${region}`);
  }
  
  connectToWeatherForecast(region: string): void {
    this.connectToStream(`weather.forecast.${region}`);
  }
  
  connectToSpaceAlerts(): void {
    this.connectToStream('space.alerts');
  }
  
  connectToSpaceAlertsByCategory(category: string): void {
    this.connectToStream(`space.alerts.${category}`);
  }
  
  connectToWeatherQuality(region: string): void {
    this.connectToStream(`quality.weather.${region}`);
  }
  
  connectToSpaceQuality(category: string): void {
    this.connectToStream(`quality.space.${category}`);
  }
  
  connectToAllData(region: string): void {
    this.connectToStream(`all.${region}`);
  }
  
  private connectToStream(topic: string): void {
    if (this.isConnected && this.ws) {
      // Send subscription message
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        topic
      }));
      return;
    }
    
    // Connect if not already connected
    this.connect();
  }
  
  private connect(): void {
    if (this.isConnected || this.ws) {
      return;
    }
    
    const wsUrl = this.config.baseUrl.replace('http', 'ws') + '/ws';
    this.ws = new WebSocket(wsUrl, {
      headers: {
        'User-Agent': this.config.userAgent,
        ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey })
      }
    });
    
    this.ws.on('open', () => {
      console.log('[NodeLiveDataClient] WebSocket connection opened');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection', { status: 'connected' });
      
      // Clear any existing reconnect timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = undefined;
      }
    });
    
    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        console.error('[NodeLiveDataClient] Error parsing WebSocket message:', error);
      }
    });
    
    this.ws.on('close', (code: number, reason: string) => {
      console.log(`[NodeLiveDataClient] WebSocket connection closed: ${code} ${reason}`);
      this.isConnected = false;
      this.emit('connection', { status: 'disconnected', code, reason });
      
      // Attempt reconnection
      this.attemptReconnect();
    });
    
    this.ws.on('error', (error: Error) => {
      console.error('[NodeLiveDataClient] WebSocket connection error:', error);
      this.isConnected = false;
      this.emit('connection', { status: 'error', error });
      
      // Attempt reconnection
      this.attemptReconnect();
    });
  }
  
  private disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
    this.isConnected = false;
    this.emit('connection', { status: 'disconnected' });
  }
  
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('[NodeLiveDataClient] Max reconnection attempts reached');
      this.emit('connection', { status: 'failed' });
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`[NodeLiveDataClient] Attempting reconnection ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`);
    
    this.reconnectTimer = setTimeout(() => {
      this.disconnect();
      this.connect();
    }, this.config.reconnectInterval);
  }
  
  private handleMessage(message: any): void {
    switch (message.type) {
      case 'weather-nowcast':
        this.emit('weather-nowcast', message.data);
        break;
      case 'weather-forecast':
        this.emit('weather-forecast', message.data);
        break;
      case 'space-alerts':
        this.emit('space-alerts', message.data);
        break;
      case 'weather-quality':
        this.emit('weather-quality', message.data);
        break;
      case 'space-quality':
        this.emit('space-quality', message.data);
        break;
      case 'heartbeat':
        console.log('[NodeLiveDataClient] Heartbeat received:', message.data);
        this.emit('heartbeat', message.data);
        break;
      case 'error':
        console.error('[NodeLiveDataClient] Server error:', message.error);
        this.emit('error', message.error);
        break;
      default:
        console.log('[NodeLiveDataClient] Unknown message type:', message.type);
        this.emit('message', message);
    }
  }
  
  // Utility Methods
  
  private async makeRequest(url: string): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': this.config.userAgent
    };
    
    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  }
  
  private getFromCache(key: string): any | null {
    if (!this.config.enableCaching) return null;
    
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.config.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  private setCache(key: string, data: any): void {
    if (!this.config.enableCaching) return;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  public clearCache(): void {
    this.cache.clear();
  }
  
  public getConnectionStatus(): { connected: boolean; reconnectAttempts: number } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }
  
  public close(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    this.disconnect();
  }
}

// Factory function for easy initialization
export function createNodeLiveDataClient(config: NodeClientConfig): NodeLiveDataClient {
  return new NodeLiveDataClient(config);
}

// Default configuration
export const defaultNodeConfig: NodeClientConfig = {
  baseUrl: 'http://localhost:3000',
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  enableCaching: true,
  cacheExpiry: 300000, // 5 minutes
  userAgent: 'NodeLiveDataClient/1.0.0'
};
