/**
 * Browser Client for Live Data Platform
 * Provides easy-to-use client for web applications
 */

export interface ClientConfig {
  baseUrl: string;
  apiKey?: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  enableOfflineStorage: boolean;
  cacheExpiry: number; // milliseconds
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

export interface QualityResult {
  overallScore: number;
  checks: QualityCheck[];
  timestamp: string;
  dataId: string;
  topic: string;
}

export interface QualityCheck {
  name: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  passed: boolean;
  details?: Record<string, unknown>;
}

export class LiveDataClient {
  private config: ClientConfig;
  private eventSource?: EventSource;
  private reconnectAttempts = 0;
  private isConnected = false;
  private eventHandlers = new Map<string, Set<(data: any) => void>>();
  private cache = new Map<string, { data: any; timestamp: number }>();
  
  constructor(config: ClientConfig) {
    this.config = config;
    this.setupOfflineStorage();
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
    const data = await response.json();
    
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
  
  async getWeatherQuality(region: string): Promise<QualityResult[]> {
    const url = `${this.config.baseUrl}/api/v1/quality/weather/${region}`;
    const response = await this.makeRequest(url);
    const data = await response.json();
    return data.qualityHistory || [];
  }
  
  async getSpaceQuality(category: string): Promise<QualityResult[]> {
    const url = `${this.config.baseUrl}/api/v1/quality/space/${category}`;
    const response = await this.makeRequest(url);
    const data = await response.json();
    return data.qualityHistory || [];
  }
  
  // Real-time Streaming Methods
  
  subscribeToWeatherNowcast(region: string, callback: (data: WeatherData) => void): () => void {
    return this.subscribeToStream(`/stream/weather/nowcast/${region}`, 'weather-nowcast', callback);
  }
  
  subscribeToWeatherForecast(region: string, callback: (data: any) => void): () => void {
    return this.subscribeToStream(`/stream/weather/forecast/${region}`, 'weather-forecast', callback);
  }
  
  subscribeToSpaceAlerts(callback: (data: SpaceAlert) => void): () => void {
    return this.subscribeToStream('/stream/space/alerts', 'space-alerts', callback);
  }
  
  subscribeToSpaceAlertsByCategory(category: string, callback: (data: SpaceAlert) => void): () => void {
    return this.subscribeToStream(`/stream/space/alerts/${category}`, 'space-alerts', callback);
  }
  
  subscribeToWeatherQuality(region: string, callback: (data: QualityResult) => void): () => void {
    return this.subscribeToStream(`/stream/quality/weather/${region}`, 'weather-quality', callback);
  }
  
  subscribeToSpaceQuality(category: string, callback: (data: QualityResult) => void): () => void {
    return this.subscribeToStream(`/stream/quality/space/${category}`, 'space-quality', callback);
  }
  
  subscribeToAllData(region: string, callback: (data: any) => void): () => void {
    return this.subscribeToStream(`/stream/all/${region}`, 'all-data', callback);
  }
  
  private subscribeToStream(path: string, eventType: string, callback: (data: any) => void): () => void {
    // Add event handler
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(callback);
    
    // Connect if not already connected
    if (!this.isConnected) {
      this.connect();
    }
    
    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(callback);
        if (handlers.size === 0) {
          this.eventHandlers.delete(eventType);
        }
      }
      
      // Disconnect if no more handlers
      if (this.eventHandlers.size === 0) {
        this.disconnect();
      }
    };
  }
  
