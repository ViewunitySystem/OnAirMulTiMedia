# 🌐 OnAirMulTiMedia - Open-Core Manifest

**Universal SDR Platform with Audit-Trail & Regulatory Compliance**

---

## 📜 Document Control

| Property | Value |
|----------|-------|
| **Version** | 1.0.0-audit |
| **Date** | 2025-01-10 |
| **Author** | Raymond Demitrio Dr. Tel (DD5BE) |
| **Organization** | ViewunitySystem / TEL Portal |
| **License** | MIT (See LICENSE file) |
| **Regulatory Status** | Compliant (BNetzA, CE, FCC, RDI NL) |
| **Last Audit** | 2025-01-10 23:00 UTC |

---

## §1 Architektur

### 1.1 Systemübersicht

OnAirMulTiMedia ist eine universelle Software-Defined-Radio (SDR) Plattform mit integriertem Audit-Trail und Multi-Domain-Unterstützung.

**Kernkomponenten:**
1. **HFRF Universal SDR** - Basis-SDR-Engine
2. **Hackathon Bridge** - Kollaborations-Hub mit GitHub-Monitoring
3. **Global Meeting Clock** - Zeitzonen-synchronisierte Meetings
4. **Canvas Swipe** - Touch-optimierte UI/UX
5. **RF Validation Engine** - Regulatorische Compliance-Prüfung
6. **Backup & Recovery** - Versionierte Datensicherung

### 1.2 Technologie-Stack

```yaml
Languages:
  - Rust (Core SDR Engine)
  - JavaScript/Node.js (Backend, Bridge)
  - TypeScript/React (Frontend, Canvas)
  - Python (ML, Data Processing)
  - Shell Scripts (Automation)

Frameworks:
  - Express.js (REST API)
  - Socket.IO (Real-time Communication)
  - WebRTC (Peer-to-Peer)
  - SQLite (Audit Database)

Hardware Support:
  - HackRF One
  - RTL-SDR
  - BladeRF
  - LimeSDR
  - USRP
  - Generic USB Sound Cards

Protocols:
  - Amateur Radio: SSB, FM, CW, APRS, DMR, D-STAR, C4FM
  - Commercial: DVB-T, FM Broadcast
  - Mobile: 3G/4G Monitoring (Receive-only)
  - CB Funk: 27 MHz (EU Channels)
  - PMR446: 446 MHz (EU)
  - FRS/GMRS: 462 MHz (US, Receive-only)
```

### 1.3 Modulare Architektur

```
OnAirMulTiMedia/
├── core/                    # Core SDR Engine (Rust)
│   ├── modulation/          # AM, FM, SSB, CW
│   ├── protocols/           # APRS, DMR, D-STAR
│   └── hardware/            # Device Drivers
├── modules/                 # Feature Modules
│   ├── global-meeting-clock/
│   ├── canvas-swipe/
│   ├── rf-validation/
│   └── backup-recovery/
├── bridge/                  # Hackathon Bridge
│   ├── server/             # Node.js Backend
│   └── public/             # Frontend Assets
├── audit/                  # Audit System
│   ├── logs/               # Event Logs
│   ├── trails/             # Change History
│   └── reports/            # Audit Reports
└── regulatory/             # Compliance Docs
    ├── germany/            # BNetzA
    ├── eu/                 # CE, RED
    ├── usa/                # FCC
    └── netherlands/        # RDI NL
```

---

## §2 Audit-Trail System

### 2.1 Zweck

Jede Änderung, jede Transaktion und jedes Event wird **unveränderlich** protokolliert für:
- **Compliance**: Regulatorische Nachweispflichten
- **Security**: Intrusion Detection & Forensik
- **Development**: Change Management & Debugging
- **Community**: Transparente Open-Source-Governance

### 2.2 Event-Kategorien

