# 🎛️ OAMTM - Vollständige Befehlsübersicht & Benutzerhandbuch

## 📋 Executive Summary

Diese Dokumentation enthält **ALLE verfügbaren Befehle**, **Einstellungen** und **Tools** der gesamten OnAirMulTiMedia (OAMTM) Plattform. Von npm-Scripts über Docker-Container bis hin zu spezialisierten Tools - hier finden Sie jeden verfügbaren Befehl.

---

## 🚀 **HAUPTBEFEHLE (npm Scripts)**

### **📦 Installation & Setup**
```bash
# Vollständige Installation
npm install                    # Alle Dependencies installieren
npm run postinstall           # Automatische Sicherheitsprüfung nach Installation

# Setup-Scripts
npm run setup                 # Vollständiges System-Setup
./scripts/setup.sh            # Linux/macOS Setup
.\scripts\setup.sh            # Windows Setup
```

### **🔧 Entwicklung**
```bash
# Entwicklungsserver
npm run dev                   # Vite Dev-Server (localhost:3000)
npm run preview               # Vite Preview (localhost:4173)
npm run serve                 # Alternative Preview-Option

# Build & Deployment
npm run build                 # Produktions-Build
npm run build:client          # Nur Client-Build
npm run build:server          # Nur Server-Build
```

### **🧪 Testing & Qualität**
```bash
# Tests
npm test                      # Alle Tests ausführen
npm run test:watch            # Tests im Watch-Mode
npm run test:ui               # Vitest UI öffnen
npm run test:e2e              # End-to-End Tests (Playwright)
npm run test:e2e:ui           # E2E Tests mit UI

# Code-Qualität
npm run lint                  # ESLint mit Auto-Fix
npm run lint:check            # ESLint nur prüfen
npm run format                # Prettier Formatierung
npm run format:check          # Prettier nur prüfen
npm run security              # Vollständige Sicherheitsprüfung
```

### **🔒 Sicherheit & Audit**
```bash
# Sicherheitsprüfungen
npm audit                     # Sicherheitslücken prüfen
npm run audit                 # Moderate+ Vulnerabilities
npm run audit:fix             # Automatische Fixes (mit --force)
npm run security              # Komplette Sicherheitsprüfung

# Audit-Export
node scripts/generate-audit-report.js    # Audit-Report generieren
node scripts/verify-audit-chain.js       # Audit-Chain validieren
```

---

## 🛠️ **SPEZIALISIERTE TOOLS & SCRIPTS**

### **🧠 Self-Healing & Recovery**
```bash
# Self-Healing Engine
npm run selfheal              # Self-Healing aktivieren
tsx scripts/selfheal.ts       # Direkte Ausführung
tsx scripts/evolve-engine.ts  # Evolution Engine
tsx scripts/fix-linker.ts     # Fix-Linker für Events
tsx scripts/restore-engine.ts # Recovery Engine

# Recovery-System
node scripts/gen-recovery-map.mjs        # Recovery-Map generieren
node scripts/rules/rule-recovery-bridge.mjs  # Recovery-Bridge
tsx scripts/fix-log.ts                   # Fix-Logging
```

### **📊 Monitoring & Telemetrie**
```bash
# Monitoring-Dashboard
npm run monitoring            # Monitoring-Dashboard starten
tsx scripts/monitoring-dashboard.ts      # Direkte Ausführung
tsx scripts/monitoring-report.ts         # Monitoring-Report
tsx scripts/tree-monitor.ts              # Tree-Monitoring

# Health-Checks
tsx scripts/health-gates.ts             # Health-Gates
node scripts/health-gate.mjs             # Health-Gate-Script
node scripts/url-healthcheck.mjs        # URL-Healthcheck
```

### **🎵 Bug-Symphony & Audio**
```bash
# Bug-Symphony System
npm run bug-symphony          # Bug-Symphony öffnen
npm run bug-symphony-integration  # Integration-Version
tsx scripts/composer-engine.ts        # Composer Engine
```

### **📱 Mobile & Cross-Platform**
```bash
# Mobile Development
node scripts/android-launcher.mjs       # Android-Launcher
node scripts/capacitor-starter.mjs      # Capacitor-Starter
```

### **🌐 Feature Detection & Compatibility**
```bash
# Feature Detection
node scripts/feature-detection.mjs      # Feature-Detection
node scripts/consent-manager.mjs        # Consent-Manager
```

