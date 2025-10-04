# Security Policy

## Supported Versions
`mainzero` branch; Releases mit SemVer-Tags.

## Reporting a Vulnerability
Bitte melde Sicherheitslücken **privat** via GitHub Security Advisory oder E-Mail an <security@example.org>.
Wir bestätigen innerhalb von 72h und veröffentlichen nach gemeinsamer Abstimmung Fix & Advisory.

## Build Safety
- CodeQL + `cargo audit` + `npm audit` in CI
- Keine Installer-Binaries im Repo – nur offizielle Quellen oder Releases mit Checksums