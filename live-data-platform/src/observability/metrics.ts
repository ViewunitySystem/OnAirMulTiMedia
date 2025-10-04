/**
 * Metrics Collector for Live Data Platform
 * Collects and aggregates system metrics for monitoring and alerting
 */

import { EventEmitter } from 'events';

export interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userAgent?: string;
  clientId?: string;
}

export interface StreamMetrics {
  topic: string;
  messageSize: number;
  timestamp: string;
}

export interface SubscriptionMetrics {
  subscriptionId: string;
  topic: string;
  success: boolean;
  error?: string;
}

export interface QualityMetrics {
  dataType: string;
  region: string;
  score: number;
  checksPassed: number;
  totalChecks: number;
}

export interface SSEMetrics {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userAgent?: string;
}

export interface SSEMessageMetrics {
  connectionId: string;
  topic: string;
  messageSize: number;
}

export interface SystemMetrics {
  timestamp: string;
  memory: NodeJS.MemoryUsage;
  uptime: number;
  cpuUsage: NodeJS.CpuUsage;
  connections: {
    active: number;
    total: number;
  };
  messages: {
    processed: number;
    errors: number;
  };
  quality: {
    averageScore: number;
    checksPassed: number;
    totalChecks: number;
  };
}

export interface SLOMetrics {
  freshness: {
    violations: number;
    totalChecks: number;
    averageAge: number;
  };
  availability: {
    uptime: number;
    downtime: number;
    errorRate: number;
  };
  latency: {
    p50: number;
    p95: number;
    p99: number;
    average: number;
  };
  throughput: {
    requestsPerSecond: number;
    messagesPerSecond: number;
  };
}

export class MetricsCollector extends EventEmitter {
  private requestMetrics: RequestMetrics[] = [];
  private streamMetrics: StreamMetrics[] = [];
  private subscriptionMetrics: SubscriptionMetrics[] = [];
  private qualityMetrics: QualityMetrics[] = [];
  private sseMetrics: SSEMetrics[] = [];
  private sseMessageMetrics: SSEMessageMetrics[] = [];
  private startTime = Date.now();
  private messageCount = 0;
  private errorCount = 0;
  
  // SLO thresholds
  private readonly SLO_THRESHOLDS = {
    FRESHNESS_MAX_AGE: 60000, // 60 seconds
    AVAILABILITY_MIN: 0.999, // 99.9%
    LATENCY_P95_MAX: 300, // 300ms
    ERROR_RATE_MAX: 0.001 // 0.1%
  };
  
  constructor() {
    super();
    this.startPeriodicCleanup();
  }
  
  // Request Metrics
  
  recordRequest(metrics: RequestMetrics): void {
    this.requestMetrics.push({
      ...metrics,
      timestamp: Date.now()
    } as any);
    
    // Emit event for real-time monitoring
    this.emit('request', metrics);
    
    // Check SLO violations
    this.checkLatencySLO(metrics);
    this.checkErrorRateSLO(metrics);
  }
  
  // Stream Metrics
  
  recordStreamMessage(metrics: StreamMetrics): void {
    this.streamMetrics.push({
      ...metrics,
      timestamp: Date.now()
    } as any);
    
    this.messageCount++;
    this.emit('stream', metrics);
  }
  
  recordSubscriptionMessage(metrics: SubscriptionMetrics): void {
    this.subscriptionMetrics.push(metrics);
    
    if (!metrics.success) {
      this.errorCount++;
    }
    
    this.emit('subscription', metrics);
  }
  
  // Quality Metrics
  
  recordQualityCheck(metrics: QualityMetrics): void {
    this.qualityMetrics.push(metrics);
    
    // Check quality SLO
    if (metrics.score < 0.8) {
      this.emit('quality-violation', {
        type: 'low-quality',
        dataType: metrics.dataType,
        region: metrics.region,
        score: metrics.score,
        threshold: 0.8
      });
    }
    
    this.emit('quality', metrics);
  }
  
  // SSE Metrics
  
  recordSSERequest(metrics: SSEMetrics): void {
    this.sseMetrics.push(metrics);
    this.emit('sse-request', metrics);
  }
  
  recordSSEMessage(metrics: SSEMessageMetrics): void {
    this.sseMessageMetrics.push(metrics);
    this.emit('sse-message', metrics);
  }
  