| Kategorie | Beschreibung | Beispiele |
|-----------|-------------|-----------|
| `SYSTEM` | System-Events | Start, Shutdown, Config Changes |
| `USER` | User-Actions | Login, Logout, Settings |
| `RF` | RF-Transmissions | TX Start, TX End, Frequency, Power |
| `MODULE` | Module-Events | Load, Unload, Error |
| `AUDIT` | Audit-Events | Log Rotation, Export, Verification |
| `SECURITY` | Security-Events | Auth Fail, Permission Denied |
| `GITHUB` | GitHub-Events | Stats Update, Contribution |
| `COMMUNITY` | Community-Events | Message, File Upload, Moderation |

### 2.3 Audit-Log Format

```json
{
  "id": "evt_a1b2c3d4e5f6",
  "timestamp": "2025-01-10T23:00:00.000Z",
  "unix_ts": 1736550000000,
  "category": "RF",
  "type": "tx_start",
  "severity": "INFO",
  "session_id": "ses_user123_20250110",
  "user": {
    "id": "user123",
    "callsign": "DD5BE",
    "license_class": "E"
  },
  "payload": {
    "frequency": 145500000,
    "mode": "FM",
    "power": 5,
    "bandwidth": 12500,
    "duration_ms": 3000
  },
  "regulatory": {
    "license_verified": true,
    "frequency_allowed": true,
    "power_within_limits": true,
    "jurisdiction": "DE-BNetzA"
  },
  "hash": "sha256:a1b2c3...",
  "previous_hash": "sha256:z9y8x7...",
  "signature": "ed25519:sig..."
}
```

### 2.4 Chain-of-Trust

- **Hashing**: Jedes Event wird mit SHA-256 gehasht
- **Chaining**: Aktueller Hash verlinkt vorherigen Hash
- **Signing**: Optional Ed25519-Signatur für Nicht-Abstreitbarkeit
- **Immutability**: Logs sind append-only, keine Modifikation

### 2.5 Audit-API

```javascript
// Log Event
POST /api/audit/log
{
  "category": "RF",
  "type": "tx_start",
  "payload": { ... }
}

// Query Events
GET /api/audit/events?category=RF&from=2025-01-10&to=2025-01-11

// Export for Authorities
GET /api/audit/export?format=pdf&jurisdiction=DE-BNetzA

// Verify Integrity
POST /api/audit/verify
{
  "from_id": "evt_...",
  "to_id": "evt_..."
}
```

---

## §3 Lizenzierung & Compliance

### 3.1 Software-Lizenz

**MIT License** (siehe `LICENSE` Datei)
- ✅ Kommerzielle Nutzung erlaubt
- ✅ Modifikation erlaubt
- ✅ Distribution erlaubt
- ✅ Private Nutzung erlaubt
- ⚠️ Keine Garantie
- ⚠️ Keine Haftung

### 3.2 Regulatorische Compliance

#### 🇩🇪 Deutschland (BNetzA)

**Gesetz**: Amateurfunkgesetz (AFuG), Telekommunikationsgesetz (TKG)

**Anforderungen:**
- ✅ Amateurfunklizenz erforderlich für TX
- ✅ Rufzeichenpflicht (z.B. DD5BE)
- ✅ Log-Book-Pflicht (automatisch via Audit-Trail)
- ✅ Frequenzbereiche gemäß Frequenznutzungsplan
- ✅ Leistungsgrenzen beachten

**Kontakt:**
- Bundesnetzagentur (BNetzA)
- Referat 221 (Amateurfunk)
- Email: amateurfunk@bnetza.de
- Tel: +49 228 14-0

#### 🇪🇺 European Union (CE)

**Direktive**: RED 2014/53/EU (Radio Equipment Directive)

**Standards:**
- EN 300 086: Satellite Earth Stations
- EN 300 220: Short Range Devices (SRD)
- EN 300 328: Wideband transmission systems (2.4 GHz)
- EN 301 489: EMC für Funkgeräte

**Konformitätserklärung**: Siehe `regulatory/eu/CE_declaration.pdf`

#### 🇺🇸 United States (FCC)

**Regulations**: Part 15 (Unlicensed), Part 97 (Amateur Radio)

