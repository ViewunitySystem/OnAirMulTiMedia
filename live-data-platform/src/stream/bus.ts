/**
 * Stream Bus for Live Data Platform
 * Handles real-time data streaming and processing
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { MetricsCollector } from '../observability/metrics';

export interface StreamMessage<T = unknown> {
  id: string;
  topic: string;
  payload: T;
  timestamp: string;
  source: string;
  signature?: string;
  metadata?: Record<string, unknown>;
}

export interface StreamSubscription {
  id: string;
  topic: string;
  handler: (message: StreamMessage) => Promise<void>;
  createdAt: Date;
  lastMessageTime?: Date;
  messageCount: number;
  errorCount: number;
}

export interface BusConfig {
  maxSubscriptions: number;
  messageRetentionMs: number;
  enableMetrics: boolean;
  enablePersistence: boolean;
  persistencePath?: string;
}

export class StreamBus extends EventEmitter {
  private subscriptions = new Map<string, StreamSubscription>();
  private messageHistory = new Map<string, StreamMessage[]>();
  private config: BusConfig;
  private metrics: MetricsCollector;
  private isHealthy = true;
  private startTime = Date.now();
  
  constructor(config: BusConfig, metrics: MetricsCollector) {
    super();
    this.config = config;
    this.metrics = metrics;
    
    // Set max listeners to prevent memory leaks
    this.setMaxListeners(this.config.maxSubscriptions);
    
    // Setup cleanup interval
    setInterval(() => this.cleanup(), 60000); // Every minute
  }
  
  /**
   * Emit a message to the stream bus
   */
  public async emit(topic: string, payload: unknown, metadata?: Record<string, unknown>): Promise<void> {
    try {
      const message: StreamMessage = {
        id: this.generateMessageId(topic, payload),
        topic,
        payload,
        timestamp: new Date().toISOString(),
        source: 'ingress-gateway',
        metadata
      };
      
      // Store in history if persistence is enabled
      if (this.config.enablePersistence) {
        this.storeMessage(message);
      }
      
      // Emit to all subscribers of this topic
      await this.distributeMessage(message);
      
      // Record metrics
      if (this.config.enableMetrics) {
        this.metrics.recordStreamMessage({
          topic,
          messageSize: JSON.stringify(payload).length,
          timestamp: message.timestamp
        });
      }
      
      console.log(`[StreamBus] Emitted message to topic '${topic}' (ID: ${message.id})`);
      
    } catch (error) {
      console.error(`[StreamBus] Error emitting message to topic '${topic}':`, error);
      this.isHealthy = false;
      throw error;
    }
  }
  
  /**
   * Subscribe to messages on a topic
   */
  public subscribe(topic: string, handler: (message: StreamMessage) => Promise<void>): string {
    if (this.subscriptions.size >= this.config.maxSubscriptions) {
      throw new Error('Maximum number of subscriptions reached');
    }
    
    const subscriptionId = this.generateSubscriptionId(topic);
    const subscription: StreamSubscription = {
      id: subscriptionId,
      topic,
      handler,
      createdAt: new Date(),
      messageCount: 0,
      errorCount: 0
    };
    
    this.subscriptions.set(subscriptionId, subscription);
    
    // Setup event listener
    this.on(topic, async (message: StreamMessage) => {
      await this.handleMessage(subscription, message);
    });
    
    console.log(`[StreamBus] Subscribed to topic '${topic}' (ID: ${subscriptionId})`);
    
    return subscriptionId;
  }
  
  /**
   * Unsubscribe from a topic
   */
  public unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }
    
    this.removeAllListeners(subscription.topic);
    this.subscriptions.delete(subscriptionId);
    
    console.log(`[StreamBus] Unsubscribed from topic '${subscription.topic}' (ID: ${subscriptionId})`);
    
    return true;
  }
  
  /**
   * Get all active subscriptions
   */
  public getSubscriptions(): StreamSubscription[] {
    return Array.from(this.subscriptions.values());
  }
  
  /**
   * Get subscription by ID
   */
  public getSubscription(subscriptionId: string): StreamSubscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }
  
  /**
   * Get message history for a topic
   */
  public getMessageHistory(topic: string, limit = 100): StreamMessage[] {
    const history = this.messageHistory.get(topic) || [];
    return history.slice(-limit);
  }
  
  /**
   * Check if the bus is healthy
   */
  public isHealthy(): boolean {
    return this.isHealthy;
  }
  
  /**
   * Get bus statistics
   */
  public getStats(): Record<string, unknown> {
    const subscriptions = this.getSubscriptions();
    const totalMessages = subscriptions.reduce((sum, sub) => sum + sub.messageCount, 0);
    const totalErrors = subscriptions.reduce((sum, sub) => sum + sub.errorCount, 0);
    
    return {
      uptime: Date.now() - this.startTime,
      healthy: this.isHealthy,
      subscriptionCount: subscriptions.length,
      totalMessages,
      totalErrors,
      errorRate: totalMessages > 0 ? totalErrors / totalMessages : 0,
      topics: [...new Set(subscriptions.map(sub => sub.topic))]
    };
  }
  
  private async distributeMessage(message: StreamMessage): Promise<void> {
    // Emit to the specific topic
    this.emit(message.topic, message);
    
    // Also emit to wildcard subscribers if any
    const wildcardSubscriptions = this.getSubscriptions().filter(sub => 
      sub.topic.includes('*') && this.matchesWildcard(message.topic, sub.topic)
    );
    
    for (const subscription of wildcardSubscriptions) {
      await this.handleMessage(subscription, message);
    }
  }
  
  private async handleMessage(subscription: StreamSubscription, message: StreamMessage): Promise<void> {
    try {
      await subscription.handler(message);
      subscription.messageCount++;
      subscription.lastMessageTime = new Date();
      
      if (this.config.enableMetrics) {
        this.metrics.recordSubscriptionMessage({
          subscriptionId: subscription.id,
          topic: subscription.topic,
          success: true
        });
      }
      
    } catch (error) {
      subscription.errorCount++;
      console.error(`[StreamBus] Error in subscription '${subscription.id}':`, error);
      
      if (this.config.enableMetrics) {
        this.metrics.recordSubscriptionMessage({
          subscriptionId: subscription.id,
          topic: subscription.topic,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
  
  private storeMessage(message: StreamMessage): void {
    const history = this.messageHistory.get(message.topic) || [];
    history.push(message);
    
    // Keep only recent messages
    const cutoff = Date.now() - this.config.messageRetentionMs;
    const filteredHistory = history.filter(msg => 
      new Date(msg.timestamp).getTime() > cutoff
    );
    
    this.messageHistory.set(message.topic, filteredHistory);
  }
  
  private cleanup(): void {
    const cutoff = Date.now() - this.config.messageRetentionMs;
    
    // Clean up old messages
    for (const [topic, history] of this.messageHistory.entries()) {
      const filteredHistory = history.filter(msg => 
        new Date(msg.timestamp).getTime() > cutoff
      );
      
      if (filteredHistory.length === 0) {
        this.messageHistory.delete(topic);
      } else {
        this.messageHistory.set(topic, filteredHistory);
      }
    }
    
    // Clean up inactive subscriptions
    const inactiveThreshold = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    for (const [id, subscription] of this.subscriptions.entries()) {
      if (subscription.lastMessageTime && 
          subscription.lastMessageTime.getTime() < inactiveThreshold) {
        this.unsubscribe(id);
      }
    }
  }
  
  private generateMessageId(topic: string, payload: unknown): string {
    const content = JSON.stringify({ topic, payload, timestamp: Date.now() });
    const hash = createHash('sha256').update(content).digest('hex');
    return `msg_${hash.substring(0, 16)}`;
  }
  
  private generateSubscriptionId(topic: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `sub_${topic.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}_${random}`;
  }
  
  private matchesWildcard(topic: string, pattern: string): boolean {
    // Simple wildcard matching - could be enhanced for more complex patterns
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(topic);
  }
}
