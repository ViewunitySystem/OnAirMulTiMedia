# RFValidationEngine – RF-Parameter Validator

Validiert RF-Parameter gegen länderspezifische Limits mit HIL-Trigger für Messgeräte.

## Funktionen
- **Frequenz-Validierung**: Prüfung gegen Amateur-Radio-Bänder
- **Power-Limits**: Länderspezifische Sendeleistungs-Limits
- **Bandwidth-Checks**: Bandbreiten-Compliance
- **HIL-Integration**: Hardware-in-the-Loop Messtrigger

## Schnittstellen (Data Contract)

**Input**
```json
{
  "freq_mhz": 145.500,
  "bandwidth_khz": 12.5,
  "power_dbm": 37,
  "country": "DE",
  "license": "DD5BE",
  "modulation": "FM"
}
```

**Output**
```json
{
  "verdict": "allow|warn|deny",
  "rationale": "Frequency within 2m amateur band (144-148 MHz)",
  "band": "VHF-2m",
  "regulatory_ref": "BNetzA §226.4.5",
  "audit_id": "evt_rf_check_123"
}
```

## Frequency Bands (DE/NL)

### HF Bands
```
1.8-2.0 MHz    (160m)
3.5-4.0 MHz    (80m)
7.0-7.3 MHz    (40m)
10.1-10.15 MHz (30m)
14.0-14.35 MHz (20m)
18.068-18.168 MHz (17m)
21.0-21.45 MHz (15m)
24.89-24.99 MHz (12m)
28.0-29.7 MHz  (10m)
```

### VHF Bands
```
50.0-54.0 MHz  (6m)
144.0-148.0 MHz (2m)
```

### UHF Bands
```
420.0-450.0 MHz (70cm)
902.0-928.0 MHz (33cm) - US only
1240.0-1300.0 MHz (23cm)
```

## Algorithmik
```javascript
function validateFrequency(freq_mhz, country) {
  const bands = getBandsForCountry(country);
  
  for (const band of bands) {
    if (freq_mhz >= band.min && freq_mhz <= band.max) {
      return {
        verdict: 'allow',
        band: band.name,
        regulatory_ref: band.regulation
      };
    }
  }
  
  return {
    verdict: 'deny',
    rationale: 'Frequency outside amateur bands'
  };
}
```

## Regulatory References
- **Germany (DE)**: BNetzA §226.4.5
- **Netherlands (NL)**: RDI §3.2.1
- **EU**: CEPT T/R 61-01

## Power Limits

| Band | DE Max | NL Max | Class |
|------|--------|--------|-------|
| HF   | 750W PEP | 400W PEP | A |
| VHF  | 750W PEP | 400W PEP | A |
| UHF  | 750W PEP | 400W PEP | A |

**Note:** Limits depend on license class and location

## HIL Testing
- Spektrumanalysator-Messung @freq/power
- Modulation-Analyse
- Spurious emission check
- Harmonics detection

## Blueprints
- JSON: `blueprints/rf_validation_engine.json`

## UI Integration
- Geplant für: RF configuration panel
- Live validation während Eingabe
- Visual feedback (allow=green, warn=yellow, deny=red)

## Audit Events
- `LICENSE_CHECK` - Lizenz geprüft
- `SIGNAL_TX` - Verdict ausgegeben
- `RECOVERY_TRIGGER` - Fallback-Regel aktiv
- `VIOLATION_WARN` - Regelverstoß erkannt

## Checkliste
- [ ] Lizenzprüfung erfolgt lokal
- [ ] Frequenztabellen aktuell (CEPT/BNetzA/RDI)
- [ ] Power-Limits korrekt
- [ ] HIL-Trigger konfiguriert
- [ ] Recovery-Regeln getestet

