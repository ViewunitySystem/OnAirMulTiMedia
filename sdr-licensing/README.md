# Integriertes SDR-Lizenzpaket: Kurs • Prüfung • Antrag • Compliance

> **Ziel:** Vollautomatisierte, auditierbare Lizenzierungsplattform für SDR, die Kurs, Prüfung, Zertifizierung und Antragsabwicklung vereint.

## 🎯 Architektur-Übersicht

Das System stellt eine durchgängige Lizenzierungsumgebung bereit:

- **📚 Kursmodul**: Interaktive Lerninhalte zu Technik, Frequenzrecht, Ethik und Betrieb
- **📝 Prüfungsmodul**: Adaptive Tests mit automatischer Auswertung und Audit-Trail
- **🏆 Zertifizierungsmodul**: Ausstellung signierter Zertifikate (JSON/PDF) mit QR-Verifikation
- **📋 Lizenzantrag**: Automatisierte Formularerstellung und Übergabe an zuständige Behörden
- **👥 Community-Governance**: Regelmäßige Pflege von Kursinhalten und Prüfungsfragen

## 🏗️ Systemarchitektur

```
sdr-licensing/
├── learning-platform/      # LMS & Schulungsplattform
├── exam-system/           # Prüfungssystem mit Video-Ident
├── certification/         # Zertifikats- & Lizenzverwaltung
├── community-hub/         # Community & Governance
├── lifecycle-management/  # Re-Zertifizierung & Lifecycle
├── compliance-audit/      # Compliance & Audit-System
├── schemas/              # JSON-Schemas & Datenmodelle
├── templates/            # Dokumentations-Templates
└── diagrams/             # PlantUML-Architekturdiagramme
```

## 🔒 Compliance und Sicherheit

### Datenschutz (EU-Fokus)
- Minimierung personenbezogener Daten
- Klare Aufbewahrungsfristen
- DSGVO-konforme Einwilligungsverwaltung
- Recht auf Vergessenwerden technisch umsetzbar

### Security Layer
- mTLS durchgängig
- Kurzlebige Tokens mit Scope-Bindung
- Audit-Logging mit Hash-Ketten
- WORM-Speicher für Evidenzen

### Integritätsprüfungen
- Hash-Ketten für tamper-evident Logs
- Digitale Signaturen für alle Zertifikate
- Re-Validierung von Zertifikaten
- SBOM-Verifikation für Supply Chain

### Barrierefreiheit
- Screenreader-Kompatibilität
- Untertitel in mind. 2 Sprachen
- Alternative Texte für alle Medien
- Tastatur-Navigation vollständig

## 🎓 Lernpfade & Profile

### Lizenz-Profile
| Profil | Beschreibung | Proctoring | TX-Freischaltung |
|--------|--------------|------------|------------------|
| **A (Streng)** | Live-Proctoring Pflicht, E-ID Ident | Vollständig | Nach behördlicher Genehmigung |
| **B (Standard)** | Trust-but-Verify + Stichprobe | Optional | Nach Zertifikat + Antrag |
| **C (Lernfreundlich)** | Kein Proctoring, nur Integrität | Minimal | Nur RX-Modus |

### Lernpfade
- **Grundlagen SDR & Frequenzrecht**
- **Technische Module** (Signalverarbeitung, Modulation, Antennentechnik)
- **Recht & Betrieb** (Frequenznutzung, Compliance, Ethik)
- **Praxisübungen** (RX-Only-Lab, Spektrum-Analyzer-Simulation)

## 🔄 Prozessfluss

1. **Registrierung** → Profil-Auswahl → Kurs-Zugang
2. **Kursabschluss** → Prüfungs-Zulassung
3. **Prüfung** → Automatische Auswertung → Zertifikat
4. **Lizenzantrag** → Automatische Generierung → Behördeneinreichung
5. **Freischaltung** → TX-Gate aktiviert lizenzierte Profile

## 📊 Lifecycle-Management

### Lizenzzyklen
| Lizenztyp | Gültigkeit | Re-Zertifizierung | Aktualisierung |
|-----------|------------|-------------------|----------------|
| SDR-Basic | 3 Jahre | Alle 3 Jahre | Theorie + Recht (kompakt) |
| SDR-Advanced | 2 Jahre | Alle 2 Jahre | Technik + Compliance |
| SDR-Instructor | 1 Jahr | Jährlich | Pädagogik + Auditverfahren |

