/**
 * Server-Sent Events (SSE) Streams for Live Data Platform
 * Provides real-time data streaming to clients
 */

import express, { Request, Response, NextFunction } from 'express';
import { StreamBus, StreamMessage } from '../stream/bus';
import { MetricsCollector } from '../observability/metrics';
import { SecurityHeaders } from '../security/headers';

interface SSEConfig {
  port: number;
  enableMetrics: boolean;
  corsOrigins: string[];
  heartbeatInterval: number; // milliseconds
  maxConnections: number;
  connectionTimeout: number; // milliseconds
}

interface SSEConnection {
  id: string;
  response: Response;
  topics: string[];
  connectedAt: Date;
  lastHeartbeat: Date;
  messageCount: number;
  clientInfo: {
    userAgent?: string;
    ip?: string;
  };
}

export class SSEStreams {
  private app: express.Application;
  private config: SSEConfig;
  private streamBus: StreamBus;
  private metrics: MetricsCollector;
  private securityHeaders: SecurityHeaders;
  private connections = new Map<string, SSEConnection>();
  private subscriptionIds = new Map<string, string>(); // connectionId -> subscriptionId
  
  constructor(config: SSEConfig, streamBus: StreamBus, metrics: MetricsCollector) {
    this.config = config;
    this.streamBus = streamBus;
    this.metrics = metrics;
    this.securityHeaders = new SecurityHeaders();
    
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupHeartbeat();
    this.setupCleanup();
  }
  
