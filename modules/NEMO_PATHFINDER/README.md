# NEMO_PATHFINDER – Zeit‑/Pfad‑Kompass

Ein Kompass, der nach **Zielzeiten** und **Wegpunkten** steuert, nicht nach Norden.  
Einsatz: virtueller Nomade (keine Ortskenntnis), auditierbare Spurhaltung, Recovery‑Wege.

## Funktionen
- **Zeitführung**: ETA bis Zielzeitpunkt, Countdown‑Bögen (UI).  
- **Koordinaten**: Virtuelle oder reale Wegpunkte (lat/lon, label).  
- **Kürzeste Verbindung**: Heading/Bearing oder virtuelle Winkelzuordnung.  
- **Spurhaltung**: Drift‑Erkennung über Kommunikationsstatus/ETA.

## Schnittstellen (Data Contract)
**Input**
```json
{
  "target_time": "2025-10-01T12:00:00Z",
  "waypoints": [
    {"label":"A","lat":52.377,"lon":4.900},
    {"label":"B","lat":51.050,"lon":13.737},
    {"label":"C","lat":48.137,"lon":11.575}
  ],
  "current": { "idx": 0 },
  "license": "DD5BE-VALID",
  "comm_status": "online",
  "energy_budget_wh": 12.5,
  "signal_quality": 0.82
}
```

**Output**
```json
{
  "heading_deg": 106,
  "eta_iso": "2025-10-01T12:00:00Z",
  "status": "on_course",
  "advisory": "Bleibe auf Kurs; noch 12 Minuten",
  "audit_id": "evt_..."
}
```

## Socket‑Events
- Client → Server: `nemo:update` (Payload wie oben)
- Server → Client: `nemo:state` (Heading/ETA/Status/Advisory)
- Overlay: `audit:event` (DIRECTION_CHANGE, DRIFT_WARN, GOAL_REACHED …)

## Algorithmik (Kurz)
- **ETA**: `max(0, target_time - now)` → ISO.
- **Bearing** (real): sphärisch (Haversine‑Ableitung) → Grad [0..360].
- **Bearing** (virtuell): `360 / N * idx_to`.
- **Drift**: `comm_status != online` **oder** `eta==0` vor letztem Wegpunkt.

## Blueprints
- JSON: `public/blueprints/nemo_pathfinder.json` (schema‑konform, CI‑validierbar).

## UI
- Seite: `public/nomadic_swipe_nemo.html` – Canvas‑Kompass, Tabs (Zeit/Koordinaten/Trail/Recovery), Swipe‑Gesten.

## Exporte & Nachweis
- PDF/MD/JSON via `/api/audit/export?…` (optional `&signed=1`).
- Lizenz‑QR: `/api/license/qr.png?module=NEMO_PATHFINDER&license=DD5BE-QR-AUDIT-2025`.

## HIL‑Hooks
- Gyro/DeviceOrientation (Heading‑Korrektur)
- RF‑Schattenzonen (comm_status=degraded/offline)
- Auto‑Advance: Countdown → `current.idx++` (simulierbar)

## Checkliste
- [ ] Modul initialisiert korrekt
- [ ] Lizenzprüfung erfolgt lokal
- [ ] Signalpfad dokumentiert
- [ ] Recovery bei Fehler getestet

