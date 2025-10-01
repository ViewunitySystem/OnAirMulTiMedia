# Audit‑Trail – Beispiel (NEMO)

Zeitstempel in **UTC**; Exportwege: JSON/MD/PDF (signiert) → siehe MANIFEST §3.

| time (UTC)              | level | type              | module           | payload |
|---|---|---|---|---|
| 2025-10-01T08:42:00Z    | info  | COMM_INIT         | NEMO_PATHFINDER  | {"session":"alpha"} |
| 2025-10-01T08:42:05Z    | info  | LICENSE_CHECK     | NEMO_PATHFINDER  | {"license":"DD5BE-VALID"} |
| 2025-10-01T08:43:10Z    | info  | DIRECTION_CHANGE  | NEMO_PATHFINDER  | {"from":"A","to":"B","heading_deg":106} |
| 2025-10-01T08:47:22Z    | warn  | DRIFT_WARN        | NEMO_PATHFINDER  | {"comm_status":"degraded"} |
| 2025-10-01T08:55:00Z    | info  | SIGNAL_TX         | NEMO_PATHFINDER  | {"eta_iso":"2025-10-01T09:00:00Z"} |
| 2025-10-01T09:00:00Z    | info  | GOAL_REACHED      | NEMO_PATHFINDER  | {"wp":"C"} |

**Programmatischer Export**
- JSON: `/api/audit/export?format=json&type=DIRECTION_CHANGE&limit=200&signed=1`
- Markdown: `/api/audit/export?format=md&type=NEMO_PATHFINDER`
- PDF (mit QR & Signaturfuß): `/api/audit/export?format=pdf&title=NEMO%20Trail&signed=1`

**Verifikation**
- Public Key: `/api/keys/public` (Ed25519, Key‑ID `oamtm-2025`)
- Prüfsumme: SHA‑256 über Rohdaten; Signatur: Base64 (siehe JSON‑Feld `signature`).

