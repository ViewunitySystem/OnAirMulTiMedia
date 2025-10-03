/**
 * RF Validation Engine - Unit Tests
 */

const { RFValidator } = require('../main');

describe('RFValidator', () => {
  let validator;
  
  beforeEach(() => {
    validator = new RFValidator({ jurisdiction: 'DE-BNetzA' });
  });
  
  describe('validate', () => {
    it('should allow valid 2m FM transmission', async () => {
      const result = await validator.validate({
        user: {
          callsign: 'DD5BE',
          license_class: 'E'
        },
        transmission: {
          frequency: 145500000,
          mode: 'FM',
          power: 5,
          bandwidth: 12500
        }
      });
      
      expect(result.allowed).toBe(true);
      expect(result.checks.every(c => c.passed)).toBe(true);
      expect(result.errors).toBeUndefined();
    });
    
    it('should deny transmission on non-amateur frequency', async () => {
      const result = await validator.validate({
        user: {
          callsign: 'DD5BE',
          license_class: 'E'
        },
        transmission: {
          frequency: 100500000,  // FM broadcast, not amateur
          mode: 'FM',
          power: 5,
          bandwidth: 12500
        }
      });
      
      expect(result.allowed).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    it('should deny excessive power', async () => {
      const result = await validator.validate({
        user: {
          callsign: 'DD5BE',
          license_class: 'E'
        },
        transmission: {
          frequency: 145500000,
          mode: 'FM',
          power: 1000,  // Exceeds 750W limit
          bandwidth: 12500
        }
      });
      
      expect(result.allowed).toBe(false);
      const powerCheck = result.checks.find(c => c.check === 'power_within_limits');
      expect(powerCheck.passed).toBe(false);
    });
  });
  
  describe('verifyLicense', () => {
    it('should validate correct callsign format', async () => {
      const result = await validator.verifyLicense('DD5BE', 'E');
      expect(result.passed).toBe(true);
    });
    
    it('should reject invalid callsign format', async () => {
      const result = await validator.verifyLicense('INVALID', 'E');
      expect(result.passed).toBe(false);
    });
    
    it('should reject invalid license class', async () => {
      const result = await validator.verifyLicense('DD5BE', 'Z');
      expect(result.passed).toBe(false);
    });
  });
  
  describe('checkFrequencyBand', () => {
    it('should identify 2m band', () => {
      const result = validator.checkFrequencyBand(145500000, 'E');
      expect(result.passed).toBe(true);
      expect(result.band).toBe('2m');
    });
    
    it('should identify 70cm band', () => {
      const result = validator.checkFrequencyBand(435000000, 'E');
      expect(result.passed).toBe(true);
      expect(result.band).toBe('70cm');
    });
    
    it('should reject frequency outside amateur bands', () => {
      const result = validator.checkFrequencyBand(100500000, 'E');
      expect(result.passed).toBe(false);
    });
  });
  
  describe('checkMode', () => {
    it('should allow SSB mode', () => {
      const result = validator.checkMode('SSB', 7050000);
      expect(result.passed).toBe(true);
    });
    
    it('should allow FM mode', () => {
      const result = validator.checkMode('FM', 145500000);
      expect(result.passed).toBe(true);
    });
    
    it('should reject unknown mode', () => {
      const result = validator.checkMode('INVALID', 145500000);
      expect(result.passed).toBe(false);
    });
  });
});

