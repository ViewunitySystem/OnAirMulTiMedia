# Open‑Core Manifest – OnAirMulTiMedia (OAMTM)

**Version**: v1.0.0‑audit  
**Branch**: mainzero  
**Kurztitel**: „Auditierbare Kommunikation in Raum & Zeit"

## §0 Ethos
**Communication is Peace.** Wir bauen Kommunikationsräume, die **prüfbar, heilbar und langfristig erinnerbar** sind. Keine Blackbox, kein Lock‑in.

## §1 Architekturblöcke
- **Bridge Node**: REST + WebSocket, Audit‑Events, Exporte (JSON/MD/PDF+QR), Ed25519‑Signatur.
- **Overlay**: Live‑Audit‑Stream (Events: COMM_INIT, LICENSE_CHECK, SIGNAL_TX, DRIFT_WARN …).
- **Info‑Board**: GitHub‑Metriken, Community‑Beiträge, Moderation mit `X-ADMIN-KEY`.
- **Blueprints**: JSON‑Schema‑validierte Modulbeschreibungen + Checklisten.

## §2 Event‑Taxonomie (Auszug)
- `COMM_INIT` – Kommunikation initialisiert  
- `LICENSE_CHECK` – Lizenzstatus geparst/geprüft  
- `DIRECTION_CHANGE` – Kurswechsel zw. Wegpunkten  
- `DRIFT_WARN` – Spurabweichung  
- `RECOVERY_TRIGGER` – Recovery aktiv  
- `GOAL_REACHED` – Zielpunkt/Zeit erreicht  
- `GITHUB_UPDATE` – Repo‑Zähler aktualisiert  

Alle Events erhalten **UTC‑Zeitstempel** (ISO 8601) und werden **idempotent** persistiert.

## §3 Export & Signatur
- **Exporte**: `/api/audit/export?format=json|md|pdf[&signed=1]`  
- **Public Key**: `/api/keys/public` (Ed25519, Key‑ID `oamtm-2025`)  
- **JSON/MD**: SHA‑256 + Base64‑Signatur im Body/Front‑Matter  
- **PDF**: Signaturfuß + QR mit Link auf JSON

## §4 Blueprint‑Kanon (v1)
- `GlobalMeetingClock` – Globale, auditierbare Meeting‑Codes (QR/Link).  
- `CanvasSwipe` – Swipe‑Gesten → UI‑State + Audit.  
- `RFValidationEngine` – RF‑Regeln pro Land, HIL‑Trigger.  
- `NEMO_PATHFINDER` – Zeit‑/Pfad‑Kompass für Nomaden.

Jedes Modul bringt: **interfaces**, **validation**, **regulatory**, **checklist**.

## §5 Regulatorik
Modulbezogene Referenzen im Blueprint (z. B. RDI NL, BNetzA).  
OAMTM liefert **keine Rechtsberatung**; Nachweispfade (Exporte/QR) sind **prüfbar**.

## §6 mainzero & Aether
> **mainzero** ist nicht nur ein Branch – es ist der Ursprung auditierter Wahrheit.  
> Der **Aether** vergisst nicht: OAMTM archiviert Stimmen – auditierbar, wiederherstellbar, unvergessen.

## §7 Community & Moderation
- Beiträge: `/api/contribs` (Anzeige nach Freigabe)  
- Admin‑Aktionen: `X-ADMIN-KEY`  
- Transparenz: Jede Moderation erzeugt ein Audit‑Event.

## §8 Lebenszyklus
- CI: `npm run ci:validate` prüft alle Blueprints.  
- Pages/Docs: optional `docs/` für Landing‑Page.  
- Webhooks: GitHub → `/api/github/webhook` (star, release) mit HMAC‑Prüfung.

—
© DD5BE – OnAirMulTiMedia