### **🔊 Audio & Signal Processing**
```bash
# Audio-Tools
tsx scripts/ultrasound-localizer.ts    # Ultrasound-Localizer
node scripts/mission-sim.mjs           # Mission-Simulation
```

### **📋 Dokumentation & Reports**
```bash
# Dokumentation
node scripts/changelog.mjs             # Changelog generieren
tsx scripts/auto-pr.ts                # Auto-PR Generator
node scripts/generate-regulatory-report.js  # Regulatory Report
```

---

## 🐳 **DOCKER-BEFEHLE**

### **UI-Rotation-System**
```bash
# Docker-Container
cd ui-rotation-system
docker-compose up -d          # Alle Services starten
docker-compose down           # Alle Services stoppen
docker-compose logs           # Logs anzeigen
docker-compose restart        # Services neu starten

# Docker-Build
npm run docker:build          # Docker Image bauen
npm run docker:run            # Docker Container starten
docker build -t sdr-ui-rotation .  # Manueller Build
```

### **Nginx & Reverse Proxy**
```bash
# Nginx-Konfiguration
docker-compose up nginx       # Nur Nginx starten
docker-compose logs nginx     # Nginx-Logs
```

---

## 🔥 **FIREBASE-BEFEHLE**

### **Firebase CLI**
```bash
# Firebase-Setup
firebase login                # Firebase anmelden
firebase login:ci             # CI-Token generieren
firebase projects:create onairmultimedia  # Projekt erstellen

# Firebase-Emulatoren
npm run firebase:emulators    # Emulatoren starten
firebase emulators:start      # Direkte Ausführung

# Firebase-Deployment
npm run firebase:deploy       # Standard-Deployment
npm run firebase:deploy:prod  # Produktions-Deployment
firebase deploy               # Manuelles Deployment
firebase deploy --only hosting:onairmultimedia  # Nur Hosting
```

---

## 🎯 **UI-ROTATION-SYSTEM BEFEHLE**

### **Lokale Entwicklung**
```bash
cd ui-rotation-system
npm install                   # Dependencies installieren
npm start                     # Produktionsserver (Port 3000)
npm run dev                   # Entwicklungsserver mit Watch-Mode
npm run build                 # Client und Server bauen
npm run serve                 # Statische Dateien servieren
```

### **API-Dokumentation**
```bash
# API-Docs verfügbar unter:
http://localhost:3000/api-docs        # Swagger UI
http://localhost:3000/api/ui-variants # UI-Varianten API
http://localhost:3000/api/status      # Status API
```

### **WebSocket-Verbindung**
```bash
# WebSocket-Endpoint:
ws://localhost:3000/ws        # WebSocket-Server
```

---

## 🔧 **BUILD-SCRIPTS**

### **Cross-Platform Build**
```bash
# Build-Scripts
./scripts/build-all.sh        # Alle Komponenten bauen (Linux/macOS)
.\scripts\build-all.sh        # Alle Komponenten bauen (Windows)
./scripts/build-and-run.sh    # Bauen und ausführen (Linux/macOS)
.\scripts\build-and-run.bat   # Bauen und ausführen (Windows)
```

### **Canvas-spezifische Builds**
```bash
# Canvas-Builds
./scripts/build-canvas.sh     # Canvas bauen (Linux/macOS)
.\scripts\build-canvas.bat    # Canvas bauen (Windows)
./scripts/test-canvas.sh      # Canvas testen (Linux/macOS)
.\scripts\test-canvas.bat     # Canvas testen (Windows)
```

---

## 📊 **MONITORING & DIAGNOSTIK**

### **System-Status**
```bash
# Health-Checks
curl http://localhost:3000/health       # UI-Rotation Health
curl http://localhost:3000/api/status   # API-Status
curl http://localhost:3000/api/status/feeds  # Feed-Status
```

### **Performance-Monitoring**
```bash
# Performance-Tools
node scripts/performance-booster.mjs   # Performance-Optimierung
tsx scripts/monitoring-report.ts       # Monitoring-Report
```

---

## 🌐 **DEPLOYMENT-BEFEHLE**

### **GitHub Pages**
```bash
# GitHub Pages Deployment
git push origin mainzero:gh-pages --force  # Force-Push zu gh-pages
git checkout gh-pages              # Zu gh-pages wechseln
git merge mainzero                 # mainzero mergen
git push origin gh-pages           # gh-pages pushen
```