**Compliance:**
- Part 15.117: SDR Software Defined Radio
- Part 97: Amateur Radio Service
- Equipment Authorization: Nicht erforderlich für Software

**Kontakt:**
- Federal Communications Commission (FCC)
- Website: https://www.fcc.gov/

#### 🇳🇱 Netherlands (RDI NL)

**Gesetz**: Telecommunicatiewet

**Behörde**: Agentschap Telecom

**Anforderungen:**
- ✅ CEPT-Lizenz anerkannt
- ✅ Nutzung nach CEPT-Empfehlung T/R 61-01
- ✅ PMR446 frei nutzbar (446 MHz, 0.5W)

**Kontakt:**
- Agentschap Telecom
- Website: https://www.agentschaptelecom.nl/

### 3.3 Export Control

**Hinweis**: Software-Defined-Radio-Software kann Exportkontrollen unterliegen.

- **US ITAR**: Nicht anwendbar (zivile Nutzung)
- **EU Dual-Use**: Prüfung erforderlich bei Verschlüsselung
- **Wassenaar Arrangement**: Kategorie 5 Part 2

---

## §4 Regulatory Validation Engine

### 4.1 Zweck

Automatische Prüfung ob eine geplante RF-Transmission **legal** ist.

### 4.2 Validierungs-Pipeline

```javascript
const validation = await rfValidator.validate({
  user: {
    callsign: "DD5BE",
    license_class: "E",
    jurisdiction: "DE"
  },
  transmission: {
    frequency: 145500000,      // 145.5 MHz
    mode: "FM",
    power: 5,                   // 5 Watts
    bandwidth: 12500,           // 12.5 kHz
    duration_ms: 3000
  }
});

// Result:
{
  "allowed": true,
  "checks": [
    { "check": "license_valid", "passed": true },
    { "check": "frequency_in_band", "passed": true, "band": "2m Amateur" },
    { "check": "power_within_limits", "passed": true, "max_power": 750 },
    { "check": "mode_allowed", "passed": true },
    { "check": "bandwidth_legal", "passed": true }
  ],
  "regulatory": {
    "jurisdiction": "DE-BNetzA",
    "band_plan": "ITU-Region-1-VHF",
    "notes": "Secondary service, listen before transmit"
  }
}
```

### 4.3 Band Plans

**Datenbasis**: `regulatory/bandplans/`
- ITU Region 1 (Europa, Afrika, Naher Osten)
- ITU Region 2 (Americas)
- ITU Region 3 (Asien, Ozeanien)
- Nationale Abweichungen (z.B. Deutschland 70cm)

### 4.4 License Database

**Verifikation:**
- Deutschland: BNetzA Rufzeichendatenbank (öffentlich)
- USA: FCC ULS (Universal Licensing System)
- Niederlande: Agentschap Telecom Register
- International: QRZ.com API (optional)

---

## §5 Backup & Recovery

### 5.1 Backup-Strategie

**3-2-1 Regel:**
- **3** Kopien der Daten
- **2** verschiedene Medien
- **1** Off-Site Backup

### 5.2 Versionierung

```yaml
Backup-Schema:
  - Full: Täglich 03:00 UTC
  - Incremental: Stündlich
  - Snapshot: Vor jedem Release
  - Retention: 30 Tage Rolling, 12 Monate Monatlich

Versionierte Inhalte:
  - Konfigurationen
  - Audit-Logs
  - User-Settings
  - Module-State
  - License-Cache
```

### 5.3 Recovery-Szenarien

| Szenario | RTO (Recovery Time Objective) | RPO (Recovery Point Objective) |
|----------|-------------------------------|-------------------------------|
| Config-Loss | < 5 Minuten | Last Snapshot |
| Module-Failure | < 10 Minuten | Last Full Backup |
| Complete System Loss | < 1 Stunde | < 24 Stunden |
| Audit-Log Corruption | < 30 Minuten | Last Valid Hash |

---

## §6 Community & Governance

### 6.1 Contribution Guidelines

