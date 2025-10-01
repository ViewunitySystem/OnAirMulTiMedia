import { createHash } from 'crypto';

// Performance-Optimierung basierend auf Swipe-Patterns
class SwipePerformanceOptimizer {
  constructor() {
    this.swipePatterns = new Map();
    this.performanceMetrics = new Map();
    this.optimizationRules = new Map();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 Minuten
    
    this.initializeOptimizationRules();
  }

  // Optimierungsregeln basierend auf Swipe-Patterns initialisieren
  initializeOptimizationRules() {
    // Swipe-Up: Hohe Qualität, mehr Bandbreite
    this.optimizationRules.set('swipe-up', {
      quality: 'high',
      bandwidth: 'high',
      latency: 'low',
      codec: 'VP9',
      resolution: '1080p',
      framerate: 60,
      audioQuality: 'high',
      features: ['ai_translation', 'recording', 'conference']
    });

    // Swipe-Down: Niedrige Latenz, weniger Bandbreite
    this.optimizationRules.set('swipe-down', {
      quality: 'medium',
      bandwidth: 'low',
      latency: 'ultra-low',
      codec: 'VP8',
      resolution: '720p',
      framerate: 30,
      audioQuality: 'medium',
      features: ['voice', 'im']
    });

    // Swipe-Left: Bandbreite-sparend, mobile-optimiert
    this.optimizationRules.set('swipe-left', {
      quality: 'low',
      bandwidth: 'minimal',
      latency: 'low',
      codec: 'H264',
      resolution: '480p',
      framerate: 15,
      audioQuality: 'low',
      features: ['voice', 'sms']
    });

    // Swipe-Right: Ausgewogen, universell
    this.optimizationRules.set('swipe-right', {
      quality: 'medium',
      bandwidth: 'medium',
      latency: 'low',
      codec: 'VP8',
      resolution: '720p',
      framerate: 30,
      audioQuality: 'medium',
      features: ['voice', 'video', 'im']
    });

    // Hold: Maximale Qualität, alle Features
    this.optimizationRules.set('hold', {
      quality: 'ultra-high',
      bandwidth: 'maximum',
      latency: 'low',
      codec: 'VP9',
      resolution: '4K',
      framerate: 60,
      audioQuality: 'ultra-high',
      features: ['voice', 'video', 'im', 'conference', 'recording', 'ai_translation', 'file_transfer']
    });

    // Tap: Schnell, minimal
    this.optimizationRules.set('tap', {
      quality: 'low',
      bandwidth: 'minimal',
      latency: 'ultra-low',
      codec: 'H264',
      resolution: '360p',
      framerate: 15,
      audioQuality: 'low',
      features: ['voice']
    });
  }

  // Swipe-Pattern analysieren und Performance-Optimierung anwenden
  analyzeSwipePattern(swipeData) {
    const pattern = this.extractPattern(swipeData);
    const optimization = this.getOptimizationForPattern(pattern);
    
    // Performance-Metriken sammeln
    this.recordPerformanceMetrics(pattern, optimization);
    
    // Cache-Strategie basierend auf Pattern
    const cacheStrategy = this.getCacheStrategy(pattern);
    
    return {
      pattern,
      optimization,
      cacheStrategy,
      timestamp: new Date().toISOString()
    };
  }

  // Swipe-Pattern aus Daten extrahieren
  extractPattern(swipeData) {
    const { gesture, intensity, duration, position } = swipeData;
    
    // Pattern-Hash für Wiedererkennung
    const patternHash = createHash('sha256')
      .update(JSON.stringify({ gesture, intensity: Math.round(intensity * 10) / 10, duration: Math.round(duration / 100) * 100 }))
      .digest('hex')
      .substring(0, 8);

    // Pattern-Details
    const pattern = {
      gesture,
      intensity,
      duration,
      position,
      hash: patternHash,
      frequency: this.getPatternFrequency(patternHash),
      lastUsed: new Date().toISOString()
    };

    // Pattern-Historie aktualisieren
    this.updatePatternHistory(pattern);

    return pattern;
  }

