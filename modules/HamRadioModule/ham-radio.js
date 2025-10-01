// Amateurfunk (Ham Radio) Modul - JavaScript Implementation
class HamRadioModule {
  constructor() {
    this.name = 'Amateurfunk (Ham Radio)';
    this.version = '1.0.0';
    this.country = 'DE'; // Default
    this.callsign = 'DD5BE';
    this.operator = 'Raymond Demitrio Dr. Tel';
    this.bands = this.initializeBands();
    this.powerLimits = this.initializePowerLimits();
    this.modes = this.initializeModes();
  }
  
  initializeBands() {
    return {
      'HF': {
        '160m': { min: 1.8, max: 2.0, power: 750, modes: ['CW', 'SSB', 'AM', 'FM'] },
        '80m': { min: 3.5, max: 4.0, power: 750, modes: ['CW', 'SSB', 'AM', 'FM'] },
        '40m': { min: 7.0, max: 7.3, power: 750, modes: ['CW', 'SSB', 'AM', 'FM'] },
        '30m': { min: 10.1, max: 10.15, power: 750, modes: ['CW', 'RTTY', 'PSK31'] },
        '20m': { min: 14.0, max: 14.35, power: 750, modes: ['CW', 'SSB', 'AM', 'FM'] },
        '17m': { min: 18.068, max: 18.168, power: 750, modes: ['CW', 'SSB', 'AM', 'FM'] },
        '15m': { min: 21.0, max: 21.45, power: 750, modes: ['CW', 'SSB', 'AM', 'FM'] },
        '12m': { min: 24.89, max: 24.99, power: 750, modes: ['CW', 'SSB', 'AM', 'FM'] },
        '10m': { min: 28.0, max: 29.7, power: 750, modes: ['CW', 'SSB', 'AM', 'FM'] }
      },
      'VHF': {
        '6m': { min: 50.0, max: 54.0, power: 750, modes: ['CW', 'SSB', 'AM', 'FM'] },
        '2m': { min: 144.0, max: 148.0, power: 750, modes: ['CW', 'SSB', 'AM', 'FM'] }
      },
      'UHF': {
        '70cm': { min: 420.0, max: 450.0, power: 750, modes: ['CW', 'SSB', 'AM', 'FM'] },
        '33cm': { min: 902.0, max: 928.0, power: 750, modes: ['CW', 'SSB', 'AM', 'FM'] },
        '23cm': { min: 1240.0, max: 1300.0, power: 750, modes: ['CW', 'SSB', 'AM', 'FM'] }
      }
    };
  }
  
  initializePowerLimits() {
    return {
      'DE': { 'HF': 750, 'VHF': 750, 'UHF': 750 },
      'NL': { 'HF': 400, 'VHF': 400, 'UHF': 400 },
      'US': { 'HF': 1500, 'VHF': 1500, 'UHF': 1500 },
      'EU': { 'HF': 750, 'VHF': 750, 'UHF': 750 }
    };
  }
  
  initializeModes() {
    return {
      'voice': ['CW', 'SSB', 'FM', 'AM'],
      'digital': ['RTTY', 'PSK31', 'FT8', 'FT4', 'JS8'],
      'special': ['APRS', 'SSTV', 'ATV']
    };
  }
  
  // Frequenz zu Band konvertieren
  frequencyToBand(frequency) {
    for (const [bandType, bands] of Object.entries(this.bands)) {
      for (const [bandName, bandInfo] of Object.entries(bands)) {
        if (frequency >= bandInfo.min && frequency <= bandInfo.max) {
          return {
            type: bandType,
            name: bandName,
            info: bandInfo
          };
        }
      }
    }
    return null;
  }
  
  // Band zu Frequenzbereich konvertieren
  bandToFrequencyRange(bandName) {
    for (const [bandType, bands] of Object.entries(this.bands)) {
      for (const [name, bandInfo] of Object.entries(bands)) {
        if (name === bandName) {
          return {
            min: bandInfo.min,
            max: bandInfo.max,
            type: bandType,
            power: bandInfo.power,
            modes: bandInfo.modes
          };
        }
      }
    }
    return null;
  }
  
  // Power-Limit für Band prüfen
  validatePower(power, bandType, country = null) {
    const countryCode = country || this.country;
    const limits = this.powerLimits[countryCode];
    if (!limits) return { valid: false, error: `No power limits for ${countryCode}` };
    
    const limit = limits[bandType] || limits['VHF'];
    return {
      valid: power <= limit,
      error: power > limit ? `Power ${power}W exceeds limit ${limit}W for ${bandType}` : null,
      limit: limit
    };
  }
  
  // Modus für Band prüfen
  validateMode(mode, bandName) {
    const bandInfo = this.bandToFrequencyRange(bandName);
    if (!bandInfo) return { valid: false, error: `Unknown band: ${bandName}` };
    
    const allowedModes = bandInfo.modes;
    return {
      valid: allowedModes.includes(mode),
      error: !allowedModes.includes(mode) ? `Mode ${mode} not allowed on ${bandName} band` : null,
      allowedModes: allowedModes
    };
  }
  