**Workflow:**
1. Fork Repository
2. Create Feature Branch (`feature/my-feature`)
3. Commit with Conventional Commits (`feat:`, `fix:`, `docs:`)
4. Write Tests
5. Update Audit-Trail Documentation
6. Submit Pull Request
7. Code Review & Approval
8. Merge to `main`

### 6.2 Code of Conduct

Wir folgen dem [Contributor Covenant](https://www.contributor-covenant.org/).

**Kernprinzipien:**
- Respektvolle Kommunikation
- Konstruktives Feedback
- Inklusivität & Diversität
- Keine Diskriminierung

### 6.3 Moderation

**Community-Beiträge** (via `/api/contribs`) werden moderiert:
- Spam-Filter
- Content-Guidelines
- Admin-Approval erforderlich
- XSS-safe Rendering

---

## §7 CI/CD & Testing

### 7.1 Continuous Integration

**GitHub Actions Workflows:**
- `ci.yml`: Build, Test, Lint auf Push
- `audit.yml`: Audit-Trail Verification täglich
- `security.yml`: Dependency Scanning wöchentlich
- `release.yml`: Automatisches Tagging & Release

### 7.2 Test-Strategie

```yaml
Unit Tests:
  - Core SDR Functions
  - Modulation/Demodulation
  - Protocol Encoders/Decoders
  Coverage: > 80%

Integration Tests:
  - Hardware Mock Interfaces
  - API Endpoints
  - WebSocket Events
  Coverage: > 70%

E2E Tests:
  - Full TX/RX Cycle
  - UI/UX Interactions
  - Regulatory Validation
  Coverage: Critical Paths

Regulatory Tests:
  - License Validation
  - Frequency Band Checks
  - Power Limit Enforcement
  Coverage: 100%
```

### 7.3 Quality Gates

**Merge Requirements:**
- ✅ All Tests Pass
- ✅ Code Coverage ≥ 80%
- ✅ No Linter Errors
- ✅ Audit-Trail Updated
- ✅ Documentation Updated
- ✅ 1 Peer Review Approval

---

## §8 Security

### 8.1 Threat Model

**Risiken:**
- Unauthorized RF Transmission (Legal Risk)
- Sensitive Data Exposure (Audit Logs, User Credentials)
- Code Injection (XSS, SQL Injection)
- Denial of Service (RF Jamming, API Overload)

### 8.2 Mitigations

```yaml
Authentication:
  - Callsign + License Verification
  - API Keys für Automation
  - Ed25519 für Signaturen

Authorization:
  - RBAC (Role-Based Access Control)
  - License-Class-Gated Features
  - Admin-Key für Moderation

Input Validation:
  - Frequency Bounds Checks
  - Power Limits Enforcement
  - XSS Prevention (textContent)
  - SQL Injection Prevention (Prepared Statements)

Logging & Monitoring:
  - All Security Events Audited
  - Failed Auth Attempts Logged
  - Anomaly Detection (Unusual TX Patterns)
```

### 8.3 Vulnerability Disclosure

**Responsible Disclosure:**
- Email: gentlyoverdone@outlook.com
- GPG Key: (siehe `SECURITY.md`)
- Response Time: < 48 Stunden
- Fix Timeline: < 7 Tage (Critical), < 30 Tage (Medium)

---

## §9 Versioning & Releases

### 9.1 SemVer

Wir folgen [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH[-LABEL]

Beispiele:
- 1.0.0-audit    (Initial Audit Release)
- 1.1.0-beta     (Feature Addition, Beta)
- 1.1.1          (Bugfix)
- 2.0.0          (Breaking Change)
```

### 9.2 Release-Zyklus

- **Alpha**: Interne Tests
- **Beta**: Community Tests
- **RC (Release Candidate)**: Feature-Freeze, nur Bugfixes
- **Stable**: Production-Ready

### 9.3 Changelog

Siehe `CHANGELOG.md` für vollständige Release-Notes.

---

## §10 Contact & Support

### 10.1 Maintainer

**Raymond Demitrio Dr. Tel**
- **Callsign**: DD5BE
- **Email**: gentlyoverdone@outlook.com
- **Website**: https://tel1.jouwweb.nl/servicesoftware
- **GitHub**: @ViewunitySystem
- **Location**: Netherlands

### 10.2 Community

- **GitHub Issues**: Bug Reports, Feature Requests
- **GitHub Discussions**: Community Forum
- **Matrix**: Real-time Chat (Coming Soon)
- **Hackathon Bridge**: Live Development Hub

### 10.3 Donations

Freiwillige Zuwendungen:
- **GoFundMe**: https://www.gofundme.com/f/magnitudo
- **Bank**: IBAN auf Anfrage
- **Crypto**: (Coming Soon)

*Keine Rechts- oder Steuerberatung. Lokale Vorgaben prüfen.*

---

## §11 Acknowledgments

### 11.1 Dependencies

- **GNU Radio**: DSP Blocks
- **SoapySDR**: Hardware Abstraction
- **Express.js**: REST API
- **Socket.IO**: Real-time Communication
- **better-sqlite3**: Audit Database

### 11.2 Inspiration

- **OpenWebRX**: Web-based SDR Receiver
- **SDRangel**: Multi-Platform SDR Software
- **GQRX**: Amateur Radio SDR Receiver
- **WebSDR**: Online SDR Network

### 11.3 Standards & Specifications

- **ITU Radio Regulations**
- **ETSI Standards** (EN 300 series)
- **FCC Regulations** (Part 15, Part 97)
- **IEEE 802.11** (Wi-Fi)
- **WebRTC** (W3C/IETF)

---

## §12 Future Roadmap

### 12.1 Planned Features

**Q1 2025:**
- ✅ Audit-Trail System (✓ Complete)
- ✅ GitHub Info Dashboard (✓ Complete)
- 🔄 Global Meeting Clock (In Progress)
- 🔄 Canvas Swipe UI (In Progress)
- 📋 RF Validation Engine (Planned)

**Q2 2025:**
- AI-Powered Signal Classification
- Automatic QSO Logging
- Integration mit QRZ.com, LoTW
- Mobile App (Android/iOS)

**Q3 2025:**
- Satellite Tracking & Doppler Correction
- APRS iGate Functionality
- DMR/D-STAR Hotspot Mode
- Mesh Networking (Meshtastic Integration)

**Q4 2025:**
- ML-based Noise Reduction
- Automatic Station Identification (SSTV, CW)
- Multi-User Collaboration Features
- Cloud SDR Backend

### 12.2 Research Areas

- **Quantum-Safe Cryptography** für Audit-Signaturen
- **Blockchain** für dezentrales Audit-Log
- **AI/ML** für autonome Frequency Coordination
- **Edge Computing** für Low-Latency RF Processing

---

## §13 Legal Disclaimer

**IMPORTANT**: This software enables radio frequency transmission. Users are 
responsible for:

1. **Obtaining appropriate licenses** (Amateur Radio, Commercial, etc.)
2. **Compliance with local regulations** (BNetzA, FCC, RDI NL, etc.)
3. **Respecting frequency allocations** (ITU Band Plans)
4. **Avoiding interference** with licensed services
5. **Maintaining accurate logs** (as required by law)

**The developers assume no liability for:**
- Illegal transmissions
- Interference with critical services (Aviation, Emergency, etc.)
- License violations
- Regulatory fines or penalties

**USE AT YOUR OWN RISK.**

---

## §14 Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0-audit | 2025-01-10 | Initial Manifest with Audit System | Raymond Demitrio Dr. Tel |
| - | - | - | - |

---

**End of Manifest**

© 2025 Raymond Demitrio Dr. Tel - ViewunitySystem / TEL Portal  
Licensed under MIT License  
OnAirMulTiMedia - Universal SDR Platform with Audit-Trail & Regulatory Compliance

*"Connecting the world through technology, compliance, and community."* 🌍📡🎵🤝

