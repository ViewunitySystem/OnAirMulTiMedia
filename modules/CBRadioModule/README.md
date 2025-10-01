# CB-Funk (Citizens Band) Modul

CB-Funk-Modul für OnAirMulTiMedia basierend auf dem RFValidationEngine.

## Funktionen
- **CB-Funk-Kanäle**: 40 Kanäle (26.965-27.405 MHz)
- **Power-Limits**: 4W AM/FM, 12W SSB
- **Emergency-Kanal**: Kanal 9 (27.065 MHz)
- **Trucker-Netzwerk**: Kanal 19 (27.185 MHz)
- **Wetter-Info**: Kanal 16 (27.155 MHz)

## Schnittstellen (Data Contract)

**Input**
```json
{
  "channel": 9,
  "mode": "FM",
  "power_w": 4,
  "country": "DE",
  "message": "Emergency call"
}
```

**Output**
```json
{
  "verdict": "allow|warn|deny",
  "frequency_mhz": 27.065,
  "power_valid": true,
  "range_km": 8,
  "interference": "none|low|medium|high",
  "regulatory_ref": "BNetzA §226.4.5",
  "audit_id": "evt_cb_comm_123"
}
```

## CB-Funk Kanäle (DE/NL/US/EU)

### Standard-Kanäle
```
Kanal 1:  26.965 MHz
Kanal 2:  26.975 MHz
Kanal 3:  26.985 MHz
Kanal 4:  27.005 MHz
Kanal 5:  27.015 MHz
Kanal 6:  27.025 MHz
Kanal 7:  27.035 MHz
Kanal 8:  27.055 MHz
Kanal 9:  27.065 MHz (Emergency)
Kanal 10: 27.075 MHz
Kanal 11: 27.085 MHz
Kanal 12: 27.105 MHz
Kanal 13: 27.115 MHz
Kanal 14: 27.125 MHz
Kanal 15: 27.135 MHz
Kanal 16: 27.155 MHz (Weather)
Kanal 17: 27.165 MHz
Kanal 18: 27.175 MHz
Kanal 19: 27.185 MHz (Trucker)
Kanal 20: 27.205 MHz
...
Kanal 40: 27.405 MHz
```

## Power Limits

| Modus | DE Max | NL Max | US Max | EU Max |
|-------|--------|--------|--------|--------|
| AM    | 4W     | 4W     | 4W     | 4W     |
| FM    | 4W     | 4W     | 4W     | 4W     |
| SSB   | 12W    | 12W    | 12W    | 12W    |

## Regulatory References
- **Germany (DE)**: BNetzA §226.4.5
- **Netherlands (NL)**: RDI §3.2.1
- **United States (US)**: FCC Part 95
- **European Union (EU)**: CEPT T/R 61-01

## Algorithmik
```javascript
function validateCBChannel(channel, mode, power, country) {
  const frequency = getCBFrequency(channel);
  const powerLimit = getCBPowerLimit(mode, country);
  
  if (power > powerLimit) {
    return {
      verdict: 'deny',
      rationale: `Power ${power}W exceeds limit ${powerLimit}W for ${mode}`
    };
  }
  
  return {
    verdict: 'allow',
    frequency: frequency,
    power_valid: true,
    range: calculateRange(power, mode)
  };
}
```

## HIL Testing
- Spektrumanalysator-Messung @freq/power
- Modulation-Analyse (AM/FM/SSB)
- Spurious emission check
- Harmonics detection

## Blueprints
- JSON: `blueprints/cb_radio.json`

## UI Integration
- CB-Funk-Kanal-Auswahl
- Live validation während Eingabe
- Visual feedback (allow=green, warn=yellow, deny=red)
- Emergency-Kanal-Hervorhebung

## Audit Events
- `CB_COMM_INIT` - CB-Kommunikation initialisiert
- `CB_COMM_SUCCESS` - CB-Kommunikation erfolgreich
- `CB_POWER_CHECK` - Power-Limit geprüft
- `CB_INTERFERENCE` - Interferenz erkannt

## Checkliste
- [ ] CB-Kanäle korrekt implementiert
- [ ] Power-Limits für alle Modi
- [ ] Emergency-Kanal funktional
- [ ] Trucker-Netzwerk verfügbar
- [ ] Wetter-Info integriert
- [ ] Interferenz-Erkennung aktiv
- [ ] Audit-Trail vollständig
