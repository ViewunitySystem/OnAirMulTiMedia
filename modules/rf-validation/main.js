/**
 * RF Validation Engine - Regulatory Compliance Checker
 * © 2025 Raymond Demitrio Dr. Tel (DD5BE)
 */

const fs = require('fs').promises;
const path = require('path');

class RFValidator {
  constructor(options = {}) {
    this.jurisdiction = options.jurisdiction || 'DE-BNetzA';
    this.bandPlans = {};
    this.licenseCache = new Map();
    this.auditLogger = options.auditLogger || null;
    
    // Load band plans
    this.loadBandPlans().catch(err => {
      console.error('Failed to load band plans:', err);
    });
  }
  
  /**
   * Load band plans from disk
   */
  async loadBandPlans() {
    const bandPlanPath = path.join(__dirname, '../../regulatory/bandplans');
    
    // Load default band plans
    const defaultPlan = {
      'DE-BNetzA': {
        jurisdiction: 'DE-BNetzA',
        updated: '2025-01-10',
        bands: [
          {
            name: '160m',
            start_hz: 1810000,
            end_hz: 1850000,
            allocation: 'Amateur (Secondary)',
            license_classes: ['A', 'E'],
            modes: ['CW', 'SSB', 'Digital'],
            max_power_watts: 750
          },
          {
            name: '80m',
            start_hz: 3500000,
            end_hz: 3800000,
            allocation: 'Amateur (Primary)',
            license_classes: ['A', 'E'],
            modes: ['CW', 'SSB', 'Digital'],
            max_power_watts: 750
          },
          {
            name: '40m',
            start_hz: 7000000,
            end_hz: 7200000,
            allocation: 'Amateur (Primary)',
            license_classes: ['A', 'E'],
            modes: ['CW', 'SSB', 'Digital'],
            max_power_watts: 750
          },
          {
            name: '20m',
            start_hz: 14000000,
            end_hz: 14350000,
            allocation: 'Amateur (Primary)',
            license_classes: ['A', 'E'],
            modes: ['CW', 'SSB', 'Digital'],
            max_power_watts: 750
          },
          {
            name: '2m',
            start_hz: 144000000,
            end_hz: 146000000,
            allocation: 'Amateur (Primary)',
            license_classes: ['A', 'E'],
            modes: ['CW', 'SSB', 'FM', 'Digital'],
            max_power_watts: 750
          },
          {
            name: '70cm',
            start_hz: 430000000,
            end_hz: 440000000,
            allocation: 'Amateur (Secondary)',
            license_classes: ['A', 'E'],
            modes: ['All'],
            max_power_watts: 750
          }
        ]
      }
    };
    
    this.bandPlans = defaultPlan;
  }
  
