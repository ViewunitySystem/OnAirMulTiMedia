# SDR UI Rotation System - README

## 🎛️ Professionelles UI/UX-Rotationssystem für Software-Defined Radio

Eine vollständig funktionsfähige, produktionsreife Anwendung für das Rotieren zwischen verschiedenen UI/UX-Frameworks in SDR-Dashboards.

### ✨ Features

- **🔄 UI-Varianten-Rotation**: Wählen Sie zwischen 6 verschiedenen UI-Kits
- **📊 Live-Status-Monitoring**: Echtzeit-Updates über WebSocket-Verbindungen
- **📚 SDR-Enzyklopädie**: Integrierte Wissensdatenbank für SDR-Konzepte
- **🔒 Rechtssichere Lizenzen**: Alle verwendeten Komponenten sind Open-Source
- **🐳 Docker-Ready**: Vollständige Containerisierung für einfaches Deployment
- **📡 REST-API**: OpenAPI-konforme Endpoints für alle Funktionen
- **⚡ WebSocket-Support**: Live-Updates ohne Polling

### 🚀 Schnellstart

#### Lokale Entwicklung

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# Anwendung öffnen
open http://localhost:3000
```

#### Docker Deployment

```bash
# Docker Image bauen
docker build -t sdr-ui-rotation .

# Container starten
docker run -p 3000:3000 sdr-ui-rotation

# Mit Docker Compose
docker-compose up -d
```

#### Automatisches Deployment

```bash
# Vollständiges Deployment
./deploy.sh

# Nur Tests
./deploy.sh test

# Nur Docker
./deploy.sh docker
```

### 📋 Verfügbare UI-Varianten

| Framework | Kategorie | Popularität | Lizenz | Features |
|-----------|-----------|-------------|--------|----------|
| **shadcn/ui** | Modern | 95% | MIT | Copy & Paste, Tailwind CSS |
| **Radix UI** | Primitives | 88% | MIT | A11y Primitives, Headless |
| **Tabler** | Dashboard | 82% | MIT | Klassisches Design, Icons |
| **PrimeReact** | Enterprise | 75% | MIT | 80+ Components, Virtual Scrolling |
| **daisyUI** | Utility | 78% | MIT | Tailwind Plugin, Themes |
| **Material-UI** | Material | 92% | MIT | Material Design, DataGrid |

### 🔌 API-Endpoints

#### UI-Varianten
- `GET /api/ui-variants` - Alle verfügbaren UI-Varianten
- `GET /api/ui-variants/:id` - Spezifische UI-Variante

#### Status-Monitoring
- `GET /api/status/feeds` - Live-Feed-Status
- `GET /api/status/freshness` - Freshness-Informationen
- `GET /api/status/license` - Lizenz-Compliance
- `GET /api/status/compliance` - Gesamt-Compliance-Score

#### WebSocket
- `ws://localhost:3000` - Live-Status-Updates

### 📚 Dokumentation

- **API-Dokumentation**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **OpenAPI Spec**: `api-docs.yaml`

### 🛠️ Entwicklung

#### Projektstruktur

```
ui-rotation-system/
├── src/
│   └── App.jsx              # Haupt-React-Komponente
├── server.js                # Express-Server mit WebSocket
├── package.json             # Dependencies und Scripts
├── api-docs.yaml           # OpenAPI-Spezifikation
├── Dockerfile              # Docker-Container
├── docker-compose.yml      # Multi-Service-Setup
├── nginx.conf              # Reverse-Proxy-Konfiguration
├── deploy.sh               # Deployment-Script
└── README.md               # Diese Datei
```

#### Scripts

```bash
npm start          # Produktionsserver starten
npm run dev        # Entwicklungsserver mit Watch-Mode
npm run build      # Client und Server bauen
npm run test       # Tests ausführen
npm run lint       # Code-Linting
npm run docker:build  # Docker Image bauen
npm run docker:run    # Docker Container starten
```

### 🔒 Sicherheit & Compliance

- **Lizenz-Compliance**: Alle Komponenten sind Open-Source (MIT/Apache-2.0)
- **Security Headers**: Helmet.js für sichere HTTP-Headers
- **Rate Limiting**: Schutz vor Missbrauch
- **Input Validation**: Sichere API-Endpoints
- **HTTPS-Ready**: SSL/TLS-Unterstützung über Nginx

### 📊 Monitoring

- **Health Checks**: Automatische Gesundheitsprüfungen
- **Live-Status**: WebSocket-basierte Echtzeit-Updates
- **Logging**: Strukturierte Logs für Debugging
- **Metrics**: Performance-Metriken und Statistiken

### 🌐 Deployment-Optionen

#### Lokal
```bash
npm start
```

#### Docker
```bash
docker-compose up -d
```

#### Cloud (AWS/GCP/Azure)
- Container Registry Upload
- Kubernetes Deployment
- Load Balancer Konfiguration

### 🤝 Beitragen

1. Fork des Repositories
2. Feature-Branch erstellen (`git checkout -b feature/amazing-feature`)
3. Änderungen committen (`git commit -m 'Add amazing feature'`)
4. Branch pushen (`git push origin feature/amazing-feature`)
5. Pull Request erstellen

### 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details.

### 👨‍💻 Autor

**Raymond Demitrio Dr. Tel**
- Email: tel@tel1.nl
- Website: https://tel1.nl

### 🆘 Support

Bei Problemen oder Fragen:
1. Issues im GitHub Repository erstellen
2. Dokumentation prüfen
3. Health Check durchführen: `curl http://localhost:3000/health`

---

**🎯 Ziel**: Eine professionelle, rechtssichere und vollständig funktionsfähige UI-Rotations-App für SDR-Dashboards - keine Dummy-Code, keine Mock-Implementierungen, sondern echte, produktionsreife Software.
