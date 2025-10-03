/**
 * Ultrasound Localizer – Distanz & Bewegungserkennung
 * Nutzt AudioContext für Emission + Empfang
 * OAMTM Integration mit Audit-Trail und Telemetrie
 */

import { FFT } from 'dsp.js';

interface LocalizerEvent {
  timestamp: string;
  distance?: number; // in cm
  dopplerShift?: number; // Hz
  signalStrength?: number; // 0-1
  frequency?: number; // Hz
  amplitude?: number; // dB
  phase?: number; // radians
  direction?: 'approaching' | 'receding' | 'stationary';
  confidence?: number; // 0-1
  deviceId?: string;
  sessionId?: string;
}

interface TelemetrySignal {
  id: string;
  timestamp: string;
  deviceId: string;
  sessionId: string;
  type: 'distance' | 'movement' | 'signal' | 'error';
  data: {
    distance?: number;
    dopplerShift?: number;
    signalStrength?: number;
    frequency?: number;
    amplitude?: number;
    phase?: number;
    direction?: string;
    confidence?: number;
  };
  metadata: {
    sampleRate: number;
    fftSize: number;
    frequencyBin: number;
    processingTime: number;
  };
}

interface UltrasoundConfig {
  frequency: number; // Hz
  duration: number; // seconds
  sampleRate: number; // Hz
  fftSize: number;
  threshold: number; // signal threshold
  maxDistance: number; // cm
  minDistance: number; // cm
  dopplerThreshold: number; // Hz
  auditEnabled: boolean;
  telemetryEnabled: boolean;
}

export class UltrasoundLocalizer {
  private audioCtx: AudioContext;
  private analyser: AnalyserNode;
  private sourceNode?: MediaStreamAudioSourceNode;
  private fft: FFT;
  private config: UltrasoundConfig;
  private events: LocalizerEvent[] = [];
  private telemetrySignals: TelemetrySignal[] = [];
  private isInitialized = false;
  private isRunning = false;
  private sessionId: string;
  private deviceId: string;
  private lastEvent?: LocalizerEvent;
  private processingStartTime = 0;

  constructor(config?: Partial<UltrasoundConfig>) {
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioCtx.createAnalyser();
    this.config = {
      frequency: 20000,
      duration: 0.2,
      sampleRate: 44100,
      fftSize: 1024,
      threshold: 0.1,
      maxDistance: 1000,
      minDistance: 1,
      dopplerThreshold: 100,
      auditEnabled: true,
      telemetryEnabled: true,
      ...config
    };
    
    this.fft = new FFT(this.config.fftSize, this.config.sampleRate);
    this.sessionId = this.generateSessionId();
    this.deviceId = this.generateDeviceId();
    
    this.setupAnalyser();
  }

