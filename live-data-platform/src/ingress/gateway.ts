/**
 * Ingress Gateway for Live Data Platform
 * Handles authentication, rate limiting, validation, and routing
 */

import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { createHash, createHmac } from 'crypto';
import { StreamBus } from '../stream/bus';
import { MetricsCollector } from '../observability/metrics';
import { SecurityHeaders } from '../security/headers';

// Import schemas
import weatherNowcastSchema from '../../schemas/weather.nowcast.v1.schema.json' assert { type: 'json' };
import spaceAlertSchema from '../../schemas/space.alert.v1.schema.json' assert { type: 'json' };

interface GatewayConfig {
  port: number;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  corsOrigins: string[];
  apiKeys: string[];
  signingKeys: Record<string, string>;
  enableMetrics: boolean;
}

interface AuthenticatedRequest extends Request {
  apiKey?: string;
  clientId?: string;
}

export class IngressGateway {
  private app: express.Application;
  private config: GatewayConfig;
  private ajv: Ajv.Ajv;
  private streamBus: StreamBus;
  private metrics: MetricsCollector;
  private securityHeaders: SecurityHeaders;
  
  // Validators
  private validateWeatherNowcast: Ajv.ValidateFunction;
  private validateSpaceAlert: Ajv.ValidateFunction;
  
  constructor(config: GatewayConfig, streamBus: StreamBus, metrics: MetricsCollector) {
    this.config = config;
    this.streamBus = streamBus;
    this.metrics = metrics;
    this.securityHeaders = new SecurityHeaders();
    
    // Initialize AJV
    this.ajv = new Ajv({ 
      allErrors: true, 
      removeAdditional: true,
      useDefaults: true
    });
    addFormats(this.ajv);
    
    // Compile validators
    this.validateWeatherNowcast = this.ajv.compile(weatherNowcastSchema);
    this.validateSpaceAlert = this.ajv.compile(spaceAlertSchema);
    
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  private setupMiddleware(): void {
    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));
    
    // CORS
    this.app.use(cors({
      origin: this.config.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
    }));
    
