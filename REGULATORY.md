# 🏛️ Regulatory Compliance Guide

**OnAirMulTiMedia - RF Transmission Compliance**

---

## 📋 Document Control

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Last Updated** | 2025-01-10 |
| **Maintainer** | Raymond Demitrio Dr. Tel (DD5BE) |
| **Status** | Active |

---

## 🌍 Jurisdictions Overview

| Country/Region | Authority | Key Regulations | Contact |
|----------------|-----------|-----------------|---------|
| 🇩🇪 Germany | BNetzA | AFuG, TKG | amateurfunk@bnetza.de |
| 🇪🇺 EU | ETSI | RED 2014/53/EU | https://www.etsi.org/ |
| 🇺🇸 USA | FCC | Part 15, Part 97 | https://www.fcc.gov/ |
| 🇳🇱 Netherlands | AT | Telecommunicatiewet | https://www.agentschaptelecom.nl/ |

---

## 🇩🇪 Germany - BNetzA

### Authority Information

**Bundesnetzagentur für Elektrizität, Gas, Telekommunikation, Post und Eisenbahnen**

- **Address**: Tulpenfeld 4, 53113 Bonn, Germany
- **Phone**: +49 228 14-0
- **Email**: amateurfunk@bnetza.de
- **Website**: https://www.bundesnetzagentur.de/
- **Referat**: 221 (Amateurfunkdienst)

### Applicable Laws

#### 1. **Amateurfunkgesetz (AFuG)**
- **Current Version**: 23.06.1997 (BGBl. I S. 1494), zuletzt geändert durch Art. 228 G v. 19.6.2020
- **Scope**: Reguliert Amateurfunkdienst in Deutschland
- **Key Points**:
  - Amateurfunklizenz erforderlich (Klasse A, E, oder N)
  - Rufzeichenpflicht
  - Log-Book-Pflicht (elektronisch erlaubt)
  - Frequenzbereiche und Leistungsgrenzen beachten

#### 2. **Amateurfunkverordnung (AFuV)**
- **Current Version**: 15.02.2005 (BGBl. I S. 242), zuletzt geändert durch Art. 4 V v. 9.5.2024
- **Scope**: Detaillierte Durchführungsbestimmungen
- **Key Points**:
  - Prüfungsanforderungen (Technik, Betrieb, Vorschriften)
  - Rufzeichenzuteilung
  - Betriebsabwicklung
  - Gastbetrieb (CEPT, IARP)

#### 3. **Telekommunikationsgesetz (TKG)**
- **Current Version**: 23.06.2021 (BGBl. I S. 1858)
- **Scope**: Allgemeine Telekommunikation
- **Relevance**: Spectrum Management, Störungsbekämpfung

### Frequency Allocations (Germany)

| Band | Frequency Range | License Class | Max Power (ERP) | Notes |
|------|-----------------|---------------|-----------------|-------|
| **160m** | 1.810–1.850 MHz | A, E | 750 W | Secondary to Broadcasting |
| **80m** | 3.500–3.800 MHz | A, E | 750 W | - |
| **40m** | 7.000–7.200 MHz | A, E | 750 W | - |
| **20m** | 14.000–14.350 MHz | A, E | 750 W | - |
| **15m** | 21.000–21.450 MHz | A, E | 750 W | - |
| **10m** | 28.000–29.700 MHz | A, E | 750 W | - |
| **6m** | 50.08–51.00 MHz | A | 750 W | Class E: 50.08–50.40 MHz only |
| **2m** | 144.000–146.000 MHz | A, E | 750 W | - |
| **70cm** | 430.000–440.000 MHz | A, E | 750 W | - |
| **23cm** | 1240–1300 MHz | A, E | 750 W | - |

**Class N (Novice)**: Nur oberhalb 30 MHz, max 10 W

### License Verification

**API**: Keine offizielle API verfügbar

**Manual Check**:
1. Besuche: https://www.bundesnetzagentur.de/DE/Fachthemen/Telekommunikation/Frequenzen/SpezielleAnwendungen/Amateurfunk/amateurfunk-node.html
2. Suche nach Rufzeichen
3. Verifiziere Gültigkeit und Klasse

**QRZ.com**: Alternativ https://www.qrz.com/db/CALLSIGN

### Export Requirements

**Format**: CSV, PDF, XML

**Required Fields**:
- Rufzeichen (Callsign)
- Datum/Zeit (UTC)
- Frequenz (kHz)
- Mode (SSB, FM, CW, etc.)
- Leistung (Watts)
- Korrespondent (optional)

**Retention**: 3 Monate empfohlen (nicht gesetzlich vorgeschrieben)

