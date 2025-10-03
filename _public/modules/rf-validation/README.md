# 🛡️ RF Validation Engine

**Regulatory Compliance Checker for Radio Frequency Transmissions**

---

## 🎯 Purpose

The RF Validation Engine automatically verifies if a planned radio transmission is **legal** before it happens, preventing violations of:

- 🇩🇪 Germany (BNetzA / AFuG)
- 🇪🇺 EU (RED / ETSI)
- 🇺🇸 USA (FCC Part 15/97)
- 🇳🇱 Netherlands (Agentschap Telecom)
- 🌍 International (ITU Band Plans)

**Key Features:**
- ✅ License verification (Callsign lookup)
- ✅ Frequency band validation
- ✅ Power limit enforcement
- ✅ Mode compatibility check
- ✅ Bandwidth compliance
- ✅ Real-time audit logging
- ✅ Offline operation (cached band plans)

---

## 🚀 Quick Start

```javascript
const { RFValidator } = require('./main.js');

const validator = new RFValidator({
  jurisdiction: 'DE-BNetzA',
  auditLogger: auditLogger
});

const result = await validator.validate({
  user: {
    callsign: 'DD5BE',
    license_class: 'E'
  },
  transmission: {
    frequency: 145500000,  // 145.5 MHz
    mode: 'FM',
    power: 5,              // 5 Watts
    bandwidth: 12500,      // 12.5 kHz
    duration_ms: 3000
  }
});

if (result.allowed) {
  console.log('✅ Transmission ALLOWED');
  startTransmission();
} else {
  console.error('❌ Transmission DENIED:', result.errors);
  showUserWarning(result.errors);
}
```

**Output:**
```json
{
  "allowed": true,
  "checks": [
    {"check": "license_valid", "passed": true},
    {"check": "frequency_in_band", "passed": true, "band": "2m Amateur"},
    {"check": "power_within_limits", "passed": true, "max_power": 750},
    {"check": "mode_allowed", "passed": true},
    {"check": "bandwidth_legal", "passed": true}
  ],
  "regulatory": {
    "jurisdiction": "DE-BNetzA",
    "band_plan": "ITU Region 1 VHF",
    "notes": ["Secondary service, listen before transmit"]
  }
}
```

---

## 🔍 Validation Checks

### 1. License Verification

```javascript
async function verifyLicense(callsign, jurisdiction) {
  // Check local cache first
  const cached = await db.get('licenses', callsign);
  if (cached && cached.expires > Date.now()) {
    return cached;
  }
  
  // Fetch from authority (BNetzA, FCC, etc.)
  const license = await fetchLicenseFromAuthority(callsign, jurisdiction);
  
  // Cache for 24 hours
  await db.set('licenses', callsign, {
    ...license,
    expires: Date.now() + 86400000
  });
  
  return license;
}
```

