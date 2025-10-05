// Self-Healing System für OnAirMulTiMedia
// Integriert Cloudflare Worker, WebSocket Recovery und Auto-Recovery

class SelfHealingSystem {
  constructor(config = {}) {
    this.apiBase = config.apiBase || 'https://onair-edge.telcotelekom.workers.dev';
    this.wsBase = config.wsBase || 'wss://onair-edge.telcotelekom.workers.dev/ws';
    this.recoveryLog = [];
    this.isHealthy = true;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.healthCheckInterval = null;
    this.wsConnection = null;
    
    this.init();
  }

  async init() {
    console.log('🔧 Self-Healing System initializing...');
    await this.startHealthMonitoring();
    await this.setupWebSocketRecovery();
    this.log('Self-Healing System initialized');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    this.recoveryLog.push({ timestamp, message, type });
    console.log(`[Self-Healing ${type.toUpperCase()}] ${message}`);
  }

  async startHealthMonitoring() {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // Every 30 seconds
    
    // Initial health check
    await this.performHealthCheck();
  }

  async performHealthCheck() {
    try {
      const response = await fetch(`${this.apiBase}/health`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000)
      });
      
      const data = await response.json();
      
      if (data.ok) {
        this.isHealthy = true;
        this.reconnectAttempts = 0;
        this.updateHealthStatus('healthy');
        this.log('Health check passed');
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      this.isHealthy = false;
      this.updateHealthStatus('unhealthy');
      this.log(`Health check failed: ${error.message}`, 'warn');
      await this.attemptRecovery();
    }
  }

  async attemptRecovery() {
    this.log('Starting recovery attempt...', 'warn');
    
    const endpoints = ['/health', '/status', '/metrics'];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${this.apiBase}${endpoint}`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          this.log(`Recovery successful via ${endpoint}`, 'success');
          this.isHealthy = true;
          this.updateHealthStatus('recovered');
          return true;
        }
      } catch (error) {
        this.log(`Recovery failed via ${endpoint}: ${error.message}`, 'error');
      }
    }
    
    this.log('All recovery attempts failed', 'error');
    return false;
  }

  updateHealthStatus(status) {
    // Update UI elements if they exist
    const statusElements = {
      'worker-status': document.getElementById('worker-status'),
      'ws-status': document.getElementById('ws-status'),
      'recovery-status': document.getElementById('recovery-status'),
      'last-check': document.getElementById('last-check')
    };

    const statusConfig = {
      healthy: { color: '#22c55e', text: 'Online' },
      unhealthy: { color: '#ef4444', text: 'Offline' },
      recovered: { color: '#eab308', text: 'Recovered' }
    };

    const config = statusConfig[status] || statusConfig.unhealthy;

    Object.entries(statusElements).forEach(([id, element]) => {
      if (element) {
        element.style.color = config.color;
        if (id === 'worker-status') element.textContent = config.text;
        if (id === 'last-check') element.textContent = new Date().toLocaleTimeString();
      }
    });
  }

  async setupWebSocketRecovery() {
    try {
      await this.connectWebSocket();
    } catch (error) {
      this.log(`WebSocket initial connection failed: ${error.message}`, 'warn');
      this.scheduleWebSocketReconnect();
    }
  }

  async connectWebSocket(room = 'global') {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${this.wsBase}?room=${encodeURIComponent(room)}`;
        this.wsConnection = new WebSocket(wsUrl);
        
        this.wsConnection.onopen = () => {
          this.log('WebSocket connected', 'success');
          this.reconnectAttempts = 0;
          resolve();
        };
        
        this.wsConnection.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
          } catch (error) {
            this.log(`WebSocket message parse error: ${error.message}`, 'warn');
          }
        };
        
        this.wsConnection.onclose = (event) => {
          this.log(`WebSocket closed: ${event.code} ${event.reason}`, 'warn');
          this.scheduleWebSocketReconnect();
        };
        
        this.wsConnection.onerror = (error) => {
          this.log(`WebSocket error: ${error.message || 'Unknown error'}`, 'error');
          reject(error);
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }

  scheduleWebSocketReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log('Max WebSocket reconnection attempts reached', 'error');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    this.log(`Scheduling WebSocket reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`, 'warn');
    
    setTimeout(async () => {
      try {
        await this.connectWebSocket();
      } catch (error) {
        this.log(`WebSocket reconnect attempt ${this.reconnectAttempts} failed: ${error.message}`, 'error');
        this.scheduleWebSocketReconnect();
      }
    }, delay);
  }

  handleWebSocketMessage(data) {
    // Handle different message types
    switch (data.type) {
      case 'hello':
        this.log('Received WebSocket hello', 'info');
        break;
      case 'status':
        this.log(`Received status update: ${JSON.stringify(data)}`, 'info');
        break;
      case 'error':
        this.log(`WebSocket error message: ${data.message}`, 'error');
        break;
      default:
        this.log(`Unknown WebSocket message type: ${data.type}`, 'warn');
    }
  }

  sendWebSocketMessage(message) {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify(message));
      return true;
    } else {
      this.log('WebSocket not connected, cannot send message', 'warn');
      return false;
    }
  }

  getRecoveryLog() {
    return this.recoveryLog;
  }

  testSelfHealing() {
    this.log('Manual self-healing test initiated', 'info');
    
    // Simulate a failure
    this.isHealthy = false;
    this.updateHealthStatus('unhealthy');
    
    // Attempt recovery after a short delay
    setTimeout(async () => {
      await this.attemptRecovery();
    }, 2000);
  }

  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.wsConnection) {
      this.wsConnection.close();
    }
    
    this.log('Self-Healing System destroyed', 'info');
  }
}

// Export für Module-System
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SelfHealingSystem;
} else if (typeof window !== 'undefined') {
  window.SelfHealingSystem = SelfHealingSystem;
}

// Auto-Initialize wenn im Browser
if (typeof window !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.selfHealingSystem = new SelfHealingSystem();
  });
} else if (typeof window !== 'undefined') {
  window.selfHealingSystem = new SelfHealingSystem();
}