  private generateSessionId(): string {
    return `ultrasound_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDeviceId(): string {
    return `device_${navigator.userAgent.slice(0, 10)}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private setupAnalyser(): void {
    this.analyser.fftSize = this.config.fftSize;
    this.analyser.smoothingTimeConstant = 0.8;
    this.analyser.minDecibels = -90;
    this.analyser.maxDecibels = -10;
  }

  async init(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: this.config.sampleRate
        } 
      });
      
      this.sourceNode = this.audioCtx.createMediaStreamSource(stream);
      this.sourceNode.connect(this.analyser);
      
      this.isInitialized = true;
      
      if (this.config.auditEnabled) {
        this.logEvent('init', 'Ultrasound localizer initialized successfully');
      }
      
      console.log('[ultrasound-localizer] Initialized successfully');
    } catch (error) {
      console.error('[ultrasound-localizer] Initialization failed:', error);
      throw error;
    }
  }

  emitTone(freq = this.config.frequency, duration = this.config.duration): void {
    if (!this.isInitialized) {
      console.warn('[ultrasound-localizer] Not initialized');
      return;
    }

    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    
    osc.frequency.value = freq;
    osc.type = 'sine';
    
    gainNode.gain.value = 0.5; // Reduce volume to protect speakers
    
    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    
    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
    
    if (this.config.auditEnabled) {
      this.logEvent('emit', `Emitted tone: ${freq}Hz for ${duration}s`);
    }
  }

  analyze(): LocalizerEvent {
    if (!this.isInitialized) {
      throw new Error('Ultrasound localizer not initialized');
    }

    this.processingStartTime = performance.now();
    
    const buffer = new Float32Array(this.analyser.frequencyBinCount);
    this.analyser.getFloatFrequencyData(buffer);
    
    // Find peak frequency near target frequency
    const targetBin = Math.round((this.config.frequency / this.audioCtx.sampleRate) * this.analyser.fftSize);
    const searchRange = Math.round(this.config.dopplerThreshold / (this.audioCtx.sampleRate / this.analyser.fftSize));
    
    let maxAmplitude = -Infinity;
    let peakIndex = targetBin;
    
    // Search around target frequency
    for (let i = Math.max(0, targetBin - searchRange); i <= Math.min(buffer.length - 1, targetBin + searchRange); i++) {
      if (buffer[i] > maxAmplitude) {
        maxAmplitude = buffer[i];
        peakIndex = i;
      }
    }
    
    const frequency = peakIndex * (this.audioCtx.sampleRate / this.analyser.fftSize);
    const dopplerShift = frequency - this.config.frequency;
    const signalStrength = Math.max(0, (maxAmplitude + 90) / 80); // Normalize to 0-1
    
    // Calculate distance using Time of Flight (simplified)
    const speedOfSound = 34300; // cm/s
    const distance = this.calculateDistance(dopplerShift, signalStrength);
    
    // Determine direction based on doppler shift
    const direction = this.determineDirection(dopplerShift);
    
    // Calculate confidence based on signal strength and consistency
    const confidence = this.calculateConfidence(signalStrength, frequency);
    
    const event: LocalizerEvent = {
      timestamp: new Date().toISOString(),
      distance: distance > 0 ? Math.round(distance) : undefined,
      dopplerShift: Math.round(dopplerShift * 100) / 100,
      signalStrength: Math.round(signalStrength * 1000) / 1000,
      frequency: Math.round(frequency * 100) / 100,
      amplitude: Math.round(maxAmplitude * 100) / 100,
      phase: 0, // TODO: Implement phase calculation
      direction,
      confidence: Math.round(confidence * 1000) / 1000,
      deviceId: this.deviceId,
      sessionId: this.sessionId
    };
    
    // Store event
    this.events.push(event);
    this.lastEvent = event;
    
    // Create telemetry signal
    if (this.config.telemetryEnabled) {
      this.createTelemetrySignal(event);
    }
    
    // Audit logging
    if (this.config.auditEnabled) {
      this.logEvent('analyze', `Analyzed signal: ${event.distance}cm, ${event.dopplerShift}Hz, ${event.signalStrength} strength`);
    }
    
    return event;
  }

  private calculateDistance(dopplerShift: number, signalStrength: number): number {
    if (signalStrength < this.config.threshold) {
      return -1; // No valid signal
    }
    
    // Simplified distance calculation based on signal strength
    // In reality, this would use Time of Flight or phase differences
    const maxDistance = this.config.maxDistance;
    const minDistance = this.config.minDistance;
    
    // Use signal strength as proxy for distance (inverse relationship)
    const normalizedStrength = Math.max(0, Math.min(1, signalStrength));
    const distance = minDistance + (maxDistance - minDistance) * (1 - normalizedStrength);
    
    return distance;
  }

  private determineDirection(dopplerShift: number): 'approaching' | 'receding' | 'stationary' {
    const threshold = this.config.dopplerThreshold;
    
    if (dopplerShift > threshold) {
      return 'approaching';
    } else if (dopplerShift < -threshold) {
      return 'receding';
    } else {
      return 'stationary';
    }
  }

  private calculateConfidence(signalStrength: number, frequency: number): number {
    let confidence = signalStrength;
    
    // Reduce confidence if frequency is far from target
    const frequencyError = Math.abs(frequency - this.config.frequency);
    const maxFrequencyError = this.config.dopplerThreshold * 2;
    const frequencyConfidence = Math.max(0, 1 - (frequencyError / maxFrequencyError));
    
    confidence *= frequencyConfidence;
    
    // Reduce confidence if signal is too weak
    if (signalStrength < this.config.threshold) {
      confidence *= 0.1;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  private createTelemetrySignal(event: LocalizerEvent): void {
    const processingTime = performance.now() - this.processingStartTime;
    
    const signal: TelemetrySignal = {
      id: this.generateSignalId(),
      timestamp: event.timestamp,
      deviceId: event.deviceId!,
      sessionId: event.sessionId!,
      type: 'signal',
      data: {
        distance: event.distance,
        dopplerShift: event.dopplerShift,
        signalStrength: event.signalStrength,
        frequency: event.frequency,
        amplitude: event.amplitude,
        phase: event.phase,
        direction: event.direction,
        confidence: event.confidence
      },
      metadata: {
        sampleRate: this.audioCtx.sampleRate,
        fftSize: this.analyser.fftSize,
        frequencyBin: Math.round((event.frequency! / this.audioCtx.sampleRate) * this.analyser.fftSize),
        processingTime: Math.round(processingTime * 100) / 100
      }
    };
    
    this.telemetrySignals.push(signal);
  }

  private generateSignalId(): string {
    return `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logEvent(type: string, message: string): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      sessionId: this.sessionId,
      deviceId: this.deviceId
    };
    
    console.log(`[ultrasound-localizer] ${type}: ${message}`);
    
    // Store in audit trail
    if (this.config.auditEnabled) {
      this.storeAuditEntry(logEntry);
    }
  }

  private storeAuditEntry(entry: any): void {
    // Store in localStorage for now, could be extended to server
    const auditKey = `ultrasound_audit_${this.sessionId}`;
    const existingAudit = JSON.parse(localStorage.getItem(auditKey) || '[]');
    existingAudit.push(entry);
    localStorage.setItem(auditKey, JSON.stringify(existingAudit));
  }

  startContinuousAnalysis(interval = 100): void {
    if (this.isRunning) {
      console.warn('[ultrasound-localizer] Already running');
      return;
    }
    
    this.isRunning = true;
    
    const analyze = () => {
      if (this.isRunning) {
        try {
          this.analyze();
        } catch (error) {
          console.error('[ultrasound-localizer] Analysis error:', error);
        }
        setTimeout(analyze, interval);
      }
    };
    
    analyze();
    
    if (this.config.auditEnabled) {
      this.logEvent('start', `Started continuous analysis with ${interval}ms interval`);
    }
  }

  stopContinuousAnalysis(): void {
    this.isRunning = false;
    
    if (this.config.auditEnabled) {
      this.logEvent('stop', 'Stopped continuous analysis');
    }
  }

  getEvents(limit?: number): LocalizerEvent[] {
    return limit ? this.events.slice(-limit) : this.events;
  }

  getTelemetrySignals(limit?: number): TelemetrySignal[] {
    return limit ? this.telemetrySignals.slice(-limit) : this.telemetrySignals;
  }

  getLastEvent(): LocalizerEvent | undefined {
    return this.lastEvent;
  }

  getStatus(): any {
    return {
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      sessionId: this.sessionId,
      deviceId: this.deviceId,
      config: this.config,
      eventCount: this.events.length,
      telemetryCount: this.telemetrySignals.length,
      audioContextState: this.audioCtx.state,
      sampleRate: this.audioCtx.sampleRate
    };
  }

  exportData(): any {
    return {
      sessionId: this.sessionId,
      deviceId: this.deviceId,
      config: this.config,
      events: this.events,
      telemetrySignals: this.telemetrySignals,
      status: this.getStatus(),
      exportedAt: new Date().toISOString()
    };
  }

  reset(): void {
    this.events = [];
    this.telemetrySignals = [];
    this.lastEvent = undefined;
    this.isRunning = false;
    
    if (this.config.auditEnabled) {
      this.logEvent('reset', 'Reset ultrasound localizer data');
    }
  }

  destroy(): void {
    this.stopContinuousAnalysis();
    
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
    
    if (this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
    }
    
    if (this.config.auditEnabled) {
      this.logEvent('destroy', 'Destroyed ultrasound localizer');
    }
  }
}

// Export for use in other modules
export { LocalizerEvent, TelemetrySignal, UltrasoundConfig };

// CLI usage
if (typeof window === 'undefined') {
  console.log('📡 Ultrasound Localizer');
  console.log('======================');
  console.log('');
  console.log('This module provides ultrasound-based localization and telemetry.');
  console.log('Use in browser environment with AudioContext support.');
}
