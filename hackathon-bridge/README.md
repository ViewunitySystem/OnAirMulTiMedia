# OAMTM Hackathon Bridge

**Raymond Demitrio Dr. Tel - Externer Bridge Node + Audit-Overlay für OnAirMulTiMedia Hackathon-Testhub**

## 🚀 Features

- **Socket.IO Bridge** (`/bridge`) für Chat, Rooms, Presence, WebRTC-Signaling, File-Announcements
- **Audit-Overlay** (`/audit` + `/overlay.html`) mit Live-Events und Query-Funktion
- **REST-API**: Health, Rooms, Logs, Messages, Uploads, Files
- **SQLite (WAL)** für robuste, auditierbare Persistenz
- **Öffentlicher Test-Client** (`/client.html`) mit schwebendem Inlay-Player
- **Privacy-freundliches YouTube-Embed** (nocookie) und Sofort-Button für "Aurora – Diluculum"

## 🎯 Schwebender Inlay-Player

### ✨ Features des Inlay-Players:
- **Eigenes schwebendes Fenster** (draggable, resizable, Maximize/Restore und X zum Schließen)
- **URL-Eingabe** für beliebige Referenz-Host-Server
- **Share-to-Room**: per Socket-Event `inlay:open` werden alle Clients im Raum synchron geöffnet
- **Privacy-freundliches YouTube-Embed** (nocookie)
- **Sofort-Button** für "Aurora – Diluculum"

### 🎵 Aurora – Diluculum Integration:
- **Auto-Open** via `?aurora=1` URL-Parameter
- **Privacy-Enhanced YouTube Embed** mit `youtube-nocookie.com`
- **Automatisches Autoplay** und optimierte Parameter

## 🛠️ Installation & Start

```bash
# Abhängigkeiten installieren
npm install

# Server starten
npm start

# Entwicklung mit Auto-Reload
npm run dev
```

### 🌐 URLs nach dem Start:
- **Bridge**: http://localhost:8080
- **Overlay**: http://localhost:8080/overlay.html
- **Test-Client**: http://localhost:8080/client.html
- **Aurora Auto-Open**: http://localhost:8080/client.html?aurora=1

## 📋 Beispielablauf

### 1. Raum anlegen:
```bash
curl -X POST http://localhost:8080/api/rooms \
  -H 'Content-Type: application/json' \
  -d '{"name":"alpha","created_by":"admin"}'
```

### 2. Mit Test-Client verbinden:
1. **http://localhost:8080/client.html** öffnen
2. **User ID** eingeben (z.B. "alice")
3. **Room ID** setzen und **Join** klicken
4. **Nachrichten** senden
5. **Inlay öffnen** mit eigener URL oder "▶ Aurora – Diluculum"

### 3. Overlay beobachten:
1. **http://localhost:8080/overlay.html** in neuem Tab öffnen
2. **Live-Events** beobachten
3. **Filter** nach Typ oder Room anwenden

## 🔧 API Endpoints

### Health & Status
- `GET /api/health` - Server-Status
- `GET /api/rooms` - Alle Räume auflisten
- `POST /api/rooms` - Neuen Raum erstellen

### Audit & Logs
- `GET /api/logs` - Event-Logs mit Filtern
- `GET /api/messages` - Nachrichten eines Raums
- `GET /api/files` - Hochgeladene Dateien

### File Upload
- `POST /api/upload` - Datei hochladen
- `GET /uploads/:filename` - Datei abrufen

## 🌐 Socket.IO Events

### Bridge Namespace (`/bridge`)
- `room:join` / `room:leave` - Raum beitreten/verlassen
- `msg:send` - Nachricht senden
- `typing` - Tipp-Indikator
- `webrtc:offer/answer/ice` - WebRTC-Signaling
- `file:shared` - Datei mit Raum teilen
- **`inlay:open`** - Inlay im Raum öffnen
- **`inlay:close`** - Inlay schließen

### Audit Namespace (`/audit`)
- `audit:query` - Events abfragen
- `audit:event` - Live-Event-Stream

## 🎮 Inlay-Player Bedienung

### 🖱️ Mouse Controls:
- **Drag**: Toolbar zum Verschieben
- **Resize**: Fenster-Ränder zum Größe ändern
- **Maximize/Restore**: ⬜ Button
- **Close**: ✕ Button

