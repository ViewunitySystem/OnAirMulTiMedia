# HFRF Universal SDR Canvas Integration

## 🎨 WebTrit-Style Frontend für HFRF-SDR-System

Dieses System implementiert eine vollständige Canvas-Integration für das HFRF Universal SDR System mit folgenden Features:

### ✨ Features

- **Keine Mock-Inhalte**: Lädt echte HFRF-SDR-Daten zur Laufzeit
- **Gäste = Accounts**: Vollzugang ohne Login-Barrieren
- **Proxy-API**: CORS-freie Requests über `/api/proxy`
- **Royalty-Zählung**: Client-seitige Zählung mit Offline-Queue
- **Hover/Haptic Overlays**: Moderne UI-Interaktionen
- **Swipe-Hub**: Integration für Raymond Demitrio Tel
- **SDR/Tech-Bereich**: Echte HFRF-SDR-Assets

### 🚀 Quick Start

#### Windows
```bash
# Build und Start
scripts\build-canvas.bat
```

#### Linux/macOS
```bash
# Build und Start
chmod +x scripts/build-canvas.sh
./scripts/build-canvas.sh
```

#### Manual Build
```bash
# Build
cargo build --release

# Run
cargo run --release
```

### 📡 URLs

Nach dem Start sind folgende URLs verfügbar:

- **Canvas Integration**: http://localhost:8080/canvas-integration
- **Canvas App**: http://localhost:8080/canvas-app
- **Dashboard**: http://localhost:8080/
- **API Proxy**: http://localhost:8080/api/proxy

### 🔗 API Endpoints

| Endpoint | Method | Beschreibung |
|----------|--------|--------------|
| `/api/proxy` | GET/POST | Proxy für CORS-freie Requests |
| `/api/royalty` | POST | Royalty-Zählung |
| `/api/spectrum` | GET | Spektrumdaten |
| `/api/presets` | GET | SDR Presets |
| `/api/hardware/status` | GET | Hardware Status |
| `/api/transmit` | POST | TX-Steuerung |
| `/api/frequency` | POST | Frequenz-Steuerung |
| `/api/community/scan` | POST | Community Scan |
| `/api/community/report` | GET | Community Report |
| `/api/community/stats` | GET | Community Stats |
| `/api/community/details` | GET | Community Details |
| `/api/audit` | POST | Audit-Logging |

### 🎯 Canvas App Features

#### SDR Presets
- Amateur 2m SSB: 144.3 MHz
- FM Broadcast: 100.0 MHz
- DVB-T TV: 474.0 MHz
- Vodafone 3G: 2100.0 MHz
- **CB-Funk EU Standard**: 27.185 MHz (WebTrit-Swipe zwischen EU/UK Varianten)
- **PMR446 WebTrit-Swipe**: 446.0 MHz (8 Kanäle mit Swipe-Navigation)
- **FRS/GMRS WebTrit-Swipe**: 462.5 MHz (FRS/GMRS Kanäle mit Swipe-Wechsel)
- **APRS WebTrit-Swipe**: 144.8 MHz (Digipeater-Wechsel)
- **DMR WebTrit-Swipe**: 145.5 MHz (Talkgroup-Wechsel)
- **D-STAR WebTrit-Swipe**: 145.6 MHz (Repeater-Wechsel)
- **C4FM System Fusion WebTrit-Swipe**: 145.5 MHz (WIRES-X Node-Wechsel)

#### WebTrit-Swipe-Technik für alle Kommunikationsprotokolle
- **CB-Funk EU Standard**: Swipe zwischen EU Standard, EU Extended, UK CB
- **PMR446**: Swipe zwischen 8 Kanälen, CTCSS-Steuerung
- **FRS/GMRS**: Swipe zwischen FRS und GMRS Kanälen, Notfall-Kanal
- **APRS**: Swipe zwischen Digipeatern (WIDE1-1, WIDE2-2, RELAY)
- **DMR**: Swipe zwischen Talkgroups (1, 2, 9, 91, 92, 93, 310, 3100)
- **D-STAR**: Swipe zwischen Repeatern (A, B, C, Gateway)
- **C4FM**: Swipe zwischen WIRES-X Nodes (Local, Regional, National, International, Emergency)
- **Gesten**: Links/Rechts für Kanal-Wechsel, Hoch/Runter für Funktionen
- **Doppel-Tap**: Notfall-Kanal (Kanal 9 bei FRS/GMRS, Emergency Node bei C4FM)

#### Spektrumanalyse
- **Echte Spektrumdaten** vom HFRF-SDR-System (keine Mocks!)
- Live-Spektrum mit Canvas-Rendering
- Frequenz-Marker und Grid basierend auf echten Daten
- Real-time Updates alle 2 Sekunden
- Frequenz-spezifische Signalquellen-Erkennung
- **Erweiterte Protokoll-Erkennung**:
  - APRS (144.7-144.9 MHz)
  - DMR (145.4-145.6 MHz)
  - D-STAR (145.5-145.7 MHz)
  - C4FM (145.4-145.6 MHz)
  - LoRa (433, 868, 915 MHz)
  - WiFi 2.4 GHz (2400-2500 MHz)
  - WiFi 5 GHz (5000-6000 MHz)
  - Bluetooth (2400-2483 MHz)
  - Zigbee (2400-2483 MHz)
  - Z-Wave (868, 908 MHz)

