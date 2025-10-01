# Amateurfunk (Ham Radio) Modul

Amateurfunk-Modul für OnAirMulTiMedia basierend auf dem RFValidationEngine.

## Funktionen
- **Amateurfunk-Bänder**: HF, VHF, UHF
- **Power-Limits**: Länderspezifische Sendeleistungs-Limits
- **Modi**: CW, SSB, FM, AM, RTTY, PSK31, FT8, FT4, JS8, APRS, SSTV, ATV
- **Callsign**: DD5BE (Raymond Demitrio Dr. Tel)
- **Emergency-Frequenzen**: 145.5 MHz (2m), 7.2 MHz (40m)

## Schnittstellen (Data Contract)

**Input**
```json
{
  "frequency_mhz": 145.500,
  "mode": "FM",
  "power_w": 25,
  "country": "DE",
  "callsign": "DD5BE",
  "message": "CQ CQ CQ"
}
```

**Output**
```json
{
  "verdict": "allow|warn|deny",
  "band": "VHF-2m",
  "power_valid": true,
  "range_km": 50,
  "modes_allowed": ["CW", "SSB", "FM", "AM"],
  "regulatory_ref": "BNetzA §226.4.5",
  "audit_id": "evt_ham_comm_123"
}
```

## Amateurfunk-Bänder (DE/NL/US/EU)

### HF Bands
```
160m: 1.8-2.0 MHz    (Power: 750W PEP)
80m:  3.5-4.0 MHz    (Power: 750W PEP)
40m:  7.0-7.3 MHz    (Power: 750W PEP)
30m:  10.1-10.15 MHz (Power: 750W PEP)
20m:  14.0-14.35 MHz (Power: 750W PEP)
17m:  18.068-18.168 MHz (Power: 750W PEP)
15m:  21.0-21.45 MHz (Power: 750W PEP)
12m:  24.89-24.99 MHz (Power: 750W PEP)
10m:  28.0-29.7 MHz  (Power: 750W PEP)
```

### VHF Bands
```
6m: 50.0-54.0 MHz    (Power: 750W PEP)
2m: 144.0-148.0 MHz  (Power: 750W PEP)
```

### UHF Bands
```
70cm: 420.0-450.0 MHz (Power: 750W PEP)
33cm: 902.0-928.0 MHz (Power: 750W PEP) - US only
23cm: 1240.0-1300.0 MHz (Power: 750W PEP)
```

## Power Limits

| Band | DE Max | NL Max | US Max | EU Max | Class |
|------|--------|--------|--------|--------|-------|
| HF   | 750W PEP | 400W PEP | 1500W PEP | 750W PEP | A |
| VHF  | 750W PEP | 400W PEP | 1500W PEP | 750W PEP | A |
| UHF  | 750W PEP | 400W PEP | 1500W PEP | 750W PEP | A |

**Note:** Limits depend on license class and location

## Modi und Anwendungen

### Voice Modi
- **CW**: Morse Code
- **SSB**: Single Sideband
- **FM**: Frequency Modulation
- **AM**: Amplitude Modulation

### Digital Modi
- **RTTY**: Radio Teletype
- **PSK31**: Phase Shift Keying
- **FT8**: Fast Fourier Transform
- **FT4**: Fast Fourier Transform (4-FSK)
- **JS8**: JavaScript 8-FSK

### Spezial-Modi
- **APRS**: Automatic Packet Reporting System
- **SSTV**: Slow Scan Television
- **ATV**: Amateur Television

## Emergency-Frequenzen

### VHF (2m)
- **Calling Frequency**: 145.5 MHz
- **Emergency**: 145.5 MHz
- **Repeater Input**: 144.5-144.9 MHz
- **Repeater Output**: 145.1-145.5 MHz

### HF (40m)
- **Calling Frequency**: 7.2 MHz
- **Emergency**: 7.2 MHz
- **DX**: 7.0-7.3 MHz

## Regulatory References
- **Germany (DE)**: BNetzA §226.4.5
- **Netherlands (NL)**: RDI §3.2.1
- **United States (US)**: FCC Part 97
- **European Union (EU)**: CEPT T/R 61-01

## Algorithmik
```javascript
function validateHamFrequency(freq_mhz, mode, power, country, callsign) {
  const band = getHamBand(freq_mhz);
  const powerLimit = getHamPowerLimit(band, country);
  const allowedModes = getBandModes(band);
  
  if (!allowedModes.includes(mode)) {
    return {
      verdict: 'deny',
      rationale: `Mode ${mode} not allowed on ${band} band`
    };
  }
  
  if (power > powerLimit) {
    return {
      verdict: 'deny',
      rationale: `Power ${power}W exceeds limit ${powerLimit}W for ${band}`
    };
  }
  
  return {
    verdict: 'allow',
    band: band,
    power_valid: true,
    modes_allowed: allowedModes
  };
}
```

## HIL Testing
- Spektrumanalysator-Messung @freq/power
- Modulation-Analyse (CW/SSB/FM/AM)
- Spurious emission check
- Harmonics detection
- Bandwidth measurement

## Blueprints
- JSON: `blueprints/ham_radio.json`

## UI Integration
- Amateurfunk-Band-Auswahl
- Live validation während Eingabe
- Visual feedback (allow=green, warn=yellow, deny=red)
- Emergency-Frequenz-Hervorhebung
- Callsign-Anzeige (DD5BE)

## Audit Events
- `HAM_COMM_INIT` - Amateurfunk-Kommunikation initialisiert
- `HAM_COMM_SUCCESS` - Amateurfunk-Kommunikation erfolgreich
- `HAM_POWER_CHECK` - Power-Limit geprüft
- `HAM_MODE_CHECK` - Modus-Validierung
- `HAM_CALLSIGN_CHECK` - Callsign-Validierung

## Checkliste
- [ ] Amateurfunk-Bänder korrekt implementiert
- [ ] Power-Limits für alle Bänder
- [ ] Modi-Validierung funktional
- [ ] Emergency-Frequenzen verfügbar
- [ ] Callsign-Validierung (DD5BE)
- [ ] DX-Frequenzen integriert
- [ ] Repeater-Frequenzen verfügbar
- [ ] Audit-Trail vollständig
