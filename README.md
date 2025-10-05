# 📦 OnAir MultiMedia System – Vollständige Architektur

## 🎯 Übersicht

Vollständig funktionsfähige OnAir MultiMedia Architektur mit:
- **Cloudflare Worker** (Edge-Gateway mit Self-Healing)
- **Firebase Functions** (Core-API mit Primary/Backup)
- **WebSocket Signaling** (Durable Objects für Rooms)
- **Live Overlay-Widget** (OBS Browser Source)
- **TURN/STUN Server** (WebRTC NAT-Traversal)

## 🏗️ Architektur-Diagramm

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Cloudflare      │    │  Firebase       │
│   (GitHub Pages)│◄──►│  Worker (Edge)   │◄──►│  Functions      │
│                 │    │  - Self-Healing  │    │  - Primary      │
│                 │    │  - CORS          │    │  - Backup       │
│                 │    │  - WebSocket     │    │  - Firestore    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  TURN/STUN       │
                       │  Server           │
                       │  (coturn)         │
                       └──────────────────┘
```

## 🚀 Quick Start

### 1. Repository Setup
```bash
git clone <repository-url>
cd onair-multimedia
npm install
```

### 2. Cloudflare Worker Setup
```bash
# Wrangler installieren
npm install -D wrangler

# Worker deployen
npx wrangler deploy

# Secrets setzen
npx wrangler secret put PRIMARY_BASE
npx wrangler secret put BACKUP_BASE
npx wrangler secret put TURN_SHARED_SECRET
```

### 3. Firebase Functions Setup
```bash
# Firebase CLI installieren
npm install -g firebase-tools

# Firebase initialisieren
firebase init functions

# Dependencies installieren
cd functions
npm install firebase-admin firebase-functions express cors

# Deployen
firebase deploy --only functions
```

### 4. Frontend Deploy
```bash
# GitHub Pages aktivieren
# Repository Settings → Pages → Source: GitHub Actions

# Oder Cloudflare Pages
# Pages → Create Project → Connect Repository
```

## 📁 Projektstruktur

```
onair-multimedia/
├── src/
│   ├── worker.js              # Cloudflare Worker (Edge)
│   └── rooms-do.js            # Durable Objects (WebSocket)
├── functions/
│   ├── index.js               # Firebase Functions (Core)
│   └── package.json
├── public/
│   ├── index.html             # Hauptanwendung
│   ├── overlay.html           # OBS Browser Source
│   ├── client.html            # Demo-Client
│   └── config.js              # Frontend-Konfiguration
├── wrangler.toml              # Cloudflare Worker Config
├── firebase.json              # Firebase Config
└── README.md                  # Diese Datei
```

## ⚙️ Konfiguration

### Cloudflare Worker (wrangler.toml)
```toml
name = "onair-edge"
main = "src/worker.js"
compatibility_date = "2024-10-05"
workers_dev = false

route = { pattern = "api.<deine-domain>", custom_domain = true }

[placement]
mode = "smart"

[vars]
ALLOWED_ORIGINS = "https://viewunitysystem.github.io,https://<deine-domain>"
TURN_REALM = "turn.<deine-domain>"

[[durable_objects.bindings]]
name = "ROOMS"
class_name = "RoomsDO"

[[migrations]]
name = "rooms-do-v1"
durable_objects = [
  { name = "ROOMS", class_name = "RoomsDO" }
]
```

### Firebase Functions (functions/index.js)
```javascript
import functions from 'firebase-functions';
import admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';

