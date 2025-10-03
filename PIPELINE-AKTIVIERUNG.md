# 🚀 OnAirMulTiMedia - Sofortige Pipeline-Aktivierung

## 📋 Schritt-für-Schritt Setup

### 1️⃣ **Firebase CLI Setup & Token**

```bash
# Firebase CLI installieren (falls noch nicht vorhanden)
npm install -g firebase-tools

# Bei Firebase anmelden
firebase login

# CI-Token generieren (für GitHub Secrets)
firebase login:ci

# Token kopieren und in GitHub Secrets speichern
# Gehe zu: https://github.com/ViewunitySystem/OnAirMulTiMedia/settings/secrets/actions
# Erstelle neuen Secret: FIREBASE_TOKEN
```

### 2️⃣ **Firebase-Projekte einrichten**

```bash
# Production-Projekt erstellen
firebase projects:create onairmultimedia --display-name "OnAirMulTiMedia Production"

# Staging-Projekt erstellen  
firebase projects:create onairmultimedia-staging --display-name "OnAirMulTiMedia Staging"

# Development-Projekt erstellen
firebase projects:create onairmultimedia-dev --display-name "OnAirMulTiMedia Development"

# Hosting für alle Projekte aktivieren
firebase use onairmultimedia
firebase init hosting --project onairmultimedia

firebase use onairmultimedia-staging  
firebase init hosting --project onairmultimedia-staging

firebase use onairmultimedia-dev
firebase init hosting --project onairmultimedia-dev
```

### 3️⃣ **GitHub Secrets konfigurieren**

**Gehe zu:** https://github.com/ViewunitySystem/OnAirMulTiMedia/settings/secrets/actions

**Erstelle diese Secrets:**

| Secret Name | Wert | Beschreibung |
|-------------|------|--------------|
| `FIREBASE_TOKEN` | `[Token von firebase login:ci]` | Firebase CI-Authentifizierung |
| `GITHUB_TOKEN` | `[Automatisch verfügbar]` | GitHub API-Zugriff |

### 4️⃣ **Lokale Tests durchführen**

```bash
# Repository klonen (falls noch nicht geschehen)
git clone https://github.com/ViewunitySystem/OnAirMulTiMedia.git
cd OnAirMulTiMedia

# Dependencies installieren
npm install

# Git-Hooks aktivieren
npx husky install

# Entwicklungsserver starten
npm run dev
# → Öffnet http://localhost:3000

# Tests ausführen
npm test
# → Unit Tests mit Vitest

# E2E-Tests starten
npm run test:e2e:ui
# → Playwright Test UI

# Security-Audit
npm run security
# → Sicherheitsprüfung

# Code-Qualität prüfen
npm run lint
npm run format:check
```

### 5️⃣ **Pipeline aktivieren**

#### **Option A: Sofortige Aktivierung (Empfohlen)**

```bash
# Aktuellen Branch zu gh-pages pushen
git checkout -b gh-pages
git push origin gh-pages

# GitHub Pages aktivieren:
# 1. Gehe zu: https://github.com/ViewunitySystem/OnAirMulTiMedia/settings/pages
# 2. Source: "Deploy from a branch"
# 3. Branch: "gh-pages" / "/ (root)"
# 4. Save

# Pipeline wird automatisch gestartet! 🚀
```

#### **Option B: Schrittweise Aktivierung**

```bash
# 1. Development-Branch testen
git checkout -b main
git push origin main
# → Firebase Dev: https://onairmultimedia-dev.web.app/

# 2. Staging-Branch testen  
git checkout -b mainzero
git push origin mainzero
# → Firebase Staging: https://onairmultimedia-staging.web.app/

# 3. Production-Branch aktivieren
git checkout -b gh-pages
git push origin gh-pages
# → GitHub Pages + Firebase Prod
```

## 🔍 **Pipeline-Status überwachen**

### **GitHub Actions Dashboard**
- **URL:** https://github.com/ViewunitySystem/OnAirMulTiMedia/actions
- **Überwache:** Deploy-Multi + CI-SelfHeal Workflows

### **Live-URLs nach Aktivierung**