**Example Export**:
```csv
Datum,Zeit,Rufzeichen,Frequenz,Mode,Leistung,Korrespondent
2025-01-10,14:30,DD5BE,145.500,FM,5,DL1ABC
2025-01-10,15:00,DD5BE,7.050,SSB,100,ON4XY
```

---

## 🇪🇺 European Union - CE / RED

### Authority Information

**ETSI (European Telecommunications Standards Institute)**

- **Address**: 650 Route des Lucioles, 06921 Sophia Antipolis, France
- **Phone**: +33 4 92 94 42 00
- **Website**: https://www.etsi.org/

### Applicable Directive

#### **RED 2014/53/EU** (Radio Equipment Directive)

**Effective**: June 13, 2016 (replaced R&TTE Directive 1999/5/EC)

**Scope**: Placement of radio equipment on the EU market

**Essential Requirements**:
1. **Health & Safety** (Art. 3.1a): Protection of users and others
2. **EMC** (Art. 3.1b): Electromagnetic Compatibility
3. **Efficient Use of Spectrum** (Art. 3.2): No harmful interference

### Applicable Standards

| Standard | Title | Scope |
|----------|-------|-------|
| **EN 300 086** | Satellite Earth Stations | VSAT, Fixed Satellite |
| **EN 300 220** | Short Range Devices (SRD) | PMR446, RFID, ISM |
| **EN 300 328** | Wideband transmission | 2.4 GHz (Wi-Fi, Bluetooth) |
| **EN 301 489** | EMC für Funkgeräte | Generic EMC Standard |
| **EN 303 413** | 5 GHz RLAN | 5 GHz Wi-Fi |

### Conformity Assessment

**Module A (Internal Production Control)**: For Software-Defined Radio Software, no Notified Body required.

**Declaration of Conformity (DoC)**: Manufacturer must issue

**Example DoC**: See `regulatory/eu/CE_declaration_template.pdf`

### CE Marking

**Requirement**: CE mark must be affixed if hardware is distributed.

**Software-Only**: CE marking not required for pure software (OnAirMulTiMedia qualifies)

**Note**: If bundled with SDR hardware, hardware must be CE-certified separately.

---

## 🇺🇸 United States - FCC

### Authority Information

**Federal Communications Commission**

- **Address**: 45 L Street NE, Washington, DC 20554, USA
- **Phone**: +1 888-CALL-FCC (+1 888-225-5322)
- **Website**: https://www.fcc.gov/
- **Amateur Radio**: https://www.fcc.gov/wireless/bureau-divisions/mobility-division/amateur-radio-service

### Applicable Regulations

#### **Part 15** - Unlicensed Devices

**Scope**: Intentional & Unintentional Radiators

**§15.117**: Software Defined Radio (SDR)
- SDR software exempt from equipment authorization
- User responsible for ensuring hardware compliance
- **Manufacturer's Installation Instructions**: Must ensure end-user compliance

#### **Part 97** - Amateur Radio Service

**Scope**: Licensed Amateur Radio Operators

**Key Requirements**:
- **License Required**: Technician, General, or Extra Class
- **Callsign**: Issued by FCC, format W1ABC, K1ABC, etc.
- **Station License**: FCC Form 605
- **Identification**: Callsign must be transmitted at least every 10 minutes
- **Prohibited Transmissions**: Music, obscenity, business communications (limited exceptions)

### Frequency Allocations (USA)

| Band | Frequency Range | License Class | Max Power (PEP) | Notes |
|------|-----------------|---------------|-----------------|-------|
| **160m** | 1.800–2.000 MHz | All | 1500 W | - |
| **80m** | 3.500–4.000 MHz | All | 1500 W | - |
| **40m** | 7.000–7.300 MHz | All | 1500 W | - |
| **20m** | 14.000–14.350 MHz | All | 1500 W | - |
| **17m** | 18.068–18.168 MHz | General, Extra | 1500 W | - |
| **15m** | 21.000–21.450 MHz | All | 1500 W | - |
| **12m** | 24.890–24.990 MHz | General, Extra | 1500 W | - |
| **10m** | 28.000–29.700 MHz | All | 1500 W | - |
| **6m** | 50.0–54.0 MHz | All | 1500 W | - |
| **2m** | 144.0–148.0 MHz | All | 1500 W | - |
| **1.25m** | 222.0–225.0 MHz | All (Limited Regions) | 1500 W | Alaska only (Lower 48: 50 W) |
| **70cm** | 420.0–450.0 MHz | All | 1500 W | - |
| **33cm** | 902.0–928.0 MHz | All | 1500 W | Shared with ISM |
| **23cm** | 1240–1300 MHz | All | 1500 W | - |

**Technician**: VHF/UHF (above 30 MHz) + limited HF CW  
**General**: Most HF + all VHF/UHF  
**Extra**: Full privileges