  /**
   * Main validation function
   */
  async validate(options) {
    const {
      user,
      transmission
    } = options;
    
    const checks = [];
    const errors = [];
    
    // 1. License Verification
    const licenseCheck = await this.verifyLicense(user.callsign, user.license_class);
    checks.push(licenseCheck);
    if (!licenseCheck.passed) {
      errors.push(licenseCheck.reason);
    }
    
    // 2. Frequency Band Check
    const bandCheck = this.checkFrequencyBand(
      transmission.frequency,
      user.license_class
    );
    checks.push(bandCheck);
    if (!bandCheck.passed) {
      errors.push(bandCheck.reason);
    }
    
    // 3. Power Limit Check
    const powerCheck = this.checkPowerLimits(
      transmission.frequency,
      transmission.power,
      user.license_class
    );
    checks.push(powerCheck);
    if (!powerCheck.passed) {
      errors.push(powerCheck.reason);
    }
    
    // 4. Mode Check
    const modeCheck = this.checkMode(
      transmission.mode,
      transmission.frequency
    );
    checks.push(modeCheck);
    if (!modeCheck.passed) {
      errors.push(modeCheck.reason);
    }
    
    // 5. Bandwidth Check
    const bandwidthCheck = this.checkBandwidth(
      transmission.bandwidth,
      transmission.frequency,
      transmission.mode
    );
    checks.push(bandwidthCheck);
    if (!bandwidthCheck.passed) {
      errors.push(bandwidthCheck.reason);
    }
    
    const allowed = errors.length === 0;
    
    // Audit log
    if (this.auditLogger) {
      await this.auditLogger.log({
        category: allowed ? 'RF' : 'SECURITY',
        type: allowed ? 'validation_passed' : 'tx_blocked',
        severity: allowed ? 'INFO' : 'WARN',
        payload: {
          callsign: user.callsign,
          frequency: transmission.frequency,
          mode: transmission.mode,
          power: transmission.power,
          result: allowed ? 'allowed' : 'denied',
          jurisdiction: this.jurisdiction,
          checks_passed: checks.filter(c => c.passed).length,
          checks_total: checks.length,
          errors: errors.length > 0 ? errors : undefined
        }
      });
    }
    
    const result = {
      allowed,
      checks,
      errors: errors.length > 0 ? errors : undefined,
      regulatory: {
        jurisdiction: this.jurisdiction,
        band_plan: bandCheck.band || 'Unknown',
        notes: bandCheck.notes || []
      }
    };
    
    if (this.auditLogger) {
      result.audit = {
        logged: true,
        event_type: allowed ? 'validation_passed' : 'tx_blocked'
      };
    }
    
    return result;
  }
  
  /**
   * Verify license
   */
  async verifyLicense(callsign, licenseClass) {
    // Check cache first
    if (this.licenseCache.has(callsign)) {
      const cached = this.licenseCache.get(callsign);
      if (cached.expires > Date.now()) {
        return {
          check: 'license_valid',
          passed: cached.valid && cached.class === licenseClass,
          cached: true,
          source: cached.source
        };
      }
    }
    
    // In real implementation, would query BNetzA/FCC/QRZ API
    // For now, validate format
    const isValid = /^[A-Z0-9]{4,7}$/.test(callsign);
    const validClasses = ['A', 'E', 'N'];
    const classValid = validClasses.includes(licenseClass);
    
    const result = {
      check: 'license_valid',
      passed: isValid && classValid,
      reason: !isValid ? 'Invalid callsign format' : 
              !classValid ? `Invalid license class: ${licenseClass}` : undefined,
      source: 'Format Validation'
    };
    
    // Cache for 24 hours
    this.licenseCache.set(callsign, {
      valid: result.passed,
      class: licenseClass,
      expires: Date.now() + 86400000,
      source: result.source
    });
    
    return result;
  }
  
  /**
   * Check if frequency is in allowed band
   */
  checkFrequencyBand(frequency, licenseClass) {
    const bandPlan = this.bandPlans[this.jurisdiction];
    if (!bandPlan) {
      return {
        check: 'frequency_in_band',
        passed: false,
        reason: `Unknown jurisdiction: ${this.jurisdiction}`
      };
    }
    
    for (const band of bandPlan.bands) {
      if (frequency >= band.start_hz && frequency <= band.end_hz) {
        // Check if license class is allowed
        if (!band.license_classes.includes(licenseClass)) {
          return {
            check: 'frequency_in_band',
            passed: false,
            reason: `License class ${licenseClass} not allowed on ${band.name} (${band.start_hz/1e6}-${band.end_hz/1e6} MHz)`,
            band: band.name
          };
        }
        
        return {
          check: 'frequency_in_band',
          passed: true,
          band: band.name,
          allocation: band.allocation,
          notes: band.allocation.includes('Secondary') ? 
            ['Secondary service, listen before transmit'] : []
        };
      }
    }
    
    return {
      check: 'frequency_in_band',
      passed: false,
      reason: `Frequency ${frequency/1e6} MHz not in amateur allocation`,
      nearest_band: this.findNearestBand(frequency)
    };
  }
  
