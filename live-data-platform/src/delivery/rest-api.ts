/**
 * REST API for Live Data Platform
 * Provides HTTP endpoints for data access
 */

import express, { Request, Response, NextFunction } from 'express';
import { StreamBus, StreamMessage } from '../stream/bus';
import { MetricsCollector } from '../observability/metrics';
import { SecurityHeaders } from '../security/headers';
import { createHash } from 'crypto';

interface RESTAPIConfig {
  port: number;
  enableCaching: boolean;
  cacheTTL: number; // seconds
  enableMetrics: boolean;
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  etag: string;
  ttl: number;
}

export class RESTAPI {
  private app: express.Application;
  private config: RESTAPIConfig;
  private streamBus: StreamBus;
  private metrics: MetricsCollector;
  private securityHeaders: SecurityHeaders;
  private cache = new Map<string, CacheEntry>();
  
  constructor(config: RESTAPIConfig, streamBus: StreamBus, metrics: MetricsCollector) {
    this.config = config;
    this.streamBus = streamBus;
    this.metrics = metrics;
    this.securityHeaders = new SecurityHeaders();
    
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupCaching();
  }
  
  private setupMiddleware(): void {
    // Security headers
    this.app.use(this.securityHeaders.apply.bind(this.securityHeaders));
    
    // CORS
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', this.config.corsOrigins.join(', '));
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, If-None-Match');
      next();
    });
    
    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
        
        if (this.config.enableMetrics) {
          this.metrics.recordAPIRequest({
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            userAgent: req.headers['user-agent'] || 'unknown'
          });
        }
      });
      
      next();
    });
    
    // Body parsing
    this.app.use(express.json({ limit: '1mb' }));
  }
  
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', this.healthCheck.bind(this));
    
    // Weather endpoints
    this.app.get('/api/v1/weather/current/:region', this.getCurrentWeather.bind(this));
    this.app.get('/api/v1/weather/forecast/:region', this.getWeatherForecast.bind(this));
    this.app.get('/api/v1/weather/history/:region', this.getWeatherHistory.bind(this));
    
    // Space weather endpoints
    this.app.get('/api/v1/space/alerts', this.getSpaceAlerts.bind(this));
    this.app.get('/api/v1/space/alerts/:category', this.getSpaceAlertsByCategory.bind(this));
    this.app.get('/api/v1/space/current', this.getCurrentSpaceWeather.bind(this));
    
    // Quality endpoints
    this.app.get('/api/v1/quality/weather/:region', this.getWeatherQuality.bind(this));
    this.app.get('/api/v1/quality/space/:category', this.getSpaceQuality.bind(this));
    
    // Metrics endpoint
    if (this.config.enableMetrics) {
      this.app.get('/metrics', this.getMetrics.bind(this));
    }
    
    // Error handling
    this.app.use(this.errorHandler.bind(this));
  }
  
  private setupCaching(): void {
    if (!this.config.enableCaching) return;
    
    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl * 1000) {
          this.cache.delete(key);
        }
      }
    }, 300000);
  }
  
  private async healthCheck(req: Request, res: Response): Promise<void> {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      streamBus: this.streamBus.isHealthy(),
      cache: {
        enabled: this.config.enableCaching,
        entries: this.cache.size
      }
    };
    
    res.json(health);
  }
  
  private async getCurrentWeather(req: Request, res: Response): Promise<void> {
    try {
      const { region } = req.params;
      const { lat, lon, radius } = req.query;
      
      const cacheKey = `weather_current_${region}_${lat}_${lon}_${radius}`;
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        res.setHeader('ETag', cached.etag);
        res.setHeader('Cache-Control', `public, max-age=${this.config.cacheTTL}`);
        
        if (req.headers['if-none-match'] === cached.etag) {
          res.status(304).end();
          return;
        }
        
        res.json(cached.data);
        return;
      }
      
      // Get latest weather data from stream bus
      const history = this.streamBus.getMessageHistory(`weather.nowcast.v1.${region}`, 1);
      
      if (history.length === 0) {
        res.status(404).json({
          error: 'No weather data available',
          code: 'NO_DATA',
          region
        });
        return;
      }
      
      const latestMessage = history[0];
      let weatherData = latestMessage.payload;
      
      // Filter by location if specified
      if (lat && lon && radius) {
        const latNum = parseFloat(lat as string);
        const lonNum = parseFloat(lon as string);
        const radiusNum = parseFloat(radius as string);
        
        weatherData = this.filterByLocation(weatherData, latNum, lonNum, radiusNum);
      }
      
      const etag = this.generateETag(weatherData);
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', `public, max-age=${this.config.cacheTTL}`);
      
      // Cache the result
      this.setCache(cacheKey, weatherData, etag);
      
      res.json(weatherData);
      
    } catch (error) {
      console.error('Error getting current weather:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  
  private async getWeatherForecast(req: Request, res: Response): Promise<void> {
    try {
      const { region } = req.params;
      const { hours = '24' } = req.query;
      
      const cacheKey = `weather_forecast_${region}_${hours}`;
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        res.setHeader('ETag', cached.etag);
        res.setHeader('Cache-Control', `public, max-age=${this.config.cacheTTL}`);
        
        if (req.headers['if-none-match'] === cached.etag) {
          res.status(304).end();
          return;
        }
        
        res.json(cached.data);
        return;
      }
      
      // Get forecast data (this would typically come from a forecast service)
      const forecastData = await this.generateWeatherForecast(region, parseInt(hours as string));
      
      const etag = this.generateETag(forecastData);
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', `public, max-age=${this.config.cacheTTL}`);
      
      // Cache the result
      this.setCache(cacheKey, forecastData, etag);
      
      res.json(forecastData);
      
    } catch (error) {
      console.error('Error getting weather forecast:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  
  private async getWeatherHistory(req: Request, res: Response): Promise<void> {
    try {
      const { region } = req.params;
      const { limit = '100', startTime, endTime } = req.query;
      
      const cacheKey = `weather_history_${region}_${limit}_${startTime}_${endTime}`;
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        res.setHeader('ETag', cached.etag);
        res.setHeader('Cache-Control', `public, max-age=${this.config.cacheTTL}`);
        
        if (req.headers['if-none-match'] === cached.etag) {
          res.status(304).end();
          return;
        }
        
        res.json(cached.data);
        return;
      }
      
      // Get historical data from stream bus
      const history = this.streamBus.getMessageHistory(`weather.nowcast.v1.${region}`, parseInt(limit as string));
      
      // Filter by time range if specified
      let filteredHistory = history;
      if (startTime || endTime) {
        filteredHistory = this.filterByTimeRange(history, startTime as string, endTime as string);
      }
      
      const historyData = {
        region,
        count: filteredHistory.length,
        data: filteredHistory.map(msg => ({
          timestamp: msg.timestamp,
          payload: msg.payload
        }))
      };
      
      const etag = this.generateETag(historyData);
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', `public, max-age=${this.config.cacheTTL}`);
      
      // Cache the result
      this.setCache(cacheKey, historyData, etag);
      
      res.json(historyData);
      
    } catch (error) {
      console.error('Error getting weather history:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  
  private async getSpaceAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { severity, limit = '50' } = req.query;
      
      const cacheKey = `space_alerts_${severity}_${limit}`;
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        res.setHeader('ETag', cached.etag);
        res.setHeader('Cache-Control', `public, max-age=${this.config.cacheTTL}`);
        
        if (req.headers['if-none-match'] === cached.etag) {
          res.status(304).end();
          return;
        }
        
        res.json(cached.data);
        return;
      }
      
      // Get space alerts from all categories
      const categories = ['solar_flare', 'geomagnetic_storm', 'radiation_storm', 'radio_blackout', 'cme', 'solar_wind'];
      const allAlerts: StreamMessage[] = [];
      
      for (const category of categories) {
        const history = this.streamBus.getMessageHistory(`space.alert.v1.${category}`, parseInt(limit as string));
        allAlerts.push(...history);
      }
      
      // Sort by timestamp (newest first)
      allAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Filter by severity if specified
      let filteredAlerts = allAlerts;
      if (severity) {
        filteredAlerts = allAlerts.filter(alert => 
          (alert.payload as any).severity === severity
        );
      }
      
      const alertsData = {
        count: filteredAlerts.length,
        severity: severity || 'all',
        alerts: filteredAlerts.map(msg => ({
          timestamp: msg.timestamp,
          payload: msg.payload
        }))
      };
      
      const etag = this.generateETag(alertsData);
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', `public, max-age=${this.config.cacheTTL}`);
      
      // Cache the result
      this.setCache(cacheKey, alertsData, etag);
      
      res.json(alertsData);
      
    } catch (error) {
      console.error('Error getting space alerts:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  
  private async getSpaceAlertsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      const { limit = '50' } = req.query;
      
      const cacheKey = `space_alerts_${category}_${limit}`;
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        res.setHeader('ETag', cached.etag);
        res.setHeader('Cache-Control', `public, max-age=${this.config.cacheTTL}`);
        
        if (req.headers['if-none-match'] === cached.etag) {
          res.status(304).end();
          return;
        }
        
        res.json(cached.data);
        return;
      }
      
      // Get alerts for specific category
      const history = this.streamBus.getMessageHistory(`space.alert.v1.${category}`, parseInt(limit as string));
      
      const alertsData = {
        category,
        count: history.length,
        alerts: history.map(msg => ({
          timestamp: msg.timestamp,
          payload: msg.payload
        }))
      };
      
      const etag = this.generateETag(alertsData);
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', `public, max-age=${this.config.cacheTTL}`);
      
      // Cache the result
      this.setCache(cacheKey, alertsData, etag);
      
      res.json(alertsData);
      
    } catch (error) {
      console.error('Error getting space alerts by category:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  
  private async getCurrentSpaceWeather(req: Request, res: Response): Promise<void> {
    try {
      const cacheKey = 'space_current';
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        res.setHeader('ETag', cached.etag);
        res.setHeader('Cache-Control', `public, max-age=${this.config.cacheTTL}`);
        
        if (req.headers['if-none-match'] === cached.etag) {
          res.status(304).end();
          return;
        }
        
        res.json(cached.data);
        return;
      }
      
      // Get current space weather data
      const currentSpaceWeather = await this.generateCurrentSpaceWeather();
      
      const etag = this.generateETag(currentSpaceWeather);
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', `public, max-age=${this.config.cacheTTL}`);
      
      // Cache the result
      this.setCache(cacheKey, currentSpaceWeather, etag);
      
      res.json(currentSpaceWeather);
      
    } catch (error) {
      console.error('Error getting current space weather:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  
  private async getWeatherQuality(req: Request, res: Response): Promise<void> {
    try {
      const { region } = req.params;
      
      const cacheKey = `quality_weather_${region}`;
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        res.setHeader('ETag', cached.etag);
        res.setHeader('Cache-Control', `public, max-age=${this.config.cacheTTL}`);
        
        if (req.headers['if-none-match'] === cached.etag) {
          res.status(304).end();
          return;
        }
        
        res.json(cached.data);
        return;
      }
      
      // Get quality data
      const history = this.streamBus.getMessageHistory(`quality.weather.v1.${region}`, 10);
      
      const qualityData = {
        region,
        count: history.length,
        latestQuality: history.length > 0 ? history[0].payload : null,
        qualityHistory: history.map(msg => ({
          timestamp: msg.timestamp,
          payload: msg.payload
        }))
      };
      
      const etag = this.generateETag(qualityData);
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', `public, max-age=${this.config.cacheTTL}`);
      
      // Cache the result
      this.setCache(cacheKey, qualityData, etag);
      
      res.json(qualityData);
      
    } catch (error) {
      console.error('Error getting weather quality:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  
  private async getSpaceQuality(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      
      const cacheKey = `quality_space_${category}`;
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        res.setHeader('ETag', cached.etag);
        res.setHeader('Cache-Control', `public, max-age=${this.config.cacheTTL}`);
        
        if (req.headers['if-none-match'] === cached.etag) {
          res.status(304).end();
          return;
        }
        
        res.json(cached.data);
        return;
      }
      
      // Get quality data
      const history = this.streamBus.getMessageHistory(`quality.space.v1.${category}`, 10);
      
      const qualityData = {
        category,
        count: history.length,
        latestQuality: history.length > 0 ? history[0].payload : null,
        qualityHistory: history.map(msg => ({
          timestamp: msg.timestamp,
          payload: msg.payload
        }))
      };
      
      const etag = this.generateETag(qualityData);
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', `public, max-age=${this.config.cacheTTL}`);
      
      // Cache the result
      this.setCache(cacheKey, qualityData, etag);
      
      res.json(qualityData);
      
    } catch (error) {
      console.error('Error getting space quality:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
  
  private async getMetrics(req: Request, res: Response): Promise<void> {
    const metrics = this.metrics.getMetrics();
    res.json(metrics);
  }
  
  private async errorHandler(err: Error, req: Request, res: Response, next: NextFunction): Promise<void> {
    console.error('API Error:', err);
    
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
  
  // Helper methods
  
  private getFromCache(key: string): CacheEntry | null {
    if (!this.config.enableCaching) return null;
    
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }
    
    return entry;
  }
  
  private setCache(key: string, data: any, etag: string): void {
    if (!this.config.enableCaching) return;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      etag,
      ttl: this.config.cacheTTL
    });
  }
  
  private generateETag(data: any): string {
    const content = JSON.stringify(data);
    const hash = createHash('md5').update(content).digest('hex');
    return `"${hash}"`;
  }
  
  private filterByLocation(weatherData: any, lat: number, lon: number, radius: number): any {
    if (!weatherData.points) return weatherData;
    
    const filteredPoints = weatherData.points.filter((point: any) => {
      const distance = this.calculateDistance(lat, lon, point.lat, point.lon);
      return distance <= radius;
    });
    
    return {
      ...weatherData,
      points: filteredPoints
    };
  }
  
  private filterByTimeRange(history: StreamMessage[], startTime?: string, endTime?: string): StreamMessage[] {
    return history.filter(msg => {
      const msgTime = new Date(msg.timestamp).getTime();
      
      if (startTime && msgTime < new Date(startTime).getTime()) {
        return false;
      }
      
      if (endTime && msgTime > new Date(endTime).getTime()) {
        return false;
      }
      
      return true;
    });
  }
  
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
  
  private async generateWeatherForecast(region: string, hours: number): Promise<any> {
    // This would typically call a forecast service
    // For now, return a mock forecast
    return {
      region,
      forecastHours: hours,
      generatedAt: new Date().toISOString(),
      points: []
    };
  }
  
  private async generateCurrentSpaceWeather(): Promise<any> {
    // This would typically aggregate current space weather data
    // For now, return mock data
    return {
      timestamp: new Date().toISOString(),
      kpIndex: 3,
      dstIndex: -15,
      solarWindSpeed: 400,
      solarWindDensity: 5.2
    };
  }
  
  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = this.app.listen(this.config.port, (err?: Error) => {
        if (err) {
          reject(err);
        } else {
          console.log(`REST API started on port ${this.config.port}`);
          resolve();
        }
      });
      
      server.on('error', reject);
    });
  }
  
  public stop(): Promise<void> {
    return new Promise((resolve) => {
      // Graceful shutdown logic would go here
      resolve();
    });
  }
}