  private setupMiddleware(): void {
    // Security headers
    this.app.use(this.securityHeaders.apply.bind(this.securityHeaders));
    
    // CORS
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', this.config.corsOrigins.join(', '));
      res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Cache-Control');
      next();
    });
    
    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`SSE ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
        
        if (this.config.enableMetrics) {
          this.metrics.recordSSERequest({
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
  }
  
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', this.healthCheck.bind(this));
    
    // Weather streams
    this.app.get('/stream/weather/nowcast/:region', this.streamWeatherNowcast.bind(this));
    this.app.get('/stream/weather/forecast/:region', this.streamWeatherForecast.bind(this));
    
    // Space weather streams
    this.app.get('/stream/space/alerts', this.streamSpaceAlerts.bind(this));
    this.app.get('/stream/space/alerts/:category', this.streamSpaceAlertsByCategory.bind(this));
    
    // Quality streams
    this.app.get('/stream/quality/weather/:region', this.streamWeatherQuality.bind(this));
    this.app.get('/stream/quality/space/:category', this.streamSpaceQuality.bind(this));
    
    // Combined streams
    this.app.get('/stream/all/:region', this.streamAllData.bind(this));
    
    // Connection management
    this.app.get('/stream/connections', this.getConnections.bind(this));
    this.app.delete('/stream/connections/:id', this.closeConnection.bind(this));
    
    // Error handling
    this.app.use(this.errorHandler.bind(this));
  }
  
  private setupHeartbeat(): void {
    // Send heartbeat to all connections every 30 seconds
    setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);
  }
  
  private setupCleanup(): void {
    // Clean up stale connections every minute
    setInterval(() => {
      this.cleanupStaleConnections();
    }, 60000);
  }
  
  private async healthCheck(req: Request, res: Response): Promise<void> {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      connections: {
        active: this.connections.size,
        max: this.config.maxConnections
      },
      streamBus: this.streamBus.isHealthy()
    };
    
    res.json(health);
  }
  
  private async streamWeatherNowcast(req: Request, res: Response): Promise<void> {
    const { region } = req.params;
    const topics = [`weather.nowcast.v1.${region}`];
    
    await this.setupSSEConnection(req, res, topics);
  }
  
  private async streamWeatherForecast(req: Request, res: Response): Promise<void> {
    const { region } = req.params;
    const topics = [`weather.forecast.v1.${region}`];
    
    await this.setupSSEConnection(req, res, topics);
  }
  
  private async streamSpaceAlerts(req: Request, res: Response): Promise<void> {
    const topics = [
      'space.alert.v1.solar_flare',
      'space.alert.v1.geomagnetic_storm',
      'space.alert.v1.radiation_storm',
      'space.alert.v1.radio_blackout',
      'space.alert.v1.cme',
      'space.alert.v1.solar_wind'
    ];
    
    await this.setupSSEConnection(req, res, topics);
  }
  
  private async streamSpaceAlertsByCategory(req: Request, res: Response): Promise<void> {
    const { category } = req.params;
    const topics = [`space.alert.v1.${category}`];
    
    await this.setupSSEConnection(req, res, topics);
  }
  
  private async streamWeatherQuality(req: Request, res: Response): Promise<void> {
    const { region } = req.params;
    const topics = [`quality.weather.v1.${region}`];
    
    await this.setupSSEConnection(req, res, topics);
  }
  
  private async streamSpaceQuality(req: Request, res: Response): Promise<void> {
    const { category } = req.params;
    const topics = [`quality.space.v1.${category}`];
    
    await this.setupSSEConnection(req, res, topics);
  }
  
  private async streamAllData(req: Request, res: Response): Promise<void> {
    const { region } = req.params;
    const topics = [
      `weather.nowcast.v1.${region}`,
      `quality.weather.v1.${region}`,
      'space.alert.v1.*'
    ];
    
    await this.setupSSEConnection(req, res, topics);
  }
  
  private async getConnections(req: Request, res: Response): Promise<void> {
    const connections = Array.from(this.connections.values()).map(conn => ({
      id: conn.id,
      topics: conn.topics,
      connectedAt: conn.connectedAt,
      lastHeartbeat: conn.lastHeartbeat,
      messageCount: conn.messageCount,
      clientInfo: conn.clientInfo
    }));
    
    res.json({
      count: connections.length,
      connections
    });
  }
  
  private async closeConnection(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    
    const connection = this.connections.get(id);
    if (!connection) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }
    
    await this.closeConnectionById(id);
    res.json({ success: true });
  }
  
  private async setupSSEConnection(req: Request, res: Response, topics: string[]): Promise<void> {
    // Check connection limit
    if (this.connections.size >= this.config.maxConnections) {
      res.status(503).json({
        error: 'Too many connections',
        code: 'CONNECTION_LIMIT_EXCEEDED'
      });
      return;
    }
    
    const connectionId = this.generateConnectionId();
    const now = new Date();
    
    // Setup SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': this.config.corsOrigins.join(', '),
      'X-Connection-ID': connectionId
    });
    
    // Send initial connection message
    this.sendSSEMessage(res, 'connection', {
      connectionId,
      topics,
      timestamp: now.toISOString()
    });
    
    // Create connection object
    const connection: SSEConnection = {
      id: connectionId,
      response: res,
      topics,
      connectedAt: now,
      lastHeartbeat: now,
      messageCount: 0,
      clientInfo: {
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress
      }
    };
    
    this.connections.set(connectionId, connection);
    
    // Setup stream bus subscriptions
    const subscriptionIds: string[] = [];
    for (const topic of topics) {
      const subscriptionId = this.streamBus.subscribe(topic, async (message: StreamMessage) => {
        await this.handleStreamMessage(connectionId, message);
      });
      subscriptionIds.push(subscriptionId);
    }
    
    this.subscriptionIds.set(connectionId, subscriptionIds.join(','));
    
    // Handle client disconnect
    req.on('close', () => {
      this.closeConnectionById(connectionId);
    });
    
    req.on('error', (err) => {
      console.error(`SSE connection error for ${connectionId}:`, err);
      this.closeConnectionById(connectionId);
    });
    
    console.log(`SSE connection established: ${connectionId} for topics: ${topics.join(', ')}`);
  }
  
  private async handleStreamMessage(connectionId: string, message: StreamMessage): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return; // Connection already closed
    }
    
    try {
      // Check if this message is relevant to this connection
      const isRelevant = connection.topics.some(topic => {
        if (topic.includes('*')) {
          // Wildcard matching
          const regex = new RegExp('^' + topic.replace(/\*/g, '.*') + '$');
          return regex.test(message.topic);
        }
        return topic === message.topic;
      });
      
      if (!isRelevant) {
        return;
      }
      
      // Send message to client
      this.sendSSEMessage(connection.response, 'data', {
        topic: message.topic,
        payload: message.payload,
        timestamp: message.timestamp,
        id: message.id
      });
      
      connection.messageCount++;
      connection.lastHeartbeat = new Date();
      
      if (this.config.enableMetrics) {
        this.metrics.recordSSEMessage({
          connectionId,
          topic: message.topic,
          messageSize: JSON.stringify(message.payload).length
        });
      }
      
    } catch (error) {
      console.error(`Error sending SSE message to ${connectionId}:`, error);
      await this.closeConnectionById(connectionId);
    }
  }
  
  private sendSSEMessage(res: Response, event: string, data: any): void {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    res.write(message);
  }
  
  private sendHeartbeat(): void {
    const now = new Date();
    
    for (const [connectionId, connection] of this.connections) {
      try {
        this.sendSSEMessage(connection.response, 'heartbeat', {
          timestamp: now.toISOString(),
          connectionId
        });
        
        connection.lastHeartbeat = now;
        
      } catch (error) {
        console.error(`Error sending heartbeat to ${connectionId}:`, error);
        this.closeConnectionById(connectionId);
      }
    }
  }
  
  private cleanupStaleConnections(): void {
    const now = new Date();
    const timeout = this.config.connectionTimeout;
    
    for (const [connectionId, connection] of this.connections) {
      const timeSinceLastHeartbeat = now.getTime() - connection.lastHeartbeat.getTime();
      
      if (timeSinceLastHeartbeat > timeout) {
        console.log(`Closing stale SSE connection: ${connectionId}`);
        this.closeConnectionById(connectionId);
      }
    }
  }
  
  private async closeConnectionById(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }
    
    try {
      // Unsubscribe from stream bus
      const subscriptionIds = this.subscriptionIds.get(connectionId);
      if (subscriptionIds) {
        const ids = subscriptionIds.split(',');
        for (const id of ids) {
          this.streamBus.unsubscribe(id);
        }
        this.subscriptionIds.delete(connectionId);
      }
      
      // Send close message
      this.sendSSEMessage(connection.response, 'close', {
        connectionId,
        timestamp: new Date().toISOString()
      });
      
      // Close response
      connection.response.end();
      
      // Remove from connections
      this.connections.delete(connectionId);
      
      console.log(`SSE connection closed: ${connectionId}`);
      
    } catch (error) {
      console.error(`Error closing SSE connection ${connectionId}:`, error);
    }
  }
  
  private generateConnectionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `sse_${timestamp}_${random}`;
  }
  
  private async errorHandler(err: Error, req: Request, res: Response, next: NextFunction): Promise<void> {
    console.error('SSE Error:', err);
    
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = this.app.listen(this.config.port, (err?: Error) => {
        if (err) {
          reject(err);
        } else {
          console.log(`SSE Streams started on port ${this.config.port}`);
          resolve();
        }
      });
      
      server.on('error', reject);
    });
  }
  
  public stop(): Promise<void> {
    return new Promise(async (resolve) => {
      // Close all connections
      const connectionIds = Array.from(this.connections.keys());
      for (const connectionId of connectionIds) {
        await this.closeConnectionById(connectionId);
      }
      
      resolve();
    });
  }
  
  public getStats(): Record<string, unknown> {
    const connections = Array.from(this.connections.values());
    const totalMessages = connections.reduce((sum, conn) => sum + conn.messageCount, 0);
    
    return {
      activeConnections: connections.length,
      maxConnections: this.config.maxConnections,
      totalMessages,
      averageMessagesPerConnection: connections.length > 0 ? totalMessages / connections.length : 0,
      topics: [...new Set(connections.flatMap(conn => conn.topics))]
    };
  }
}