### ⌨️ Keyboard Shortcuts:
- **Escape**: Inlay schließen
- **F11**: Vollbild (Browser)

### 📱 Touch Controls:
- **Swipe**: Toolbar zum Verschieben (Touch-Geräte)
- **Pinch**: Größe ändern (Touch-Geräte)

## 🔒 Sicherheit/Produktion

### Reverse Proxy Setup:
```nginx
# Nginx Konfiguration
location /hackathon-bridge/ {
    proxy_pass http://localhost:8080/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### Caddy Setup:
```caddyfile
hackathon-bridge.yourdomain.com {
    reverse_proxy localhost:8080
    header {
        Access-Control-Allow-Origin *
        Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Access-Control-Allow-Headers "Content-Type, Authorization"
    }
}
```

### Produktions-Empfehlungen:
- **JWT-Authentifizierung** vor Socket.IO und REST schalten
- **Rate Limits** und **CSRF-Protection** ergänzen
- **TLS-Terminierung** am Reverse Proxy
- **Database-Backups** für SQLite implementieren
- **Log-Rotation** für Audit-Events

## 🏗️ Docker Deployment

### Dockerfile:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

### Docker Compose:
```yaml
version: '3.8'
services:
  hackathon-bridge:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - PORT=8080
```

## 📊 Monitoring & Analytics

### Audit-Events überwachen:
- **Session-Öffnung/Schließung**
- **Room-Beitritte/Verlässe**
- **Nachrichten-Sendungen**
- **WebRTC-Signaling**
- **File-Uploads/Downloads**
- **Inlay-Öffnungen/Schließungen**

### Metriken sammeln:
- **Aktive Sessions**
- **Room-Aktivität**
- **Event-Rate**
- **File-Upload-Volumen**
- **Inlay-Nutzung**

## 🌍 Integration mit OnAirMulTiMedia

### Repository-Struktur:
```
OnAirMulTiMedia/
├── hfrf-universal-sdr/          # Haupt-SDR-System
├── hackathon-bridge/            # Bridge-System
│   ├── server.js
│   ├── package.json
│   ├── public/
│   │   ├── client.html
│   │   └── overlay.html
│   └── README.md
└── README.md
```

### Subfolder-Integration:
- **URL**: `https://yourdomain.com/hackathon-bridge/`
- **Proxy-Pass**: `/hackathon-bridge/` → `localhost:8080/`
- **Shared Assets**: Gemeinsame CSS/JS-Bibliotheken

## 🎯 Hackathon-Use-Cases

### 1. **Live-Demo & Testing**
- Entwickler können Features live testen
- Audit-Overlay für Debugging
- Inlay-Player für Multimedia-Demos

### 2. **Collaborative Development**
- Real-time Chat zwischen Entwicklern
- File-Sharing für Assets
- WebRTC für Video-Calls

### 3. **Community Events**
- Live-Streaming mit Inlay-Player
- Interactive Sessions
- Aurora – Diluculum für entspannte Atmosphäre

## 📞 Support & Kontakt

### 🌐 Links:
- **Website**: [tel1.nl](https://tel1.jouwweb.nl/servicesoftware)
- **Email**: [gentlyoverdone@outlook.com](mailto:gentlyoverdone@outlook.com)
- **GitHub**: [@ViewunitySystem](https://github.com/ViewunitySystem)
- **Spendenaktion**: [GoFundMe - Magnitudo](https://www.gofundme.com/f/magnitudo?utm_campaign=unknown&utm_medium=referral&utm_source=widget)

### 🎵 Playlists:
- **Spotify**: [Magnitudo Playlist](https://open.spotify.com/playlist/7BXr0cyoKuJSH6NUdPkrQ4)
- **YouTube**: [Magnitudo YouTube](https://www.youtube.com/watch?v=zoWHvD4S9UM&list=PLCE4Plp9QXA5y1yQDFd0l7Mrd-jZDKZZc)

---

**© 2025 Raymond Demitrio Dr. Tel - TEL & Gentlyoverdone**  
**OAMTM Hackathon Bridge - Universal Communication Platform**

*"Connecting developers through technology, music, and collaborative innovation."* 🌍📡🎵🤝