    // Body parsing
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        // Store raw body for signature verification
        (req as any).rawBody = buf;
      }
    }));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimitWindowMs,
      max: this.config.rateLimitMax,
      message: {
        error: 'Too many requests',
        retryAfter: Math.ceil(this.config.rateLimitWindowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        const authReq = req as AuthenticatedRequest;
        return authReq.clientId || req.ip;
      }
    });
    this.app.use(limiter);
    
    // Authentication middleware
    this.app.use(this.authenticate.bind(this));
    
    // Request logging
    this.app.use(this.logRequest.bind(this));
  }
  
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', this.healthCheck.bind(this));
    
    // Weather data ingestion
    this.app.post('/ingest/weather/nowcast', this.ingestWeatherNowcast.bind(this));
    
    // Space alert ingestion
    this.app.post('/ingest/space/alert', this.ingestSpaceAlert.bind(this));
    
    // Metrics endpoint
    if (this.config.enableMetrics) {
      this.app.get('/metrics', this.getMetrics.bind(this));
    }
    
    // Error handling
    this.app.use(this.errorHandler.bind(this));
  }
  
  private async authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const apiKey = req.headers['x-api-key'] as string || req.headers['authorization']?.toString().replace('Bearer ', '');
    
    if (!apiKey) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'MISSING_API_KEY'
      });
      return;
    }
    
    if (!this.config.apiKeys.includes(apiKey)) {
      res.status(401).json({
        error: 'Invalid API key',
        code: 'INVALID_API_KEY'
      });
      return;
    }
    
    req.apiKey = apiKey;
    req.clientId = this.generateClientId(apiKey);
    
    next();
  }
  
  private async logRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const authReq = req as AuthenticatedRequest;
      
      console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - Client: ${authReq.clientId}`);
      
      if (this.config.enableMetrics) {
        this.metrics.recordRequest({
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          clientId: authReq.clientId || 'unknown'
        });
      }
    });
    
    next();
  }
  
  private async healthCheck(req: Request, res: Response): Promise<void> {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      streamBus: this.streamBus.isHealthy(),
      metrics: this.config.enableMetrics ? this.metrics.getHealth() : null
    };
    
    res.json(health);
  }
  
  private async ingestWeatherNowcast(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const payload = req.body;
      
      // Validate schema
      if (!this.validateWeatherNowcast(payload)) {
        const errors = this.validateWeatherNowcast.errors?.map(err => ({
          path: err.instancePath,
          message: err.message,
          data: err.data
        }));
        
        res.status(400).json({
          error: 'Schema validation failed',
          code: 'INVALID_SCHEMA',
          details: errors
        });
        return;
      }
      
      // Verify signature
      if (!this.verifySignature(payload, req)) {
        res.status(401).json({
          error: 'Signature verification failed',
          code: 'INVALID_SIGNATURE'
        });
        return;
      }
      
      // Check data freshness
      const dataAge = Date.now() - new Date(payload.issuedAt).getTime();
      if (dataAge > 300000) { // 5 minutes
        res.status(400).json({
          error: 'Data too old',
          code: 'STALE_DATA',
          details: { ageMs: dataAge, maxAgeMs: 300000 }
        });
        return;
      }
      
      // Emit to stream bus
      const topic = `weather.nowcast.v1.${payload.region}`;
      await this.streamBus.emit(topic, payload);
      
      res.json({
        success: true,
        topic,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error ingesting weather nowcast:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INGESTION_ERROR'
      });
    }
  }
  
  private async ingestSpaceAlert(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const payload = req.body;
      
      // Validate schema
      if (!this.validateSpaceAlert(payload)) {
        const errors = this.validateSpaceAlert.errors?.map(err => ({
          path: err.instancePath,
          message: err.message,
          data: err.data
        }));
        
        res.status(400).json({
          error: 'Schema validation failed',
          code: 'INVALID_SCHEMA',
          details: errors
        });
        return;
      }
      
      // Verify signature
      if (!this.verifySignature(payload, req)) {
        res.status(401).json({
          error: 'Signature verification failed',
          code: 'INVALID_SIGNATURE'
        });
        return;
      }
      
      // Emit to stream bus
      const topic = `space.alert.v1.${payload.category}`;
      await this.streamBus.emit(topic, payload);
      
      res.json({
        success: true,
        topic,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error ingesting space alert:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INGESTION_ERROR'
      });
    }
  }
  
  private async getMetrics(req: Request, res: Response): Promise<void> {
    const metrics = this.metrics.getMetrics();
    res.json(metrics);
  }
  
  private verifySignature(payload: any, req: AuthenticatedRequest): boolean {
    if (!payload.signature) {
      return false;
    }
    
    const signature = payload.signature;
    const keyId = signature.keyId;
    const signingKey = this.config.signingKeys[keyId];
    
    if (!signingKey) {
      console.warn(`Unknown signing key ID: ${keyId}`);
      return false;
    }
    
    // Create hash of payload without signature
    const payloadCopy = { ...payload };
    delete payloadCopy.signature;
    const payloadString = JSON.stringify(payloadCopy);
    const hash = createHash('sha256').update(payloadString).digest('hex');
    
    // Verify signature
    const expectedSignature = createHmac('sha256', signingKey).update(hash).digest('base64');
    
    return signature.value === expectedSignature;
  }
  
  private generateClientId(apiKey: string): string {
    const hash = createHash('sha256').update(apiKey).digest('hex');
    return `client_${hash.substring(0, 8)}`;
  }
  
  private async errorHandler(err: Error, req: Request, res: Response, next: NextFunction): Promise<void> {
    console.error('Unhandled error:', err);
    
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
  
  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = this.app.listen(this.config.port, (err?: Error) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Ingress Gateway started on port ${this.config.port}`);
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