#### Hardware Status
- Geräte-Status (Verbunden/Getrennt)
- Temperatur-Monitoring
- Leistungs-Monitoring
- Fähigkeiten-Anzeige

#### Royalty System
- Client-seitige Zählung
- Offline-Queue für Robustheit
- Session-basierte Tracking
- Server-API-Hooks vorbereitet

### 🔧 Konfiguration

Das System kann über `CanvasConfig` konfiguriert werden:

```rust
let config = CanvasConfig::new()
    .with_host("0.0.0.0")
    .with_port(8080)
    .with_webui_path("webui")
    .with_cors(true)
    .with_proxy(true)
    .with_royalty(true)
    .with_audit(true);
```

### 📁 Dateistruktur

```
hfrf-universal-sdr/
├── webui/
│   ├── canvas-integration.html    # Canvas Integration UI
│   ├── canvas-app.tsx            # React Canvas App
│   └── index.html                # Original Dashboard
├── src/
│   ├── web/
│   │   ├── api.rs                # API Endpoints
│   │   └── server.rs             # Canvas Server
│   └── main.rs                   # Main mit Canvas Integration
└── scripts/
    ├── build-canvas.sh           # Linux Build Script
    └── build-canvas.bat          # Windows Build Script
```

### 🎨 Canvas App Komponenten

#### HFRFSwipeHub
- Hauptkomponente für SDR-Preset-Management
- Live-Spektrum-Visualisierung
- Hardware-Status-Anzeige

#### SDRPresetPlayer
- Einzelne Preset-Steuerung
- Play/Pause-Funktionalität
- Frequenz-Anpassung
- **WebTrit-Swipe-Integration** für CB-Funk und verwandte Bereiche
- Touch/Mouse-Gesten für Kanal-Wechsel
- Doppel-Tap für Notfall-Kanäle

#### SpectrumVisualizer
- **Echte Spektrumdaten** vom HFRF-SDR-System
- Canvas-basierte Spektrum-Darstellung
- Real-time Updates alle 2 Sekunden
- Frequenz-Marker basierend auf echten Daten
- Frequenz-spezifische Signalquellen-Erkennung

#### HardwareStatusPanel
- Hardware-Status-Monitoring
- Temperatur und Leistung
- Fähigkeiten-Anzeige

### 🔍 Discovery System

Das System entdeckt automatisch:

1. **API Presets** von `/api/presets`
2. **Spektrumdaten** von `/api/spectrum`
3. **Hardware-Status** von `/api/hardware/status`
4. **Fallback-Presets** aus statischen Dateien

### 💰 Royalty System

#### Event-Typen
- `SDR_STREAM_START`: Stream gestartet
- `SDR_STREAM_HEARTBEAT`: Heartbeat (alle 15s)
- `SDR_STREAM_STOP`: Stream gestoppt
- `SDR_STREAM_COMPLETE`: Stream abgeschlossen

#### Offline-Queue
- Events werden in `localStorage` gespeichert
- Automatische Server-Synchronisation
- Robustheit bei Netzwerk-Problemen

### 🔒 Audit System

Alle Aktionen werden auditierbar protokolliert:

- Canvas-Interaktionen
- Preset-Aktivierungen
- Frequenz-Änderungen
- Hardware-Status-Änderungen
- Community-Scans

### 🌐 CORS-Handling

Das System bietet automatisches CORS-Handling:

1. **Direkte Requests** mit CORS-Support
2. **Proxy-Fallback** über `/api/proxy`
3. **Automatische Erkennung** von CORS-Problemen

### 📱 Mobile Support

- Touch-Events für Canvas-Interaktion
- Responsive Design
- Haptic Feedback (falls unterstützt)

### 🚀 Deployment

#### Lokal
```bash
cargo run --release
```

#### Docker (geplant)
```bash
docker build -t hfrf-canvas .
docker run -p 8080:8080 hfrf-canvas
```

#### Production
- HTTPS-Support
- Load Balancing
- Monitoring
- Logging

### 🔧 Troubleshooting

#### Canvas lädt nicht
1. Prüfe ob `webui/canvas-integration.html` existiert
2. Prüfe Browser-Konsole auf Fehler
3. Prüfe Server-Logs

#### API-Endpoints nicht erreichbar
1. Prüfe ob Server auf Port 8080 läuft
2. Prüfe CORS-Konfiguration
3. Teste Proxy-API

#### Hardware nicht erkannt
1. Prüfe COM-Port-Verbindung
2. Prüfe Hardware-Status-API
3. Prüfe Treiber-Installation

### 📚 Weitere Dokumentation

- [HFRF-SDR-DOKUMENTATION.md](../HFRF-SDR-DOKUMENTATION.md)
- [API-Dokumentation](../docs/api.md)
- [Hardware-Setup](../REAL_HARDWARE_SETUP.md)

### 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature-Branch
3. Implementiere Änderungen
4. Teste mit Canvas-Integration
5. Erstelle Pull Request

### 📄 Lizenz

Siehe [LICENSE](../LICENSE) für Details.

---

**HFRF Universal SDR Canvas Integration** - WebTrit-Style Frontend für professionelle SDR-Anwendungen.