**Authorities:**
- 🇩🇪 BNetzA: Web scraping (no official API)
- 🇺🇸 FCC: ULS API (https://www.fcc.gov/developers)
- 🌐 QRZ.com API (requires subscription)

### 2. Frequency Band Check

```javascript
const bandPlans = {
  'DE-BNetzA': {
    '2m': {
      start: 144000000,
      end: 146000000,
      allocation: 'Amateur (Primary)',
      classes: ['A', 'E'],
      modes: ['CW', 'SSB', 'FM', 'DSTAR', 'DMR', 'C4FM'],
      max_power: 750  // Watts ERP
    },
    '70cm': {
      start: 430000000,
      end: 440000000,
      allocation: 'Amateur (Secondary)',
      classes: ['A', 'E'],
      modes: ['All'],
      max_power: 750
    }
  }
};

function isFrequencyInBand(frequency, license_class, jurisdiction) {
  const bands = bandPlans[jurisdiction];
  
  for (const [name, band] of Object.entries(bands)) {
    if (frequency >= band.start && frequency <= band.end) {
      if (band.classes.includes(license_class)) {
        return { allowed: true, band: name, details: band };
      } else {
        return { allowed: false, reason: `License class ${license_class} not allowed on ${name}` };
      }
    }
  }
  
  return { allowed: false, reason: 'Frequency not in amateur allocation' };
}
```

### 3. Power Limit Enforcement

```javascript
function checkPowerLimits(frequency, power, license_class, jurisdiction) {
  const band = getBandForFrequency(frequency, jurisdiction);
  
  if (!band) {
    return { passed: false, reason: 'Unknown band' };
  }
  
  // Class-specific limits
  const classLimits = {
    'A': band.max_power,
    'E': band.max_power,
    'N': Math.min(band.max_power, 10)  // Novice max 10W
  };
  
  const maxPower = classLimits[license_class];
  
  if (power > maxPower) {
    return {
      passed: false,
      reason: `Power ${power}W exceeds limit ${maxPower}W for class ${license_class}`,
      max_power: maxPower
    };
  }
  
  return { passed: true, max_power: maxPower };
}
```

### 4. Mode Compatibility

```javascript
const modeCompatibility = {
  'CW': { bandwidth: 150, allowed: true },
  'SSB': { bandwidth: 2700, allowed: true },
  'FM': { bandwidth: 12500, allowed: true },
  'DMR': { bandwidth: 12500, allowed: true, digital: true },
  'DSTAR': { bandwidth: 6000, allowed: true, digital: true },
  'C4FM': { bandwidth: 12500, allowed: true, digital: true },
  'APRS': { bandwidth: 12500, allowed: true, data: true }
};

function checkMode(mode, frequency, bandwidth) {
  const modeInfo = modeCompatibility[mode.toUpperCase()];
  
  if (!modeInfo) {
    return { passed: false, reason: `Unknown mode: ${mode}` };
  }
  
  if (!modeInfo.allowed) {
    return { passed: false, reason: `Mode ${mode} not allowed` };
  }
  
  if (bandwidth > modeInfo.bandwidth * 1.2) {
    return {
      passed: false,
      reason: `Bandwidth ${bandwidth}Hz exceeds typical ${modeInfo.bandwidth}Hz for ${mode}`,
      max_bandwidth: modeInfo.bandwidth * 1.2
    };
  }
  
  return { passed: true, mode_info: modeInfo };
}
```

### 5. Bandwidth Compliance

```javascript
function checkBandwidth(frequency, bandwidth, jurisdiction) {
  // Different limits for different bands
  const band = getBandForFrequency(frequency, jurisdiction);
  
  const bandwidthLimits = {
    'HF': 2700,      // SSB standard
    'VHF': 16000,    // 16 kHz max
    'UHF': 25000,    // 25 kHz max
    'SHF': 100000    // 100 kHz max (satellite, etc.)
  };
  
  const maxBandwidth = bandwidthLimits[band.type] || 12500;
  
  if (bandwidth > maxBandwidth) {
    return {
      passed: false,
      reason: `Bandwidth ${bandwidth}Hz exceeds limit ${maxBandwidth}Hz for ${band.type}`,
      max_bandwidth: maxBandwidth
    };
  }
  
  return { passed: true, max_bandwidth: maxBandwidth };
}
```

---

## 🗺️ Band Plans Database

Located in `../../regulatory/bandplans/`:

```
bandplans/
├── itu-region-1.json      # Europe, Africa, Middle East
├── itu-region-2.json      # Americas
├── itu-region-3.json      # Asia-Pacific
├── germany.json           # DE-specific (70cm deviation)
├── usa.json               # US-specific (1.25m, etc.)
└── netherlands.json       # NL-specific (6m extension)
```

**Example**: `germany.json`
```json
{
  "jurisdiction": "DE-BNetzA",
  "updated": "2025-01-10",
  "bands": [
    {
      "name": "2m",
      "start_hz": 144000000,
      "end_hz": 146000000,
      "allocation": "Amateur (Primary)",
      "license_classes": ["A", "E"],
      "modes": ["CW", "SSB", "FM", "Digital"],
      "max_power_watts": 750,
      "max_erp_watts": 750,
      "notes": "Secondary to broadcasting below 146 MHz",
      "url": "https://www.bundesnetzagentur.de/..."
    }
  ]
}
```

---

## 🔄 Offline Operation

**Strategy**: Cache band plans locally for offline validation.

```javascript
class RFValidator {
  constructor(options) {
    this.bandPlans = {};
    this.licenseCache = {};
    
    // Load band plans from disk
    this.loadBandPlans();
    
    // Schedule updates (daily)
    setInterval(() => this.updateBandPlans(), 86400000);
  }
  
  async loadBandPlans() {
    const files = ['itu-region-1.json', 'germany.json', 'usa.json'];
    
    for (const file of files) {
      const data = await fs.readFile(`regulatory/bandplans/${file}`, 'utf8');
      const bandPlan = JSON.parse(data);
      this.bandPlans[bandPlan.jurisdiction] = bandPlan;
    }
  }
  
  async updateBandPlans() {
    // Fetch latest from GitHub or API
    try {
      const response = await fetch('https://api.example.com/bandplans/latest');
      const latest = await response.json();
      
      for (const [jurisdiction, data] of Object.entries(latest)) {
        await fs.writeFile(
          `regulatory/bandplans/${jurisdiction}.json`,
          JSON.stringify(data, null, 2)
        );
        this.bandPlans[jurisdiction] = data;
      }
      
      console.log('Band plans updated successfully');
    } catch (error) {
      console.warn('Failed to update band plans, using cached versions:', error);
    }
  }
}
```

---

## 📊 Audit Integration

Every validation is logged:

```json
{
  "category": "RF",
  "type": "validation_check",
  "payload": {
    "callsign": "DD5BE",
    "frequency": 145500000,
    "mode": "FM",
    "power": 5,
    "result": "allowed",
    "jurisdiction": "DE-BNetzA",
    "checks_passed": 5,
    "checks_total": 5
  }
}
```

If **denied**:
```json
{
  "category": "SECURITY",
  "type": "tx_blocked",
  "severity": "WARN",
  "payload": {
    "callsign": "INVALID",
    "frequency": 100500000,
    "reason": "Frequency not in amateur allocation",
    "attempted_power": 50
  }
}
```

---

## 🧪 Testing

```javascript
describe('RFValidator', () => {
  it('should allow valid 2m FM transmission', async () => {
    const validator = new RFValidator({ jurisdiction: 'DE-BNetzA' });
    
    const result = await validator.validate({
      user: { callsign: 'DD5BE', license_class: 'E' },
      transmission: { frequency: 145500000, mode: 'FM', power: 5, bandwidth: 12500 }
    });
    
    expect(result.allowed).toBe(true);
    expect(result.checks.every(c => c.passed)).toBe(true);
  });
  
  it('should deny transmission on non-amateur frequency', async () => {
    const validator = new RFValidator({ jurisdiction: 'DE-BNetzA' });
    
    const result = await validator.validate({
      user: { callsign: 'DD5BE', license_class: 'E' },
      transmission: { frequency: 100500000, mode: 'FM', power: 5, bandwidth: 12500 }
    });
    
    expect(result.allowed).toBe(false);
    expect(result.errors).toContain('Frequency not in amateur allocation');
  });
});
```

---

## 📞 Support

- **GitHub Issues**: https://github.com/ViewunitySystem/OnAirMulTiMedia/issues
- **Email**: gentlyoverdone@outlook.com
- **Maintainer**: Raymond Demitrio Dr. Tel (DD5BE)

---

© 2025 ViewunitySystem / TEL Portal  
RF Validation Engine - Regulatory Compliance for Radio Transmissions

