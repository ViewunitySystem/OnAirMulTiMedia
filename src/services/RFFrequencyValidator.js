// RF-Frequenz-Validierung für alle Funk-Varianten
class RFFrequencyValidator {
  constructor() {
    this.frequencyBands = {
      // CB-Funk (Citizens Band)
      cb_radio: {
        'DE': { min: 26.965, max: 27.405, channels: 40, power: { am: 4, fm: 4, ssb: 12 } },
        'NL': { min: 26.965, max: 27.405, channels: 40, power: { am: 4, fm: 4, ssb: 12 } },
        'US': { min: 26.965, max: 27.405, channels: 40, power: { am: 4, fm: 4, ssb: 12 } },
        'EU': { min: 26.965, max: 27.405, channels: 40, power: { am: 4, fm: 4, ssb: 12 } }
      },
      
      // Amateurfunk (Ham Radio)
      ham_radio: {
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
      },
      
      // PMR446 (Personal Mobile Radio)
      pmr446: {
        'EU': { min: 446.00625, max: 446.09375, channels: 16, power: 0.5 }
      },
      
      // Marinefunk
      marine_radio: {
        'VHF': { min: 156.0, max: 162.0, channels: 88, power: 25 },
        'MF': { min: 2.0, max: 3.0, power: 150 },
        'HF': { min: 4.0, max: 27.5, power: 150 }
      },
      
      // Luftfahrtfunk
      aviation_radio: {
        'VHF': { min: 118.0, max: 137.0, power: 25 },
        'UHF': { min: 225.0, max: 400.0, power: 25 }
      },
      
      // GMRS (General Mobile Radio Service)
      gmrs: {
        'US': { min: 462.0, max: 467.0, channels: 22, power: { base: 50, portable: 5 } }
      },
      
      // FRS (Family Radio Service)
      frs: {
        'US': { min: 462.0, max: 467.0, channels: 22, power: 2 }
      },
      
      // MURS (Multi-Use Radio Service)
      murs: {
        'US': { frequencies: [151.820, 151.880, 151.940, 154.570, 154.600], power: 2 }
      },
      
      // LoRa (Long Range)
      lora: {
        'EU': { min: 868.0, max: 868.6, power: 14 },
        'US': { min: 902.0, max: 928.0, power: 14 },
        'AS': { min: 433.0, max: 434.0, power: 14 }
      },
      
      // WiFi Direct
      wifi_direct: {
        '2.4GHz': { min: 2400, max: 2500, power: 100 },
        '5GHz': { min: 5000, max: 6000, power: 100 }
      }
    };
    
    this.regulatoryReferences = {
      'DE': {
        'cb_radio': 'BNetzA §226.4.5',
        'ham_radio': 'BNetzA §226.4.5',
        'pmr446': 'BNetzA §226.4.5',
        'marine_radio': 'BNetzA §226.4.5',
        'aviation_radio': 'BNetzA §226.4.5'
      },
      'NL': {
        'cb_radio': 'RDI §3.2.1',
        'ham_radio': 'RDI §3.2.1',
        'pmr446': 'RDI §3.2.1',
        'marine_radio': 'RDI §3.2.1',
        'aviation_radio': 'RDI §3.2.1'
      },
      'US': {
        'cb_radio': 'FCC Part 95',
        'ham_radio': 'FCC Part 97',
        'gmrs': 'FCC Part 95',
        'frs': 'FCC Part 95',
        'murs': 'FCC Part 95',
        'marine_radio': 'FCC Part 80',
        'aviation_radio': 'FCC Part 87'
      },
      'EU': {
        'cb_radio': 'CEPT T/R 61-01',
        'ham_radio': 'CEPT T/R 61-01',
        'pmr446': 'CEPT T/R 61-01',
        'marine_radio': 'CEPT T/R 61-01',
        'aviation_radio': 'CEPT T/R 61-01'
      }
    };
  }
  
