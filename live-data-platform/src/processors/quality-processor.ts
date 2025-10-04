/**
 * Quality Processor for Live Data Platform
 * Performs data quality checks and validation
 */

import { StreamBus, StreamMessage } from '../stream/bus';
import { MetricsCollector } from '../observability/metrics';

interface QualityCheck {
  name: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  passed: boolean;
  details?: Record<string, unknown>;
}

interface QualityResult {
  overallScore: number; // 0-1
  checks: QualityCheck[];
  timestamp: string;
  dataId: string;
  topic: string;
}

interface QualityConfig {
  enableTemperatureChecks: boolean;
  enablePressureChecks: boolean;
  enableWindChecks: boolean;
  enablePrecipitationChecks: boolean;
  enableSpaceWeatherChecks: boolean;
  temperatureRange: { min: number; max: number };
  pressureRange: { min: number; max: number };
  windSpeedRange: { min: number; max: number };
  precipitationRange: { min: number; max: number };
  maxDataAge: number; // milliseconds
  enableAnomalyDetection: boolean;
  anomalyThreshold: number; // standard deviations
}

export class QualityProcessor {
  private streamBus: StreamBus;
  private metrics: MetricsCollector;
  private config: QualityConfig;
  private subscriptionIds: string[] = [];
  private historicalData = new Map<string, number[]>();
  
  constructor(streamBus: StreamBus, metrics: MetricsCollector, config: QualityConfig) {
    this.streamBus = streamBus;
    this.metrics = metrics;
    this.config = config;
  }
  
  public start(): void {
    // Subscribe to weather data
    if (this.config.enableTemperatureChecks || 
        this.config.enablePressureChecks || 
        this.config.enableWindChecks || 
        this.config.enablePrecipitationChecks) {
      
      const weatherSubId = this.streamBus.subscribe('weather.nowcast.v1.*', 
        this.processWeatherData.bind(this)
      );
      this.subscriptionIds.push(weatherSubId);
    }
    
    // Subscribe to space weather data
    if (this.config.enableSpaceWeatherChecks) {
      const spaceSubId = this.streamBus.subscribe('space.alert.v1.*', 
        this.processSpaceData.bind(this)
      );
      this.subscriptionIds.push(spaceSubId);
    }
    
    console.log('[QualityProcessor] Started with subscriptions:', this.subscriptionIds);
  }
  
  public stop(): void {
    for (const subscriptionId of this.subscriptionIds) {
      this.streamBus.unsubscribe(subscriptionId);
    }
    this.subscriptionIds = [];
    console.log('[QualityProcessor] Stopped');
  }
  
