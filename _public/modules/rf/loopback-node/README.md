# RF Loopback-Node (Auditierbares Modul)

Ein minimales RF-Modul, das die **Audio-Loopback-Kette** (Mikrofon → Verarbeitung → Ausgabe) demonstriert, samt **Audit-Flags**, **Compliance-Feldern** und **CI/CD-Hooks**.

## Ziele
- Offen, auditierbar, CI-fähig
- CSP-konforme Web-UI (keine Inline-Skripte/Styles)
- Lern- & Audit-Artefakte (Learning Log, Audit Export)

## Schnellstart
- Öffne `ui/security-status.html` im Browser → Live-Indikatoren
- Fülle `data/audit-export.template.md` → als PDF drucken/archivieren

## Compliance
- RDI-NL ✓ • Referat 226 ✓ • BNetzA ✓ (als Platzhalterfelder; echte Einreichungen separat)

## CI/CD
- GitHub Action: `rf-loopback-ci.yml` prüft Blueprint, UI-Smoke und erzeugt Audit-Artefakte