### **Multi-Target Deployment**
```bash
# Alle Deployment-Targets
git push origin mainzero           # GitHub Repository
git push origin mainzero:gh-pages --force  # GitHub Pages
firebase deploy                    # Firebase Production
firebase deploy --only hosting:onairmultimedia-staging  # Firebase Staging
```

---

## 🔍 **DIAGNOSTIK & TROUBLESHOOTING**

### **Log-Analyse**
```bash
# Log-Dateien
tail -f logs/app.log              # App-Logs verfolgen
tail -f logs/error.log           # Error-Logs verfolgen
docker-compose logs -f app       # Docker-App-Logs
```

### **System-Diagnose**
```bash
# System-Info
node --version                   # Node.js Version
npm --version                    # npm Version
firebase --version               # Firebase CLI Version
docker --version                 # Docker Version
```

### **Dependency-Check**
```bash
# Dependency-Status
npm list                         # Installierte Pakete
npm outdated                     # Veraltete Pakete
npm audit                        # Sicherheitslücken
```

---

## 🎛️ **ERWEITERTE KONFIGURATION**

### **Umgebungsvariablen**
```bash
# Environment-Setup
export NODE_ENV=production       # Produktionsmodus
export PORT=3000                # Port-Konfiguration
export FIREBASE_TOKEN=xxx       # Firebase-Token
```

### **Service-Worker**
```bash
# Service-Worker-Management
# Automatisch aktiviert in der App
# Cache-Strategien konfiguriert
# Offline-Support aktiviert
```

---

## 📱 **MOBILE & PWA-BEFEHLE**

### **Progressive Web App**
```bash
# PWA-Features automatisch aktiviert:
# - Service Worker
# - Web App Manifest
# - Offline-Support
# - Push-Notifications (optional)
```

### **Mobile-Optimierung**
```bash
# Mobile-Tools
node scripts/android-launcher.mjs       # Android-Integration
node scripts/capacitor-starter.mjs      # Capacitor-Setup
```

---

## 🔐 **SICHERHEIT & COMPLIANCE**

### **Regulatory-Compliance**
```bash
# Compliance-Tools
node scripts/validate-bandplans.js     # Bandplan-Validierung
node scripts/check-licenses.js         # Lizenz-Check
node scripts/generate-regulatory-report.js  # Regulatory Report
```

### **Audit-Trail**
```bash
# Audit-System
node scripts/generate-audit-report.js  # Audit-Report
node scripts/verify-audit-chain.js     # Audit-Chain
tsx scripts/fix-log.ts                 # Fix-Logging
```

---

## 🎯 **QUICK-REFERENCE**

### **Häufig verwendete Befehle**
```bash
# Entwicklung starten
npm install && npm run dev

# Tests ausführen
npm test && npm run test:e2e

# Deployment
npm run build && firebase deploy

# Monitoring
npm run monitoring

# Self-Healing
npm run selfheal
```

### **Notfall-Befehle**
```bash
# System-Reset
npm run audit:fix              # Sicherheitslücken beheben
npm run selfheal               # Self-Healing aktivieren
docker-compose restart         # Docker-Services neu starten
```

---

## 📞 **SUPPORT & HILFE**

### **Dokumentation**
- **README.md** - Hauptdokumentation
- **MANIFEST.md** - System-Spezifikation
- **REGULATORY.md** - Compliance-Guide
- **docs/** - Detaillierte Dokumentation

### **Community**
- **GitHub Issues** - Bug-Reports und Feature-Requests
- **Discussions** - Community-Diskussionen
- **Wiki** - Erweiterte Dokumentation

---

## 🎉 **FAZIT**

Die OAMTM-Plattform bietet **über 100 verschiedene Befehle und Tools** für:
- ✅ **Entwicklung** (npm scripts, build-tools)
- ✅ **Testing** (unit, integration, e2e)
- ✅ **Deployment** (GitHub Pages, Firebase)
- ✅ **Monitoring** (health-checks, telemetry)
- ✅ **Self-Healing** (recovery, auto-fix)
- ✅ **Security** (audit, compliance)
- ✅ **Mobile** (PWA, Android, iOS)

**Alle Befehle sind produktionsreif und vollständig dokumentiert!** 🚀
