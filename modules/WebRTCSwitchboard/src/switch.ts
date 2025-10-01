import { createHash } from 'crypto';

export type SwipeContext = {
  gesture: 'swipe-left'|'swipe-right'|'swipe-up'|'swipe-down'|'tap'|'hold';
  intensity: number; // 0-1
  duration: number; // ms
  position: { x: number; y: number };
};

export type PeerRole = 'controller'|'display'|'relay'|'observer';

export type ConnectionConfig = {
  iceServers: RTCIceServer[];
  codecPreferences: string[];
  bandwidth: number;
  latency: number;
  quality: 'high'|'medium'|'low';
};

export type SwitchboardEvent = {
  type: 'PEER_CONNECTED'|'PEER_DISCONNECTED'|'SWIPE_DETECTED'|'ROOM_CREATED'|'ROOM_DESTROYED';
  timestamp: string;
  peerId: string;
  roomId: string;
  role: PeerRole;
  swipe?: SwipeContext;
  metadata?: any;
};

export type SwitchboardResult = {
  success: boolean;
  roomId: string;
  peerId: string;
  role: PeerRole;
  connectionConfig: ConnectionConfig;
  swipe?: SwipeContext;
  performance: {
    latency: number;
    bandwidth: number;
    quality: 'high'|'medium'|'low';
  };
  license: {
    status: 'valid'|'invalid';
    region: string;
  };
};

// WebRTC Switchboard mit Swipe-Technology
export class WebRTCSwitchboard {
  private rooms: Map<string, Set<string>> = new Map();
  private peers: Map<string, PeerRole> = new Map();
  private swipeHistory: SwipeContext[] = [];
  private eventListeners: ((event: SwitchboardEvent) => void)[] = [];

  constructor() {
    this.setupDefaultConfig();
  }

  // Swipe-basierte Peer-Routing
  async route(role: PeerRole, swipe?: SwipeContext): Promise<SwitchboardResult> {
    const startTime = Date.now();
    const peerId = this.generatePeerId();
    const roomId = this.determineRoom(role, swipe);

    try {
      // Swipe-Event verarbeiten
      if (swipe) {
        this.processSwipeEvent(swipe, peerId, roomId);
      }

      // Peer zu Room hinzufügen
      this.addPeerToRoom(peerId, roomId, role);

      // Connection-Config basierend auf Swipe generieren
      const config = this.generateConnectionConfig(role, swipe);

      // Performance-Metriken
      const latency = Date.now() - startTime;
      const bandwidth = this.calculateBandwidth(swipe);
      const quality = this.determineQuality(swipe);

      // Event emittieren
      this.emitEvent({
        type: 'PEER_CONNECTED',
        timestamp: new Date().toISOString(),
        peerId,
        roomId,
        role,
        swipe,
        metadata: { config }
      });

      return {
        success: true,
        roomId,
        peerId,
        role,
        connectionConfig: config,
        swipe,
        performance: {
          latency,
          bandwidth,
          quality
        },
        license: {
          status: 'valid',
          region: 'EU'
        }
      };

    } catch (error) {
      return {
        success: false,
        roomId: 'error',
        peerId,
        role,
        connectionConfig: this.getDefaultConfig(),
        swipe,
        performance: {
          latency: Date.now() - startTime,
          bandwidth: 0,
          quality: 'low'
        },
        license: {
          status: 'invalid',
          region: 'EU'
        }
      };
    }
  }

  // Room basierend auf Swipe-Geste bestimmen
  private determineRoom(role: PeerRole, swipe?: SwipeContext): string {
    if (!swipe) {
      return `room-${role}-${Date.now()}`;
    }

    // Swipe-Geste bestimmt Room-Typ
    switch (swipe.gesture) {
      case 'swipe-left':
        return `room-${role}-left-${Math.floor(swipe.intensity * 10)}`;
      case 'swipe-right':
        return `room-${role}-right-${Math.floor(swipe.intensity * 10)}`;
      case 'swipe-up':
        return `room-${role}-up-${Math.floor(swipe.intensity * 10)}`;
      case 'swipe-down':
        return `room-${role}-down-${Math.floor(swipe.intensity * 10)}`;
      case 'tap':
        return `room-${role}-tap-${Math.floor(swipe.intensity * 5)}`;
      case 'hold':
        return `room-${role}-hold-${Math.floor(swipe.duration / 1000)}`;
      default:
        return `room-${role}-default`;
    }
  }

  // Connection-Config basierend auf Swipe generieren
  private generateConnectionConfig(role: PeerRole, swipe?: SwipeContext): ConnectionConfig {
    const baseConfig = this.getDefaultConfig();

    if (!swipe) {
      return baseConfig;
    }

    // Swipe-Intensität beeinflusst Qualität und Bandbreite
    const intensityMultiplier = swipe.intensity;
    const qualityMultiplier = swipe.gesture === 'hold' ? 1.5 : 1.0;

    return {
      iceServers: baseConfig.iceServers,
      codecPreferences: this.getCodecPreferences(role, swipe),
      bandwidth: Math.floor(baseConfig.bandwidth * intensityMultiplier * qualityMultiplier),
      latency: Math.floor(baseConfig.latency / intensityMultiplier),
      quality: this.determineQuality(swipe)
    };
  }

