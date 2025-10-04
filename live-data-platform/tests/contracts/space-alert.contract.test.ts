/**
 * Contract Tests for Space Alert API
 * Tests producer-consumer contracts and schema validation
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { describe, it, expect, beforeAll } from '@jest/globals';
import spaceAlertSchema from '../../schemas/space.alert.v1.schema.json';

describe('Space Alert Contract Tests', () => {
  let validate: Ajv.ValidateFunction;
  
  beforeAll(() => {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    validate = ajv.compile(spaceAlertSchema);
  });
  
  describe('Schema Validation', () => {
    it('should accept valid space alert data', () => {
      const validData = {
        provider: 'nasa',
        issuedAt: '2025-10-04T17:30:00Z',
        alertId: 'SF-20251004-A7.2',
        severity: 'warning',
        category: 'solar_flare',
        message: 'X-ray flare detected with potential impact on HF communications',
        details: {
          affectedRegion: 'North America, Europe',
          startTime: '2025-10-04T17:25:00Z',
          endTime: '2025-10-04T18:00:00Z',
          confidence: 0.85,
          impact: {
            satellites: 'minor',
            aviation: 'moderate',
            powerGrids: 'none',
            communications: 'moderate'
          },
          metrics: {
            kpIndex: 6,
            dstIndex: -75,
            flux: 1500,
            xrayClass: 'A7.2'
          }
        },
        signature: {
          alg: 'HS256',
          value: 'space-alert-signature-123',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'nasa-key-1'
        }
      };
      
      const isValid = validate(validData);
      expect(isValid).toBe(true);
      if (!isValid) {
        console.log('Validation errors:', validate.errors);
      }
    });
    
    it('should reject data with missing required fields', () => {
      const invalidData = {
        provider: 'nasa',
        // missing issuedAt
        alertId: 'SF-20251004-A7.2',
        severity: 'warning',
        category: 'solar_flare',
        message: 'Test alert'
      };
      
      const isValid = validate(invalidData);
      expect(isValid).toBe(false);
      expect(validate.errors).toBeDefined();
      expect(validate.errors?.some(err => err.instancePath === '' && err.message?.includes('issuedAt'))).toBe(true);
    });
    
    it('should reject data with invalid severity levels', () => {
      const invalidData = {
        provider: 'nasa',
        issuedAt: '2025-10-04T17:30:00Z',
        alertId: 'SF-20251004-A7.2',
        severity: 'invalid_severity', // Invalid severity
        category: 'solar_flare',
        message: 'Test alert',
        signature: {
          alg: 'HS256',
          value: 'test-signature',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'nasa-key-1'
        }
      };
      
      const isValid = validate(invalidData);
      expect(isValid).toBe(false);
      expect(validate.errors?.some(err => 
        err.instancePath?.includes('severity') && err.message?.includes('enum')
      )).toBe(true);
    });
    
    it('should reject data with invalid alert categories', () => {
      const invalidData = {
        provider: 'nasa',
        issuedAt: '2025-10-04T17:30:00Z',
        alertId: 'SF-20251004-A7.2',
        severity: 'warning',
        category: 'invalid_category', // Invalid category
        message: 'Test alert',
        signature: {
          alg: 'HS256',
          value: 'test-signature',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'nasa-key-1'
        }
      };
      
      const isValid = validate(invalidData);
      expect(isValid).toBe(false);
      expect(validate.errors?.some(err => 
        err.instancePath?.includes('category') && err.message?.includes('enum')
      )).toBe(true);
    });
    
    it('should reject data with invalid alert ID format', () => {
      const invalidData = {
        provider: 'nasa',
        issuedAt: '2025-10-04T17:30:00Z',
        alertId: 'invalid-id-format', // Invalid format
        severity: 'warning',
        category: 'solar_flare',
        message: 'Test alert',
        signature: {
          alg: 'HS256',
          value: 'test-signature',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'nasa-key-1'
        }
      };
      
      const isValid = validate(invalidData);
      expect(isValid).toBe(false);
      expect(validate.errors?.some(err => 
        err.instancePath?.includes('alertId') && err.message?.includes('pattern')
      )).toBe(true);
    });
  });
  
  describe('Producer Contract Tests', () => {
    it('should validate NASA space alert format', () => {
      const nasaAlert = {
        provider: 'nasa',
        issuedAt: '2025-10-04T17:30:00Z',
        alertId: 'GM-20251004-STRONG',
        severity: 'critical',
        category: 'geomagnetic_storm',
        message: 'Strong geomagnetic storm in progress with potential for widespread power grid impacts',
        details: {
          affectedRegion: 'Global',
          startTime: '2025-10-04T17:00:00Z',
          endTime: '2025-10-04T23:00:00Z',
          confidence: 0.95,
          impact: {
            satellites: 'severe',
            aviation: 'severe',
            powerGrids: 'severe',
            communications: 'severe'
          },
          metrics: {
            kpIndex: 8,
            dstIndex: -200,
            flux: 5000
          }
        },
        signature: {
          alg: 'HS256',
          value: 'nasa-critical-alert-signature',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'nasa-key-1'
        }
      };
      
      const isValid = validate(nasaAlert);
      expect(isValid).toBe(true);
    });
    
    it('should validate ESA space alert format', () => {
      const esaAlert = {
        provider: 'esa',
        issuedAt: '2025-10-04T17:30:00Z',
        alertId: 'RB-20251004-MODERATE',
        severity: 'watch',
        category: 'radio_blackout',
        message: 'Moderate radio blackout affecting HF communications over Europe',
        details: {
          affectedRegion: 'Europe',
          startTime: '2025-10-04T17:15:00Z',
          endTime: '2025-10-04T18:30:00Z',
          confidence: 0.75,
          impact: {
            satellites: 'none',
            aviation: 'minor',
            powerGrids: 'none',
            communications: 'moderate'
          },
          metrics: {
            xrayClass: 'M5.4'
          }
        },
        signature: {
          alg: 'ES256',
          value: 'esa-radio-blackout-signature',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'esa-key-1'
        }
      };
      
      const isValid = validate(esaAlert);
      expect(isValid).toBe(true);
    });
  });
  
  describe('Consumer Contract Tests', () => {
    it('should handle consumer requests with minimal required fields', () => {
      const minimalAlert = {
        provider: 'nasa',
        issuedAt: '2025-10-04T17:30:00Z',
        alertId: 'SF-20251004-A2.1',
        severity: 'info',
        category: 'solar_flare',
        message: 'Minor solar flare detected',
        signature: {
          alg: 'HS256',
          value: 'minimal-alert-signature',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'nasa-key-1'
        }
      };
      
      const isValid = validate(minimalAlert);
      expect(isValid).toBe(true);
    });
    
    it('should handle consumer requests with all optional fields', () => {
      const fullAlert = {
        provider: 'nasa',
        issuedAt: '2025-10-04T17:30:00Z',
        alertId: 'CME-20251004-EARTH-DIRECTED',
        severity: 'warning',
        category: 'cme',
        message: 'Earth-directed coronal mass ejection detected with moderate impact potential',
        details: {
          affectedRegion: 'North America, Europe, Asia',
          startTime: '2025-10-04T17:00:00Z',
          endTime: '2025-10-05T12:00:00Z',
          confidence: 0.88,
          impact: {
            satellites: 'moderate',
            aviation: 'moderate',
            powerGrids: 'minor',
            communications: 'moderate'
          },
          metrics: {
            kpIndex: 7,
            dstIndex: -150,
            flux: 3000
          }
        },
        signature: {
          alg: 'EdDSA',
          value: 'full-cme-alert-signature',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'nasa-key-2'
        }
      };
      
      const isValid = validate(fullAlert);
      expect(isValid).toBe(true);
    });
  });
  
  describe('Impact Assessment Validation', () => {
    it('should validate all impact levels correctly', () => {
      const impactLevels = ['none', 'minor', 'moderate', 'severe'];
      
      for (const level of impactLevels) {
        const alert = {
          provider: 'nasa',
          issuedAt: '2025-10-04T17:30:00Z',
          alertId: `TEST-20251004-${level.toUpperCase()}`,
          severity: 'warning',
          category: 'solar_flare',
          message: `Test alert with ${level} impact`,
          details: {
            confidence: 0.8,
            impact: {
              satellites: level,
              aviation: level,
              powerGrids: level,
              communications: level
            }
          },
          signature: {
            alg: 'HS256',
            value: `test-signature-${level}`,
            timestamp: '2025-10-04T17:30:00Z',
            keyId: 'nasa-key-1'
          }
        };
        
        const isValid = validate(alert);
        expect(isValid).toBe(true);
      }
    });
    
    it('should reject invalid impact levels', () => {
      const invalidAlert = {
        provider: 'nasa',
        issuedAt: '2025-10-04T17:30:00Z',
        alertId: 'TEST-20251004-INVALID',
        severity: 'warning',
        category: 'solar_flare',
        message: 'Test alert with invalid impact',
        details: {
          confidence: 0.8,
          impact: {
            satellites: 'invalid_level', // Invalid impact level
            aviation: 'minor',
            powerGrids: 'moderate',
            communications: 'severe'
          }
        },
        signature: {
          alg: 'HS256',
          value: 'test-signature-invalid',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'nasa-key-1'
        }
      };
      
      const isValid = validate(invalidAlert);
      expect(isValid).toBe(false);
      expect(validate.errors?.some(err => 
        err.instancePath?.includes('satellites') && err.message?.includes('enum')
      )).toBe(true);
    });
  });
  
  describe('Metrics Validation', () => {
    it('should validate Kp index within valid range', () => {
      const validKpAlert = {
        provider: 'nasa',
        issuedAt: '2025-10-04T17:30:00Z',
        alertId: 'GM-20251004-KP-VALID',
        severity: 'warning',
        category: 'geomagnetic_storm',
        message: 'Geomagnetic storm with valid Kp index',
        details: {
          confidence: 0.8,
          impact: {
            satellites: 'moderate',
            aviation: 'moderate',
            powerGrids: 'minor',
            communications: 'moderate'
          },
          metrics: {
            kpIndex: 5 // Valid Kp index (0-9)
          }
        },
        signature: {
          alg: 'HS256',
          value: 'valid-kp-signature',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'nasa-key-1'
        }
      };
      
      const isValid = validate(validKpAlert);
      expect(isValid).toBe(true);
    });
    
    it('should reject invalid Kp index', () => {
      const invalidKpAlert = {
        provider: 'nasa',
        issuedAt: '2025-10-04T17:30:00Z',
        alertId: 'GM-20251004-KP-INVALID',
        severity: 'warning',
        category: 'geomagnetic_storm',
        message: 'Geomagnetic storm with invalid Kp index',
        details: {
          confidence: 0.8,
          impact: {
            satellites: 'moderate',
            aviation: 'moderate',
            powerGrids: 'minor',
            communications: 'moderate'
          },
          metrics: {
            kpIndex: 10 // Invalid Kp index (> 9)
          }
        },
        signature: {
          alg: 'HS256',
          value: 'invalid-kp-signature',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'nasa-key-1'
        }
      };
      
      const isValid = validate(invalidKpAlert);
      expect(isValid).toBe(false);
      expect(validate.errors?.some(err => 
        err.instancePath?.includes('kpIndex') && err.message?.includes('maximum')
      )).toBe(true);
    });
    
    it('should validate X-ray class format', () => {
      const validXrayAlert = {
        provider: 'nasa',
        issuedAt: '2025-10-04T17:30:00Z',
        alertId: 'SF-20251004-XRAY-VALID',
        severity: 'warning',
        category: 'solar_flare',
        message: 'Solar flare with valid X-ray class',
        details: {
          confidence: 0.8,
          impact: {
            satellites: 'minor',
            aviation: 'minor',
            powerGrids: 'none',
            communications: 'minor'
          },
          metrics: {
            xrayClass: 'M3.7' // Valid X-ray class format
          }
        },
        signature: {
          alg: 'HS256',
          value: 'valid-xray-signature',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'nasa-key-1'
        }
      };
      
      const isValid = validate(validXrayAlert);
      expect(isValid).toBe(true);
    });
    
    it('should reject invalid X-ray class format', () => {
      const invalidXrayAlert = {
        provider: 'nasa',
        issuedAt: '2025-10-04T17:30:00Z',
        alertId: 'SF-20251004-XRAY-INVALID',
        severity: 'warning',
        category: 'solar_flare',
        message: 'Solar flare with invalid X-ray class',
        details: {
          confidence: 0.8,
          impact: {
            satellites: 'minor',
            aviation: 'minor',
            powerGrids: 'none',
            communications: 'minor'
          },
          metrics: {
            xrayClass: 'INVALID3.7' // Invalid X-ray class format
          }
        },
        signature: {
          alg: 'HS256',
          value: 'invalid-xray-signature',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'nasa-key-1'
        }
      };
      
      const isValid = validate(invalidXrayAlert);
      expect(isValid).toBe(false);
      expect(validate.errors?.some(err => 
        err.instancePath?.includes('xrayClass') && err.message?.includes('pattern')
      )).toBe(true);
    });
  });
  
  describe('Confidence Score Validation', () => {
    it('should validate confidence score within valid range', () => {
      const validConfidenceAlert = {
        provider: 'nasa',
        issuedAt: '2025-10-04T17:30:00Z',
        alertId: 'TEST-20251004-CONFIDENCE-VALID',
        severity: 'warning',
        category: 'solar_flare',
        message: 'Alert with valid confidence score',
        details: {
          confidence: 0.75, // Valid confidence (0-1)
          impact: {
            satellites: 'moderate',
            aviation: 'moderate',
            powerGrids: 'minor',
            communications: 'moderate'
          }
        },
        signature: {
          alg: 'HS256',
          value: 'valid-confidence-signature',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'nasa-key-1'
        }
      };
      
      const isValid = validate(validConfidenceAlert);
      expect(isValid).toBe(true);
    });
    
    it('should reject confidence score outside valid range', () => {
      const invalidConfidenceAlert = {
        provider: 'nasa',
        issuedAt: '2025-10-04T17:30:00Z',
        alertId: 'TEST-20251004-CONFIDENCE-INVALID',
        severity: 'warning',
        category: 'solar_flare',
        message: 'Alert with invalid confidence score',
        details: {
          confidence: 1.5, // Invalid confidence (> 1)
          impact: {
            satellites: 'moderate',
            aviation: 'moderate',
            powerGrids: 'minor',
            communications: 'moderate'
          }
        },
        signature: {
          alg: 'HS256',
          value: 'invalid-confidence-signature',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'nasa-key-1'
        }
      };
      
      const isValid = validate(invalidConfidenceAlert);
      expect(isValid).toBe(false);
      expect(validate.errors?.some(err => 
        err.instancePath?.includes('confidence') && err.message?.includes('maximum')
      )).toBe(true);
    });
  });
});