| Branch | Target | URL | Status |
|--------|--------|-----|--------|
| `gh-pages` | GitHub Pages | https://viewunitysystem.github.io/OnAirMulTiMedia/ | 🟡 Aktivierung |
| `gh-pages` | Firebase Prod | https://onairmultimedia.web.app/ | 🟡 Aktivierung |
| `mainzero` | Firebase Staging | https://onairmultimedia-staging.web.app/ | 🟡 Aktivierung |
| `main` | Firebase Dev | https://onairmultimedia-dev.web.app/ | 🟡 Aktivierung |

## 🛠️ **Troubleshooting**

### **Problem: Firebase Token ungültig**
```bash
# Token erneuern
firebase logout
firebase login:ci
# Neuen Token in GitHub Secrets aktualisieren
```

### **Problem: GitHub Pages nicht aktiv**
```bash
# Manuell aktivieren
gh api repos/ViewunitySystem/OnAirMulTiMedia/pages \
  --method PUT \
  --field source='{"branch":"gh-pages","path":"/"}'
```

### **Problem: Tests schlagen fehl**
```bash
# Node.js Version prüfen (20+ erforderlich)
node --version

# Dependencies neu installieren
rm -rf node_modules package-lock.json
npm install

# Tests einzeln ausführen
npm run test
npm run test:e2e
```

### **Problem: Self-Healing funktioniert nicht**
```bash
# Workflow-Berechtigungen prüfen
# Gehe zu: https://github.com/ViewunitySystem/OnAirMulTiMedia/settings/actions
# Stelle sicher: "Allow GitHub Actions to create and approve pull requests"
```

## 🎯 **Erfolgs-Indikatoren**

### ✅ **Pipeline erfolgreich aktiviert wenn:**

1. **GitHub Actions grün** 🟢
   - Deploy-Multi: Erfolgreich
   - CI-SelfHeal: Erfolgreich

2. **Live-URLs erreichbar** 🌐
   - GitHub Pages lädt
   - Firebase-Sites funktionieren

3. **Self-Healing aktiv** 🔧
   - Automatische PRs werden erstellt
   - Repository-Hygiene wird überwacht

4. **Tests bestehen** 🧪
   - Unit Tests: ✅
   - E2E Tests: ✅
   - Security Tests: ✅

## 🚨 **Sofortige Aktionen bei Problemen**

### **Pipeline schlägt fehl:**
```bash
# Logs prüfen
gh run list --workflow=deploy-multi.yml
gh run view [RUN_ID] --log

# Manuell neu starten
gh workflow run deploy-multi.yml
```

### **Deployment hängt:**
```bash
# Firebase-Status prüfen
firebase projects:list
firebase hosting:sites:list

# Manuell deployen
firebase deploy --only hosting
```

### **Self-Healing nicht aktiv:**
```bash
# Workflow manuell starten
gh workflow run ci-selfheal.yml

# Cron-Job prüfen
gh api repos/ViewunitySystem/OnAirMulTiMedia/actions/workflows/ci-selfheal.yml
```

## 📊 **Monitoring-Dashboard**

### **GitHub Actions Status**
```bash
# Alle Workflows anzeigen
gh run list --limit=10

# Spezifischen Workflow prüfen
gh run list --workflow=deploy-multi.yml
gh run list --workflow=ci-selfheal.yml
```

### **Firebase Hosting Status**
```bash
# Alle Sites anzeigen
firebase hosting:sites:list

# Deployment-Historie
firebase hosting:releases:list
```

### **Repository-Status**
```bash
# Branch-Status
git branch -a

# Letzte Commits
git log --oneline -10

# Repository-Größe
du -sh .git
```

## 🎉 **Fertig!**

Nach erfolgreicher Aktivierung haben Sie:

- ✅ **Multi-Target Deployment** (4 Live-URLs)
- ✅ **Automatische Self-Healing** (alle 30 Min)
- ✅ **Security-Gates** (bei jedem Commit)
- ✅ **Cross-Browser Testing** (Chrome, Firefox, Safari, Mobile)
- ✅ **Performance-Monitoring** (Lighthouse CI)
- ✅ **PR-Preview-Channels** (für alle Branches)
- ✅ **Comprehensive Error-Handling** (Offline-Support)

**Ihre Pipeline ist jetzt produktionsreif und folgt allen Best Practices!** 🚀

---

**Nächster Schritt:** Push zu `gh-pages` und beobachten Sie die magische Automatisierung! ✨