### Re-Zertifizierung
- Automatische Erinnerung 60/30/7 Tage vor Ablauf
- Kürzere Prüfung oder Praxis-Audit
- Neues Zertifikat ersetzt altes
- Audit-Trail bleibt erhalten

## 🎛️ TX-Gate Integration

### SDR-Profile nach Zertifizierung
```yaml
sdr-basic:
  bands: ["2m", "70cm"]
  power-limit: "5W"
  modes: ["FM", "CW"]
  
sdr-advanced:
  bands: ["160m", "80m", "40m", "20m", "15m", "10m", "2m", "70cm"]
  power-limit: "100W"
  modes: ["CW", "SSB", "FM", "DIGITAL"]
  
sdr-instructor:
  bands: "ALL"
  power-limit: "1000W"
  modes: "ALL"
  special-permissions: ["teaching", "examination"]
```

## 📈 KPIs & Monitoring

### Erfolgskennzahlen
| Kategorie | Kennzahl | Zielwert |
|-----------|----------|----------|
| Kursabschlüsse | Abschlussquote pro Kurs | ≥ 85% |
| Prüfungsdurchläufe | Erfolgsquote pro Profil | 70-90% |
| Re-Zertifizierungen | Fristgerechte Verlängerungen | ≥ 95% |
| Community-Aktivität | Beiträge / Monat | ≥ 20 |
| Barrierefreiheit | Erfüllung WCAG 2.1 | 100% |

### SLOs/SLAs
- **Media-Session Setup**: p95 < 10s
- **Signatur-/Evidenz-Latenz**: p95 < 5s
- **Certificate Issue**: < 30s nach Ergebnis-Sign-Off
- **License Sync**: Status-Update ≤ 15min

## 🔍 Auditierbarkeit

Jeder Schritt erzeugt prüfbare Evidenzen:

- **Kursabschlüsse** mit Zeitstempeln und Fortschrittsnachweisen
- **Prüfungsprotokolle** und Scores mit digitaler Signatur
- **Zertifikats-Hashes** und Signaturen für Verifikation
- **Lizenz-Workflow-Protokolle** mit vollständigem Audit-Trail
- **Community-Änderungen** versioniert und signiert

## 🌍 Regionale Anpassungen

### EU-Strict (Deutschland)
- DSGVO-konforme Datenaufbewahrung
- E-ID Integration für Identitätsnachweis
- Strenge Proctoring-Anforderungen
- Behördliche Einbindung über OZG

### US-Strict
- SOX/HIPAA-Compliance
- FIPS 140-2 Verschlüsselung
- Extended Retention (7 Jahre)
- State-spezifische Anpassungen

### Global-Standard
- ISO 27001-konform
- Minimal invasive Datenerhebung
- Flexible Proctoring-Modi
- Internationale Barrierefreiheit

## 🚀 Quick Start

```bash
# SDR-Lizenzsystem starten
./sdr-licensing/scripts/start-licensing-platform.sh

# Kurs-Katalog anzeigen
./sdr-licensing/learning-platform/show-courses.sh

# Prüfung durchführen
./sdr-licensing/exam-system/take-exam.sh --profile B --course sdr-basic

# Zertifikat verifizieren
./sdr-licensing/certification/verify-certificate.sh --cert-id CERT-12345

# TX-Gate Status prüfen
./sdr-licensing/certification/check-tx-permissions.sh --user-id USER-67890
```

## 📞 Support & Governance

### Rollen & Verantwortlichkeiten
- **Program Lead**: Gesamtkoordination und strategische Ausrichtung
- **Instructional Designer**: Kursentwicklung und Content-Management
- **Exam Committee**: Prüfungsfragen und Qualitätssicherung
- **Compliance Officer**: Rechtliche Konformität und Audit
- **Community Board**: Governance und Community-Management

### Kommunikationswege
- **Incident-Handling**: Secure Chat + Incident Portal
- **Community**: Forum + Newsletter
- **Updates**: Dashboard + E-Mail-Benachrichtigungen
- **Support**: Ticket-System + Knowledge Base

---

**Build:** 2025-10-04T161800Z UTC  
**Version:** 1.0.0  
**Status:** Production Ready ✅  
**Compliance:** EU-DSGVO, ISO 27001, WCAG 2.1 AA