admin.initializeApp();
const db = admin.firestore();
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Health Check
app.get('/health', async (_req, res) => {
  try {
    await db.collection('_health').doc('ping').set({ ts: admin.firestore.Timestamp.now() }, { merge: true });
    res.json({ ok: true, region: process.env.FUNCTION_REGION || 'default' });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Status
app.get('/status', async (_req, res) => {
  const snap = await db.collection('status').doc('kpis').get();
  const data = snap.exists ? snap.data() : {};
  res.json({
    uptimeSec: process.uptime() | 0,
    appsOnline: data.appsOnline || 1,
    modulesLoaded: (data.modulesLoaded || []).length,
    lastDeploy: data.lastDeploy || new Date().toISOString(),
  });
});

// Metrics
app.get('/metrics', async (_req, res) => {
  const m = (await db.collection('metrics').doc('public').get()).data() || {};
  res.json({
    stars: m.stars || 0,
    forks: m.forks || 0,
    releases: m.releases || 1,
    downloads: m.downloads || 0,
    updatedAt: new Date().toISOString(),
  });
});

export const api = functions.region('europe-west1').https.onRequest(app);
```

### Frontend Config (public/config.js)
```javascript
export const API_BASE_URL = 'https://api.<deine-domain>';
export const WS_BASE_URL = 'wss://api.<deine-domain>/ws';

const j = (p) => fetch(`${API_BASE_URL}${p}`).then((r) => r.json());

export async function refreshTiles() {
  const [status, metrics] = await Promise.all([j('/status'), j('/metrics')]);
  console.log('Status:', status, 'Metrics:', metrics);
}

export function startRoom(room = 'global') {
  const ws = new WebSocket(`${WS_BASE_URL}?room=${encodeURIComponent(room)}`);
  ws.onmessage = (e) => console.log('WS:', e.data);
  ws.onopen = () => ws.send(JSON.stringify({ type: 'hello', ts: Date.now() }));
  return ws;
}
```

## 🔧 Deployment-Schritte

### A. Cloudflare Worker (Edge-Gateway)

1. **Wrangler installieren**
   ```bash
   npm i -D wrangler
   ```

2. **Worker deployen**
   ```bash
   npx wrangler deploy
   ```

3. **Secrets setzen**
   ```bash
   npx wrangler secret put PRIMARY_BASE
   # Eingabe: https://europe-west1-<project>.cloudfunctions.net/api
   
   npx wrangler secret put BACKUP_BASE
   # Eingabe: https://us-central1-<project>.cloudfunctions.net/api
   
   npx wrangler secret put TURN_SHARED_SECRET
   # Eingabe: <coturn-static-auth-secret>
   ```

4. **DNS/Route konfigurieren**
   - Subdomain anlegen: `api.<deine-domain>` → Worker Route (`/*`)

### B. Firebase Functions (Core-API)

1. **Firebase initialisieren**
   ```bash
   firebase init functions
   ```

2. **Dependencies installieren**
   ```bash
   cd functions
   npm i firebase-admin firebase-functions express cors
   ```

3. **Primary Deploy**
   ```bash
   firebase deploy --only functions:api --project <PROJECT_ID> --force
   ```

4. **Backup Deploy** (zweite Region)
   ```bash
   firebase deploy --only functions:api --project <PROJECT_ID_BACKUP> --force
   ```

### C. Frontend (GitHub Pages / Cloudflare Pages)

1. **Config aktualisieren**
   ```javascript
   export const API_BASE_URL = 'https://api.<deine-domain>';
   export const WS_BASE_URL = 'wss://api.<deine-domain>/ws';
   ```

2. **GitHub Pages aktivieren**
   - Repository Settings → Pages → Source: GitHub Actions

3. **Oder Cloudflare Pages**
   - Pages → Create Project → Connect Repository

### D. TURN/STUN Server (coturn)

1. **coturn installieren**
   ```bash
   sudo apt update
   sudo apt install coturn
   ```

2. **Konfiguration** (`/etc/turnserver.conf`)
   ```conf
   listening-port=3478
   fingerprint
   realm=turn.<domain>
   no-stdout-log
   verbose
   use-auth-secret
   static-auth-secret=<SAME_TURN_SHARED_SECRET>
   total-quota=100
   bps-capacity=0
   stale-nonce=600
   cert=/etc/letsencrypt/live/turn.<domain>/fullchain.pem
   pkey=/etc/letsencrypt/live/turn.<domain>/privkey.pem
   ```

3. **systemd Service** (`/etc/systemd/system/coturn.service`)
   ```ini
   [Unit]
   Description=coturn TURN server
   After=network.target
   Wants=network-online.target

   [Service]
   Type=simple
   User=turnserver
   Group=turnserver
   Restart=always
   RestartSec=5
   Environment=DAEMON_OPTS="-c /etc/turnserver.conf"
   ExecStart=/usr/bin/turnserver $DAEMON_OPTS
   LimitNOFILE=1048576

   [Install]
   WantedBy=multi-user.target
   ```

4. **Service aktivieren**
   ```bash
   sudo adduser --system --group --no-create-home turnserver
   sudo systemctl daemon-reload
   sudo systemctl enable --now coturn.service
   sudo systemctl status coturn.service
   ```

5. **Firewall konfigurieren**
   ```bash
   sudo ufw allow 3478/udp
   sudo ufw allow 3478/tcp
   ```

## 🧪 Testing & Verification

### 1. Health Checks
```bash
# Edge Health
curl https://api.<deine-domain>/health
# Erwartet: {"ok":true,"edge":true,"ts":1234567890}

# Status
curl https://api.<deine-domain>/status
# Erwartet: {"uptimeSec":123,"appsOnline":1,"modulesLoaded":5,"lastDeploy":"2024-..."}

# Metrics
curl https://api.<deine-domain>/metrics
# Erwartet: {"stars":0,"forks":0,"releases":1,"downloads":0,"updatedAt":"2024-..."}
```

### 2. WebSocket Test
```bash
# Zwei Browser-Tabs öffnen
# Tab 1: https://<frontend-domain>/client.html
# Tab 2: https://<frontend-domain>/client.html
# Room "global" beitreten → Nachrichten senden → Gegenseitige Messages sichtbar
```

### 3. Overlay Test
```bash
# OBS Browser Source
# URL: https://<frontend-domain>/overlay.html?api=https://api.<deine-domain>&theme=dark&compact=1
# LED sollte grün werden, KPIs sollten Zahlen anzeigen
```

### 4. Self-Healing Test
```bash
# PRIMARY_BASE absichtlich blockieren (falsche URL in Worker-ENV)
npx wrangler secret put PRIMARY_BASE
# Eingabe: https://invalid-url.com/api

# Worker sollte auf BACKUP_BASE failovern
curl https://api.<deine-domain>/status
# Sollte weiterhin funktionieren

# PRIMARY_BASE korrigieren
npx wrangler secret put PRIMARY_BASE
# Eingabe: https://europe-west1-<project>.cloudfunctions.net/api
```

## 🎛️ OBS Integration

### Browser Source Setup
1. **OBS Studio öffnen**
2. **Sources → Add → Browser Source**
3. **URL eingeben:**
   ```
   https://<frontend-domain>/overlay.html?api=https://api.<deine-domain>&theme=dark&compact=1
   ```
4. **Einstellungen:**
   - Width: 800
   - Height: 100
   - Shutdown source when not visible: ✅

### URL-Parameter
- `api`: API Base URL (erforderlich)
- `theme`: `dark` oder `light` (Standard: dark)
- `compact`: `1` für kompakte Ansicht (Standard: 0)

## 🔐 Security & Secrets

### Cloudflare Worker Secrets
```bash
# Diese Secrets NIEMALS im Repository committen!
npx wrangler secret put PRIMARY_BASE
npx wrangler secret put BACKUP_BASE
npx wrangler secret put TURN_SHARED_SECRET
```

### Firebase Functions Config
```bash
# Für externe APIs
firebase functions:config:set github.token="<GITHUB_TOKEN>"
firebase functions:config:set metrics.api_key="<API_KEY>"
```

### Lokale Entwicklung (.env.local)
```bash
# .env.local (NIEMALS committen!)
API_BASE_LOCAL=http://127.0.0.1:8787
WS_BASE_LOCAL=ws://127.0.0.1:8787/ws
TURN_USERNAME=localuser
TURN_CREDENTIAL=localpass
```

## 🚨 Troubleshooting

### CORS-Fehler
- **Problem:** CORS-Fehler im Browser
- **Lösung:** `ALLOWED_ORIGINS` im Worker korrekt setzen
- **Check:** `Vary: Origin` Header vorhanden

### 404 /status
- **Problem:** Status-Endpoint nicht erreichbar
- **Lösung:** Firebase-App prüfen, Express-Pfad `/status` vorhanden
- **Check:** `functions/index.js` korrekt deployed

### 502/525 WebSocket
- **Problem:** WebSocket-Verbindung fehlgeschlagen
- **Lösung:** Route `/ws` an Worker, Durable Objects gebunden
- **Check:** `wrangler.toml` Durable Objects Konfiguration

### Mixed Content
- **Problem:** HTTP/HTTPS Mischung
- **Lösung:** Alles über HTTPS/WSS laufen lassen
- **Check:** Zertifikate korrekt installiert

### Rate Limits
- **Problem:** Zu viele Requests
- **Lösung:** Edge cacht GET `/status` & `/metrics` (max-age=10)
- **Check:** Cache-Control Header gesetzt

## 📊 Monitoring & Logs

### Cloudflare Workers Logs
```bash
# Live Logs anzeigen
npx wrangler tail

# Logs filtern
npx wrangler tail --format=pretty
```

### Firebase Functions Logs
```bash
# Live Logs anzeigen
firebase functions:log

# Logs filtern
firebase functions:log --only api
```

### Alerts & Monitoring
- **Health-Check Intervalle:** 30s
- **Retry:** Exponential Backoff im Client
- **Alerts:** 5xx-Spikes überwachen

## 🔄 Rollback-Plan

### Worker Rollback
```bash
# Vorherige Version wiederherstellen
npx wrangler deploy --env=prev

# Oder spezifische Version
npx wrangler rollback <version-id>
```

### Firebase Rollback
```bash
# Vorherigen Release wiederherstellen
firebase functions:delete api
# Dann vorherige Version deployen
```

### Frontend Rollback
```bash
# GitHub Pages: Vorherigen Build wiederherstellen
# Cloudflare Pages: Vorherige Deployment wiederherstellen
```

## 📈 Performance & Scaling

### Edge Caching
- **HTML:** network-first
- **Assets:** cache-first
- **API:** max-age=10, stale-while-revalidate=30

### WebSocket Scaling
- **Durable Objects:** Automatische Skalierung
- **Rooms:** Pro Room ein Durable Object
- **Clients:** Unbegrenzt pro Room

### Database Scaling
- **Firestore:** Automatische Skalierung
- **Collections:** Optimiert für Lese-Zugriffe
- **Indexes:** Composite Indexes für Queries

## 🎯 Next Steps

1. **Monitoring Dashboard** erstellen
2. **Alert-System** implementieren
3. **Performance-Metriken** sammeln
4. **User Analytics** hinzufügen
5. **A/B Testing** Framework

## 📞 Support

Bei Problemen oder Fragen:
1. **Logs prüfen** (Cloudflare + Firebase)
2. **Health-Checks** durchführen
3. **Self-Healing** testen
4. **Rollback** bei kritischen Problemen

---

## ✅ Deployment-Checkliste

- [ ] Cloudflare Worker deployed
- [ ] Firebase Functions deployed (Primary + Backup)
- [ ] Frontend deployed (GitHub Pages / Cloudflare Pages)
- [ ] TURN/STUN Server konfiguriert
- [ ] DNS/Route konfiguriert
- [ ] Secrets gesetzt
- [ ] Health-Checks funktionieren
- [ ] WebSocket-Verbindung funktioniert
- [ ] Overlay-Widget funktioniert
- [ ] Self-Healing getestet
- [ ] Monitoring aktiviert
- [ ] Alerts konfiguriert

**🎉 System ist live und produktionsbereit!**