  // System Metrics
  
  getSystemMetrics(): SystemMetrics {
    const now = Date.now();
    const uptime = now - this.startTime;
    
    // Calculate average quality score
    const avgQuality = this.qualityMetrics.length > 0 
      ? this.qualityMetrics.reduce((sum, m) => sum + m.score, 0) / this.qualityMetrics.length
      : 1.0;
    
    const totalChecks = this.qualityMetrics.reduce((sum, m) => sum + m.totalChecks, 0);
    const checksPassed = this.qualityMetrics.reduce((sum, m) => sum + m.checksPassed, 0);
    
    return {
      timestamp: new Date(now).toISOString(),
      memory: process.memoryUsage(),
      uptime,
      cpuUsage: process.cpuUsage(),
      connections: {
        active: this.getActiveConnections(),
        total: this.getTotalConnections()
      },
      messages: {
        processed: this.messageCount,
        errors: this.errorCount
      },
      quality: {
        averageScore: avgQuality,
        checksPassed,
        totalChecks
      }
    };
  }
  
  // SLO Metrics
  
  getSLOMetrics(): SLOMetrics {
    const now = Date.now();
    const timeWindow = 300000; // 5 minutes
    
    // Filter metrics from last 5 minutes
    const recentRequests = this.requestMetrics.filter(m => 
      now - (m as any).timestamp < timeWindow
    );
    
    const recentStreams = this.streamMetrics.filter(m => 
      now - (m as any).timestamp < timeWindow
    );
    
    // Calculate freshness metrics
    const freshnessViolations = this.calculateFreshnessViolations(recentStreams);
    
    // Calculate availability
    const availability = this.calculateAvailability(recentRequests);
    
    // Calculate latency
    const latency = this.calculateLatency(recentRequests);
    
    // Calculate throughput
    const throughput = this.calculateThroughput(recentRequests, recentStreams);
    
    return {
      freshness: {
        violations: freshnessViolations,
        totalChecks: recentStreams.length,
        averageAge: this.calculateAverageAge(recentStreams)
      },
      availability,
      latency,
      throughput
    };
  }
  
  // Health Check
  
  getHealth(): { healthy: boolean; issues: string[] } {
    const issues: string[] = [];
    const sloMetrics = this.getSLOMetrics();
    
    // Check freshness SLO
    if (sloMetrics.freshness.violations > 0) {
      issues.push(`Freshness violations: ${sloMetrics.freshness.violations}`);
    }
    
    // Check availability SLO
    if (sloMetrics.availability.uptime < this.SLO_THRESHOLDS.AVAILABILITY_MIN) {
      issues.push(`Availability below threshold: ${(sloMetrics.availability.uptime * 100).toFixed(2)}%`);
    }
    
    // Check latency SLO
    if (sloMetrics.latency.p95 > this.SLO_THRESHOLDS.LATENCY_P95_MAX) {
      issues.push(`Latency p95 above threshold: ${sloMetrics.latency.p95}ms`);
    }
    
    // Check error rate SLO
    if (sloMetrics.availability.errorRate > this.SLO_THRESHOLDS.ERROR_RATE_MAX) {
      issues.push(`Error rate above threshold: ${(sloMetrics.availability.errorRate * 100).toFixed(3)}%`);
    }
    
    return {
      healthy: issues.length === 0,
      issues
    };
  }
  
  // Get all metrics
  
  getMetrics(): {
    system: SystemMetrics;
    slo: SLOMetrics;
    health: { healthy: boolean; issues: string[] };
    requests: RequestMetrics[];
    streams: StreamMetrics[];
    subscriptions: SubscriptionMetrics[];
    quality: QualityMetrics[];
    sse: SSEMetrics[];
    sseMessages: SSEMessageMetrics[];
  } {
    return {
      system: this.getSystemMetrics(),
      slo: this.getSLOMetrics(),
      health: this.getHealth(),
      requests: this.requestMetrics,
      streams: this.streamMetrics,
      subscriptions: this.subscriptionMetrics,
      quality: this.qualityMetrics,
      sse: this.sseMetrics,
      sseMessages: this.sseMessageMetrics
    };
  }
  
  // Clear old metrics
  