  private connect(): void {
    if (this.isConnected || this.eventSource) {
      return;
    }
    
    const url = `${this.config.baseUrl}/stream/all/eu-central`; // Default region
    this.eventSource = new EventSource(url);
    
    this.eventSource.onopen = () => {
      console.log('[LiveDataClient] SSE connection opened');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.dispatchEvent('connection', { status: 'connected' });
    };
    
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleStreamMessage(event.type, data);
      } catch (error) {
        console.error('[LiveDataClient] Error parsing SSE message:', error);
      }
    };
    
    this.eventSource.addEventListener('weather-nowcast', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        this.handleStreamMessage('weather-nowcast', data);
      } catch (error) {
        console.error('[LiveDataClient] Error parsing weather nowcast:', error);
      }
    });
    
    this.eventSource.addEventListener('weather-forecast', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        this.handleStreamMessage('weather-forecast', data);
      } catch (error) {
        console.error('[LiveDataClient] Error parsing weather forecast:', error);
      }
    });
    
    this.eventSource.addEventListener('space-alerts', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        this.handleStreamMessage('space-alerts', data);
      } catch (error) {
        console.error('[LiveDataClient] Error parsing space alerts:', error);
      }
    });
    
    this.eventSource.addEventListener('weather-quality', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        this.handleStreamMessage('weather-quality', data);
      } catch (error) {
        console.error('[LiveDataClient] Error parsing weather quality:', error);
      }
    });
    
    this.eventSource.addEventListener('space-quality', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        this.handleStreamMessage('space-quality', data);
      } catch (error) {
        console.error('[LiveDataClient] Error parsing space quality:', error);
      }
    });
    
    this.eventSource.addEventListener('heartbeat', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        console.log('[LiveDataClient] Heartbeat received:', data);
      } catch (error) {
        console.error('[LiveDataClient] Error parsing heartbeat:', error);
      }
    });
    
    this.eventSource.addEventListener('close', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        console.log('[LiveDataClient] Connection closed:', data);
        this.disconnect();
      } catch (error) {
        console.error('[LiveDataClient] Error parsing close message:', error);
      }
    });
    
    this.eventSource.onerror = (error) => {
      console.error('[LiveDataClient] SSE connection error:', error);
      this.isConnected = false;
      this.dispatchEvent('connection', { status: 'error', error });
      
      // Attempt reconnection
      this.attemptReconnect();
    };
  }
  
  private disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
    this.isConnected = false;
    this.dispatchEvent('connection', { status: 'disconnected' });
  }
  
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('[LiveDataClient] Max reconnection attempts reached');
      this.dispatchEvent('connection', { status: 'failed' });
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`[LiveDataClient] Attempting reconnection ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`);
    
    setTimeout(() => {
      this.disconnect();
      this.connect();
    }, this.config.reconnectInterval);
  }
  
  private handleStreamMessage(eventType: string, data: any): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (error) {
          console.error(`[LiveDataClient] Error in event handler for ${eventType}:`, error);
        }
      }
    }
    
    // Store in offline cache if enabled
    if (this.config.enableOfflineStorage) {
      this.storeOfflineData(eventType, data);
    }
  }
  
  private dispatchEvent(eventType: string, data: any): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (error) {
          console.error(`[LiveDataClient] Error in connection handler:`, error);
        }
      }
    }
  }
  
  // Utility Methods
  
  private async makeRequest(url: string): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
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
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  private setupOfflineStorage(): void {
    if (!this.config.enableOfflineStorage || typeof localStorage === 'undefined') {
      return;
    }
    
    // Load cached data on initialization
    try {
      const cached = localStorage.getItem('live-data-cache');
      if (cached) {
        const data = JSON.parse(cached);
        this.cache = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('[LiveDataClient] Error loading offline cache:', error);
    }
    
    // Save cache periodically
    setInterval(() => {
      try {
        const cacheObj = Object.fromEntries(this.cache);
        localStorage.setItem('live-data-cache', JSON.stringify(cacheObj));
      } catch (error) {
        console.error('[LiveDataClient] Error saving offline cache:', error);
      }
    }, 30000); // Every 30 seconds
  }
  
  private storeOfflineData(eventType: string, data: any): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const key = `offline_${eventType}`;
      const offlineData = {
        data,
        timestamp: Date.now(),
        eventType
      };
      
      // Keep only last 100 entries per type
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(offlineData);
      if (existing.length > 100) {
        existing.splice(0, existing.length - 100);
      }
      
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.error('[LiveDataClient] Error storing offline data:', error);
    }
  }
  
  public getOfflineData(eventType: string): any[] {
    if (typeof localStorage === 'undefined') return [];
    
    try {
      const key = `offline_${eventType}`;
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (error) {
      console.error('[LiveDataClient] Error loading offline data:', error);
      return [];
    }
  }
  
  public clearCache(): void {
    this.cache.clear();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('live-data-cache');
    }
  }
  
  public getConnectionStatus(): { connected: boolean; reconnectAttempts: number } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Factory function for easy initialization
export function createLiveDataClient(config: ClientConfig): LiveDataClient {
  return new LiveDataClient(config);
}

// Default configuration
export const defaultConfig: ClientConfig = {
  baseUrl: 'http://localhost:3000',
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  enableOfflineStorage: true,
  cacheExpiry: 300000 // 5 minutes
};
