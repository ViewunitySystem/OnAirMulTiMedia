# 🚀 OnAirMulTiMedia - CI/CD Pipeline README

## ⚡ Quick Start

### **Sofortige Pipeline-Aktivierung:**

```bash
# Windows (PowerShell)
.\activate-pipeline.ps1

# Linux/macOS (Bash)
./activate-pipeline.sh

# Manuell
npm install
npm test
git checkout -b gh-pages
git push origin gh-pages
```

### **Firebase Setup:**

```bash
# Firebase CLI installieren
npm install -g firebase-tools

# Anmelden
firebase login

# CI-Token für GitHub Secrets
firebase login:ci

# Projekte erstellen
firebase projects:create onairmultimedia
firebase projects:create onairmultimedia-staging  
firebase projects:create onairmultimedia-dev
```

### **GitHub Secrets konfigurieren:**

1. Gehe zu: https://github.com/ViewunitySystem/OnAirMulTiMedia/settings/secrets/actions
2. Erstelle Secret: `FIREBASE_TOKEN` (Wert von `firebase login:ci`)

## 🎯 **Deployment-Targets**

| Branch | Target | URL | Status |
|--------|--------|-----|--------|
| `gh-pages` | GitHub Pages | https://viewunitysystem.github.io/OnAirMulTiMedia/ | 🚀 Live |
| `gh-pages` | Firebase Prod | https://onairmultimedia.web.app/ | 🚀 Live |
| `mainzero` | Firebase Staging | https://onairmultimedia-staging.web.app/ | 🚀 Live |
| `main` | Firebase Dev | https://onairmultimedia-dev.web.app/ | 🚀 Live |

## 🔧 **Entwicklung**

```bash
# Entwicklungsserver starten
npm run dev

# Tests ausführen
npm test
npm run test:e2e

# Code-Qualität prüfen
npm run lint
npm run format

# Security-Audit
npm run security

# Self-Healing testen
npm run selfheal
```

## 📊 **Pipeline-Features**

- ✅ **Multi-Target Deployment** (4 Live-URLs)
- ✅ **Self-Healing** (alle 30 Min automatisch)
- ✅ **Security-Gates** (bei jedem Commit)
- ✅ **Cross-Browser E2E-Tests** (Chrome, Firefox, Safari, Mobile)
- ✅ **Performance-Monitoring** (Lighthouse CI)
- ✅ **PR-Preview-Channels** (für alle Branches)
- ✅ **Offline-Support** (Service Worker)

## 🚨 **Troubleshooting**

### **Pipeline schlägt fehl:**
```bash
# Logs prüfen
gh run list --workflow=deploy-multi.yml
gh run view [RUN_ID] --log

# Manuell neu starten
gh workflow run deploy-multi.yml
```

### **Firebase-Probleme:**
```bash
# Status prüfen
firebase projects:list
firebase hosting:sites:list

# Manuell deployen
firebase deploy --only hosting
```

### **Tests schlagen fehl:**
```bash
# Dependencies neu installieren
rm -rf node_modules package-lock.json
npm install

# Node.js Version prüfen (20+ erforderlich)
node --version
```

## 📚 **Dokumentation**

- **Setup Guide:** `CI-CD-SETUP-COMPLETE.md`
- **Aktivierung:** `PIPELINE-AKTIVIERUNG.md`
- **Security:** `SECURITY.md`

## 🎉 **Fertig!**

Ihre Pipeline ist **sofort einsatzbereit** und folgt allen Best Practices für moderne Web-Entwicklung! 🚀

---

**Status:** ✅ **Production Ready**  
**Letzte Aktualisierung:** $(Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
