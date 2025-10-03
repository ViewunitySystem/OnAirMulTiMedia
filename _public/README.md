# OnAirMulTiMedia Serverfarm

## 🏭 Serverfarm-Übersicht

Diese Serverfarm stellt eine vollständige, skalierbare Infrastruktur für die OnAirMulTiMedia-Plattform bereit.

### 📁 Verzeichnisstruktur

```
_public/
├── index.html                 # Haupt-Landing-Page
├── info.html                  # Info Dashboard
├── blueprints.html            # Blueprints & Module
├── regulatory.html            # Regulatory Compliance
├── manifest.html              # Open Core Manifest
├── overlay.html               # Audit Overlay
├── client.html                # Test Client
├── audit-export.html          # Audit Export
├── serverfarm-dashboard.html  # Serverfarm Dashboard
├── assets/                    # Statische Assets
│   └── landing.css           # Haupt-Stylesheet
├── apps/                      # Anwendungen
│   ├── oamtm/                # Haupt-App
│   ├── studio/               # Studio App
│   ├── dashboard/            # Dashboard App
│   └── backup-system/        # Backup System App
├── modules/                   # RF Module
│   └── rf/
│       └── loopback-node/    # RF Loopback-Node
├── backup/                    # Backup System
│   ├── backup-system.js      # Backup Logic
│   ├── backup-ui.html        # Backup UI
│   └── build-info.json       # Build Information
├── blueprints/                # Blueprint-Definitionen
├── schemas/                   # JSON-Schemas
├── docs/                      # Dokumentation
├── wrangler.toml             # Cloudflare Pages Config
└── _redirects                # Cloudflare Redirects
```

## 🚀 Deployment

### Cloudflare Pages
- **Primary CDN**: Automatische Deployments über GitHub Actions
- **Build Command**: Keine (statische Dateien)
- **Publish Directory**: `_public`
- **Custom Domain**: Über Cloudflare DNS konfigurierbar

### Firebase Hosting (Backup)
- **Backup System**: Automatische Spiegelung aller Deployments
- **Projects**: `onairmultimedia` (prod), `back-ee052` (staging)
- **Configuration**: `firebase.serverfarm.json`

## 🔄 Backup & Wiederherstellung

### Automatisches Backup-System
- **Echtzeit-Synchronisation**: Alle 30 Sekunden
- **Multi-Backup**: Firebase Hosting + Cloudflare Pages
- **Versionierung**: Git-basierte Versionierung mit Zeitstempel
- **Health Checks**: Kontinuierliche Überwachung aller Endpoints

### Wiederherstellung
1. **Automatisch**: Bei Ausfall des Hauptsystems
2. **Manuell**: Über Backup-UI (`/backup/backup-ui.html`)
3. **Rollback**: Zu vorherigen Versionen

## 📊 Monitoring

### Health Checks
- **Primary**: `https://viewunitysystem.github.io/OnAirMulTiMedia/`
- **Backup #1**: `https://onairmultimedia.web.app/`
- **Backup #2**: `https://back-ee052.web.app/`

### Metrics
- Uptime-Tracking
- Response-Zeiten
- Deployment-Status
- Version-History

## 🛠️ Entwicklung

### Lokale Entwicklung
```bash
# Statischer Server
npx http-server _public -p 8080

# Mit Hot-Reload
npx live-server _public
```

### CI/CD Pipeline
- **Trigger**: Push zu `gh-pages` oder `main` Branch
- **Build**: Kopiert alle Dateien nach `_public`
- **Deploy**: Cloudflare Pages + Firebase Hosting
- **Health Check**: Überprüft alle Endpoints

## 🔒 Sicherheit

### Content Security Policy (CSP)
- **Strict CSP**: Nur lokale Ressourcen erlaubt
- **Frame Protection**: X-Frame-Options aktiviert
- **Content Type**: X-Content-Type-Options aktiviert

### Backup-Sicherheit
- **Verschlüsselung**: HTTPS überall
- **Authentifizierung**: Service Account-basiert
- **Audit-Logs**: Vollständige Aktivitätsprotokollierung

## 📈 Skalierung

### CDN-Optimierung
- **Cloudflare**: Globales CDN mit Edge-Caching
- **Firebase**: Google Cloud CDN
- **Cache-Strategien**: Optimiert für statische Inhalte

### Storage-Erweiterung
- **Modulare Struktur**: Einfache Erweiterung um neue Apps
- **Blueprint-System**: Standardisierte Modul-Integration
- **API-Ready**: Vorbereitet für zukünftige API-Integration

## 🚨 Notfall-Wiederherstellung

### Automatische Failover
1. **Primary Down**: Automatischer Wechsel zu Backup #1
2. **Backup #1 Down**: Wechsel zu Backup #2
3. **Alle Down**: Manuelle Wiederherstellung erforderlich

### Manuelle Wiederherstellung
1. **GitHub Actions**: Re-run failed deployment
2. **Cloudflare Pages**: Rollback zu vorheriger Version
3. **Firebase**: Rollback über Firebase Console
4. **DNS**: Wechsel zu Backup-Domain

## 📞 Support

### Monitoring-Dashboard
- **URL**: `/serverfarm-dashboard.html`
- **Features**: System-Status, Apps, Module, Metrics

### Backup-UI
- **URL**: `/backup/backup-ui.html`
- **Features**: Health Checks, Wiederherstellung, Logs

### Logs & Debugging
- **Browser**: `localStorage['oamtm:backup:logs']`
- **Export**: Über Backup-UI verfügbar
- **GitHub Actions**: Build-Logs in Repository
