# GlobalMeetingClock – Globale Meeting-Synchronisation

Auditierbare Meeting-Koordination über Zeitzonen hinweg mit QR-Code-basiertem Zugang.

## Funktionen
- **Zeitzone-Synchronisation**: Automatische Konvertierung zwischen Zeitzonen
- **QR-Code-Generation**: Meeting-Links als QR-Code
- **Audit-Trail**: Jede Meeting-Erstellung wird geloggt
- **Multi-User**: Unterstützt mehrere Teilnehmer gleichzeitig

## Schnittstellen (Data Contract)

**Input**
```json
{
  "meeting_title": "OAMTM Status Call",
  "start_time": "2025-10-01T14:00:00Z",
  "duration_minutes": 60,
  "timezone": "Europe/Berlin",
  "participants": ["DD5BE", "User2"],
  "license": "DD5BE-VALID"
}
```

**Output**
```json
{
  "meeting_id": "mtg_abc123",
  "qr_code_url": "/api/meeting/qr.png?id=mtg_abc123",
  "join_url": "https://oamtm.example/meeting/mtg_abc123",
  "local_time": "2025-10-01T16:00:00+02:00",
  "audit_id": "evt_xyz789"
}
```

## Socket-Events
- Client → Server: `meeting:create`
- Server → Client: `meeting:created`
- Broadcast: `meeting:reminder` (5min vor Start)

## Algorithmus
- **Zeitzone-Konvertierung**: UTC → Local mit IANA timezone database
- **QR-Generation**: Meeting-URL encoded als QR (200x200px)
- **Reminder-System**: Scheduled notifications via setTimeout

## Blueprints
- JSON: `blueprints/global_meeting_clock.json`

## UI Integration
- Geplant für: `timemanagement-integration.html`
- WebTrit Swipe: Swipe für Zeitzone-Wechsel

## Exporte & Nachweis
- Meeting-Log via `/api/audit/export?type=MEETING_CREATE`
- QR-Code: `/api/meeting/qr.png?id=<MEETING_ID>`

## Checkliste
- [ ] Modul initialisiert korrekt
- [ ] Zeitzone-Datenbank aktuell
- [ ] QR-Generierung funktional
- [ ] Audit-Trail aktiv