  // Optimierung für Pattern abrufen
  getOptimizationForPattern(pattern) {
    const baseOptimization = this.optimizationRules.get(pattern.gesture) || this.optimizationRules.get('tap');
    
    // Intensität-basierte Anpassungen
    const intensityMultiplier = pattern.intensity;
    const durationMultiplier = Math.min(pattern.duration / 1000, 2); // Max 2x für lange Gesten
    
    return {
      ...baseOptimization,
      bandwidth: this.adjustBandwidth(baseOptimization.bandwidth, intensityMultiplier),
      quality: this.adjustQuality(baseOptimization.quality, intensityMultiplier),
      latency: this.adjustLatency(baseOptimization.latency, intensityMultiplier),
      resolution: this.adjustResolution(baseOptimization.resolution, intensityMultiplier),
      framerate: this.adjustFramerate(baseOptimization.framerate, intensityMultiplier),
      features: this.adjustFeatures(baseOptimization.features, intensityMultiplier, durationMultiplier),
      intensity: pattern.intensity,
      duration: pattern.duration
    };
  }

  // Bandbreite basierend auf Intensität anpassen
  adjustBandwidth(baseBandwidth, intensity) {
    const multipliers = {
      'minimal': 0.5,
      'low': 0.7,
      'medium': 1.0,
      'high': 1.5,
      'maximum': 2.0
    };
    
    const multiplier = multipliers[baseBandwidth] || 1.0;
    const adjustedMultiplier = multiplier * (0.5 + intensity * 1.5); // 0.5x bis 2.0x
    
    if (adjustedMultiplier <= 0.7) return 'minimal';
    if (adjustedMultiplier <= 1.0) return 'low';
    if (adjustedMultiplier <= 1.5) return 'medium';
    if (adjustedMultiplier <= 2.0) return 'high';
    return 'maximum';
  }

  // Qualität basierend auf Intensität anpassen
  adjustQuality(baseQuality, intensity) {
    const qualityLevels = ['low', 'medium', 'high', 'ultra-high'];
    const baseIndex = qualityLevels.indexOf(baseQuality);
    const intensityAdjustment = Math.round(intensity * 2); // 0-2 Stufen
    const newIndex = Math.min(baseIndex + intensityAdjustment, qualityLevels.length - 1);
    
    return qualityLevels[newIndex];
  }

  // Latenz basierend auf Intensität anpassen
  adjustLatency(baseLatency, intensity) {
    // Höhere Intensität = niedrigere Latenz (mehr Priorität)
    const latencyLevels = ['ultra-low', 'low', 'medium', 'high'];
    const baseIndex = latencyLevels.indexOf(baseLatency);
    const intensityAdjustment = Math.round(intensity * 2); // 0-2 Stufen
    const newIndex = Math.max(baseIndex - intensityAdjustment, 0);
    
    return latencyLevels[newIndex];
  }

  // Auflösung basierend auf Intensität anpassen
  adjustResolution(baseResolution, intensity) {
    const resolutions = ['360p', '480p', '720p', '1080p', '4K'];
    const baseIndex = resolutions.indexOf(baseResolution);
    const intensityAdjustment = Math.round(intensity * 2); // 0-2 Stufen
    const newIndex = Math.min(baseIndex + intensityAdjustment, resolutions.length - 1);
    
    return resolutions[newIndex];
  }

  // Framerate basierend auf Intensität anpassen
  adjustFramerate(baseFramerate, intensity) {
    const framerates = [15, 30, 60];
    const baseIndex = framerates.indexOf(baseFramerate);
    const intensityAdjustment = Math.round(intensity * 2); // 0-2 Stufen
    const newIndex = Math.min(baseIndex + intensityAdjustment, framerates.length - 1);
    
    return framerates[newIndex];
  }