  /**
   * Find nearest amateur band
   */
  findNearestBand(frequency) {
    const bandPlan = this.bandPlans[this.jurisdiction];
    if (!bandPlan) return null;
    
    let minDist = Infinity;
    let nearestBand = null;
    
    for (const band of bandPlan.bands) {
      const dist = Math.min(
        Math.abs(frequency - band.start_hz),
        Math.abs(frequency - band.end_hz)
      );
      
      if (dist < minDist) {
        minDist = dist;
        nearestBand = band.name;
      }
    }
    
    return nearestBand;
  }
  
  /**
   * Check power limits
   */
  checkPowerLimits(frequency, power, licenseClass) {
    const bandPlan = this.bandPlans[this.jurisdiction];
    if (!bandPlan) {
      return {
        check: 'power_within_limits',
        passed: false,
        reason: 'Unknown jurisdiction'
      };
    }
    
    // Find band
    let maxPower = null;
    for (const band of bandPlan.bands) {
      if (frequency >= band.start_hz && frequency <= band.end_hz) {
        maxPower = band.max_power_watts;
        
        // Novice class has lower limits
        if (licenseClass === 'N') {
          maxPower = Math.min(maxPower, 10);
        }
        
        break;
      }
    }
    
    if (maxPower === null) {
      return {
        check: 'power_within_limits',
        passed: false,
        reason: 'Frequency not in amateur band'
      };
    }
    
    if (power > maxPower) {
      return {
        check: 'power_within_limits',
        passed: false,
        reason: `Power ${power}W exceeds limit ${maxPower}W for class ${licenseClass}`,
        max_power: maxPower
      };
    }
    
    return {
      check: 'power_within_limits',
      passed: true,
      max_power: maxPower,
      requested_power: power
    };
  }
  
  /**
   * Check mode compatibility
   */
  checkMode(mode, frequency) {
    const modeInfo = {
      'CW': { bandwidth: 150, allowed: true },
      'SSB': { bandwidth: 2700, allowed: true },
      'FM': { bandwidth: 12500, allowed: true },
      'DMR': { bandwidth: 12500, allowed: true, digital: true },
      'DSTAR': { bandwidth: 6000, allowed: true, digital: true },
      'C4FM': { bandwidth: 12500, allowed: true, digital: true },
      'APRS': { bandwidth: 12500, allowed: true, data: true }
    };
    
    const info = modeInfo[mode.toUpperCase()];
    
    if (!info) {
      return {
        check: 'mode_allowed',
        passed: false,
        reason: `Unknown mode: ${mode}`
      };
    }
    
    if (!info.allowed) {
      return {
        check: 'mode_allowed',
        passed: false,
        reason: `Mode ${mode} not allowed`
      };
    }
    
    return {
      check: 'mode_allowed',
      passed: true,
      mode_info: info
    };
  }
  
  /**
   * Check bandwidth
   */
  checkBandwidth(bandwidth, frequency, mode) {
    const modeInfo = {
      'CW': 150,
      'SSB': 2700,
      'FM': 12500,
      'DMR': 12500,
      'DSTAR': 6000,
      'C4FM': 12500
    };
    
    const typicalBandwidth = modeInfo[mode.toUpperCase()] || 12500;
    
    // Allow 20% tolerance
    const maxBandwidth = typicalBandwidth * 1.2;
    
    if (bandwidth > maxBandwidth) {
      return {
        check: 'bandwidth_legal',
        passed: false,
        reason: `Bandwidth ${bandwidth}Hz exceeds typical ${typicalBandwidth}Hz for ${mode}`,
        max_bandwidth: maxBandwidth
      };
    }
    
    return {
      check: 'bandwidth_legal',
      passed: true,
      max_bandwidth: maxBandwidth,
      requested_bandwidth: bandwidth
    };
  }
}

module.exports = { RFValidator };

