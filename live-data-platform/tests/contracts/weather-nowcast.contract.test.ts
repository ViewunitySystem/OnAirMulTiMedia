/**
 * Contract Tests for Weather Nowcast API
 * Tests producer-consumer contracts and schema validation
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { describe, it, expect, beforeAll } from '@jest/globals';
import weatherNowcastSchema from '../../schemas/weather.nowcast.v1.schema.json';

describe('Weather Nowcast Contract Tests', () => {
  let validate: Ajv.ValidateFunction;
  
  beforeAll(() => {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    validate = ajv.compile(weatherNowcastSchema);
  });
  
  describe('Schema Validation', () => {
    it('should accept valid weather nowcast data', () => {
      const validData = {
        provider: 'dwd',
        issuedAt: '2025-10-04T17:30:00Z',
        region: 'eu-central',
        unitSystem: 'SI',
        points: [
          {
            lat: 52.5,
            lon: 13.4,
            time: '2025-10-04T17:30:00Z',
            tempC: 18.5,
            windMS: 3.2,
            precipMMph: 0,
            humidity: 65,
            pressure: 1013.25,
            quality: 0.95
          }
        ],
        metadata: {
          resolution: '1km',
          forecastHours: 0,
          source: 'dwd-radar',
          stationCount: 1
        },
        signature: {
          alg: 'HS256',
          value: 'abc123def456',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'dwd-key-1'
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
        provider: 'dwd',
        // missing issuedAt
        region: 'eu-central',
        points: []
      };
      
      const isValid = validate(invalidData);
      expect(isValid).toBe(false);
      expect(validate.errors).toBeDefined();
      expect(validate.errors?.some(err => err.instancePath === '' && err.message?.includes('issuedAt'))).toBe(true);
    });
    
    it('should reject data with invalid temperature values', () => {
      const invalidData = {
        provider: 'dwd',
        issuedAt: '2025-10-04T17:30:00Z',
        region: 'eu-central',
        unitSystem: 'SI',
        points: [
          {
            lat: 52.5,
            lon: 13.4,
            time: '2025-10-04T17:30:00Z',
            tempC: 150, // Invalid temperature (> 70)
            windMS: 3.2,
            precipMMph: 0,
            humidity: 65,
            pressure: 1013.25
          }
        ],
        signature: {
          alg: 'HS256',
          value: 'abc123def456',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'dwd-key-1'
        }
      };
      
      const isValid = validate(invalidData);
      expect(isValid).toBe(false);
      expect(validate.errors?.some(err => 
        err.instancePath?.includes('tempC') && err.message?.includes('maximum')
      )).toBe(true);
    });
    
    it('should reject data with invalid coordinates', () => {
      const invalidData = {
        provider: 'dwd',
        issuedAt: '2025-10-04T17:30:00Z',
        region: 'eu-central',
        unitSystem: 'SI',
        points: [
          {
            lat: 95, // Invalid latitude (> 90)
            lon: 13.4,
            time: '2025-10-04T17:30:00Z',
            tempC: 18.5,
            windMS: 3.2,
            precipMMph: 0,
            humidity: 65,
            pressure: 1013.25
          }
        ],
        signature: {
          alg: 'HS256',
          value: 'abc123def456',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'dwd-key-1'
        }
      };
      
      const isValid = validate(invalidData);
      expect(isValid).toBe(false);
      expect(validate.errors?.some(err => 
        err.instancePath?.includes('lat') && err.message?.includes('maximum')
      )).toBe(true);
    });
    
    it('should reject data with invalid signature format', () => {
      const invalidData = {
        provider: 'dwd',
        issuedAt: '2025-10-04T17:30:00Z',
        region: 'eu-central',
        unitSystem: 'SI',
        points: [
          {
            lat: 52.5,
            lon: 13.4,
            time: '2025-10-04T17:30:00Z',
            tempC: 18.5,
            windMS: 3.2,
            precipMMph: 0,
            humidity: 65,
            pressure: 1013.25
          }
        ],
        signature: {
          alg: 'INVALID', // Invalid algorithm
          value: 'abc123def456',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'dwd-key-1'
        }
      };
      
      const isValid = validate(invalidData);
      expect(isValid).toBe(false);
      expect(validate.errors?.some(err => 
        err.instancePath?.includes('alg') && err.message?.includes('enum')
      )).toBe(true);
    });
  });
  
  describe('Producer Contract Tests', () => {
    it('should validate DWD weather data format', () => {
      const dwdData = {
        provider: 'dwd',
        issuedAt: '2025-10-04T17:30:00Z',
        region: 'eu-central',
        unitSystem: 'SI',
        points: [
          {
            lat: 50.1,
            lon: 8.6,
            time: '2025-10-04T17:30:00Z',
            tempC: 15.2,
            windMS: 2.8,
            precipMMph: 0,
            humidity: 72,
            pressure: 1015.5,
            quality: 0.98
          },
          {
            lat: 51.2,
            lon: 6.8,
            time: '2025-10-04T17:30:00Z',
            tempC: 16.8,
            windMS: 4.1,
            precipMMph: 0.5,
            humidity: 68,
            pressure: 1012.8,
            quality: 0.92
          }
        ],
        metadata: {
          resolution: '1km',
          forecastHours: 0,
          source: 'dwd-radar',
          stationCount: 2
        },
        signature: {
          alg: 'HS256',
          value: 'def456ghi789',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'dwd-key-1'
        }
      };
      
      const isValid = validate(dwdData);
      expect(isValid).toBe(true);
    });
    
    it('should validate large dataset with many points', () => {
      const points = [];
      for (let i = 0; i < 1000; i++) {
        points.push({
          lat: 50 + (i % 10) * 0.1,
          lon: 8 + (i % 10) * 0.1,
          time: '2025-10-04T17:30:00Z',
          tempC: 15 + Math.random() * 10,
          windMS: Math.random() * 10,
          precipMMph: Math.random() * 5,
          humidity: 60 + Math.random() * 30,
          pressure: 1000 + Math.random() * 50,
          quality: 0.8 + Math.random() * 0.2
        });
      }
      
      const largeData = {
        provider: 'dwd',
        issuedAt: '2025-10-04T17:30:00Z',
        region: 'eu-central',
        unitSystem: 'SI',
        points,
        metadata: {
          resolution: '1km',
          forecastHours: 0,
          source: 'dwd-radar',
          stationCount: 1000
        },
        signature: {
          alg: 'HS256',
          value: 'ghi789jkl012',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'dwd-key-1'
        }
      };
      
      const isValid = validate(largeData);
      expect(isValid).toBe(true);
    });
  });
  
  describe('Consumer Contract Tests', () => {
    it('should handle consumer requests with minimal required fields', () => {
      const minimalData = {
        provider: 'dwd',
        issuedAt: '2025-10-04T17:30:00Z',
        region: 'eu-central',
        points: [
          {
            lat: 52.5,
            lon: 13.4,
            time: '2025-10-04T17:30:00Z',
            tempC: 18.5,
            windMS: 3.2,
            precipMMph: 0,
            humidity: 65,
            pressure: 1013.25
          }
        ],
        signature: {
          alg: 'HS256',
          value: 'abc123def456',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'dwd-key-1'
        }
      };
      
      const isValid = validate(minimalData);
      expect(isValid).toBe(true);
    });
    
    it('should handle consumer requests with all optional fields', () => {
      const fullData = {
        provider: 'dwd',
        issuedAt: '2025-10-04T17:30:00Z',
        region: 'eu-central',
        unitSystem: 'SI',
        points: [
          {
            lat: 52.5,
            lon: 13.4,
            time: '2025-10-04T17:30:00Z',
            tempC: 18.5,
            windMS: 3.2,
            precipMMph: 0,
            humidity: 65,
            pressure: 1013.25,
            quality: 0.95
          }
        ],
        metadata: {
          resolution: '1km',
          forecastHours: 0,
          source: 'dwd-radar',
          stationCount: 1
        },
        signature: {
          alg: 'HS256',
          value: 'abc123def456',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'dwd-key-1'
        }
      };
      
      const isValid = validate(fullData);
      expect(isValid).toBe(true);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle boundary values correctly', () => {
      const boundaryData = {
        provider: 'dwd',
        issuedAt: '2025-10-04T17:30:00Z',
        region: 'eu-central',
        unitSystem: 'SI',
        points: [
          {
            lat: -90, // Minimum latitude
            lon: -180, // Minimum longitude
            time: '2025-10-04T17:30:00Z',
            tempC: -100, // Minimum temperature
            windMS: 0, // Minimum wind speed
            precipMMph: 0, // Minimum precipitation
            humidity: 0, // Minimum humidity
            pressure: 800, // Minimum pressure
            quality: 0 // Minimum quality
          },
          {
            lat: 90, // Maximum latitude
            lon: 180, // Maximum longitude
            time: '2025-10-04T17:30:00Z',
            tempC: 70, // Maximum temperature
            windMS: 150, // Maximum wind speed
            precipMMph: 500, // Maximum precipitation
            humidity: 100, // Maximum humidity
            pressure: 1200, // Maximum pressure
            quality: 1 // Maximum quality
          }
        ],
        signature: {
          alg: 'HS256',
          value: 'abc123def456',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'dwd-key-1'
        }
      };
      
      const isValid = validate(boundaryData);
      expect(isValid).toBe(true);
    });
    
    it('should reject values outside boundaries', () => {
      const invalidBoundaryData = {
        provider: 'dwd',
        issuedAt: '2025-10-04T17:30:00Z',
        region: 'eu-central',
        unitSystem: 'SI',
        points: [
          {
            lat: 91, // Invalid latitude (> 90)
            lon: 181, // Invalid longitude (> 180)
            time: '2025-10-04T17:30:00Z',
            tempC: 71, // Invalid temperature (> 70)
            windMS: 151, // Invalid wind speed (> 150)
            precipMMph: 501, // Invalid precipitation (> 500)
            humidity: 101, // Invalid humidity (> 100)
            pressure: 799, // Invalid pressure (< 800)
            quality: 1.1 // Invalid quality (> 1)
          }
        ],
        signature: {
          alg: 'HS256',
          value: 'abc123def456',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'dwd-key-1'
        }
      };
      
      const isValid = validate(invalidBoundaryData);
      expect(isValid).toBe(false);
      expect(validate.errors?.length).toBeGreaterThan(0);
    });
  });
  
  describe('Performance Tests', () => {
    it('should validate large datasets efficiently', () => {
      const startTime = Date.now();
      
      const largeDataset = {
        provider: 'dwd',
        issuedAt: '2025-10-04T17:30:00Z',
        region: 'eu-central',
        unitSystem: 'SI',
        points: Array.from({ length: 10000 }, (_, i) => ({
          lat: 50 + (i % 100) * 0.01,
          lon: 8 + (i % 100) * 0.01,
          time: '2025-10-04T17:30:00Z',
          tempC: 15 + Math.random() * 10,
          windMS: Math.random() * 10,
          precipMMph: Math.random() * 5,
          humidity: 60 + Math.random() * 30,
          pressure: 1000 + Math.random() * 50,
          quality: 0.8 + Math.random() * 0.2
        })),
        metadata: {
          resolution: '1km',
          forecastHours: 0,
          source: 'dwd-radar',
          stationCount: 10000
        },
        signature: {
          alg: 'HS256',
          value: 'large-dataset-signature',
          timestamp: '2025-10-04T17:30:00Z',
          keyId: 'dwd-key-1'
        }
      };
      
      const isValid = validate(largeDataset);
      const endTime = Date.now();
      const validationTime = endTime - startTime;
      
      expect(isValid).toBe(true);
      expect(validationTime).toBeLessThan(1000); // Should validate in less than 1 second
    });
  });
});