  private async processWeatherData(message: StreamMessage): Promise<void> {
    try {
      const payload = message.payload as any;
      const qualityResult = this.checkWeatherQuality(payload, message);
      
      // Emit quality result
      await this.streamBus.emit(`quality.weather.v1.${payload.region}`, qualityResult);
      
      // Record metrics
      this.metrics.recordQualityCheck({
        dataType: 'weather',
        region: payload.region,
        score: qualityResult.overallScore,
        checksPassed: qualityResult.checks.filter(c => c.passed).length,
        totalChecks: qualityResult.checks.length
      });
      
      // Check for critical issues
      const criticalIssues = qualityResult.checks.filter(c => 
        c.severity === 'critical' && !c.passed
      );
      
      if (criticalIssues.length > 0) {
        console.warn(`[QualityProcessor] Critical quality issues in weather data for ${payload.region}:`, criticalIssues);
        
        // Emit alert
        await this.streamBus.emit('alerts.quality.v1.critical', {
          type: 'quality_issue',
          severity: 'critical',
          dataType: 'weather',
          region: payload.region,
          issues: criticalIssues,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('[QualityProcessor] Error processing weather data:', error);
    }
  }
  
  private async processSpaceData(message: StreamMessage): Promise<void> {
    try {
      const payload = message.payload as any;
      const qualityResult = this.checkSpaceQuality(payload, message);
      
      // Emit quality result
      await this.streamBus.emit(`quality.space.v1.${payload.category}`, qualityResult);
      
      // Record metrics
      this.metrics.recordQualityCheck({
        dataType: 'space',
        region: payload.category,
        score: qualityResult.overallScore,
        checksPassed: qualityResult.checks.filter(c => c.passed).length,
        totalChecks: qualityResult.checks.length
      });
      
    } catch (error) {
      console.error('[QualityProcessor] Error processing space data:', error);
    }
  }
  
  private checkWeatherQuality(payload: any, message: StreamMessage): QualityResult {
    const checks: QualityCheck[] = [];
    
    // Data freshness check
    checks.push(this.checkDataFreshness(payload.issuedAt, message.timestamp));
    
    // Schema validation (already done in gateway, but double-check)
    checks.push(this.checkSchemaCompliance(payload, 'weather'));
    
    // Temperature range check
    if (this.config.enableTemperatureChecks) {
      checks.push(...this.checkTemperatureRanges(payload.points));
    }
    
    // Pressure range check
    if (this.config.enablePressureChecks) {
      checks.push(...this.checkPressureRanges(payload.points));
    }
    
    // Wind speed check
    if (this.config.enableWindChecks) {
      checks.push(...this.checkWindRanges(payload.points));
    }
    
    // Precipitation check
    if (this.config.enablePrecipitationChecks) {
      checks.push(...this.checkPrecipitationRanges(payload.points));
    }
    
    // Anomaly detection
    if (this.config.enableAnomalyDetection) {
      checks.push(...this.detectAnomalies(payload.points, payload.region));
    }
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore(checks);
    
    return {
      overallScore,
      checks,
      timestamp: new Date().toISOString(),
      dataId: message.id,
      topic: message.topic
    };
  }
  
  private checkSpaceQuality(payload: any, message: StreamMessage): QualityResult {
    const checks: QualityCheck[] = [];
    
    // Data freshness check
    checks.push(this.checkDataFreshness(payload.issuedAt, message.timestamp));
    
    // Schema validation
    checks.push(this.checkSchemaCompliance(payload, 'space'));
    
    // Severity validation
    checks.push(this.checkSeverityLevel(payload.severity));
    
    // Confidence score check
    if (payload.details?.confidence !== undefined) {
      checks.push(this.checkConfidenceScore(payload.details.confidence));
    }
    
    // Metric validation
    if (payload.details?.metrics) {
      checks.push(...this.checkSpaceMetrics(payload.details.metrics));
    }
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore(checks);
    
    return {
      overallScore,
      checks,
      timestamp: new Date().toISOString(),
      dataId: message.id,
      topic: message.topic
    };
  }
  
  private checkDataFreshness(issuedAt: string, receivedAt: string): QualityCheck {
    const age = new Date(receivedAt).getTime() - new Date(issuedAt).getTime();
    const isFresh = age <= this.config.maxDataAge;
    
    return {
      name: 'data_freshness',
      description: 'Check if data is fresh enough',
      severity: age > this.config.maxDataAge * 2 ? 'critical' : age > this.config.maxDataAge ? 'error' : 'info',
      passed: isFresh,
      details: { ageMs: age, maxAgeMs: this.config.maxDataAge }
    };
  }
  
  private checkSchemaCompliance(payload: any, type: string): QualityCheck {
    // Basic schema compliance check
    const requiredFields = type === 'weather' 
      ? ['provider', 'issuedAt', 'region', 'points', 'signature']
      : ['provider', 'issuedAt', 'severity', 'message', 'alertId', 'signature'];
    
    const missingFields = requiredFields.filter(field => !(field in payload));
    
    return {
      name: 'schema_compliance',
      description: 'Check if payload contains required fields',
      severity: missingFields.length > 0 ? 'error' : 'info',
      passed: missingFields.length === 0,
      details: { missingFields, requiredFields }
    };
  }
  
  private checkTemperatureRanges(points: any[]): QualityCheck[] {
    const checks: QualityCheck[] = [];
    const invalidTemps = points.filter(p => 
      p.tempC < this.config.temperatureRange.min || 
      p.tempC > this.config.temperatureRange.max
    );
    
    if (invalidTemps.length > 0) {
      checks.push({
        name: 'temperature_range',
        description: 'Check if temperatures are within valid range',
        severity: 'error',
        passed: false,
        details: { 
          invalidCount: invalidTemps.length, 
          totalCount: points.length,
          range: this.config.temperatureRange,
          invalidTemps: invalidTemps.map(p => ({ lat: p.lat, lon: p.lon, tempC: p.tempC }))
        }
      });
    } else {
      checks.push({
        name: 'temperature_range',
        description: 'Check if temperatures are within valid range',
        severity: 'info',
        passed: true,
        details: { validCount: points.length, range: this.config.temperatureRange }
      });
    }
    
    return checks;
  }
  
  private checkPressureRanges(points: any[]): QualityCheck[] {
    const checks: QualityCheck[] = [];
    const invalidPressures = points.filter(p => 
      p.pressure < this.config.pressureRange.min || 
      p.pressure > this.config.pressureRange.max
    );
    
    if (invalidPressures.length > 0) {
      checks.push({
        name: 'pressure_range',
        description: 'Check if pressures are within valid range',
        severity: 'error',
        passed: false,
        details: { 
          invalidCount: invalidPressures.length, 
          totalCount: points.length,
          range: this.config.pressureRange
        }
      });
    } else {
      checks.push({
        name: 'pressure_range',
        description: 'Check if pressures are within valid range',
        severity: 'info',
        passed: true,
        details: { validCount: points.length, range: this.config.pressureRange }
      });
    }
    
    return checks;
  }
  
  private checkWindRanges(points: any[]): QualityCheck[] {
    const checks: QualityCheck[] = [];
    const invalidWinds = points.filter(p => 
      p.windMS < this.config.windSpeedRange.min || 
      p.windMS > this.config.windSpeedRange.max
    );
    
    if (invalidWinds.length > 0) {
      checks.push({
        name: 'wind_speed_range',
        description: 'Check if wind speeds are within valid range',
        severity: 'error',
        passed: false,
        details: { 
          invalidCount: invalidWinds.length, 
          totalCount: points.length,
          range: this.config.windSpeedRange
        }
      });
    } else {
      checks.push({
        name: 'wind_speed_range',
        description: 'Check if wind speeds are within valid range',
        severity: 'info',
        passed: true,
        details: { validCount: points.length, range: this.config.windSpeedRange }
      });
    }
    
    return checks;
  }
  
  private checkPrecipitationRanges(points: any[]): QualityCheck[] {
    const checks: QualityCheck[] = [];
    const invalidPrecip = points.filter(p => 
      p.precipMMph < this.config.precipitationRange.min || 
      p.precipMMph > this.config.precipitationRange.max
    );
    
    if (invalidPrecip.length > 0) {
      checks.push({
        name: 'precipitation_range',
        description: 'Check if precipitation values are within valid range',
        severity: 'error',
        passed: false,
        details: { 
          invalidCount: invalidPrecip.length, 
          totalCount: points.length,
          range: this.config.precipitationRange
        }
      });
    } else {
      checks.push({
        name: 'precipitation_range',
        description: 'Check if precipitation values are within valid range',
        severity: 'info',
        passed: true,
        details: { validCount: points.length, range: this.config.precipitationRange }
      });
    }
    
    return checks;
  }
  
  private detectAnomalies(points: any[], region: string): QualityCheck[] {
    const checks: QualityCheck[] = [];
    
    // Get historical data for this region
    const historicalTemps = this.historicalData.get(`${region}_temp`) || [];
    const historicalPressures = this.historicalData.get(`${region}_pressure`) || [];
    
    // Check temperature anomalies
    if (historicalTemps.length > 10) {
      const currentTemps = points.map(p => p.tempC);
      const avgTemp = historicalTemps.reduce((a, b) => a + b, 0) / historicalTemps.length;
      const tempStdDev = Math.sqrt(historicalTemps.reduce((sq, n) => sq + Math.pow(n - avgTemp, 2), 0) / historicalTemps.length);
      
      const anomalies = currentTemps.filter(temp => 
        Math.abs(temp - avgTemp) > this.config.anomalyThreshold * tempStdDev
      );
      
      if (anomalies.length > 0) {
        checks.push({
          name: 'temperature_anomaly',
          description: 'Detect temperature anomalies using historical data',
          severity: 'warning',
          passed: false,
          details: { 
            anomalyCount: anomalies.length,
            averageTemp: avgTemp,
            standardDeviation: tempStdDev,
            threshold: this.config.anomalyThreshold
          }
        });
      }
      
      // Update historical data
      this.historicalData.set(`${region}_temp`, [...historicalTemps.slice(-100), ...currentTemps]);
    }
    
    return checks;
  }
  
  private checkSeverityLevel(severity: string): QualityCheck {
    const validSeverities = ['info', 'watch', 'warning', 'critical'];
    const isValid = validSeverities.includes(severity);
    
    return {
      name: 'severity_level',
      description: 'Check if severity level is valid',
      severity: isValid ? 'info' : 'error',
      passed: isValid,
      details: { severity, validSeverities }
    };
  }
  
  private checkConfidenceScore(confidence: number): QualityCheck {
    const isValid = confidence >= 0 && confidence <= 1;
    
    return {
      name: 'confidence_score',
      description: 'Check if confidence score is within valid range',
      severity: isValid ? 'info' : 'warning',
      passed: isValid,
      details: { confidence, validRange: [0, 1] }
    };
  }
  
  private checkSpaceMetrics(metrics: any): QualityCheck[] {
    const checks: QualityCheck[] = [];
    
    // Check Kp index
    if (metrics.kpIndex !== undefined) {
      const isValid = metrics.kpIndex >= 0 && metrics.kpIndex <= 9;
      checks.push({
        name: 'kp_index',
        description: 'Check if Kp index is within valid range',
        severity: isValid ? 'info' : 'error',
        passed: isValid,
        details: { kpIndex: metrics.kpIndex, validRange: [0, 9] }
      });
    }
    
    // Check X-ray class
    if (metrics.xrayClass) {
      const isValid = /^[ABCX][0-9]\.[0-9]$/.test(metrics.xrayClass);
      checks.push({
        name: 'xray_class',
        description: 'Check if X-ray class format is valid',
        severity: isValid ? 'info' : 'error',
        passed: isValid,
        details: { xrayClass: metrics.xrayClass, pattern: '^[ABCX][0-9]\\.[0-9]$' }
      });
    }
    
    return checks;
  }
  
  private calculateOverallScore(checks: QualityCheck[]): number {
    if (checks.length === 0) return 1.0;
    
    let totalWeight = 0;
    let weightedScore = 0;
    
    for (const check of checks) {
      const weight = this.getSeverityWeight(check.severity);
      totalWeight += weight;
      weightedScore += (check.passed ? 1 : 0) * weight;
    }
    
    return totalWeight > 0 ? weightedScore / totalWeight : 1.0;
  }
  
  private getSeverityWeight(severity: string): number {
    switch (severity) {
      case 'critical': return 4;
      case 'error': return 3;
      case 'warning': return 2;
      case 'info': return 1;
      default: return 1;
    }
  }
}