  // Codec-Präferenzen basierend auf Role und Swipe
  private getCodecPreferences(role: PeerRole, swipe?: SwipeContext): string[] {
    const baseCodecs = ['VP8', 'VP9', 'H264'];

    if (!swipe) {
      return baseCodecs;
    }

    // Swipe-Geste beeinflusst Codec-Auswahl
    switch (swipe.gesture) {
      case 'swipe-up': // Hohe Qualität
        return ['VP9', 'VP8', 'H264'];
      case 'swipe-down': // Niedrige Latenz
        return ['VP8', 'H264', 'VP9'];
      case 'swipe-left': // Bandbreite-sparend
        return ['H264', 'VP8', 'VP9'];
      case 'swipe-right': // Ausgewogen
        return baseCodecs;
      case 'hold': // Maximale Qualität
        return ['VP9', 'VP8'];
      default:
        return baseCodecs;
    }
  }

  // Qualität basierend auf Swipe bestimmen
  private determineQuality(swipe?: SwipeContext): 'high'|'medium'|'low' {
    if (!swipe) return 'medium';

    if (swipe.intensity > 0.7 || swipe.gesture === 'hold') {
      return 'high';
    } else if (swipe.intensity > 0.3) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  // Bandbreite berechnen
  private calculateBandwidth(swipe?: SwipeContext): number {
    const baseBandwidth = 1000; // kbps
    if (!swipe) return baseBandwidth;

    return Math.floor(baseBandwidth * swipe.intensity * 2);
  }

  // Swipe-Event verarbeiten
  private processSwipeEvent(swipe: SwipeContext, peerId: string, roomId: string): void {
    this.swipeHistory.push(swipe);

    // Nur letzte 50 Swipe-Events behalten
    if (this.swipeHistory.length > 50) {
      this.swipeHistory = this.swipeHistory.slice(-50);
    }

    this.emitEvent({
      type: 'SWIPE_DETECTED',
      timestamp: new Date().toISOString(),
      peerId,
      roomId,
      role: 'controller', // Swipe kommt immer vom Controller
      swipe,
      metadata: {
        swipeCount: this.swipeHistory.length,
        averageIntensity: this.calculateAverageIntensity()
      }
    });
  }

  // Durchschnittliche Swipe-Intensität berechnen
  private calculateAverageIntensity(): number {
    if (this.swipeHistory.length === 0) return 0;

    const sum = this.swipeHistory.reduce((acc, swipe) => acc + swipe.intensity, 0);
    return sum / this.swipeHistory.length;
  }

  // Peer zu Room hinzufügen
  private addPeerToRoom(peerId: string, roomId: string, role: PeerRole): void {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
      this.emitEvent({
        type: 'ROOM_CREATED',
        timestamp: new Date().toISOString(),
        peerId: 'system',
        roomId,
        role: 'observer'
      });
    }

    this.rooms.get(roomId)!.add(peerId);
    this.peers.set(peerId, role);
  }

  // Peer von Room entfernen
  async disconnect(peerId: string): Promise<void> {
    const role = this.peers.get(peerId);
    if (!role) return;

    // Peer aus allen Rooms entfernen
    for (const [roomId, peers] of this.rooms.entries()) {
      if (peers.has(peerId)) {
        peers.delete(peerId);
        
        this.emitEvent({
          type: 'PEER_DISCONNECTED',
          timestamp: new Date().toISOString(),
          peerId,
          roomId,
          role
        });

        // Room löschen wenn leer
        if (peers.size === 0) {
          this.rooms.delete(roomId);
          this.emitEvent({
            type: 'ROOM_DESTROYED',
            timestamp: new Date().toISOString(),
            peerId: 'system',
            roomId,
            role: 'observer'
          });
        }
      }
    }

    this.peers.delete(peerId);
  }

  // Event-Listener hinzufügen
  addEventListener(listener: (event: SwitchboardEvent) => void): void {
    this.eventListeners.push(listener);
  }

  // Event emittieren
  private emitEvent(event: SwitchboardEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }

  // Peer-ID generieren
  private generatePeerId(): string {
    return `peer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Default-Config
  private getDefaultConfig(): ConnectionConfig {
    return {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      codecPreferences: ['VP8', 'VP9', 'H264'],
      bandwidth: 1000,
      latency: 50,
      quality: 'medium'
    };
  }

  private setupDefaultConfig(): void {
    // Setup für WebRTC-Konfiguration
  }

  // Statistiken abrufen
  getStats(): any {
    return {
      totalRooms: this.rooms.size,
      totalPeers: this.peers.size,
      swipeHistory: this.swipeHistory.length,
      averageIntensity: this.calculateAverageIntensity(),
      rooms: Array.from(this.rooms.entries()).map(([roomId, peers]) => ({
        roomId,
        peerCount: peers.size,
        peers: Array.from(peers)
      }))
    };
  }
}

// Legacy-Funktion für Rückwärtskompatibilität
export function route(role: PeerRole): SwitchboardResult {
  const switchboard = new WebRTCSwitchboard();
  return switchboard.route(role).then(result => result).catch(() => ({
    success: false,
    roomId: 'error',
    peerId: 'error',
    role,
    connectionConfig: {
      iceServers: [],
      codecPreferences: [],
      bandwidth: 0,
      latency: 0,
      quality: 'low'
    },
    performance: {
      latency: 0,
      bandwidth: 0,
      quality: 'low'
    },
    license: {
      status: 'invalid',
      region: 'EU'
    }
  }));
}

// Swipe-Detection für Touch-Events
export function detectSwipe(event: TouchEvent | MouseEvent): SwipeContext | null {
  if (!('touches' in event) || event.touches.length === 0) return null;
  
  const touch = event.touches[0];
  const rect = (event.target as Element).getBoundingClientRect();
  
  return {
    gesture: 'tap', // Vereinfacht für Demo
    intensity: 0.5,
    duration: 100,
    position: {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }
  };
}