### License Verification

**ULS (Universal Licensing System)**: https://wireless2.fcc.gov/UlsApp/UlsSearch/searchLicense.jsp

**API**: https://www.fcc.gov/developers (JSON, XML)

**Example Query**:
```bash
curl "https://data.fcc.gov/api/license-view/basicSearch/getLicenses?searchValue=KA1ABC"
```

### Log-Book Requirements

**Not Mandatory**: FCC does not require log books for amateur radio (as of 2004)

**Recommended**: For contest verification, QSL cards, and personal records

---

## 🇳🇱 Netherlands - Agentschap Telecom

### Authority Information

**Agentschap Telecom (AT)**

- **Address**: Emmasingel 1, 9726 AH Groningen, Netherlands
- **Phone**: +31 (0)88 - 7000 888
- **Email**: info@agentschaptelecom.nl
- **Website**: https://www.agentschaptelecom.nl/
- **Amateur Radio**: https://www.agentschaptelecom.nl/onderwerpen/zendamateur

### Applicable Laws

#### **Telecommunicatiewet**

**Scope**: General Telecommunications Law

**Relevance**: Spectrum Management, Licensing

#### **CEPT Recommendations**

**T/R 61-01**: CEPT Radio Amateur License
- **Recognition**: Valid in all CEPT countries (Europe + more)
- **Call**: PA/DD5BE (example: German license in Netherlands)

### Frequency Allocations (Netherlands)

**Same as Germany/EU**: ITU Region 1

**Key Differences**:
- **6m Band**: Only 50.0–52.0 MHz (wider than DE)
- **70cm**: 430–440 MHz (same as DE)

**PMR446 (License-Free)**:
- **Frequency**: 446.00625–446.19375 MHz (16 channels)
- **Power**: 0.5 W ERP
- **Modulation**: FM (12.5 kHz), DMR (Digital)
- **No License Required**

### License Verification

**Online Database**: https://www.agentschaptelecom.nl/onderwerpen/zendamateur/zoekmachine-zendamateurs

**Search**: By Callsign (e.g., PA3XYZ)

---

## 🌐 International - ITU

### Authority Information

**International Telecommunication Union (ITU)**

- **Headquarters**: Geneva, Switzerland
- **Website**: https://www.itu.int/

### Radio Regulations

**ITU-RR**: International Radio Regulations (Edition 2020)

**Scope**: Global frequency allocations, procedures, definitions

**Relevance**:
- **Article 5**: Frequency Allocations (by Region)
- **Article 25**: Amateur Service
- **Appendix 42**: Amateur Allocations

### ITU Regions

| Region | Coverage |
|--------|----------|
| **Region 1** | Europe, Africa, Middle East, Northern Asia |
| **Region 2** | Americas |
| **Region 3** | Asia-Pacific (excl. Northern Asia) |

**Note**: Different band allocations per region!

---

## 📊 Validation API

### Endpoint

```
POST /api/regulatory/validate
```

### Request Body

```json
{
  "user": {
    "callsign": "DD5BE",
    "license_class": "E",
    "jurisdiction": "DE"
  },
  "transmission": {
    "frequency": 145500000,
    "mode": "FM",
    "power": 5,
    "bandwidth": 12500,
    "duration_ms": 3000
  }
}
```

### Response

```json
{
  "allowed": true,
  "checks": [
    {
      "check": "license_valid",
      "passed": true,
      "source": "BNetzA Database",
      "verified_at": "2025-01-10T14:30:00Z"
    },
    {
      "check": "frequency_in_band",
      "passed": true,
      "band": "2m Amateur (144-146 MHz)",
      "allocation": "ITU Region 1, Primary"
    },
    {
      "check": "power_within_limits",
      "passed": true,
      "max_power": 750,
      "requested_power": 5,
      "unit": "Watts"
    },
    {
      "check": "mode_allowed",
      "passed": true,
      "allowed_modes": ["CW", "SSB", "FM", "DSTAR", "DMR", "C4FM"]
    },
    {
      "check": "bandwidth_legal",
      "passed": true,
      "max_bandwidth": 16000,
      "requested_bandwidth": 12500,
      "unit": "Hz"
    }
  ],
  "regulatory": {
    "jurisdiction": "DE-BNetzA",
    "band_plan": "ITU Region 1 VHF",
    "notes": [
      "Secondary service to broadcasting below 146 MHz",
      "Listen before transmit (collision avoidance)"
    ],
    "authority_contact": {
      "name": "Bundesnetzagentur",
      "email": "amateurfunk@bnetza.de",
      "phone": "+49 228 14-0"
    }
  },
  "audit": {
    "logged": true,
    "event_id": "evt_rf_tx_20250110_143000",
    "hash": "sha256:a1b2c3..."
  }
}
```