  // Callsign validieren
  validateCallsign(callsign) {
    const validCallsigns = ['DD5BE', 'DD5BE/P', 'DD5BE/M'];
    return {
      valid: validCallsigns.includes(callsign),
      error: !validCallsigns.includes(callsign) ? `Invalid callsign: ${callsign}` : null,
      operator: callsign === 'DD5BE' ? 'Raymond Demitrio Dr. Tel' : 'Unknown'
    };
  }
  
  // Emergency-Frequenzen abrufen
  getEmergencyFrequencies() {
    return {
      'VHF': {
        'calling': 145.5,
        'emergency': 145.5,
        'repeater_input': '144.5-144.9',
        'repeater_output': '145.1-145.5'
      },
      'HF': {
        'calling': 7.2,
        'emergency': 7.2,
        'dx': '7.0-7.3'
      }
    };
  }
  
  // Alle verfügbaren Bänder abrufen
  getAvailableBands() {
    const bands = [];
    for (const [bandType, bandList] of Object.entries(this.bands)) {
      for (const [bandName, bandInfo] of Object.entries(bandList)) {
        bands.push({
          type: bandType,
          name: bandName,
          min: bandInfo.min,
          max: bandInfo.max,
          power: bandInfo.power,
          modes: bandInfo.modes
        });
      }
    }
    return bands;
  }
  
  // Amateurfunk-spezifische Audit-Events
  emitAudit(event, data) {
    const auditEvent = {
      timestamp: new Date().toISOString(),
      module: 'HamRadioModule',
      event: event,
      data: data,
      callsign: this.callsign,
      country: this.country
    };
    
    console.log('HAM-RADIO-AUDIT:', JSON.stringify(auditEvent));
    return auditEvent;
  }
  
  // Amateurfunk-Kommunikation simulieren
  async simulateCommunication(frequency, mode = 'FM', power = 25, callsign = 'DD5BE', message = '') {
    const band = this.frequencyToBand(frequency);
    if (!band) {
      throw new Error(`Frequency ${frequency} MHz not in amateur bands`);
    }
    
    const powerValidation = this.validatePower(power, band.type);
    if (!powerValidation.valid) {
      throw new Error(powerValidation.error);
    }
    
    const modeValidation = this.validateMode(mode, band.name);
    if (!modeValidation.valid) {
      throw new Error(modeValidation.error);
    }
    
    const callsignValidation = this.validateCallsign(callsign);
    if (!callsignValidation.valid) {
      throw new Error(callsignValidation.error);
    }
    
    this.emitAudit('HAM_COMM_INIT', {
      frequency: frequency,
      band: band.name,
      mode: mode,
      power: power,
      callsign: callsign,
      message: message
    });
    
    // Simuliere Amateurfunk-Kommunikation
    const result = {
      success: true,
      frequency: frequency,
      band: band.name,
      bandType: band.type,
      mode: mode,
      power: power,
      callsign: callsign,
      operator: callsignValidation.operator,
      message: message,
      timestamp: new Date().toISOString(),
      range: this.calculateRange(power, mode, band.type),
      modesAllowed: modeValidation.allowedModes
    };
    
    this.emitAudit('HAM_COMM_SUCCESS', result);
    return result;
  }
  
  // Reichweite berechnen (vereinfacht)
  calculateRange(power, mode, bandType) {
    const baseRange = {
      'HF': {
        'CW': 1000,   // km
        'SSB': 500,   // km
        'FM': 50,     // km
        'AM': 100     // km
      },
      'VHF': {
        'CW': 100,    // km
        'SSB': 50,    // km
        'FM': 25,     // km
        'AM': 30      // km
      },
      'UHF': {
        'CW': 50,     // km
        'SSB': 25,    // km
        'FM': 15,     // km
        'AM': 20      // km
      }
    };
    
    const modeRange = baseRange[bandType]?.[mode] || baseRange['VHF']['FM'];
    const powerFactor = Math.sqrt(power / 25); // 25W als Basis
    
    return Math.round(modeRange * powerFactor);
  }
  
  // DX-Frequenzen abrufen
  getDXFrequencies() {
    return {
      'HF': {
        '40m': { 'dx': '7.0-7.3', 'calling': 7.2 },
        '20m': { 'dx': '14.0-14.35', 'calling': 14.2 },
        '15m': { 'dx': '21.0-21.45', 'calling': 21.2 },
        '10m': { 'dx': '28.0-29.7', 'calling': 28.2 }
      },
      'VHF': {
        '2m': { 'dx': '144.0-148.0', 'calling': 145.5 }
      }
    };
  }
  
  // Repeater-Frequenzen abrufen
  getRepeaterFrequencies() {
    return {
      'VHF': {
        '2m': {
          'input': '144.5-144.9',
          'output': '145.1-145.5',
          'ctcss': '88.5 Hz'
        }
      },
      'UHF': {
        '70cm': {
          'input': '430.0-440.0',
          'output': '440.0-450.0',
          'ctcss': '88.5 Hz'
        }
      }
    };
  }
}

export default HamRadioModule;