  // Features basierend auf Intensität und Dauer anpassen
  adjustFeatures(baseFeatures, intensity, durationMultiplier) {
    const allFeatures = ['voice', 'video', 'im', 'conference', 'recording', 'ai_translation', 'file_transfer', 'sms', 'mms'];
    
    // Basis-Features beibehalten
    let adjustedFeatures = [...baseFeatures];
    
    // Intensität-basierte Features hinzufügen
    if (intensity > 0.7) {
      adjustedFeatures.push('ai_translation', 'recording');
    }
    
    if (intensity > 0.5) {
      adjustedFeatures.push('conference', 'file_transfer');
    }
    
    // Dauer-basierte Features hinzufügen
    if (durationMultiplier > 1.5) {
      adjustedFeatures.push('recording', 'ai_translation');
    }
    
    // Duplikate entfernen
    return [...new Set(adjustedFeatures)];
  }

  // Cache-Strategie basierend auf Pattern
  getCacheStrategy(pattern) {
    const strategies = {
      'swipe-up': { ttl: 300000, priority: 'high', compression: 'gzip' }, // 5 Min, hohe Priorität
      'swipe-down': { ttl: 60000, priority: 'medium', compression: 'none' }, // 1 Min, mittlere Priorität
      'swipe-left': { ttl: 30000, priority: 'low', compression: 'brotli' }, // 30 Sek, niedrige Priorität
      'swipe-right': { ttl: 120000, priority: 'medium', compression: 'gzip' }, // 2 Min, mittlere Priorität
      'hold': { ttl: 600000, priority: 'high', compression: 'gzip' }, // 10 Min, hohe Priorität
      'tap': { ttl: 15000, priority: 'low', compression: 'none' } // 15 Sek, niedrige Priorität
    };
    
    return strategies[pattern.gesture] || strategies['tap'];
  }

  // Pattern-Frequenz verfolgen
  getPatternFrequency(patternHash) {
    const pattern = this.swipePatterns.get(patternHash);
    return pattern ? pattern.frequency + 1 : 1;
  }

  // Pattern-Historie aktualisieren
  updatePatternHistory(pattern) {
    const existing = this.swipePatterns.get(pattern.hash);
    if (existing) {
      existing.frequency++;
      existing.lastUsed = pattern.lastUsed;
    } else {
      this.swipePatterns.set(pattern.hash, {
        ...pattern,
        frequency: 1,
        firstUsed: pattern.lastUsed
      });
    }
  }

  // Performance-Metriken aufzeichnen
  recordPerformanceMetrics(pattern, optimization) {
    const metrics = {
      pattern: pattern.hash,
      gesture: pattern.gesture,
      intensity: pattern.intensity,
      duration: pattern.duration,
      optimization: optimization,
      timestamp: new Date().toISOString(),
      performance: {
        bandwidth_usage: this.estimateBandwidthUsage(optimization),
        cpu_usage: this.estimateCPUUsage(optimization),
        memory_usage: this.estimateMemoryUsage(optimization),
        battery_impact: this.estimateBatteryImpact(optimization)
      }
    };

    this.performanceMetrics.set(pattern.hash, metrics);
  }

  // Bandbreiten-Verbrauch schätzen
  estimateBandwidthUsage(optimization) {
    const bandwidthMap = {
      'minimal': 100, // kbps
      'low': 300,
      'medium': 600,
      'high': 1200,
      'maximum': 2400
    };
    
    const resolutionMap = {
      '360p': 1.0,
      '480p': 1.5,
      '720p': 2.0,
      '1080p': 3.0,
      '4K': 6.0
    };
    
    const baseBandwidth = bandwidthMap[optimization.bandwidth] || 600;
    const resolutionMultiplier = resolutionMap[optimization.resolution] || 2.0;
    
    return Math.round(baseBandwidth * resolutionMultiplier);
  }

  // CPU-Verbrauch schätzen
  estimateCPUUsage(optimization) {
    const codecMap = {
      'H264': 1.0,
      'VP8': 1.2,
      'VP9': 1.5
    };
    
    const framerateMultiplier = optimization.framerate / 30; // Basis 30fps
    const codecMultiplier = codecMap[optimization.codec] || 1.0;
    
    return Math.round(50 * codecMultiplier * framerateMultiplier); // Basis 50% CPU
  }