### Error Response

```json
{
  "allowed": false,
  "checks": [
    {
      "check": "license_valid",
      "passed": true
    },
    {
      "check": "frequency_in_band",
      "passed": false,
      "reason": "Frequency 100.5 MHz not allocated to Amateur Service",
      "nearest_amateur_band": "144-146 MHz (2m)"
    }
  ],
  "error": "Transmission not allowed: Frequency out of band",
  "action": "Change frequency to allocated amateur band"
}
```

---

## 📄 Export for Authorities

### Germany (BNetzA)

**Format**: CSV, PDF

**Template**: `regulatory/templates/BNetzA_logbook_export.csv`

**Fields**:
```csv
Datum,Zeit (UTC),Rufzeichen,Frequenz (kHz),Mode,Leistung (W),Korrespondent,Bemerkungen
2025-01-10,14:30,DD5BE,145500,FM,5,DL1ABC,"VHF QSO, S9+20dB"
```

**Generate**:
```bash
curl -X POST /api/audit/export \
  -H "Content-Type: application/json" \
  -d '{"jurisdiction":"DE-BNetzA","format":"csv","from":"2025-01-01","to":"2025-01-31"}' \
  -o BNetzA_export_202501.csv
```

### USA (FCC)

**Format**: ADIF (Amateur Data Interchange Format)

**Template**: `regulatory/templates/FCC_logbook_export.adi`

**Example**:
```
<STATION_CALLSIGN:5>KA1BC
<CALL:6>W1XYZ
<QSO_DATE:8>20250110
<TIME_ON:4>1430
<BAND:3>2m
<MODE:2>FM
<FREQ:7>145.500
<EOR>
```

### Netherlands (AT)

**Format**: Same as Germany (CSV)

---

## 🔒 Compliance Checklist

### Before TX (Transmission)

- [ ] Valid license verified (Callsign + Class)
- [ ] Frequency within allocated band
- [ ] Mode allowed for frequency
- [ ] Power within legal limits
- [ ] Bandwidth within limits
- [ ] Listen before transmit (collision avoidance)
- [ ] Station identification prepared (Callsign)

### During TX

- [ ] Monitor for interference
- [ ] Identify station regularly (every 10 min FCC, at start/end EU)
- [ ] Log TX parameters (Audit-Trail automatic)

### After TX

- [ ] Verify TX logged in Audit-Trail
- [ ] Check for reported interference
- [ ] Update QSL logs (optional)

### Periodic

- [ ] License renewal (typically 10 years, varies by country)
- [ ] Export logs for authorities (if requested)
- [ ] Software updates for band plan changes
- [ ] Hardware recalibration (if applicable)

---

## 📞 Emergency Contacts

| Country | Emergency Amateur Net | Frequency |
|---------|----------------------|-----------|
| 🇩🇪 Germany | DARC Notfunk | 3.760 MHz (LSB), 145.500 MHz (FM) |
| 🇺🇸 USA | ARES/RACES | Varies by region |
| 🇳🇱 Netherlands | VERON Noodnet | 3.760 MHz (LSB), 145.550 MHz (FM) |

**International Emergency**: 
- **Distress Call**: MAYDAY MAYDAY MAYDAY (voice)
- **CW Distress**: SOS SOS SOS (···---···)

---

## 📚 Further Resources

### Official Documents

- **ITU-RR**: https://www.itu.int/pub/R-REG-RR
- **BNetzA**: https://www.bundesnetzagentur.de/
- **FCC Part 97**: https://www.ecfr.gov/current/title-47/chapter-I/subchapter-D/part-97
- **ETSI Standards**: https://www.etsi.org/standards

### Band Plans

- **IARU Region 1**: https://www.iaru-r1.org/spectrum-and-band-plans/
- **ARRL Band Plan** (USA): http://www.arrl.org/band-plan
- **VERON** (Netherlands): https://www.veron.nl/

### License Study Materials

- **Germany**: https://www.darc.de/ (DARC Ortsverbände offer courses)
- **USA**: http://www.arrl.org/getting-licensed
- **Netherlands**: https://www.veron.nl/examen/

---

## ⚖️ Legal Disclaimer

**This document is for informational purposes only and does not constitute legal advice.**

Users must:
- Verify current regulations with authorities
- Obtain appropriate licenses before TX
- Comply with all local, national, and international laws
- Understand that regulations change over time

**OnAirMulTiMedia developers assume no liability for misuse or non-compliance.**

---

**Last Updated**: 2025-01-10  
**Version**: 1.0.0  
**Maintainer**: Raymond Demitrio Dr. Tel (DD5BE)

© 2025 ViewunitySystem / TEL Portal