  // Frequenz validieren
  validateFrequency(frequency, radioType, country = 'DE', mode = 'FM') {
    const bands = this.frequencyBands[radioType];
    if (!bands) {
      return {
        valid: false,
        error: `Unknown radio type: ${radioType}`,
        regulatory_ref: null
      };
    }
    
    const countryBands = bands[country] || bands['EU'] || bands['US'];
    if (!countryBands) {
      return {
        valid: false,
        error: `No frequency allocation for ${radioType} in ${country}`,
        regulatory_ref: null
      };
    }
    
    // Einzelne Frequenzen (z.B. MURS)
    if (countryBands.frequencies) {
      const isValid = countryBands.frequencies.includes(frequency);
      return {
        valid: isValid,
        error: isValid ? null : `Frequency ${frequency} MHz not allocated for ${radioType}`,
        regulatory_ref: this.regulatoryReferences[country]?.[radioType] || null
      };
    }
    
    // Frequenzbereiche
    if (countryBands.min && countryBands.max) {
      const isValid = frequency >= countryBands.min && frequency <= countryBands.max;
      return {
        valid: isValid,
        error: isValid ? null : `Frequency ${frequency} MHz outside allocated range ${countryBands.min}-${countryBands.max} MHz`,
        regulatory_ref: this.regulatoryReferences[country]?.[radioType] || null
      };
    }
    
    // Unterbänder (z.B. Ham Radio)
    for (const [bandName, bandInfo] of Object.entries(countryBands)) {
      if (bandInfo.min && bandInfo.max && frequency >= bandInfo.min && frequency <= bandInfo.max) {
        return {
          valid: true,
          band: bandName,
          power_limit: bandInfo.power,
          modes: bandInfo.modes || [],
          regulatory_ref: this.regulatoryReferences[country]?.[radioType] || null
        };
      }
    }
    
    return {
      valid: false,
      error: `Frequency ${frequency} MHz not allocated for ${radioType} in ${country}`,
      regulatory_ref: this.regulatoryReferences[country]?.[radioType] || null
    };
  }
  
  // Power-Limit validieren
  validatePower(power, radioType, country = 'DE', mode = 'FM') {
    const bands = this.frequencyBands[radioType];
    if (!bands) return { valid: false, error: `Unknown radio type: ${radioType}` };
    
    const countryBands = bands[country] || bands['EU'] || bands['US'];
    if (!countryBands) return { valid: false, error: `No power allocation for ${radioType} in ${country}` };
    
    const powerLimit = countryBands.power;
    if (typeof powerLimit === 'object') {
      const modePower = powerLimit[mode.toLowerCase()] || powerLimit['fm'];
      return {
        valid: power <= modePower,
        error: power > modePower ? `Power ${power}W exceeds limit ${modePower}W for ${mode}` : null,
        limit: modePower
      };
    }
    
    return {
      valid: power <= powerLimit,
      error: power > powerLimit ? `Power ${power}W exceeds limit ${powerLimit}W` : null,
      limit: powerLimit
    };
  }
  
  // Alle verfügbaren Frequenzen für einen Radio-Typ abrufen
  getAvailableFrequencies(radioType, country = 'DE') {
    const bands = this.frequencyBands[radioType];
    if (!bands) return [];
    
    const countryBands = bands[country] || bands['EU'] || bands['US'];
    if (!countryBands) return [];
    
    const frequencies = [];
    
    // Einzelne Frequenzen
    if (countryBands.frequencies) {
      frequencies.push(...countryBands.frequencies);
    }
    
    // Frequenzbereiche
    if (countryBands.min && countryBands.max) {
      const step = 0.025; // 25kHz steps
      for (let freq = countryBands.min; freq <= countryBands.max; freq += step) {
        frequencies.push(Math.round(freq * 1000) / 1000);
      }
    }
    
    // Unterbänder
    for (const [bandName, bandInfo] of Object.entries(countryBands)) {
      if (bandInfo.min && bandInfo.max) {
        frequencies.push({
          band: bandName,
          min: bandInfo.min,
          max: bandInfo.max,
          power: bandInfo.power,
          modes: bandInfo.modes || []
        });
      }
    }
    
    return frequencies;
  }
  
  // Emergency-Frequenzen abrufen
  getEmergencyFrequencies(radioType, country = 'DE') {
    const emergencyFreqs = {
      'cb_radio': { 'DE': 27.065, 'NL': 27.065, 'US': 27.065, 'EU': 27.065 }, // Channel 9
      'ham_radio': { 'DE': 145.5, 'NL': 145.5, 'US': 146.52, 'EU': 145.5 }, // 2m calling frequency
      'pmr446': { 'EU': 446.00625 }, // Channel 1
      'marine_radio': { 'DE': 156.8, 'NL': 156.8, 'US': 156.8, 'EU': 156.8 }, // Channel 16
      'aviation_radio': { 'DE': 121.5, 'NL': 121.5, 'US': 121.5, 'EU': 121.5 }, // Emergency frequency
      'gmrs': { 'US': 462.550 }, // Channel 1
      'frs': { 'US': 462.550 } // Channel 1
    };
    
    return emergencyFreqs[radioType]?.[country] || emergencyFreqs[radioType]?.['EU'] || emergencyFreqs[radioType]?.['US'] || null;
  }
}

export default RFFrequencyValidator;