  // Speicher-Verbrauch schätzen
  estimateMemoryUsage(optimization) {
    const resolutionMap = {
      '360p': 50, // MB
      '480p': 75,
      '720p': 100,
      '1080p': 150,
      '4K': 300
    };
    
    const baseMemory = resolutionMap[optimization.resolution] || 100;
    const featureMultiplier = optimization.features.length / 3; // Basis 3 Features
    
    return Math.round(baseMemory * (1 + featureMultiplier));
  }

  // Batterie-Impact schätzen
  estimateBatteryImpact(optimization) {
    const qualityMap = {
      'low': 1.0,
      'medium': 1.5,
      'high': 2.0,
      'ultra-high': 3.0
    };
    
    const baseImpact = qualityMap[optimization.quality] || 1.5;
    const intensityMultiplier = optimization.intensity;
    
    return Math.round(baseImpact * (0.5 + intensityMultiplier) * 100) / 100;
  }

  // Optimierungsempfehlungen generieren
  generateOptimizationRecommendations() {
    const recommendations = [];
    
    // Häufigste Patterns analysieren
    const frequentPatterns = Array.from(this.swipePatterns.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
    
    frequentPatterns.forEach(pattern => {
      const metrics = this.performanceMetrics.get(pattern.hash);
      if (metrics) {
        recommendations.push({
          pattern: pattern.gesture,
          frequency: pattern.frequency,
          optimization: metrics.optimization,
          performance: metrics.performance,
          recommendation: this.generatePatternRecommendation(pattern, metrics)
        });
      }
    });
    
    return recommendations;
  }

  // Pattern-spezifische Empfehlung generieren
  generatePatternRecommendation(pattern, metrics) {
    const { performance } = metrics;
    
    if (performance.bandwidth_usage > 1500) {
      return 'Consider reducing quality for better bandwidth efficiency';
    }
    
    if (performance.cpu_usage > 80) {
      return 'Switch to H264 codec for lower CPU usage';
    }
    
    if (performance.memory_usage > 200) {
      return 'Reduce resolution or disable some features';
    }
    
    if (performance.battery_impact > 2.5) {
      return 'Optimize for battery life by reducing quality';
    }
    
    return 'Performance is optimal for this pattern';
  }

  // Cache-Management
  getCachedOptimization(patternHash) {
    const cached = this.cache.get(patternHash);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.optimization;
    }
    return null;
  }

  setCachedOptimization(patternHash, optimization) {
    this.cache.set(patternHash, {
      optimization,
      timestamp: Date.now()
    });
  }

  // System-Status abrufen
  getSystemStatus() {
    return {
      patternsTracked: this.swipePatterns.size,
      performanceMetrics: this.performanceMetrics.size,
      cacheSize: this.cache.size,
      optimizationRules: this.optimizationRules.size,
      recommendations: this.generateOptimizationRecommendations()
    };
  }

  // Audit-Events für Performance-Tracking
  emitPerformanceAudit(event, metadata = {}) {
    const auditEvent = {
      event: `PERFORMANCE_${event}`,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        optimizer: 'swipe-performance',
        patterns_tracked: this.swipePatterns.size,
        cache_hit_rate: this.calculateCacheHitRate()
      }
    };
    
    console.debug('PERFORMANCE_AUDIT:', JSON.stringify(auditEvent));
    return auditEvent;
  }

  // Cache-Hit-Rate berechnen
  calculateCacheHitRate() {
    const totalRequests = this.performanceMetrics.size;
    const cacheHits = Array.from(this.cache.values()).length;
    return totalRequests > 0 ? Math.round((cacheHits / totalRequests) * 100) : 0;
  }
}

// Singleton Instance
export const swipePerformanceOptimizer = new SwipePerformanceOptimizer();
export default SwipePerformanceOptimizer;