  clearMetrics(): void {
    this.requestMetrics = [];
    this.streamMetrics = [];
    this.subscriptionMetrics = [];
    this.qualityMetrics = [];
    this.sseMetrics = [];
    this.sseMessageMetrics = [];
    this.messageCount = 0;
    this.errorCount = 0;
  }
  
  // Private methods
  
  private startPeriodicCleanup(): void {
    // Clean up old metrics every 5 minutes
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 300000);
  }
  
  private cleanupOldMetrics(): void {
    const now = Date.now();
    const retentionTime = 3600000; // 1 hour
    
    this.requestMetrics = this.requestMetrics.filter(m => 
      now - (m as any).timestamp < retentionTime
    );
    
    this.streamMetrics = this.streamMetrics.filter(m => 
      now - (m as any).timestamp < retentionTime
    );
    
    this.subscriptionMetrics = this.subscriptionMetrics.slice(-1000); // Keep last 1000
    this.qualityMetrics = this.qualityMetrics.slice(-1000);
    this.sseMetrics = this.sseMetrics.slice(-1000);
    this.sseMessageMetrics = this.sseMessageMetrics.slice(-1000);
  }
  
  private checkLatencySLO(metrics: RequestMetrics): void {
    if (metrics.duration > this.SLO_THRESHOLDS.LATENCY_P95_MAX) {
      this.emit('slo-violation', {
        type: 'latency',
        path: metrics.path,
        duration: metrics.duration,
        threshold: this.SLO_THRESHOLDS.LATENCY_P95_MAX
      });
    }
  }
  
  private checkErrorRateSLO(metrics: RequestMetrics): void {
    if (metrics.statusCode >= 500) {
      this.emit('slo-violation', {
        type: 'error-rate',
        path: metrics.path,
        statusCode: metrics.statusCode,
        threshold: 500
      });
    }
  }
  
  private calculateFreshnessViolations(streams: StreamMetrics[]): number {
    return streams.filter(s => {
      const age = Date.now() - new Date(s.timestamp).getTime();
      return age > this.SLO_THRESHOLDS.FRESHNESS_MAX_AGE;
    }).length;
  }
  
  private calculateAvailability(requests: RequestMetrics[]): { uptime: number; downtime: number; errorRate: number } {
    if (requests.length === 0) {
      return { uptime: 1, downtime: 0, errorRate: 0 };
    }
    
    const totalRequests = requests.length;
    const errorRequests = requests.filter(r => r.statusCode >= 500).length;
    const errorRate = errorRequests / totalRequests;
    const uptime = 1 - errorRate;
    
    return {
      uptime,
      downtime: errorRate,
      errorRate
    };
  }
  
  private calculateLatency(requests: RequestMetrics[]): { p50: number; p95: number; p99: number; average: number } {
    if (requests.length === 0) {
      return { p50: 0, p95: 0, p99: 0, average: 0 };
    }
    
    const durations = requests.map(r => r.duration).sort((a, b) => a - b);
    const len = durations.length;
    
    return {
      p50: durations[Math.floor(len * 0.5)],
      p95: durations[Math.floor(len * 0.95)],
      p99: durations[Math.floor(len * 0.99)],
      average: durations.reduce((sum, d) => sum + d, 0) / len
    };
  }
  
  private calculateThroughput(requests: RequestMetrics[], streams: StreamMetrics[]): { requestsPerSecond: number; messagesPerSecond: number } {
    const timeWindow = 300000; // 5 minutes
    const requestsPerSecond = requests.length / (timeWindow / 1000);
    const messagesPerSecond = streams.length / (timeWindow / 1000);
    
    return {
      requestsPerSecond,
      messagesPerSecond
    };
  }
  
  private calculateAverageAge(streams: StreamMetrics[]): number {
    if (streams.length === 0) return 0;
    
    const now = Date.now();
    const totalAge = streams.reduce((sum, s) => {
      const age = now - new Date(s.timestamp).getTime();
      return sum + age;
    }, 0);
    
    return totalAge / streams.length;
  }
  
  private getActiveConnections(): number {
    // This would integrate with actual connection tracking
    return 0;
  }
  
  private getTotalConnections(): number {
    // This would integrate with actual connection tracking
    return 0;
  }
}
