/**
 * Connector SDK for Live Data Platform
 * Provides standardized interface for data source connectors
 */

export interface Health {
  ok: boolean;
  details?: Record<string, unknown>;
  timestamp: string;
  uptime?: number;
  lastSuccess?: string;
  errorCount?: number;
}

export interface Metrics {
  messagesProcessed: number;
  errors: number;
  lastMessageTime?: string;
  averageLatency?: number;
}

export type EmitFn<T = unknown> = (topic: string, payload: T) => Promise<void>;

export interface ConnectorConfig {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  intervalSec?: number;
  timeoutMs?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
}

export interface Connector<TConfig = Record<string, unknown>> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  
  /**
   * Initialize the connector with configuration
   */
  init(config: TConfig & ConnectorConfig): Promise<void>;
  
  /**
   * Start the connector - begin data collection
   * @param emitter Function to emit data to the stream bus
   */
  start(emitter: EmitFn): Promise<void>;
  
  /**
   * Stop the connector - halt data collection
   */
  stop(): Promise<void>;
  
  /**
   * Check connector health status
   */
  health(): Promise<Health>;
  
  /**
   * Get connector metrics
   */
  metrics(): Promise<Metrics>;
  
  /**
   * Validate configuration
   */
  validateConfig(config: TConfig): Promise<{ valid: boolean; errors?: string[] }>;
}

export interface ConnectorRegistry {
  register(connector: Connector): void;
  unregister(connectorId: string): void;
  get(connectorId: string): Connector | undefined;
  list(): Connector[];
  start(connectorId: string): Promise<void>;
  stop(connectorId: string): Promise<void>;
  health(): Promise<Record<string, Health>>;
}

export class BaseConnector<TConfig = Record<string, unknown>> implements Connector<TConfig> {
  public readonly id: string;
  public readonly name: string;
  public readonly version: string;
  
  protected config?: TConfig & ConnectorConfig;
  protected isRunning = false;
  protected startTime?: Date;
  protected messageCount = 0;
  protected errorCount = 0;
  protected lastMessageTime?: Date;
  protected emitter?: EmitFn;
  
  constructor(id: string, name: string, version: string) {
    this.id = id;
    this.name = name;
    this.version = version;
  }
  
  async init(config: TConfig & ConnectorConfig): Promise<void> {
    this.config = config;
    this.validateConfig(config);
  }
  
  async start(emitter: EmitFn): Promise<void> {
    if (this.isRunning) {
      throw new Error(`Connector ${this.id} is already running`);
    }
    
    this.emitter = emitter;
    this.isRunning = true;
    this.startTime = new Date();
    this.messageCount = 0;
    this.errorCount = 0;
    
    await this.onStart();
  }
  
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    await this.onStop();
  }
  
  async health(): Promise<Health> {
    const now = new Date();
    const uptime = this.startTime ? now.getTime() - this.startTime.getTime() : 0;
    
    return {
      ok: this.isRunning && this.errorCount < 10,
      details: {
        running: this.isRunning,
        uptime,
        messageCount: this.messageCount,
        errorCount: this.errorCount,
        lastMessageTime: this.lastMessageTime?.toISOString()
      },
      timestamp: now.toISOString(),
      uptime,
      lastSuccess: this.lastMessageTime?.toISOString(),
      errorCount: this.errorCount
    };
  }
  
  async metrics(): Promise<Metrics> {
    return {
      messagesProcessed: this.messageCount,
      errors: this.errorCount,
      lastMessageTime: this.lastMessageTime?.toISOString()
    };
  }
  
  async validateConfig(config: TConfig): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];
    
    if (!config) {
      errors.push('Configuration is required');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
  
  /**
   * Emit data to the stream bus
   */
  protected async emit(topic: string, payload: unknown): Promise<void> {
    if (!this.emitter) {
      throw new Error('Connector not started - no emitter available');
    }
    
    try {
      await this.emitter(topic, payload);
      this.messageCount++;
      this.lastMessageTime = new Date();
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }
  
  /**
   * Override in subclasses to implement start logic
   */
  protected async onStart(): Promise<void> {
    // Default implementation - do nothing
  }
  
  /**
   * Override in subclasses to implement stop logic
   */
  protected async onStop(): Promise<void> {
    // Default implementation - do nothing
  }
  
  /**
   * Check if connector is running
   */
  protected get running(): boolean {
    return this.isRunning;
  }
  
  /**
   * Get current configuration
   */
  protected get currentConfig(): (TConfig & ConnectorConfig) | undefined {
    return this.config;
  }
}

export class ConnectorRegistryImpl implements ConnectorRegistry {
  private connectors = new Map<string, Connector>();
  
  register(connector: Connector): void {
    if (this.connectors.has(connector.id)) {
      throw new Error(`Connector with id '${connector.id}' is already registered`);
    }
    this.connectors.set(connector.id, connector);
  }
  
  unregister(connectorId: string): void {
    this.connectors.delete(connectorId);
  }
  
  get(connectorId: string): Connector | undefined {
    return this.connectors.get(connectorId);
  }
  
  list(): Connector[] {
    return Array.from(this.connectors.values());
  }
  
  async start(connectorId: string): Promise<void> {
    const connector = this.connectors.get(connectorId);
    if (!connector) {
      throw new Error(`Connector '${connectorId}' not found`);
    }
    
    // Create emitter function that will be passed to the connector
    const emitter: EmitFn = async (topic: string, payload: unknown) => {
      // This will be connected to the actual stream bus
      console.log(`[${connectorId}] Emitting to topic '${topic}':`, payload);
    };
    
    await connector.start(emitter);
  }
  
  async stop(connectorId: string): Promise<void> {
    const connector = this.connectors.get(connectorId);
    if (!connector) {
      throw new Error(`Connector '${connectorId}' not found`);
    }
    
    await connector.stop();
  }
  
  async health(): Promise<Record<string, Health>> {
    const healthMap: Record<string, Health> = {};
    
    for (const [id, connector] of this.connectors) {
      try {
        healthMap[id] = await connector.health();
      } catch (error) {
        healthMap[id] = {
          ok: false,
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date().toISOString()
        };
      }
    }
    
    return healthMap;
  }
}
